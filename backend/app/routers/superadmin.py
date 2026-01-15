"""
Superadmin Router - Platform-wide administration
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User, UserRole
from app.models.organization import Organization, SubscriptionPlan
from app.models.organization_settings import OrganizationSettings, AIProvider, StorageProvider
from app.models.subscription import PlanLimits, UsageTracking, AuditLog
from app.models.system_settings import SystemSettings
from app.routers.auth import get_current_user
from app.utils.encryption import encrypt_value, decrypt_value, mask_value

router = APIRouter(prefix="/superadmin", tags=["Superadmin"])


# ============== Dependency ==============

async def require_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require superadmin role for access."""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user


# ============== Schemas ==============

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9-]+$")
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    subscription_plan: SubscriptionPlan = SubscriptionPlan.FREE


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    custom_domain: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    subscription_plan: Optional[SubscriptionPlan] = None
    subscription_expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str]
    primary_color: Optional[str]
    custom_domain: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    subscription_plan: SubscriptionPlan
    subscription_expires_at: Optional[datetime]
    is_active: bool
    is_verified: bool
    created_at: datetime
    users_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    # AI Configuration
    ai_provider: Optional[AIProvider] = None
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    azure_openai_endpoint: Optional[str] = None
    azure_openai_key: Optional[str] = None
    azure_openai_deployment: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    litellm_api_key: Optional[str] = None
    litellm_base_url: Optional[str] = None
    litellm_model: Optional[str] = None
    
    # Storage Configuration
    storage_provider: Optional[StorageProvider] = None
    gcs_bucket_name: Optional[str] = None
    gcs_service_account_key: Optional[str] = None
    s3_bucket_name: Optional[str] = None
    s3_region: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    azure_storage_connection_string: Optional[str] = None
    azure_storage_container: Optional[str] = None
    
    # Feature Flags
    voice_enabled: Optional[bool] = None
    multilingual_enabled: Optional[bool] = None
    custom_branding_enabled: Optional[bool] = None
    advanced_analytics_enabled: Optional[bool] = None
    api_access_enabled: Optional[bool] = None
    
    # Integrations
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None
    sso_enabled: Optional[bool] = None
    sso_provider: Optional[str] = None
    sso_client_id: Optional[str] = None
    sso_client_secret: Optional[str] = None
    lms_enabled: Optional[bool] = None
    lms_provider: Optional[str] = None
    lms_api_url: Optional[str] = None
    lms_api_key: Optional[str] = None


class SettingsResponse(BaseModel):
    id: int
    organization_id: int
    ai_provider: AIProvider
    openai_api_key_masked: Optional[str] = None
    openai_model: str
    gemini_api_key_masked: Optional[str] = None
    gemini_model: str
    storage_provider: StorageProvider
    gcs_bucket_name: Optional[str]
    s3_bucket_name: Optional[str]
    voice_enabled: bool
    multilingual_enabled: bool
    custom_branding_enabled: bool
    advanced_analytics_enabled: bool
    api_access_enabled: bool
    webhook_url: Optional[str]
    sso_enabled: bool
    sso_provider: Optional[str]
    lms_enabled: bool
    lms_provider: Optional[str]
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_organizations: int
    active_organizations: int
    total_users: int
    total_queries: int
    organizations_by_plan: dict
    recent_organizations: List[OrganizationResponse]


