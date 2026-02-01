"""
Direct Messaging Router - For Teacher-CRP communication
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User, UserRole
from app.models.direct_message import DirectMessage
from app.models.notification import Notification, NotificationType
from app.routers.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Direct Messages"])


# ===== Schemas =====

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    query_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: Optional[str]
    receiver_id: int
    receiver_name: Optional[str]
    content: str
    query_id: Optional[int]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    user_id: int
    user_name: Optional[str]
    user_role: str
    last_message: str
    last_message_at: datetime
    unread_count: int


# ===== Endpoints =====

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a direct message to another user."""
    # Verify receiver exists and is a valid recipient
    receiver_result = await db.execute(
        select(User).where(User.id == message.receiver_id)
    )
    receiver = receiver_result.scalar_one_or_none()
    
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Validate sender-receiver relationship
    # Teachers can message CRPs/ARPs, CRPs can message Teachers/ARPs
    valid_recipient = False
    if current_user.role == UserRole.TEACHER:
        valid_recipient = receiver.role in [UserRole.CRP, UserRole.ARP]
    elif current_user.role == UserRole.CRP:
        valid_recipient = receiver.role in [UserRole.TEACHER, UserRole.ARP]
    elif current_user.role == UserRole.ARP:
        valid_recipient = receiver.role in [UserRole.TEACHER, UserRole.CRP]
    elif current_user.role == UserRole.ADMIN:
        valid_recipient = True  # Admin can message anyone
    
    if not valid_recipient:
        raise HTTPException(status_code=403, detail="Cannot send message to this user")
    
    # Create message
    new_message = DirectMessage(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
        query_id=message.query_id,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(new_message)
    
    # Create notification for receiver
    notification = Notification(
        user_id=message.receiver_id,
        type=NotificationType.MESSAGE,
        title=f"New message from {current_user.display_name}",
        message=message.content[:100] + ("..." if len(message.content) > 100 else ""),
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notification)
    
    await db.commit()
    await db.refresh(new_message)
    
    return MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        sender_name=current_user.display_name,
        receiver_id=new_message.receiver_id,
        receiver_name=receiver.display_name,
        content=new_message.content,
        query_id=new_message.query_id,
        is_read=new_message.is_read,
        read_at=new_message.read_at,
        created_at=new_message.created_at
    )


