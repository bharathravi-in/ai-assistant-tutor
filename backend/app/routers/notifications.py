"""
Notification Router - Push notifications and real-time alerts
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, update
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.routers.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ===== Schemas =====

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_type: dict


# ===== Endpoints =====

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's notifications."""
    
    query = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_archived == False
    )
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.order_by(desc(Notification.created_at)).limit(limit).offset(offset)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return notifications


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get notification statistics."""
    
    # Total count
    total_result = await db.execute(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == current_user.id,
            Notification.is_archived == False
        )
    )
    total = total_result.scalar() or 0
    
    # Unread count
    unread_result = await db.execute(
        select(func.count(Notification.id))
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
            Notification.is_archived == False
        )
    )
    unread = unread_result.scalar() or 0
    
    # By type
    by_type_result = await db.execute(
        select(Notification.type, func.count(Notification.id))
        .where(
            Notification.user_id == current_user.id,
            Notification.is_archived == False
        )
        .group_by(Notification.type)
    )
    by_type = {ntype.value: count for ntype, count in by_type_result}
    
    return NotificationStats(
        total=total,
        unread=unread,
        by_type=by_type
    )


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read."""
    
    result = await db.execute(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read."""
    
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    await db.commit()
    
    return {"success": True}


@router.delete("/{notification_id}")
async def archive_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Archive (soft delete) a notification."""
    
    result = await db.execute(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_archived = True
    await db.commit()
    
    return {"success": True}


# ===== Notification Service Helper =====

async def create_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    action_label: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
    extra_data: Optional[dict] = None
) -> Notification:
    """Helper function to create a notification."""
    
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        action_label=action_label,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        extra_data=extra_data
    )
    
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    return notification
