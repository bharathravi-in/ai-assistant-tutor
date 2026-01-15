"""
Billing & Usage Tracking Router - For private sector licensing
"""
from typing import Optional, List
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel, Field
from decimal import Decimal

from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization, SubscriptionPlan
from app.models.subscription import PlanLimits, UsageTracking, AuditLog
from app.routers.auth import require_role

router = APIRouter(prefix="/billing", tags=["Billing"])


# ============== Schemas ==============

class UsageSummary(BaseModel):
    """Current billing period usage summary."""
    organization_id: int
    organization_name: str
    plan: str
    period_start: date
    period_end: date
    queries_used: int
    queries_limit: int
    queries_percent: float
    users_count: int
    users_limit: int
    storage_used_mb: float
    storage_limit_mb: int
    overage_queries: int
    estimated_overage_cost: float


class InvoiceItem(BaseModel):
    """Single invoice line item."""
    description: str
    quantity: int
    unit_price: float
    total: float


class Invoice(BaseModel):
    """Invoice for a billing period."""
    invoice_id: str
    organization_id: int
    organization_name: str
    period_start: date
    period_end: date
    plan: str
    base_amount: float
    overage_amount: float
    tax_amount: float
    total_amount: float
    items: List[InvoiceItem]
    status: str  # draft, pending, paid
    due_date: date
    created_at: datetime


class PlanChangeRequest(BaseModel):
    """Request to change subscription plan."""
    new_plan: SubscriptionPlan
    effective_date: Optional[date] = None  # None = immediate


# ============== Usage Tracking ==============

