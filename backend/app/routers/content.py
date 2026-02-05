"""
Content Router - Teacher-created content with approval workflow
Enhanced with PDF generation, GCP storage, and Qdrant vectorization
"""
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response
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
from app.services.storage import get_storage_provider
from app.routers.notifications import create_notification
from app.models.notification import NotificationType

# Lazy imports for optional services
_pdf_service = None
_pdf_service_loaded = False
_vector_service = None
_vector_service_loaded = False

def get_pdf_service():
    """Lazy load PDF service - retry on each call if previously failed."""
    global _pdf_service, _pdf_service_loaded
    if not _pdf_service_loaded:
        try:
            from app.services.pdf_service import get_pdf_service as _get_pdf
            _pdf_service = _get_pdf()
            _pdf_service_loaded = True
            print("✅ PDF service loaded successfully")
        except ImportError as e:
            print(f"⚠️ PDF service not available: {e}")
            # Don't mark as loaded - will retry on next call
            return None
    return _pdf_service

def get_vector_service():
    """Lazy load vector service - retry on each call if previously failed."""
    global _vector_service, _vector_service_loaded
    if not _vector_service_loaded:
        try:
            from app.services.vector_service import VectorService
            _vector_service = VectorService()
            _vector_service_loaded = True
            print("✅ Vector service loaded successfully")
        except ImportError as e:
            print(f"⚠️ Vector service not available: {e}")
            # Don't mark as loaded - will retry on next call
            return None
    return _vector_service

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
        pdf_url=getattr(content, 'pdf_url', None),
        file_size_bytes=getattr(content, 'file_size_bytes', None),
        is_vectorized=getattr(content, 'is_vectorized', False) or False,
        status=content.status,
        reviewer_id=content.reviewer_id,
        reviewer_name=content.reviewer.name if content.reviewer else None,
        review_notes=content.review_notes,
        reviewed_at=content.reviewed_at,
        view_count=content.view_count,
        like_count=content.like_count,
        parent_id=getattr(content, 'parent_id', None),
        remix_count=getattr(content, 'remix_count', 0),
        is_liked=is_liked,
        created_at=content.created_at,
        updated_at=content.updated_at,
        published_at=content.published_at
    )


async def process_content_async(
    content_id: int,
    title: str,
    content_type: str,
    description: str,
    content_json: Optional[dict],
    metadata: dict,
    author_name: str,
    generate_pdf: bool,
    vectorize: bool,
    db_url: str
):
    """Background task to generate PDF and vectorize content."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession as AS
    from sqlalchemy.orm import sessionmaker
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AS, expire_on_commit=False)
    
    async with async_session() as db:
        try:
            # Get content
            result = await db.execute(
                select(TeacherContent).where(TeacherContent.id == content_id)
            )
            content = result.scalar_one_or_none()
            if not content:
                print(f"Content {content_id} not found for processing")
                return
            
            # Generate PDF
            if generate_pdf:
                try:
                    pdf_service = get_pdf_service()
                    if pdf_service is None:
                        print(f"⚠️ PDF service not available for content {content_id}")
                    else:
                        structured_data = content_json.get('structured_data') if content_json else None
                        
                        pdf_bytes = pdf_service.generate_content_pdf(
                            title=title,
                            content_type=content_type,
                            description=description,
                            structured_data=structured_data,
                            metadata=metadata,
                            author_name=author_name
                        )
                        
                        # Upload to storage
                        storage = get_storage_provider()
                        file_path = f"content/{content_id}/{title.replace(' ', '_')[:50]}.pdf"
                        
                        await storage.upload_file(
                            file_data=pdf_bytes,
                            destination_path=file_path,
                            content_type="application/pdf"
                        )
                        
                        # Get URL
                        pdf_url = storage.get_signed_url(file_path, expiration_minutes=60*24*7)  # 7 days
                        
                        content.pdf_path = file_path
                        content.pdf_url = pdf_url
                        content.file_size_bytes = len(pdf_bytes)
                        
                        print(f"✅ PDF generated for content {content_id}: {file_path}")
                except Exception as e:
                    print(f"⚠️ PDF generation failed for content {content_id}: {e}")
            
            # Vectorize content
            if vectorize:
                try:
                    vector_service = get_vector_service()
                    if vector_service is None:
                        print(f"⚠️ Vector service not available for content {content_id}")
                    else:
                        qdrant_id = await vector_service.index_content(
                            content_id=content_id,
                            title=title,
                            description=description,
                            content_type=content_type,
                            grade=metadata.get('grade'),
                            subject=metadata.get('subject'),
                            topic=metadata.get('topic'),
                            tags=metadata.get('tags')
                        )
                        content.qdrant_id = qdrant_id
                        content.is_vectorized = True
                        print(f"✅ Content {content_id} vectorized in Qdrant")
                except Exception as e:
                    print(f"⚠️ Vectorization failed for content {content_id}: {e}")
            
            await db.commit()
            
        except Exception as e:
            print(f"❌ Background processing failed for content {content_id}: {e}")
        finally:
            await engine.dispose()


# ==================== TEACHER ENDPOINTS ====================

@router.post("/", response_model=ContentResponse)
async def create_content(
    content_data: ContentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new content with optional PDF generation and vectorization."""
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
    
    # Schedule background processing for PDF and vectorization
    from app.config import get_settings
    settings = get_settings()
    
    metadata = {
        'grade': content_data.grade,
        'subject': content_data.subject,
        'topic': content_data.topic,
        'tags': content_data.tags
    }
    
    background_tasks.add_task(
        process_content_async,
        content_id=content.id,
        title=content_data.title,
        content_type=content_data.content_type.value,
        description=content_data.description,
        content_json=content_data.content_json,
        metadata=metadata,
        author_name=current_user.name,
        generate_pdf=content_data.generate_pdf,
        vectorize=content_data.vectorize,
        db_url=settings.database_url
    )
    
    # Load relationships
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
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
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
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
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
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


