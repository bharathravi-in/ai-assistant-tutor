"""
Program/Library API Router
Handles program creation, resource organization, and publishing
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserRole, Resource
from app.models.program import Program, ProgramResource, ResourcePublishRequest, ProgramStatus
from app.routers.auth import get_current_user

router = APIRouter(prefix="/programs", tags=["programs"])


# ============== Schemas ==============

class ProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grade: Optional[int] = None
    subject: Optional[str] = None
    cover_image_url: Optional[str] = None


class ProgramOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    grade: Optional[int]
    subject: Optional[str]
    cover_image_url: Optional[str]
    status: str
    is_public: bool
    resource_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class AddResourceToProgram(BaseModel):
    resource_id: int
    section_name: Optional[str] = None
    order: Optional[int] = None


class ProgramResourceOut(BaseModel):
    id: int
    resource_id: int
    resource_title: Optional[str] = None
    resource_type: Optional[str] = None
    section_name: Optional[str]
    order: int
    
    class Config:
        from_attributes = True


class PublishRequestCreate(BaseModel):
    resource_id: int


class PublishRequestOut(BaseModel):
    id: int
    resource_id: int
    resource_title: Optional[str] = None
    requested_by_name: Optional[str] = None
    status: str
    review_notes: Optional[str]
    requested_at: datetime
    reviewed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============== Program Endpoints ==============

@router.post("/", response_model=ProgramOut)
async def create_program(
    data: ProgramCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new program (ARP/Admin only)"""
    if current_user.role not in [UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only ARPs and Admins can create programs")
    
    program = Program(
        created_by_id=current_user.id,
        name=data.name,
        description=data.description,
        grade=data.grade,
        subject=data.subject,
        cover_image_url=data.cover_image_url,
        status=ProgramStatus.DRAFT
    )
    
    db.add(program)
    await db.commit()
    await db.refresh(program)
    
    return ProgramOut(
        id=program.id,
        name=program.name,
        description=program.description,
        grade=program.grade,
        subject=program.subject,
        cover_image_url=program.cover_image_url,
        status=program.status.value,
        is_public=program.is_public,
        resource_count=0,
        created_at=program.created_at
    )


@router.get("/", response_model=List[ProgramOut])
async def list_programs(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List programs based on user role"""
    query = select(Program)
    
    # Teachers see only published programs
    if current_user.role == UserRole.TEACHER:
        query = query.where(Program.status == ProgramStatus.PUBLISHED)
    # Mentors see their own + published
    elif current_user.role in [UserRole.CRP, UserRole.ARP]:
        query = query.where(
            (Program.created_by_id == current_user.id) | 
            (Program.status == ProgramStatus.PUBLISHED)
        )
    
    if status_filter:
        status_enum = ProgramStatus(status_filter)
        query = query.where(Program.status == status_enum)
    
    query = query.order_by(Program.created_at.desc())
    
    result = await db.execute(query)
    programs = result.scalars().all()
    
    output = []
    for p in programs:
        # Count resources
        res_result = await db.execute(
            select(ProgramResource).where(ProgramResource.program_id == p.id)
        )
        resource_count = len(res_result.scalars().all())
        
        output.append(ProgramOut(
            id=p.id,
            name=p.name,
            description=p.description,
            grade=p.grade,
            subject=p.subject,
            cover_image_url=p.cover_image_url,
            status=p.status.value,
            is_public=p.is_public,
            resource_count=resource_count,
            created_at=p.created_at
        ))
    
    return output


@router.post("/{program_id}/resources", response_model=ProgramResourceOut)
async def add_resource_to_program(
    program_id: int,
    data: AddResourceToProgram,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a resource to a program"""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    if program.created_by_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    resource = await db.get(Resource, data.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Get current max order
    order = data.order
    if order is None:
        max_order_result = await db.execute(
            select(ProgramResource.order)
            .where(ProgramResource.program_id == program_id)
            .order_by(ProgramResource.order.desc())
            .limit(1)
        )
        max_order = max_order_result.scalar_one_or_none()
        order = (max_order or 0) + 1
    
    program_resource = ProgramResource(
        program_id=program_id,
        resource_id=data.resource_id,
        section_name=data.section_name,
        order=order
    )
    
    db.add(program_resource)
    await db.commit()
    await db.refresh(program_resource)
    
    return ProgramResourceOut(
        id=program_resource.id,
        resource_id=program_resource.resource_id,
        resource_title=resource.title,
        resource_type=resource.resource_type.value if resource.resource_type else None,
        section_name=program_resource.section_name,
        order=program_resource.order
    )


@router.get("/{program_id}/resources", response_model=List[ProgramResourceOut])
async def get_program_resources(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resources in a program"""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    result = await db.execute(
        select(ProgramResource)
        .where(ProgramResource.program_id == program_id)
        .order_by(ProgramResource.section_order, ProgramResource.order)
    )
    program_resources = result.scalars().all()
    
    output = []
    for pr in program_resources:
        resource = await db.get(Resource, pr.resource_id)
        output.append(ProgramResourceOut(
            id=pr.id,
            resource_id=pr.resource_id,
            resource_title=resource.title if resource else None,
            resource_type=resource.resource_type.value if resource and resource.resource_type else None,
            section_name=pr.section_name,
            order=pr.order
        ))
    
    return output


@router.post("/{program_id}/publish")
async def publish_program(
    program_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish a program to make it available"""
    program = await db.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    if program.created_by_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    program.status = ProgramStatus.PUBLISHED
    program.is_public = True
    program.published_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Program published successfully"}


# ============== Resource Publishing Workflow ==============

@router.post("/publish-request", response_model=PublishRequestOut)
async def request_resource_publish(
    data: PublishRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Request to publish a resource to the library (Teacher)"""
    resource = await db.get(Resource, data.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if resource.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only request publish for your own resources")
    
    # Check for existing pending request
    existing = await db.execute(
        select(ResourcePublishRequest).where(
            ResourcePublishRequest.resource_id == data.resource_id,
            ResourcePublishRequest.status == "pending"
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Publish request already pending")
    
    request = ResourcePublishRequest(
        resource_id=data.resource_id,
        requested_by_id=current_user.id,
        status="pending"
    )
    
    db.add(request)
    await db.commit()
    await db.refresh(request)
    
    return PublishRequestOut(
        id=request.id,
        resource_id=request.resource_id,
        resource_title=resource.title,
        requested_by_name=current_user.name,
        status=request.status,
        review_notes=request.review_notes,
        requested_at=request.requested_at,
        reviewed_at=request.reviewed_at
    )


@router.get("/publish-requests", response_model=List[PublishRequestOut])
async def get_publish_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending publish requests (CRP/ARP)"""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only mentors can review publish requests")
    
    result = await db.execute(
        select(ResourcePublishRequest)
        .where(ResourcePublishRequest.status == "pending")
        .order_by(ResourcePublishRequest.requested_at.desc())
    )
    requests = result.scalars().all()
    
    output = []
    for r in requests:
        resource = await db.get(Resource, r.resource_id)
        requester = await db.get(User, r.requested_by_id)
        output.append(PublishRequestOut(
            id=r.id,
            resource_id=r.resource_id,
            resource_title=resource.title if resource else None,
            requested_by_name=requester.name if requester else None,
            status=r.status,
            review_notes=r.review_notes,
            requested_at=r.requested_at,
            reviewed_at=r.reviewed_at
        ))
    
    return output


@router.post("/publish-requests/{request_id}/review")
async def review_publish_request(
    request_id: int,
    approve: bool,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a publish request (CRP/ARP)"""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only mentors can review publish requests")
    
    request = await db.get(ResourcePublishRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request.status = "approved" if approve else "rejected"
    request.review_notes = notes
    request.reviewed_by_id = current_user.id
    request.reviewed_at = datetime.utcnow()
    
    # If approved, mark resource as published
    if approve:
        resource = await db.get(Resource, request.resource_id)
        if resource:
            resource.is_published = True
    
    await db.commit()
    
    return {"message": f"Request {'approved' if approve else 'rejected'}"}