class UserResponse(BaseModel):
    id: int
    phone: str
    email: Optional[str]
    name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============== Dashboard ==============

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get superadmin dashboard statistics."""
    # Total organizations
    total_orgs = await db.scalar(select(func.count(Organization.id)))
    active_orgs = await db.scalar(
        select(func.count(Organization.id)).where(Organization.is_active == True)
    )
    
    # Total users
    total_users = await db.scalar(select(func.count(User.id)))
    
    # Total queries
    from app.models.query import Query
    total_queries = await db.scalar(select(func.count(Query.id)))
    
    # Organizations by plan
    plan_counts = await db.execute(
        select(Organization.subscription_plan, func.count(Organization.id))
        .group_by(Organization.subscription_plan)
    )
    orgs_by_plan = {plan.value: count for plan, count in plan_counts.all()}
    
    # Recent organizations
    recent = await db.execute(
        select(Organization)
        .order_by(Organization.created_at.desc())
        .limit(5)
    )
    recent_orgs = recent.scalars().all()
    
    return DashboardStats(
        total_organizations=total_orgs or 0,
        active_organizations=active_orgs or 0,
        total_users=total_users or 0,
        total_queries=total_queries or 0,
        organizations_by_plan=orgs_by_plan,
        recent_organizations=[OrganizationResponse.model_validate(org) for org in recent_orgs]
    )


# ============== Organizations ==============

@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    plan: Optional[SubscriptionPlan] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """List all organizations with filtering."""
    query = select(Organization)
    
    if search:
        query = query.where(
            Organization.name.ilike(f"%{search}%") |
            Organization.slug.ilike(f"%{search}%")
        )
    
    if plan:
        query = query.where(Organization.subscription_plan == plan)
    
    if is_active is not None:
        query = query.where(Organization.is_active == is_active)
    
    query = query.order_by(Organization.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    organizations = result.scalars().all()
    
    # Get user counts
    response = []
    for org in organizations:
        org_dict = OrganizationResponse.model_validate(org)
        users_count = await db.scalar(
            select(func.count(User.id)).where(User.organization_id == org.id)
        )
        org_dict.users_count = users_count or 0
        response.append(org_dict)
    
    return response


@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    data: OrganizationCreate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new organization."""
    # Check slug uniqueness
    existing = await db.scalar(
        select(Organization).where(Organization.slug == data.slug)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    
    org = Organization(
        name=data.name,
        slug=data.slug,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        subscription_plan=data.subscription_plan,
    )
    
    db.add(org)
    await db.commit()
    await db.refresh(org)
    
    # Create default settings
    settings = OrganizationSettings(organization_id=org.id)
    db.add(settings)
    await db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org.id,
        action="organization.create",
        resource_type="organization",
        resource_id=org.id,
        new_values={"name": org.name, "slug": org.slug}
    )
    db.add(audit)
    await db.commit()
    
    return OrganizationResponse.model_validate(org)


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get organization details."""
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    response = OrganizationResponse.model_validate(org)
    response.users_count = await db.scalar(
        select(func.count(User.id)).where(User.organization_id == org.id)
    )
    return response


@router.put("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    data: OrganizationUpdate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Update an organization."""
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    old_values = {}
    new_values = {}
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        old_values[key] = getattr(org, key)
        setattr(org, key, value)
        new_values[key] = value
    
    await db.commit()
    await db.refresh(org)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org.id,
        action="organization.update",
        resource_type="organization",
        resource_id=org.id,
        old_values=old_values,
        new_values=new_values
    )
    db.add(audit)
    await db.commit()
    
    return OrganizationResponse.model_validate(org)


@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: int,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate an organization (soft delete)."""
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.is_active = False
    await db.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org.id,
        action="organization.deactivate",
        resource_type="organization",
        resource_id=org.id
    )
    db.add(audit)
    await db.commit()
    
    return {"message": "Organization deactivated"}


# ============== Organization Settings ==============

@router.get("/organizations/{org_id}/settings", response_model=SettingsResponse)
async def get_organization_settings(
    org_id: int,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get organization settings."""
    settings = await db.scalar(
        select(OrganizationSettings).where(OrganizationSettings.organization_id == org_id)
    )
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Mask sensitive values
    response = SettingsResponse(
        id=settings.id,
        organization_id=settings.organization_id,
        ai_provider=settings.ai_provider,
        openai_api_key_masked=mask_value(decrypt_value(settings.openai_api_key)) if settings.openai_api_key else None,
        openai_model=settings.openai_model,
        gemini_api_key_masked=mask_value(decrypt_value(settings.gemini_api_key)) if settings.gemini_api_key else None,
        gemini_model=settings.gemini_model,
        storage_provider=settings.storage_provider,
        gcs_bucket_name=settings.gcs_bucket_name,
        s3_bucket_name=settings.s3_bucket_name,
        voice_enabled=settings.voice_enabled,
        multilingual_enabled=settings.multilingual_enabled,
        custom_branding_enabled=settings.custom_branding_enabled,
        advanced_analytics_enabled=settings.advanced_analytics_enabled,
        api_access_enabled=settings.api_access_enabled,
        webhook_url=settings.webhook_url,
        sso_enabled=settings.sso_enabled,
        sso_provider=settings.sso_provider,
        lms_enabled=settings.lms_enabled,
        lms_provider=settings.lms_provider,
    )
    
    return response