@router.post("/{content_id}/remix", response_model=ContentResponse)
async def remix_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remix existing content.
    Creates a new draft for the current user based on an existing piece of content.
    """
    # 1. Fetch original content
    result = await db.execute(
        select(TeacherContent).where(TeacherContent.id == content_id)
    )
    original = result.scalar_one_or_none()
    
    if not original:
        raise HTTPException(status_code=404, detail="Content not found")

    # 2. Create remix
    remix = TeacherContent(
        author_id=current_user.id,
        title=f"Remix of {original.title}",
        content_type=original.content_type,
        description=original.description,
        content_json=original.content_json,
        grade=original.grade,
        subject=original.subject,
        topic=original.topic,
        tags=original.tags,
        parent_id=original.id,
        status=ContentStatus.DRAFT
    )
    
    db.add(remix)
    
    # 3. Increment remix count on original
    original.remix_count += 1
    
    await db.commit()
    await db.refresh(remix)
    
    return content_to_response(remix, current_user.id)


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
    query = query.options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
    query = query.order_by(TeacherContent.created_at.desc())  # Latest first
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
        
        # Send approval notification to teacher
        await create_notification(
            db=db,
            user_id=content.author_id,
            notification_type=NotificationType.CONTENT_APPROVED,
            title="Content Approved! 🎉",
            message=f'Your content "{content.title}" has been approved and is now published.',
            action_url=f"/teacher/my-content",
            action_label="View My Content",
            related_entity_type="content",
            related_entity_id=content.id
        )
        
        # TODO: Index content in Qdrant for search
        # await vector_service.index_content(content)
    else:
        content.status = ContentStatus.REJECTED
        
        # Send rejection notification to teacher
        rejection_message = f'Your content "{content.title}" needs revision.'
        if review_data.review_notes:
            rejection_message += f" Feedback: {review_data.review_notes}"
        
        await create_notification(
            db=db,
            user_id=content.author_id,
            notification_type=NotificationType.CONTENT_REJECTED,
            title="Content Needs Revision",
            message=rejection_message,
            action_url=f"/teacher/content/edit/{content.id}",
            action_label="Edit Content",
            related_entity_type="content",
            related_entity_id=content.id
        )
    
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
    total = total_result.scalar() or 0
    
    # Get paginated results ordered by popularity
    query = query.options(
        selectinload(TeacherContent.author),
        selectinload(TeacherContent.reviewer)
    )
    query = query.order_by(TeacherContent.like_count.desc(), TeacherContent.view_count.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    contents = result.scalars().all()
    
    # Check which ones are liked by current user
    liked_ids = set()
    if contents:
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


# ==================== PDF DOWNLOAD ENDPOINT ====================

@router.get("/{content_id}/pdf")
async def download_content_pdf(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download or generate PDF for content."""
    import traceback
    
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check access
    if content.status == ContentStatus.DRAFT and content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # If PDF exists and is stored, return signed URL or redirect
    pdf_path = getattr(content, 'pdf_path', None)
    if pdf_path:
        storage = get_storage_provider()
        signed_url = storage.get_signed_url(pdf_path, expiration_minutes=60)
        return {"pdf_url": signed_url, "file_size_bytes": getattr(content, 'file_size_bytes', None)}
    
    # Generate PDF on-the-fly if not stored
    try:
        print(f"📄 Generating PDF for content {content_id}...")
        pdf_service = get_pdf_service()
        if pdf_service is None:
            print("❌ PDF service is None - reportlab not installed?")
            raise HTTPException(status_code=503, detail="PDF service not available - reportlab may not be installed")
        
        # Extract structured data safely
        structured_data = None
        if content.content_json:
            structured_data = content.content_json.get('structured_data')
            print(f"📦 Structured data keys: {list(structured_data.keys()) if structured_data else 'None'}")
        
        metadata = {
            'grade': content.grade,
            'subject': content.subject,
            'topic': content.topic,
            'tags': content.tags
        }
        
        # Get content type value safely
        content_type_value = content.content_type.value if hasattr(content.content_type, 'value') else str(content.content_type)
        
        print(f"📝 Generating PDF: title={content.title}, type={content_type_value}")
        
        pdf_bytes = pdf_service.generate_content_pdf(
            title=content.title,
            content_type=content_type_value,
            description=content.description or "",
            structured_data=structured_data,
            metadata=metadata,
            author_name=content.author.name if content.author else "Unknown"
        )
        
        print(f"✅ PDF generated: {len(pdf_bytes)} bytes")
        
        # Sanitize filename
        safe_title = "".join(c for c in content.title[:50] if c.isalnum() or c in " _-").replace(" ", "_")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_title}.pdf"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        error_detail = traceback.format_exc()
        print(f"❌ PDF generation failed: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.post("/{content_id}/regenerate-pdf", response_model=ContentResponse)
async def regenerate_pdf(
    content_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate PDF for content."""
    result = await db.execute(
        select(TeacherContent)
        .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
        .where(TeacherContent.id == content_id)
    )
    content = result.scalar_one_or_none()
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only regenerate PDFs for your own content")
    
    # Schedule PDF regeneration
    from app.config import get_settings
    settings = get_settings()
    
    metadata = {
        'grade': content.grade,
        'subject': content.subject,
        'topic': content.topic,
        'tags': content.tags
    }
    
    background_tasks.add_task(
        process_content_async,
        content_id=content.id,
        title=content.title,
        content_type=content.content_type.value,
        description=content.description,
        content_json=content.content_json,
        metadata=metadata,
        author_name=current_user.name,
        generate_pdf=True,
        vectorize=False,
        db_url=settings.database_url
    )
    
    return content_to_response(content, current_user.id)


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
    results = []
    
    # Try Qdrant semantic search first
    try:
        vector_service = get_vector_service()
        vector_results = await vector_service.search_content(
            query=search_data.query,
            content_type=search_data.content_type.value if search_data.content_type else None,
            grade=search_data.grade,
            subject=search_data.subject,
            limit=search_data.limit
        )
        
        if vector_results:
            # Get full content for each result
            content_ids = [r['content_id'] for r in vector_results]
            
            result = await db.execute(
                select(TeacherContent)
                .options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
                .where(
                    TeacherContent.id.in_(content_ids),
                    TeacherContent.status == ContentStatus.PUBLISHED
                )
            )
            contents = {c.id: c for c in result.scalars().all()}
            
            # Check likes
            like_check = await db.execute(
                select(ContentLike.content_id).where(
                    ContentLike.user_id == current_user.id,
                    ContentLike.content_id.in_(content_ids)
                )
            )
            liked_ids = set(like_check.scalars().all())
            
            for vr in vector_results:
                if vr['content_id'] in contents:
                    results.append(ContentSearchResult(
                        content=content_to_response(
                            contents[vr['content_id']], 
                            current_user.id, 
                            vr['content_id'] in liked_ids
                        ),
                        score=vr['score']
                    ))
            
            if results:
                return results
                
    except Exception as e:
        print(f"⚠️ Qdrant search failed, falling back to keyword search: {e}")
    
    # Fallback to keyword search
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
    
    query = query.options(selectinload(TeacherContent.author), selectinload(TeacherContent.reviewer))
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
