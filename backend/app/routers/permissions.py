"""
Granular Permissions System - Custom roles and permission matrix
"""
from typing import Optional, List, Set
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, Field
import enum

from app.database import get_db, Base
from app.models.user import User, UserRole
from app.routers.auth import require_role
from sqlalchemy import String, DateTime, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship


# ============== Permission Definitions ==============

class Permission(str, enum.Enum):
    """All available permissions in the system."""
    # User Management
    USERS_VIEW = "users.view"
    USERS_CREATE = "users.create"
    USERS_EDIT = "users.edit"
    USERS_DELETE = "users.delete"
    
    # Query & AI
    QUERIES_VIEW_OWN = "queries.view_own"
    QUERIES_VIEW_ALL = "queries.view_all"
    QUERIES_CREATE = "queries.create"
    AI_TUTOR = "ai.tutor"
    AI_ASSISTANT = "ai.assistant"
    AI_PLANNER = "ai.planner"
    AI_QUIZ = "ai.quiz"
    AI_TLM = "ai.tlm"
    
    # CRP/ARP Features
    CRP_RESPOND = "crp.respond"
    CRP_VIEW_TEACHERS = "crp.view_teachers"
    CRP_FEEDBACK = "crp.feedback"
    CRP_BEST_PRACTICES = "crp.best_practices"
    
    # ARP Analytics
    ARP_ANALYTICS = "arp.analytics"
    ARP_TRENDS = "arp.trends"
    ARP_AI_REVIEW = "arp.ai_review"
    
    # Admin
    ADMIN_DASHBOARD = "admin.dashboard"
    ADMIN_SETTINGS = "admin.settings"
    ADMIN_AUDIT = "admin.audit"
    
    # Billing
    BILLING_VIEW = "billing.view"
    BILLING_MANAGE = "billing.manage"
    
    # SuperAdmin
    SUPERADMIN_ALL = "superadmin.all"


# Default role permissions
DEFAULT_ROLE_PERMISSIONS = {
    UserRole.STUDENT: [
        Permission.QUERIES_VIEW_OWN,
    ],
    UserRole.TEACHER: [
        Permission.QUERIES_VIEW_OWN,
        Permission.QUERIES_CREATE,
        Permission.AI_TUTOR,
        Permission.AI_ASSISTANT,
        Permission.AI_PLANNER,
        Permission.AI_QUIZ,
        Permission.AI_TLM,
    ],
    UserRole.CRP: [
        Permission.QUERIES_VIEW_OWN,
        Permission.QUERIES_CREATE,
        Permission.AI_TUTOR,
        Permission.AI_ASSISTANT,
        Permission.CRP_RESPOND,
        Permission.CRP_VIEW_TEACHERS,
        Permission.CRP_FEEDBACK,
        Permission.CRP_BEST_PRACTICES,
    ],
    UserRole.ARP: [
        Permission.QUERIES_VIEW_ALL,
        Permission.CRP_RESPOND,
        Permission.CRP_VIEW_TEACHERS,
        Permission.CRP_FEEDBACK,
        Permission.CRP_BEST_PRACTICES,
        Permission.ARP_ANALYTICS,
        Permission.ARP_TRENDS,
        Permission.ARP_AI_REVIEW,
    ],
    UserRole.ADMIN: [
        Permission.USERS_VIEW,
        Permission.USERS_CREATE,
        Permission.USERS_EDIT,
        Permission.USERS_DELETE,
        Permission.QUERIES_VIEW_ALL,
        Permission.ADMIN_DASHBOARD,
        Permission.ADMIN_SETTINGS,
        Permission.ADMIN_AUDIT,
        Permission.BILLING_VIEW,
        Permission.BILLING_MANAGE,
    ],
    UserRole.SUPERADMIN: [
        Permission.SUPERADMIN_ALL,
    ],
}


# ============== Models ==============