@router.get("/usage")
async def get_current_usage(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get current billing period usage for the organization."""
    org_id = current_user.organization_id
    
    if not org_id and current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    org = await db.get(Organization, org_id) if org_id else None
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get plan limits
    plan_limits = await db.scalar(
        select(PlanLimits).where(PlanLimits.plan == org.subscription_plan.value)
    )
    
    # Get or create current usage tracking
    today = date.today()
    period_start = today.replace(day=1)
    if today.month == 12:
        period_end = date(today.year + 1, 1, 1) - timedelta(days=1)
    else:
        period_end = date(today.year, today.month + 1, 1) - timedelta(days=1)
    
    usage = await db.scalar(
        select(UsageTracking).where(
            and_(
                UsageTracking.organization_id == org_id,
                UsageTracking.period_start == period_start
            )
        )
    )
    
    if not usage:
        # Calculate actual usage from queries
        from app.models.query import Query as QueryModel
        
        query_count = await db.scalar(
            select(func.count()).select_from(QueryModel).join(User).where(
                and_(
                    User.organization_id == org_id,
                    QueryModel.created_at >= datetime.combine(period_start, datetime.min.time()),
                    QueryModel.created_at <= datetime.combine(period_end, datetime.max.time())
                )
            )
        )
        
        usage = UsageTracking(
            organization_id=org_id,
            period_start=period_start,
            period_end=period_end,
            queries_count=query_count or 0,
            users_count=await db.scalar(
                select(func.count()).where(User.organization_id == org_id)
            ) or 0
        )
        db.add(usage)
        await db.commit()
    
    # Calculate limits
    max_queries = plan_limits.max_queries_per_month if plan_limits else 100
    max_users = plan_limits.max_users if plan_limits else 5
    max_storage = plan_limits.max_storage_mb if plan_limits else 100
    
    overage = max(0, usage.queries_count - max_queries)
    overage_cost = overage * 0.05  # $0.05 per overage query
    
    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "plan": org.subscription_plan.value,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "queries_used": usage.queries_count,
        "queries_limit": max_queries,
        "queries_percent": round((usage.queries_count / max_queries * 100) if max_queries > 0 else 0, 1),
        "users_count": usage.users_count,
        "users_limit": max_users,
        "storage_used_mb": usage.storage_used_mb,
        "storage_limit_mb": max_storage,
        "overage_queries": overage,
        "estimated_overage_cost": round(overage_cost, 2)
    }


@router.get("/usage/history")
async def get_usage_history(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get historical usage data for the organization."""
    org_id = current_user.organization_id
    
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    since = date.today() - timedelta(days=months * 30)
    
    result = await db.execute(
        select(UsageTracking).where(
            and_(
                UsageTracking.organization_id == org_id,
                UsageTracking.period_start >= since
            )
        ).order_by(UsageTracking.period_start.desc())
    )
    usage_records = result.scalars().all()
    
    return [
        {
            "period_start": u.period_start.isoformat(),
            "period_end": u.period_end.isoformat(),
            "queries_count": u.queries_count,
            "users_count": u.users_count,
            "storage_used_mb": u.storage_used_mb,
            "api_calls_count": u.api_calls_count
        }
        for u in usage_records
    ]


# ============== Invoicing ==============

@router.get("/invoices")
async def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    status: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List invoices for the organization."""
    org_id = current_user.organization_id
    
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    org = await db.get(Organization, org_id)
    plan_limits = await db.scalar(
        select(PlanLimits).where(PlanLimits.plan == org.subscription_plan.value)
    )
    
    # Get usage records (each represents a billing period)
    result = await db.execute(
        select(UsageTracking).where(
            UsageTracking.organization_id == org_id
        ).order_by(UsageTracking.period_start.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    usage_records = result.scalars().all()
    
    invoices = []
    for u in usage_records:
        base_price = plan_limits.price_monthly_usd if plan_limits else 0
        max_queries = plan_limits.max_queries_per_month if plan_limits else 100
        overage = max(0, u.queries_count - max_queries)
        overage_cost = overage * 0.05
        tax = (base_price + overage_cost) * 0.18  # 18% GST
        
        invoices.append({
            "invoice_id": f"INV-{org_id}-{u.period_start.strftime('%Y%m')}",
            "organization_id": org_id,
            "organization_name": org.name,
            "period_start": u.period_start.isoformat(),
            "period_end": u.period_end.isoformat(),
            "plan": org.subscription_plan.value,
            "base_amount": base_price,
            "overage_amount": round(overage_cost, 2),
            "tax_amount": round(tax, 2),
            "total_amount": round(base_price + overage_cost + tax, 2),
            "status": "paid" if u.period_end < date.today() else "pending",
            "due_date": (u.period_end + timedelta(days=15)).isoformat()
        })
    
    # Count total
    total_count = await db.scalar(
        select(func.count()).where(UsageTracking.organization_id == org_id)
    )
    
    return {
        "items": invoices,
        "total": total_count,
        "page": page,
        "page_size": page_size
    }


@router.get("/invoices/{invoice_id}")
async def get_invoice_detail(
    invoice_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed invoice with line items."""
    # Parse invoice_id (format: INV-{org_id}-{YYYYMM})
    try:
        parts = invoice_id.split("-")
        org_id = int(parts[1])
        year_month = parts[2]
        year = int(year_month[:4])
        month = int(year_month[4:])
        period_start = date(year, month, 1)
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid invoice ID format")
    
    # Verify access
    if current_user.organization_id != org_id and current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    usage = await db.scalar(
        select(UsageTracking).where(
            and_(
                UsageTracking.organization_id == org_id,
                UsageTracking.period_start == period_start
            )
        )
    )
    
    if not usage:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    plan_limits = await db.scalar(
        select(PlanLimits).where(PlanLimits.plan == org.subscription_plan.value)
    )
    
    base_price = plan_limits.price_monthly_usd if plan_limits else 0
    max_queries = plan_limits.max_queries_per_month if plan_limits else 100
    overage = max(0, usage.queries_count - max_queries)
    overage_cost = overage * 0.05
    tax = (base_price + overage_cost) * 0.18
    
    items = [
        {
            "description": f"{org.subscription_plan.value.title()} Plan - Monthly",
            "quantity": 1,
            "unit_price": base_price,
            "total": base_price
        }
    ]
    
    if overage > 0:
        items.append({
            "description": f"Overage Queries ({overage} queries @ $0.05/query)",
            "quantity": overage,
            "unit_price": 0.05,
            "total": round(overage_cost, 2)
        })
    
    if usage.users_count > (plan_limits.max_users if plan_limits else 5):
        extra_users = usage.users_count - (plan_limits.max_users if plan_limits else 5)
        user_cost = extra_users * 5  # $5 per extra user
        items.append({
            "description": f"Additional Users ({extra_users} users @ $5/user)",
            "quantity": extra_users,
            "unit_price": 5,
            "total": user_cost
        })
    
    items.append({
        "description": "GST (18%)",
        "quantity": 1,
        "unit_price": round(tax, 2),
        "total": round(tax, 2)
    })
    
    return {
        "invoice_id": invoice_id,
        "organization_id": org_id,
        "organization_name": org.name,
        "period_start": usage.period_start.isoformat(),
        "period_end": usage.period_end.isoformat(),
        "plan": org.subscription_plan.value,
        "base_amount": base_price,
        "overage_amount": round(overage_cost, 2),
        "tax_amount": round(tax, 2),
        "total_amount": round(base_price + overage_cost + tax, 2),
        "items": items,
        "status": "paid" if usage.period_end < date.today() else "pending",
        "due_date": (usage.period_end + timedelta(days=15)).isoformat(),
        "created_at": usage.created_at.isoformat()
    }


# ============== Plan Management ==============

@router.get("/plans")
async def list_available_plans(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List all available subscription plans with pricing."""
    result = await db.execute(select(PlanLimits))
    plans = result.scalars().all()
    
    # If no plans exist, return defaults
    if not plans:
        return [
            {
                "plan": "FREE",
                "max_users": 5,
                "max_queries_per_month": 100,
                "storage_mb": 100,
                "price_monthly_usd": 0,
                "features": ["Basic AI Tutor", "5 Users", "100 Queries/month"]
            },
            {
                "plan": "BASIC",
                "max_users": 25,
                "max_queries_per_month": 1000,
                "storage_mb": 500,
                "price_monthly_usd": 49,
                "features": ["AI Tutor + Classroom Assistant", "25 Users", "1000 Queries/month", "Voice Support"]
            },
            {
                "plan": "PREMIUM",
                "max_users": 100,
                "max_queries_per_month": 5000,
                "storage_mb": 2000,
                "price_monthly_usd": 199,
                "features": ["All Features", "100 Users", "5000 Queries/month", "Priority Support", "Analytics"]
            },
            {
                "plan": "ENTERPRISE",
                "max_users": -1,  # Unlimited
                "max_queries_per_month": -1,
                "storage_mb": 10000,
                "price_monthly_usd": 499,
                "features": ["Unlimited Users & Queries", "Custom Branding", "SSO", "Dedicated Support", "SLA"]
            }
        ]
    
    return [
        {
            "plan": p.plan,
            "max_users": p.max_users,
            "max_queries_per_month": p.max_queries_per_month,
            "storage_mb": p.max_storage_mb,
            "price_monthly_usd": p.price_monthly_usd,
            "features": list(p.features.get("features", [])) if p.features else []
        }
        for p in plans
    ]


@router.post("/upgrade")
async def request_plan_upgrade(
    request: PlanChangeRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Request an upgrade to a higher plan."""
    org_id = current_user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    org = await db.get(Organization, org_id)
    
    current_plan_order = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]
    current_idx = current_plan_order.index(org.subscription_plan.value) if org.subscription_plan.value in current_plan_order else 0
    new_idx = current_plan_order.index(request.new_plan.value) if request.new_plan.value in current_plan_order else 0
    
    if new_idx <= current_idx:
        raise HTTPException(status_code=400, detail="Can only upgrade to a higher plan (use /downgrade for lower plans)")
    
    # Set effective date
    effective = request.effective_date or date.today()
    
    # Log the upgrade request
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org_id,
        action="billing.upgrade_request",
        resource_type="organization",
        resource_id=org_id,
        old_values={"plan": org.subscription_plan.value},
        new_values={"plan": request.new_plan.value, "effective_date": effective.isoformat()}
    )
    db.add(audit)
    
    # For immediate upgrades, update the org
    if effective <= date.today():
        org.subscription_plan = request.new_plan
        await db.commit()
        return {
            "status": "completed",
            "message": f"Upgraded to {request.new_plan.value} plan immediately",
            "new_plan": request.new_plan.value,
            "effective_date": effective.isoformat()
        }
    
    await db.commit()
    return {
        "status": "scheduled",
        "message": f"Upgrade to {request.new_plan.value} scheduled",
        "new_plan": request.new_plan.value,
        "effective_date": effective.isoformat()
    }


