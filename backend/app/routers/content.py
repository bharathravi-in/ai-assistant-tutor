"""
Content Router - Teacher-created content with approval workflow
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.teacher_content import TeacherContent, ContentLike, ContentStatus, ContentType
from app.schemas.content import (
    ContentCreate, ContentUpdate, ContentReview, ContentResponse,
    ContentListResponse, ContentSearchRequest, ContentSearchResult
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/content", tags=["Content"])


def content_to_response(content: TeacherContent, current_user_id: int = None, is_liked: bool = False) -> ContentResponse:
    """Convert TeacherContent model to response schema."""
    return ContentResponse(
        id=content.id,
        author_id=content.author_id,
        author_name=content.author.name if content.author else None,
        title=content.title,
        content_type=content.content_type,
        description=content.description,
        content_json=content.content_json,
        grade=content.grade,
        subject=content.subject,
        topic=content.topic,
        tags=content.tags,
        status=content.status,
        reviewer_id=content.reviewer_id,
        reviewer_name=content.reviewer.name if content.reviewer else None,
        review_notes=content.review_notes,
        reviewed_at=content.reviewed_at,
        view_count=content.view_count,
        like_count=content.like_count,
        is_liked=is_liked,
        created_at=content.created_at,
        updated_at=content.updated_at,
        published_at=content.published_at
    )


# ==================== TEACHER ENDPOINTS ====================

@router.post("/", response_model=ContentResponse)
async def create_content(
    content_data: ContentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new content (starts as draft)."""
    content = TeacherContent(
        author_id=current_user.id,
        title=content_data.title,
        content_type=content_data.content_type,
        description=content_data.description,
        content_json=content_data.content_json,
        grade=content_data.grade,
        subject=content_data.subject,
        topic=content_data.topic,
        tags=content_data.tags,
        status=ContentStatus.DRAFT
    )
    
    db.add(content)
    await db.commit()
    await db.refresh(content)
    
    # Load relationships
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author))
        .where(TeacherContent.id == content.id)
    )
    content = result.scalar_one()
    
    return content_to_response(content, current_user.id)