class CustomRole(Base):
    """Custom role with specific permissions."""
    __tablename__ = "custom_roles"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    base_role: Mapped[str] = mapped_column(String(20), default="TEACHER")
    permissions: Mapped[dict] = mapped_column(JSON, default=dict)  # {"permissions": ["perm1", "perm2"]}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserCustomRole(Base):
    """Association between users and custom roles."""
    __tablename__ = "user_custom_roles"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    custom_role_id: Mapped[int] = mapped_column(Integer, ForeignKey("custom_roles.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============== Schemas ==============

class CustomRoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    base_role: UserRole = UserRole.TEACHER
    permissions: List[str] = []


class CustomRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CustomRoleResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    description: Optional[str]
    base_role: str
    permissions: List[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Router ==============

router = APIRouter(prefix="/permissions", tags=["Permissions"])


@router.get("/available")
async def list_available_permissions(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
):
    """List all available permissions in the system."""
    categories = {}
    
    for perm in Permission:
        category = perm.value.split(".")[0]
        if category not in categories:
            categories[category] = []
        categories[category].append({
            "key": perm.value,
            "name": perm.name.replace("_", " ").title()
        })
    
    return {
        "categories": categories,
        "total": len(Permission)
    }


@router.get("/matrix")
async def get_permission_matrix(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN))
):
    """Get the full permission matrix showing what each role can do."""
    matrix = {}
    
    for role in UserRole:
        perms = DEFAULT_ROLE_PERMISSIONS.get(role, [])
        matrix[role.value] = [p.value for p in perms]
    
    return {
        "matrix": matrix,
        "permissions": [p.value for p in Permission]
    }


@router.get("/user/{user_id}")
async def get_user_permissions(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Get all permissions for a specific user (base + custom roles)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Base permissions from role
    base_perms = set(p.value for p in DEFAULT_ROLE_PERMISSIONS.get(user.role, []))
    
    # Custom role permissions
    custom_perms = set()
    custom_roles_result = await db.execute(
        select(CustomRole).join(UserCustomRole).where(
            UserCustomRole.user_id == user_id,
            CustomRole.is_active == True
        )
    )
    custom_roles = custom_roles_result.scalars().all()
    
    for cr in custom_roles:
        if cr.permissions and "permissions" in cr.permissions:
            custom_perms.update(cr.permissions["permissions"])
    
    # Combine
    all_perms = base_perms | custom_perms
    
    return {
        "user_id": user_id,
        "role": user.role.value,
        "base_permissions": list(base_perms),
        "custom_permissions": list(custom_perms),
        "all_permissions": list(all_perms),
        "custom_roles": [cr.name for cr in custom_roles]
    }


# ============== Custom Role CRUD ==============

@router.get("/roles")
async def list_custom_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List custom roles for the organization."""
    query = select(CustomRole)
    
    if current_user.organization_id:
        query = query.where(CustomRole.organization_id == current_user.organization_id)
    
    # Count
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Paginate
    query = query.order_by(CustomRole.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    roles = result.scalars().all()
    
    items = []
    for r in roles:
        items.append({
            "id": r.id,
            "organization_id": r.organization_id,
            "name": r.name,
            "description": r.description,
            "base_role": r.base_role,
            "permissions": r.permissions.get("permissions", []) if r.permissions else [],
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat()
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/roles")
async def create_custom_role(
    data: CustomRoleCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Create a custom role with specific permissions."""
    if not current_user.organization_id and current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(status_code=400, detail="No organization associated")
    
    # Validate permissions
    valid_perms = {p.value for p in Permission}
    invalid = [p for p in data.permissions if p not in valid_perms]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")
    
    role = CustomRole(
        organization_id=current_user.organization_id or 0,
        name=data.name,
        description=data.description,
        base_role=data.base_role.value,
        permissions={"permissions": data.permissions}
    )
    
    db.add(role)
    await db.commit()
    await db.refresh(role)
    
    return {
        "id": role.id,
        "name": role.name,
        "permissions": data.permissions,
        "message": "Custom role created"
    }


@router.put("/roles/{role_id}")
async def update_custom_role(
    role_id: int,
    data: CustomRoleUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Update a custom role."""
    role = await db.get(CustomRole, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Custom role not found")
    
    # Verify org access
    if current_user.organization_id and role.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permissions is not None:
        # Validate permissions
        valid_perms = {p.value for p in Permission}
        invalid = [p for p in data.permissions if p not in valid_perms]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")
        role.permissions = {"permissions": data.permissions}
    if data.is_active is not None:
        role.is_active = data.is_active
    
    await db.commit()
    
    return {"message": "Custom role updated", "id": role_id}


@router.delete("/roles/{role_id}")
async def delete_custom_role(
    role_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Delete a custom role (soft delete by setting inactive)."""
    role = await db.get(CustomRole, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Custom role not found")
    
    if current_user.organization_id and role.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    role.is_active = False
    await db.commit()
    
    return {"message": "Custom role deactivated", "id": role_id}


# ============== User Role Assignment ==============

@router.post("/users/{user_id}/assign/{role_id}")
async def assign_custom_role(
    user_id: int,
    role_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Assign a custom role to a user."""
    user = await db.get(User, user_id)
    role = await db.get(CustomRole, role_id)
    
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or role not found")
    
    # Check if already assigned
    existing = await db.scalar(
        select(UserCustomRole).where(
            UserCustomRole.user_id == user_id,
            UserCustomRole.custom_role_id == role_id
        )
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned")
    
    assignment = UserCustomRole(user_id=user_id, custom_role_id=role_id)
    db.add(assignment)
    await db.commit()
    
    return {"message": "Custom role assigned", "user_id": user_id, "role": role.name}


@router.delete("/users/{user_id}/assign/{role_id}")
async def remove_custom_role(
    user_id: int,
    role_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Remove a custom role from a user."""
    result = await db.execute(
        select(UserCustomRole).where(
            UserCustomRole.user_id == user_id,
            UserCustomRole.custom_role_id == role_id
        )
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Role assignment not found")
    
    await db.delete(assignment)
    await db.commit()
    
    return {"message": "Custom role removed", "user_id": user_id}