@router.put("/organizations/{org_id}/settings", response_model=SettingsResponse)
async def update_organization_settings(
    org_id: int,
    data: SettingsUpdate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Update organization settings."""
    settings = await db.scalar(
        select(OrganizationSettings).where(OrganizationSettings.organization_id == org_id)
    )
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Fields that need encryption
    encrypted_fields = [
        'openai_api_key', 'gemini_api_key', 'azure_openai_key', 'anthropic_api_key',
        'litellm_api_key', 'gcs_service_account_key', 's3_access_key', 's3_secret_key',
        'azure_storage_connection_string', 'webhook_secret', 'sso_client_secret', 'lms_api_key'
    ]
    
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key in encrypted_fields and value:
            value = encrypt_value(value)
        setattr(settings, key, value)
    
    await db.commit()
    await db.refresh(settings)
    
    # Audit log (don't log actual secrets)
    audit = AuditLog(
        user_id=current_user.id,
        organization_id=org_id,
        action="settings.update",
        resource_type="organization_settings",
        resource_id=settings.id,
        new_values={k: "***" if k in encrypted_fields else v for k, v in update_data.items()}
    )
    db.add(audit)
    await db.commit()
    
    return await get_organization_settings(org_id, current_user, db)


# ============== Organization Users ==============

@router.get("/organizations/{org_id}/users", response_model=List[UserResponse])
async def list_organization_users(
    org_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """List users in an organization."""
    result = await db.execute(
        select(User)
        .where(User.organization_id == org_id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


# ============== Audit Logs ==============

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    organization_id: Optional[int] = None,
    action: Optional[str] = None,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs."""
    query = select(AuditLog)
    
    if organization_id:
        query = query.where(AuditLog.organization_id == organization_id)
    
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    
    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "organization_id": log.organization_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "created_at": log.created_at,
        }
        for log in logs
    ]


# ============== Plan Management ==============