@router.get("/my", response_model=ContentListResponse)
async def get_my_content(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status: Optional[ContentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current teacher's content."""
    query = select(TeacherContent).where(TeacherContent.author_id == current_user.id)
    
    if status:
        query = query.where(TeacherContent.status == status)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
    query = query.order_by(TeacherContent.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    # Check which ones are liked by current user
    like_check = await db.execute(
        select(ContentLike.content_id).where(
            ContentLike.user_id == current_user.id,
            ContentLike.content_id.in_([c.id for c in contents])
        )
    )
    liked_ids = set(like_check.scalars().all())
    
    return ContentListResponse(
        items=[content_to_response(c, current_user.id, c.id in liked_ids) for c in contents],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get content by ID."""
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check access - only author can see drafts, everyone can see published
    if content.status == ContentStatus.DRAFT and content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Increment view count for published content
    if content.status == ContentStatus.PUBLISHED and content.author_id != current_user.id:
        content.view_count += 1
        await db.commit()
    
    # Check if liked
    like_result = await db.execute(
        select(ContentLike).where(
            ContentLike.content_id == content_id,
            ContentLike.user_id == current_user.id
        )
    )
    is_liked = like_result.scalar_one_or_none() is not None
    
    return content_to_response(content, current_user.id, is_liked)


@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: int,
    content_data: ContentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update content (only drafts can be edited)."""
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own content")
    
    if content.status != ContentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only drafts can be edited")
    
    # Update fields
    for field, value in content_data.model_dump(exclude_unset=True).items():
        setattr(content, field, value)
    
    content.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(content)
    
    return content_to_response(content, current_user.id)


@router.post("/{content_id}/submit", response_model=ContentResponse)
async def submit_for_review(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit content for review (draft → pending)."""
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only submit your own content")
    
    if content.status != ContentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only drafts can be submitted for review")
    
    content.status = ContentStatus.PENDING
    content.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(content)
    
    return content_to_response(content, current_user.id)


@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete content (only author can delete drafts)."""
    result = await db.execute(
        select(TeacherContent).where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own content")
    
    if content.status != ContentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only drafts can be deleted")
    
    await db.delete(content)
    await db.commit()
    
    return {"message": "Content deleted successfully"}


# ==================== CRP/ARP REVIEW ENDPOINTS ====================

@router.get("/pending/review", response_model=ContentListResponse)
async def get_pending_content(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    content_type: Optional[ContentType] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending content for review (CRP/ARP only)."""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only CRP/ARP can review content")
    
    query = select(TeacherContent).where(TeacherContent.status == ContentStatus.PENDING)
    
    if content_type:
        query = query.where(TeacherContent.content_type == content_type)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.options(selectinload(TeacherContent.author))
    query = query.order_by(TeacherContent.created_at.asc())  # Oldest first
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    return ContentListResponse(
        items=[content_to_response(c, current_user.id) for c in contents],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )


@router.post("/{content_id}/review", response_model=ContentResponse)
async def review_content(
    content_id: int,
    review_data: ContentReview,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve or reject content (CRP/ARP only)."""
    if current_user.role not in [UserRole.CRP, UserRole.ARP, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(status_code=403, detail="Only CRP/ARP can review content")
    
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.status != ContentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending content can be reviewed")
    
    content.reviewer_id = current_user.id
    content.review_notes = review_data.review_notes
    content.reviewed_at = datetime.utcnow()
    
    if review_data.approved:
        content.status = ContentStatus.PUBLISHED
        content.published_at = datetime.utcnow()
        
        # TODO: Index content in Qdrant for search
        # await vector_service.index_content(content)
    else:
        content.status = ContentStatus.REJECTED
    
    await db.commit()
    await db.refresh(content)
    
    # Reload relationships
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one()
    
    return content_to_response(content, current_user.id)


# ==================== LIBRARY ENDPOINTS ====================

@router.get("/library/browse", response_model=ContentListResponse)
async def browse_library(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    content_type: Optional[ContentType] = None,
    grade: Optional[int] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Browse published content library."""
    query = select(TeacherContent).where(TeacherContent.status == ContentStatus.PUBLISHED)
    
    if content_type:
        query = query.where(TeacherContent.content_type == content_type)
    if grade:
        query = query.where(TeacherContent.grade == grade)
    if subject:
        query = query.where(TeacherContent.subject == subject)
    if search:
        search_filter = or_(
            TeacherContent.title.ilike(f"%{search}%"),
            TeacherContent.description.ilike(f"%{search}%"),
            TeacherContent.topic.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results ordered by popularity
    query = query.options(selectinload(TeacherContent.author))
    query = query.order_by(TeacherContent.like_count.desc(), TeacherContent.view_count.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    # Check which ones are liked by current user
    like_check = await db.execute(
        select(ContentLike.content_id).where(
            ContentLike.user_id == current_user.id,
            ContentLike.content_id.in_([c.id for c in contents])
        )
    )
    liked_ids = set(like_check.scalars().all())
    
    return ContentListResponse(
        items=[content_to_response(c, current_user.id, c.id in liked_ids) for c in contents],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1
    )


@router.post("/{content_id}/like")
async def toggle_like(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Like or unlike content."""
    # Check content exists and is published
    content_result = await db.execute(
        select(TeacherContent).where(TeacherContent.id == content_id)
    )
    content = content_result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.status != ContentStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Can only like published content")
    
    # Check if already liked
    like_result = await db.execute(
        select(ContentLike).where(
            ContentLike.content_id == content_id,
            ContentLike.user_id == current_user.id
        )
    )
    existing_like = like_result.scalar_one_or_none()
    
    if existing_like:
        # Unlike
        await db.delete(existing_like)
        content.like_count = max(0, content.like_count - 1)
        liked = False
    else:
        # Like
        new_like = ContentLike(content_id=content_id, user_id=current_user.id)
        db.add(new_like)
        content.like_count += 1
        liked = True
    
    await db.commit()
    
    return {"liked": liked, "like_count": content.like_count}


# ==================== SEMANTIC SEARCH ENDPOINT ====================

@router.post("/search", response_model=List[ContentSearchResult])
async def search_content(
    search_data: ContentSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Semantic search for content using Qdrant.
    Falls back to keyword search if Qdrant is unavailable.
    """
    # TODO: Implement Qdrant semantic search
    # For now, use keyword search as fallback
    
    query = select(TeacherContent).where(TeacherContent.status == ContentStatus.PUBLISHED)
    
    # Apply filters
    if search_data.content_type:
        query = query.where(TeacherContent.content_type == search_data.content_type)
    if search_data.grade:
        query = query.where(TeacherContent.grade == search_data.grade)
    if search_data.subject:
        query = query.where(TeacherContent.subject == search_data.subject)
    
    # Keyword search
    search_filter = or_(
        TeacherContent.title.ilike(f"%{search_data.query}%"),
        TeacherContent.description.ilike(f"%{search_data.query}%"),
        TeacherContent.topic.ilike(f"%{search_data.query}%")
    )
    query = query.where(search_filter)
    
    query = query.options(selectinload(TeacherContent.author))
    query = query.limit(search_data.limit)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    # Check which ones are liked by current user
    like_check = await db.execute(
        select(ContentLike.content_id).where(
            ContentLike.user_id == current_user.id,
            ContentLike.content_id.in_([c.id for c in contents])
        )
    )
    liked_ids = set(like_check.scalars().all())
    
    return [
        ContentSearchResult(
            content=content_to_response(c, current_user.id, c.id in liked_ids),
            score=1.0  # Placeholder score for keyword search
        )
        for c in contents
    ]
