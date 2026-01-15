"""
Resources router - Learning resources API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.resource import Resource, ResourceBookmark, ResourceProgress, ResourceType, ResourceCategory

router = APIRouter(prefix="/resources", tags=["resources"])


# Pydantic schemas
class ResourceResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    category: str
    grade: Optional[str]
    subject: Optional[str]
    duration: Optional[str]
    content_url: Optional[str]
    thumbnail_url: Optional[str]
    is_bookmarked: bool = False
    is_completed: bool = False
    progress_percent: int = 0
    view_count: int = 0
    is_featured: bool = False
    
    class Config:
        from_attributes = True


class ResourceListResponse(BaseModel):
    items: List[ResourceResponse]
    total_items: int
    page: int
    page_size: int


class BookmarkResponse(BaseModel):
    id: int
    resource_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    progress_percent: Optional[int] = None
    is_completed: Optional[bool] = None


class ProgressResponse(BaseModel):
    id: int
    resource_id: int
    is_completed: bool
    progress_percent: int
    last_accessed_at: datetime
    
    class Config:
        from_attributes = True


# Helper to get user's bookmark and progress status
async def get_user_resource_status(db: AsyncSession, user_id: int, resource_ids: List[int]):
    """Get bookmark and progress status for resources."""
    bookmarks = {}
    progress = {}
    
    if resource_ids:
        # Get bookmarks
        bookmark_result = await db.execute(
            select(ResourceBookmark.resource_id).where(
                ResourceBookmark.user_id == user_id,
                ResourceBookmark.resource_id.in_(resource_ids)
            )
        )
        bookmarks = {row[0]: True for row in bookmark_result.fetchall()}
        
        # Get progress
        progress_result = await db.execute(
            select(ResourceProgress).where(
                ResourceProgress.user_id == user_id,
                ResourceProgress.resource_id.in_(resource_ids)
            )
        )
        for p in progress_result.scalars().all():
            progress[p.resource_id] = {
                "is_completed": p.is_completed,
                "progress_percent": p.progress_percent
            }
    
    return bookmarks, progress


@router.get("", response_model=ResourceListResponse)
async def get_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    category: Optional[str] = None,
    type: Optional[str] = None,
    grade: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    bookmarked_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of learning resources with filtering and pagination.
    """
    query = select(Resource).where(Resource.is_active == True)
    
    # Apply filters
    if category and category != "all":
        try:
            cat_enum = ResourceCategory(category)
            query = query.where(Resource.category == cat_enum)
        except ValueError:
            pass
    
    if type:
        try:
            type_enum = ResourceType(type)
            query = query.where(Resource.type == type_enum)
        except ValueError:
            pass
    
    if grade:
        query = query.where(or_(
            Resource.grade.ilike(f"%{grade}%"),
            Resource.grade == "All"
        ))
    
    if subject:
        query = query.where(or_(
            Resource.subject.ilike(f"%{subject}%"),
            Resource.subject == "General"
        ))
    
    if search:
        query = query.where(or_(
            Resource.title.ilike(f"%{search}%"),
            Resource.description.ilike(f"%{search}%"),
            Resource.tags.ilike(f"%{search}%")
        ))
    
    if bookmarked_only:
        query = query.join(
            ResourceBookmark,
            (ResourceBookmark.resource_id == Resource.id) & 
            (ResourceBookmark.user_id == current_user.id)
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_items = (await db.execute(count_query)).scalar_one()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Resource.is_featured.desc(), Resource.created_at.desc())
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    resources = result.scalars().all()
    
    # Get user's bookmark and progress status
    resource_ids = [r.id for r in resources]
    bookmarks, progress = await get_user_resource_status(db, current_user.id, resource_ids)
    
    # Build response
    items = []
    for r in resources:
        prog = progress.get(r.id, {})
        items.append(ResourceResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            type=r.type.value if r.type else "document",
            category=r.category.value if r.category else "pedagogy",
            grade=r.grade,
            subject=r.subject,
            duration=r.duration,
            content_url=r.content_url,
            thumbnail_url=r.thumbnail_url,
            is_bookmarked=r.id in bookmarks,
            is_completed=prog.get("is_completed", False),
            progress_percent=prog.get("progress_percent", 0),
            view_count=r.view_count,
            is_featured=r.is_featured
        ))
    
    return ResourceListResponse(
        items=items,
        total_items=total_items,
        page=page,
        page_size=page_size
    )


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a single resource by ID and increment view count."""
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id, Resource.is_active == True)
    )
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Increment view count
    resource.view_count += 1
    await db.commit()
    
    # Get user status
    bookmarks, progress = await get_user_resource_status(db, current_user.id, [resource_id])
    prog = progress.get(resource_id, {})
    
    return ResourceResponse(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        type=resource.type.value if resource.type else "document",
        category=resource.category.value if resource.category else "pedagogy",
        grade=resource.grade,
        subject=resource.subject,
        duration=resource.duration,
        content_url=resource.content_url,
        thumbnail_url=resource.thumbnail_url,
        is_bookmarked=resource_id in bookmarks,
        is_completed=prog.get("is_completed", False),
        progress_percent=prog.get("progress_percent", 0),
        view_count=resource.view_count,
        is_featured=resource.is_featured
    )


@router.post("/{resource_id}/bookmark", response_model=BookmarkResponse)
async def bookmark_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a bookmark for a resource."""
    # Check resource exists
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id, Resource.is_active == True)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Check if already bookmarked
    existing = await db.execute(
        select(ResourceBookmark).where(
            ResourceBookmark.user_id == current_user.id,
            ResourceBookmark.resource_id == resource_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Resource already bookmarked")
    
    bookmark = ResourceBookmark(
        user_id=current_user.id,
        resource_id=resource_id
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    return BookmarkResponse(
        id=bookmark.id,
        resource_id=bookmark.resource_id,
        created_at=bookmark.created_at
    )


@router.delete("/{resource_id}/bookmark")
async def remove_bookmark(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a bookmark for a resource."""
    result = await db.execute(
        select(ResourceBookmark).where(
            ResourceBookmark.user_id == current_user.id,
            ResourceBookmark.resource_id == resource_id
        )
    )
    bookmark = result.scalar_one_or_none()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    await db.delete(bookmark)
    await db.commit()
    
    return {"message": "Bookmark removed"}


@router.post("/{resource_id}/progress", response_model=ProgressResponse)
async def update_progress(
    resource_id: int,
    data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user progress on a resource."""
    # Check resource exists
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id, Resource.is_active == True)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Get or create progress record
    result = await db.execute(
        select(ResourceProgress).where(
            ResourceProgress.user_id == current_user.id,
            ResourceProgress.resource_id == resource_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        progress = ResourceProgress(
            user_id=current_user.id,
            resource_id=resource_id
        )
        db.add(progress)
    
    # Update fields
    if data.progress_percent is not None:
        progress.progress_percent = min(100, max(0, data.progress_percent))
        if progress.progress_percent == 100:
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
    
    if data.is_completed is not None:
        progress.is_completed = data.is_completed
        if data.is_completed:
            progress.progress_percent = 100
            progress.completed_at = datetime.utcnow()
        else:
            progress.completed_at = None
    
    progress.last_accessed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(progress)
    
    return ProgressResponse(
        id=progress.id,
        resource_id=progress.resource_id,
        is_completed=progress.is_completed,
        progress_percent=progress.progress_percent,
        last_accessed_at=progress.last_accessed_at
    )


@router.get("/stats/summary")
async def get_resource_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's learning resource statistics."""
    # Total available resources
    total_result = await db.execute(
        select(func.count(Resource.id)).where(Resource.is_active == True)
    )
    total_resources = total_result.scalar_one()
    
    # Completed resources
    completed_result = await db.execute(
        select(func.count(ResourceProgress.id)).where(
            ResourceProgress.user_id == current_user.id,
            ResourceProgress.is_completed == True
        )
    )
    completed_count = completed_result.scalar_one()
    
    # Bookmarked resources
    bookmarked_result = await db.execute(
        select(func.count(ResourceBookmark.id)).where(
            ResourceBookmark.user_id == current_user.id
        )
    )
    bookmarked_count = bookmarked_result.scalar_one()
    
    # In progress resources
    in_progress_result = await db.execute(
        select(func.count(ResourceProgress.id)).where(
            ResourceProgress.user_id == current_user.id,
            ResourceProgress.is_completed == False,
            ResourceProgress.progress_percent > 0
        )
    )
    in_progress_count = in_progress_result.scalar_one()
    
    return {
        "total_resources": total_resources,
        "completed": completed_count,
        "bookmarked": bookmarked_count,
        "in_progress": in_progress_count,
        "completion_rate": round((completed_count / total_resources * 100) if total_resources > 0 else 0, 1)
    }