@router.get("/plans")
async def list_plans(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """List all subscription plans."""
    result = await db.execute(select(PlanLimits))
    plans = result.scalars().all()
    return plans


@router.put("/plans/{plan}")
async def update_plan(
    plan: SubscriptionPlan,
    max_users: int = None,
    max_queries_per_month: int = None,
    price_monthly_usd: float = None,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Update a subscription plan's limits."""
    plan_limits = await db.scalar(
        select(PlanLimits).where(PlanLimits.plan == plan.value)
    )
    
    if not plan_limits:
        # Create if doesn't exist
        plan_limits = PlanLimits(plan=plan.value)
        db.add(plan_limits)
    
    if max_users is not None:
        plan_limits.max_users = max_users
    if max_queries_per_month is not None:
        plan_limits.max_queries_per_month = max_queries_per_month
    if price_monthly_usd is not None:
        plan_limits.price_monthly_usd = price_monthly_usd
    
    await db.commit()
    await db.refresh(plan_limits)
    
    return plan_limits


# ============== Global AI Settings ==============

class GlobalAISettings(BaseModel):
    ai_provider: str = "openai"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-pro"
    azure_openai_endpoint: Optional[str] = None
    azure_openai_key: Optional[str] = None
    azure_openai_deployment: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    litellm_api_key: Optional[str] = None
    litellm_base_url: Optional[str] = None
    litellm_model: str = "gpt-4o-mini"


@router.get("/ai-settings")
async def get_global_ai_settings(
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get global AI settings."""
    # Try to get from database first
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    
    if not system_settings:
        # Fallback to current environment settings
        from app.config import get_settings
        config_settings = get_settings()
        return {
            "ai_provider": config_settings.llm_provider,
            "openai_api_key": mask_value(config_settings.openai_api_key) if config_settings.openai_api_key else "",
            "openai_model": "gpt-4o-mini",
            "gemini_api_key": mask_value(config_settings.google_api_key) if config_settings.google_api_key else "",
            "gemini_model": "gemini-pro",
            "azure_openai_endpoint": "",
            "azure_openai_key": "",
            "azure_openai_deployment": "",
            "anthropic_api_key": mask_value(config_settings.anthropic_api_key) if config_settings.anthropic_api_key else "",
            "litellm_api_key": mask_value(config_settings.litellm_api_key) if config_settings.litellm_api_key else "",
            "litellm_base_url": config_settings.litellm_base_url or "",
            "litellm_model": config_settings.litellm_model or "gpt-4o-mini",
        }
    
    return {
        "ai_provider": system_settings.ai_provider,
        "openai_api_key": mask_value(decrypt_value(system_settings.openai_api_key)) if system_settings.openai_api_key else "",
        "openai_model": system_settings.openai_model,
        "gemini_api_key": mask_value(decrypt_value(system_settings.gemini_api_key)) if system_settings.gemini_api_key else "",
        "gemini_model": system_settings.gemini_model,
        "azure_openai_endpoint": system_settings.azure_openai_endpoint or "",
        "azure_openai_key": mask_value(decrypt_value(system_settings.azure_openai_key)) if system_settings.azure_openai_key else "",
        "azure_openai_deployment": system_settings.azure_openai_deployment or "",
        "anthropic_api_key": mask_value(decrypt_value(system_settings.anthropic_api_key)) if system_settings.anthropic_api_key else "",
        "litellm_api_key": mask_value(decrypt_value(system_settings.litellm_api_key)) if system_settings.litellm_api_key else "",
        "litellm_base_url": system_settings.litellm_base_url or "",
        "litellm_model": system_settings.litellm_model or "gpt-4o-mini",
    }


@router.put("/ai-settings")
async def update_global_ai_settings(
    data: GlobalAISettings,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Update global AI settings (writes to database)."""
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    
    if not system_settings:
        system_settings = SystemSettings()
        db.add(system_settings)
    
    system_settings.ai_provider = data.ai_provider
    
    # Only update non-empty/non-masked values
    if data.openai_api_key and data.openai_api_key != "••••••••":
        system_settings.openai_api_key = encrypt_value(data.openai_api_key)
    if data.openai_model:
        system_settings.openai_model = data.openai_model
        
    if data.gemini_api_key and data.gemini_api_key != "••••••••":
        system_settings.gemini_api_key = encrypt_value(data.gemini_api_key)
    if data.gemini_model:
        system_settings.gemini_model = data.gemini_model
        
    if data.anthropic_api_key and data.anthropic_api_key != "••••••••":
        system_settings.anthropic_api_key = encrypt_value(data.anthropic_api_key)
        
    if data.azure_openai_endpoint:
        system_settings.azure_openai_endpoint = data.azure_openai_endpoint
    if data.azure_openai_key and data.azure_openai_key != "••••••••":
        system_settings.azure_openai_key = encrypt_value(data.azure_openai_key)
    if data.azure_openai_deployment:
        system_settings.azure_openai_deployment = data.azure_openai_deployment
        
    if data.litellm_api_key and data.litellm_api_key != "••••••••":
        system_settings.litellm_api_key = encrypt_value(data.litellm_api_key)
    if data.litellm_base_url:
        system_settings.litellm_base_url = data.litellm_base_url
    if data.litellm_model:
        system_settings.litellm_model = data.litellm_model
    
    await db.commit()
    
    return {"message": "AI settings updated successfully. Changes are applied in real-time."}


@router.post("/ai-settings/test")
async def test_ai_connection(
    data: GlobalAISettings,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Test AI provider connection."""
    try:
        from app.ai.llm_client import LLMClient
        
        # Fetch real settings from DB for masked keys
        system_settings = await db.scalar(select(SystemSettings).limit(1))
        
        # Create a temporary mock settings for testing
        class MockSystemSettings:
            def __init__(self, data: GlobalAISettings, db_settings: Optional[SystemSettings]):
                self.ai_provider = data.ai_provider
                self.openai_model = data.openai_model
                self.gemini_model = data.gemini_model
                self.azure_openai_endpoint = data.azure_openai_endpoint
                self.azure_openai_deployment = data.azure_openai_deployment
                self.litellm_base_url = data.litellm_base_url
                self.litellm_model = data.litellm_model
                
                # Resolve keys: if input is mask, use DB; else use what user sent
                self.openai_api_key = self._resolve_key(data.openai_api_key, db_settings.openai_api_key if db_settings else None)
                self.gemini_api_key = self._resolve_key(data.gemini_api_key, db_settings.gemini_api_key if db_settings else None)
                self.azure_openai_key = self._resolve_key(data.azure_openai_key, db_settings.azure_openai_key if db_settings else None)
                self.anthropic_api_key = self._resolve_key(data.anthropic_api_key, db_settings.anthropic_api_key if db_settings else None)
                self.litellm_api_key = self._resolve_key(data.litellm_api_key, db_settings.litellm_api_key if db_settings else None)

            def _resolve_key(self, input_val: Optional[str], db_val: Optional[str]) -> Optional[str]:
                if not input_val:
                    return None
                if input_val == "••••••••":
                    return db_val # Already encrypted in DB
                return encrypt_value(input_val)

        mock_settings = MockSystemSettings(data, system_settings)
        client = LLMClient(system_settings=mock_settings)
        
        # Try a simple completion
        response = await client.generate("Say 'Connection successful!' in exactly 3 words.", max_tokens=50)
        
        if "demo" in response.lower() or "configure" in response.lower():
            return {"success": False, "message": "No valid API key configured for this provider"}
        
        return {"success": True, "message": f"Connection successful! Response: {response[:100]}..."}
    
    except Exception as e:
        return {"success": False, "message": f"Connection failed: {str(e)}"}


# ============== AI Response Auditing ==============

@router.get("/audit/queries")
async def get_queries_for_audit(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    organization_id: Optional[int] = None,
    mode: Optional[str] = None,
    has_crp_override: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """
    List queries for AI response auditing.
    SuperAdmins can review AI responses for quality and curriculum alignment.
    """
    from app.models.query import Query as QueryModel
    from app.models.reflection import Reflection, CRPResponse
    
    query = select(QueryModel)
    
    if organization_id:
        query = query.join(User, QueryModel.user_id == User.id).where(
            User.organization_id == organization_id
        )
    
    if mode:
        from app.models.query import QueryMode
        try:
            query = query.where(QueryModel.mode == QueryMode(mode))
        except ValueError:
            pass
    
    if start_date:
        query = query.where(QueryModel.created_at >= start_date)
    if end_date:
        query = query.where(QueryModel.created_at <= end_date)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # Paginate
    query = query.order_by(QueryModel.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    queries = result.scalars().all()
    
    items = []
    for q in queries:
        # Get teacher
        teacher = await db.get(User, q.user_id)
        
        # Get reflection
        reflection = await db.scalar(
            select(Reflection).where(Reflection.query_id == q.id)
        )
        
        # Get CRP responses
        crp_responses = await db.execute(
            select(CRPResponse).where(CRPResponse.query_id == q.id)
        )
        crp_list = crp_responses.scalars().all()
        
        # Check for override
        has_override = any(r.overrides_ai for r in crp_list)
        
        if has_crp_override is not None and has_override != has_crp_override:
            continue
        
        items.append({
            "id": q.id,
            "teacher": {
                "id": teacher.id if teacher else None,
                "name": teacher.name if teacher else None,
                "organization_id": teacher.organization_id if teacher else None,
            },
            "mode": q.mode.value,
            "input_text": q.input_text[:200] if q.input_text else None,
            "ai_response": q.response_text[:500] if q.response_text else None,
            "subject": q.subject,
            "grade": q.grade,
            "topic": q.topic,
            "processing_time_ms": q.processing_time_ms,
            "created_at": q.created_at.isoformat(),
            "reflection": {
                "tried": reflection.tried,
                "worked": reflection.worked,
                "feedback": reflection.text_feedback,
            } if reflection else None,
            "crp_responses": [
                {
                    "id": r.id,
                    "crp_id": r.crp_id,
                    "response_text": r.response_text[:200] if r.response_text else None,
                    "overrides_ai": r.overrides_ai,
                    "override_reason": r.override_reason,
                    "tag": r.tag.value if r.tag else None,
                }
                for r in crp_list
            ],
            "has_crp_override": has_override,
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total else 0
    }


@router.get("/audit/queries/{query_id}")
async def get_query_audit_detail(
    query_id: int,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed audit view of a single query."""
    from app.models.query import Query as QueryModel
    from app.models.reflection import Reflection, CRPResponse
    
    q = await db.get(QueryModel, query_id)
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    
    teacher = await db.get(User, q.user_id)
    org = await db.get(Organization, teacher.organization_id) if teacher and teacher.organization_id else None
    
    reflection = await db.scalar(select(Reflection).where(Reflection.query_id == q.id))
    
    crp_responses = await db.execute(select(CRPResponse).where(CRPResponse.query_id == q.id))
    crp_list = crp_responses.scalars().all()
    
    # Get CRP names
    crp_details = []
    for r in crp_list:
        crp_user = await db.get(User, r.crp_id)
        crp_details.append({
            "id": r.id,
            "crp_id": r.crp_id,
            "crp_name": crp_user.name if crp_user else None,
            "response_text": r.response_text,
            "voice_note_url": r.voice_note_url,
            "overrides_ai": r.overrides_ai,
            "override_reason": r.override_reason,
            "tag": r.tag.value if r.tag else None,
            "is_best_practice": r.is_best_practice,
            "created_at": r.created_at.isoformat(),
        })
    
    return {
        "query": {
            "id": q.id,
            "mode": q.mode.value,
            "input_text": q.input_text,
            "response_text": q.response_text,
            "subject": q.subject,
            "grade": q.grade,
            "topic": q.topic,
            "processing_time_ms": q.processing_time_ms,
            "language": q.language,
            "created_at": q.created_at.isoformat(),
        },
        "teacher": {
            "id": teacher.id if teacher else None,
            "name": teacher.name if teacher else None,
            "phone": teacher.phone if teacher else None,
            "school_name": teacher.school_name if teacher else None,
        },
        "organization": {
            "id": org.id if org else None,
            "name": org.name if org else None,
        },
        "reflection": {
            "tried": reflection.tried,
            "worked": reflection.worked,
            "text_feedback": reflection.text_feedback,
            "voice_note_url": reflection.voice_note_url,
            "created_at": reflection.created_at.isoformat(),
        } if reflection else None,
        "crp_responses": crp_details,
    }


@router.get("/audit/summary")
async def get_audit_summary(
    days: int = Query(30, ge=1, le=365),
    organization_id: Optional[int] = None,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Get summary statistics for AI response auditing."""
    from app.models.query import Query as QueryModel, QueryMode
    from app.models.reflection import Reflection, CRPResponse
    from datetime import timedelta
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Base query
    base = select(QueryModel).where(QueryModel.created_at >= since)
    if organization_id:
        base = base.join(User, QueryModel.user_id == User.id).where(
            User.organization_id == organization_id
        )
    
    # Total queries
    total_queries = await db.scalar(
        select(func.count()).select_from(base.subquery())
    )
    
    # Queries with reflections
    with_reflection = await db.scalar(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.created_at >= since
        )
    )
    
    # Success rate
    worked = await db.scalar(
        select(func.count()).select_from(Reflection).join(QueryModel).where(
            QueryModel.created_at >= since,
            Reflection.worked == True
        )
    )
    
    # CRP override count
    overrides = await db.scalar(
        select(func.count()).select_from(CRPResponse).join(QueryModel).where(
            QueryModel.created_at >= since,
            CRPResponse.overrides_ai == True
        )
    )
    
    # Queries by mode
    mode_counts = {}
    for mode in QueryMode:
        count = await db.scalar(
            select(func.count()).where(
                QueryModel.created_at >= since,
                QueryModel.mode == mode
            )
        )
        mode_counts[mode.value] = count or 0
    
    return {
        "period_days": days,
        "total_queries": total_queries or 0,
        "with_reflection": with_reflection or 0,
        "worked": worked or 0,
        "success_rate": round((worked / with_reflection * 100) if with_reflection else 0, 1),
        "crp_overrides": overrides or 0,
        "override_rate": round((overrides / total_queries * 100) if total_queries else 0, 1),
        "queries_by_mode": mode_counts,
    }