@router.post("/downgrade")
async def request_plan_downgrade(
    request: PlanChangeRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Request a downgrade to a lower plan (effective at end of billing period)."""
    org_id = current_user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    org = await db.get(Organization, org_id)
    
    current_plan_order = ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"]
    current_idx = current_plan_order.index(org.subscription_plan.value) if org.subscription_plan.value in current_plan_order else 0
    new_idx = current_plan_order.index(request.new_plan.value) if request.new_plan.value in current_plan_order else 0
    
    if new_idx >= current_idx:
        raise HTTPException(status_code=400, detail="Can only downgrade to a lower plan")
    
    # Downgrades always take effect at end of billing period
    today = date.today()
    if today.month == 12:
        effective = date(today.year + 1, 1, 1)
    else:
        effective = date(today.year, today.month + 1, 1)
    
    # Log the downgrade request
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org_id,
        action="billing.downgrade_request",
        resource_type="organization",
        resource_id=org_id,
        old_values={"plan": org.subscription_plan.value},
        new_values={"plan": request.new_plan.value, "effective_date": effective.isoformat()}
    )
    db.add(audit)
    await db.commit()
    
    return {
        "status": "scheduled",
        "message": f"Downgrade to {request.new_plan.value} scheduled for end of billing period",
        "new_plan": request.new_plan.value,
        "effective_date": effective.isoformat()
    }