@router.get("/conversations", response_model=List[ConversationPreview])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of conversations (unique users messaged with)."""
    # Get all users we've exchanged messages with
    # This is a complex query - we need to get the latest message with each user
    
    # First, get all unique users we've messaged with
    sent_to_result = await db.execute(
        select(DirectMessage.receiver_id).where(
            DirectMessage.sender_id == current_user.id
        ).distinct()
    )
    sent_to_ids = [r[0] for r in sent_to_result]
    
    received_from_result = await db.execute(
        select(DirectMessage.sender_id).where(
            DirectMessage.receiver_id == current_user.id
        ).distinct()
    )
    received_from_ids = [r[0] for r in received_from_result]
    
    # Combine unique user IDs
    all_user_ids = list(set(sent_to_ids + received_from_ids))
    
    if not all_user_ids:
        return []
    
    conversations = []
    for user_id in all_user_ids:
        # Get the user info
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            continue
        
        # Get the latest message
        latest_msg_result = await db.execute(
            select(DirectMessage)
            .where(
                or_(
                    and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == user_id),
                    and_(DirectMessage.sender_id == user_id, DirectMessage.receiver_id == current_user.id)
                )
            )
            .order_by(desc(DirectMessage.created_at))
            .limit(1)
        )
        latest_msg = latest_msg_result.scalar_one_or_none()
        
        # Count unread messages from this user
        unread_result = await db.execute(
            select(func.count(DirectMessage.id))
            .where(
                DirectMessage.sender_id == user_id,
                DirectMessage.receiver_id == current_user.id,
                DirectMessage.is_read == False
            )
        )
        unread_count = unread_result.scalar() or 0
        
        conversations.append(ConversationPreview(
            user_id=user.id,
            user_name=user.display_name,
            user_role=user.role.value,
            last_message=latest_msg.content[:50] + ("..." if len(latest_msg.content) > 50 else "") if latest_msg else "",
            last_message_at=latest_msg.created_at if latest_msg else datetime.utcnow(),
            unread_count=unread_count
        ))
    
    # Sort by last message time
    conversations.sort(key=lambda c: c.last_message_at, reverse=True)
    
    return conversations


@router.get("/contacts")
async def get_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of users this user can start a new chat with."""
    contacts = []
    
    # Recommendation logic:
    # 1. For Teachers: Their creator (CRP) and other CRPs in the same organization
    # 2. For CRPs: Their assigned ARP and Teachers they created
    
    if current_user.role == UserRole.TEACHER:
        # Get the CRP who created this teacher
        if current_user.created_by_id:
            creator_result = await db.execute(
                select(User).where(User.id == current_user.created_by_id)
            )
            creator = creator_result.scalar_one_or_none()
            if creator:
                contacts.append({
                    "id": creator.id,
                    "name": creator.name or creator.phone,
                    "role": creator.role.value,
                    "reason": "Your assigned CRP"
                })
        
        # Also show other CRPs in the organization
        crps_result = await db.execute(
            select(User).where(
                User.role == UserRole.CRP,
                User.organization_id == current_user.organization_id,
                User.id != (current_user.created_by_id or 0)
            ).limit(10)
        )
        for crp in crps_result.scalars().all():
            contacts.append({
                "id": crp.id,
                "name": crp.name or crp.phone,
                "role": crp.role.value,
                "reason": "Organization CRP"
            })
            
    elif current_user.role == UserRole.CRP:
        # Get Teachers this CRP created
        teachers_result = await db.execute(
            select(User).where(User.created_by_id == current_user.id).limit(20)
        )
        for teacher in teachers_result.scalars().all():
            contacts.append({
                "id": teacher.id,
                "name": teacher.name or teacher.phone,
                "role": teacher.role.value,
                "reason": "Teacher you supervise"
            })
            
        # Get assigned ARP
        if (getattr(current_user, 'assigned_arp_id', None)):
            arp_result = await db.execute(
                select(User).where(User.id == current_user.assigned_arp_id)
            )
            arp = arp_result.scalar_one_or_none()
            if arp:
                contacts.append({
                    "id": arp.id,
                    "name": arp.name or arp.phone,
                    "role": arp.role.value,
                    "reason": "Your assigned ARP"
                })
                
    elif current_user.role in [UserRole.ADMIN, UserRole.ARP]:
        # Admins/ARPs see everyone in their org (limited for now)
        users_result = await db.execute(
            select(User).where(
                User.organization_id == current_user.organization_id,
                User.id != current_user.id
            ).limit(30)
        )
        for user in users_result.scalars().all():
            contacts.append({
                "id": user.id,
                "name": user.name or user.phone,
                "role": user.role.value,
                "reason": f"Member of {current_user.organization.name if current_user.organization else 'organization'}"
            })
            
    # Remove duplicates just in case
    seen_ids = set()
    unique_contacts = []
    for c in contacts:
        if c["id"] not in seen_ids:
            unique_contacts.append(c)
            seen_ids.add(c["id"])
            
    return unique_contacts


@router.get("/with/{user_id}", response_model=List[MessageResponse])
async def get_messages_with_user(
    user_id: int,
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get message history with a specific user."""
    # Verify the user exists
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    other_user = user_result.scalar_one_or_none()
    
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query
    query = (
        select(DirectMessage)
        .where(
            or_(
                and_(DirectMessage.sender_id == current_user.id, DirectMessage.receiver_id == user_id),
                and_(DirectMessage.sender_id == user_id, DirectMessage.receiver_id == current_user.id)
            )
        )
    )
    
    if before_id:
        query = query.where(DirectMessage.id < before_id)
    
    query = query.order_by(desc(DirectMessage.created_at)).limit(limit)
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    # Mark messages from other user as read
    unread_messages = [m for m in messages if m.sender_id == user_id and not m.is_read]
    for msg in unread_messages:
        msg.is_read = True
        msg.read_at = datetime.utcnow()
    
    if unread_messages:
        await db.commit()
    
    # Get user names for response
    return [
        MessageResponse(
            id=msg.id,
            sender_id=msg.sender_id,
            sender_name=current_user.display_name if msg.sender_id == current_user.id else other_user.display_name,
            receiver_id=msg.receiver_id,
            receiver_name=other_user.display_name if msg.receiver_id == other_user.id else current_user.display_name,
            content=msg.content,
            query_id=msg.query_id,
            is_read=msg.is_read,
            read_at=msg.read_at,
            created_at=msg.created_at
        )
        for msg in reversed(messages)  # Reverse to get chronological order
    ]


@router.post("/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a message as read."""
    result = await db.execute(
        select(DirectMessage).where(
            DirectMessage.id == message_id,
            DirectMessage.receiver_id == current_user.id
        )
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()
    
    return {"status": "success"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get count of unread messages."""
    result = await db.execute(
        select(func.count(DirectMessage.id))
        .where(
            DirectMessage.receiver_id == current_user.id,
            DirectMessage.is_read == False
        )
    )
    count = result.scalar() or 0
    
    return {"unread_count": count}
