"""
Chat Router - Conversational AI Interface

Supports:
- Multi-turn conversations with context
- Teacher profile/context memory
- Follow-up suggestions
- Voice input transcription
- Multiple chat modes (explain, plan, assist, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import time

from app.database import get_db
from app.models.user import User
from app.models.chat import Conversation, ChatMessage, TeacherProfile, ChatMode
from app.schemas.chat import (
    ConversationCreateInput,
    ConversationUpdateInput,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ChatMessageInput,
    ChatMessageResponse,
    ChatSendResponse,
    TeacherProfileInput,
    TeacherProfileResponse,
)
from app.routers.auth import get_current_user
from app.ai.llm_client import LLMClient
from app.services.transcription import TranscriptionService

router = APIRouter(prefix="/chat", tags=["Chat"])


# ===== Helper Functions =====

async def get_or_create_profile(db: AsyncSession, user_id: int) -> TeacherProfile:
    """Get or create teacher profile for context memory."""
    result = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = TeacherProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    
    return profile


async def build_conversation_context(conversation: Conversation, messages: List[ChatMessage], profile: TeacherProfile) -> dict:
    """Build context for AI including message history and teacher profile."""
    context = {
        "mode": conversation.mode,
        "grade": conversation.grade,
        "subject": conversation.subject,
        "topic": conversation.topic,
        "teacher_profile": {
            "primary_grades": profile.primary_grades or [],
            "primary_subjects": profile.primary_subjects or [],
            "teaching_style": profile.teaching_style,
            "preferred_tone": profile.preferred_ai_tone or "encouraging",
            "location": profile.location,
        },
        "message_history": [
            {"role": msg.role, "content": msg.content}
            for msg in messages[-10:]  # Last 10 messages for context
        ]
    }
    return context


def generate_followup_suggestions(mode: ChatMode, last_user_message: str, ai_response: str) -> List[str]:
    """Generate follow-up question suggestions based on conversation."""
    
    # Default suggestions by mode
    suggestions_by_mode = {
        ChatMode.EXPLAIN: [
            "Can you explain this with an example?",
            "How would I teach this to struggling students?",
            "What are common misconceptions about this?",
        ],
        ChatMode.PLAN: [
            "What activities can I include?",
            "How much time should I allocate?",
            "What assessment methods work best?",
        ],
        ChatMode.ASSIST: [
            "Can you suggest classroom management strategies?",
            "How do I differentiate for different levels?",
            "What materials do I need?",
        ],
        ChatMode.ASK: [
            "Can you elaborate on that?",
            "Do you have any examples?",
            "What else should I know?",
        ],
        ChatMode.GENERAL: [
            "Tell me more",
            "How can I apply this?",
            "What's the next step?",
        ],
    }
    
    # In production, use LLM to generate contextual follow-ups
    # For now, return mode-based defaults
    return suggestions_by_mode.get(mode, suggestions_by_mode[ChatMode.GENERAL])


async def generate_ai_response(
    conversation: Conversation,
    user_message: str,
    profile: TeacherProfile,
    messages: List[ChatMessage],
    db: AsyncSession,
    language: str = "en"
) -> tuple[str, Optional[dict], int]:
    """Generate AI response with context memory."""
    
    start_time = time.time()
    
    # Fetch system settings for LLM configuration
    from app.models.system_settings import SystemSettings
    system_settings = await db.scalar(select(SystemSettings).limit(1))
    
    # Build context from conversation history + teacher profile
    context = await build_conversation_context(conversation, messages, profile)
    
    # Build system prompt based on mode and profile
    mode_prompts = {
        ChatMode.EXPLAIN: f"You are an expert teacher assistant helping explain concepts. Teaching style: {profile.teaching_style or 'adaptive'}",
        ChatMode.PLAN: "You are a lesson planning assistant. Help create structured, effective lesson plans.",
        ChatMode.ASSIST: "You are a teaching assistant helping with classroom management and teaching strategies.",
        ChatMode.ASK: "You are a knowledgeable educational assistant answering teacher questions.",
        ChatMode.GENERAL: "You are a helpful assistant supporting teachers in their professional development.",
    }
    
    system_prompt = mode_prompts.get(conversation.mode, mode_prompts[ChatMode.GENERAL])
    
    # Add profile context to system prompt
    if context["teacher_profile"]["primary_subjects"]:
        system_prompt += f"\n\nTeacher teaches: {', '.join(context['teacher_profile']['primary_subjects'])}"
    if context["teacher_profile"]["primary_grades"]:
        system_prompt += f" to grades {', '.join(map(str, context['teacher_profile']['primary_grades']))}"
    
    system_prompt += f"\n\nResponse tone: {context['teacher_profile']['preferred_tone']}"
    system_prompt += f"\n\nUser's preferred language: {language}"
    
    # Build messages for LLM
    llm_messages = [{"role": "system", "content": system_prompt}]
    
    # Add recent conversation history
    for msg in context["message_history"]:
        llm_messages.append(msg)
    
    # Add current user message
    llm_messages.append({"role": "user", "content": user_message})
    
    # Call LLM
    llm = LLMClient(system_settings=system_settings)
    response_text = await llm.chat(llm_messages, temperature=0.7)
    
    response_time = int((time.time() - start_time) * 1000)
    
    # Extract structured data if mode is EXPLAIN or PLAN
    structured_data = None
    if conversation.mode in [ChatMode.EXPLAIN, ChatMode.PLAN]:
        # In production, parse structured response from LLM
        structured_data = {"mode": conversation.mode.value}
    
    return response_text, structured_data, response_time


# ===== Profile Endpoints =====

@router.get("/profile", response_model=TeacherProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current teacher's profile for context memory."""
    profile = await get_or_create_profile(db, current_user.id)
    return profile


@router.put("/profile", response_model=TeacherProfileResponse)
async def update_profile(
    input: TeacherProfileInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update teacher profile/preferences."""
    profile = await get_or_create_profile(db, current_user.id)
    
    # Update fields
    update_data = input.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    return profile


# ===== Conversation Endpoints =====

@router.post("/conversations", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    input: ConversationCreateInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation with optional first message."""
    
    # Get/create profile for context
    profile = await get_or_create_profile(db, current_user.id)
    
    # Create conversation
    conversation = Conversation(
        user_id=current_user.id,
        mode=input.mode,
        title=input.title,
        grade=input.grade,
        subject=input.subject,
        topic=input.topic,
        context_data={"profile_id": profile.id}  # Link to profile
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    # If initial message provided, send it
    if input.initial_message:
        # Add user message
        user_msg = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=input.initial_message,
            language=profile.preferred_language or "en",
        )
        db.add(user_msg)
        await db.commit()
        await db.refresh(user_msg)
        
        # Generate AI response
        ai_text, structured, response_time = await generate_ai_response(
            conversation, input.initial_message, profile, [user_msg], db, profile.preferred_language or "en"
        )
        
        ai_msg = ChatMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_text,
            structured_data=structured,
            ai_model="gemini-pro",
            response_time_ms=response_time,
            suggested_followups=generate_followup_suggestions(input.mode, input.initial_message, ai_text),
        )
        db.add(ai_msg)
        
        # Update conversation stats
        conversation.message_count = 2
        conversation.last_message_at = datetime.utcnow()
        if not conversation.title:
            # Generate title from first message
            conversation.title = input.initial_message[:50] + ("..." if len(input.initial_message) > 50 else "")
        
        await db.commit()
    
    # Reload with messages using eager loading
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation.id)
    )
    conversation = result.scalar_one()
    
    return conversation


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = 1,
    page_size: int = 20,
    mode: Optional[ChatMode] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's conversations with pagination."""
    
    # Build query
    query = select(Conversation).where(Conversation.user_id == current_user.id)
    
    if mode:
        query = query.where(Conversation.mode == mode)
    if is_active is not None:
        query = query.where(Conversation.is_active == is_active)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    # Apply pagination
    query = query.order_by(desc(Conversation.last_message_at), desc(Conversation.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    return ConversationListResponse(
        conversations=conversations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get conversation with full message history."""
    
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    input: ConversationUpdateInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update conversation metadata (title, active status)."""
    
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Update fields
    update_data = input.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conversation, field, value)
    
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    await db.delete(conversation)
    await db.commit()


# ===== Message Endpoints =====

@router.post("/conversations/{conversation_id}/messages", response_model=ChatSendResponse)
async def send_message(
    conversation_id: int,
    input: ChatMessageInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a conversation and get AI response."""
    
    # Get conversation
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get profile
    profile = await get_or_create_profile(db, current_user.id)
    
    # Get recent messages for context
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at)
    )
    messages = list(msg_result.scalars().all())
    
    # Handle voice input
    content = input.content
    was_voice = False
    if input.voice_note_url:
        # Transcribe voice note
        transcription_service = TranscriptionService(system_settings=system_settings)
        content = await transcription_service.transcribe_audio(input.voice_note_url)
        if not content:
            content = input.content  # Fallback to provided content
        was_voice = True
    
    # Add user message
    user_msg = ChatMessage(
        conversation_id=conversation_id,
        role="user",
        content=content,
        language=input.language,
        was_voice_input=was_voice,
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)
    
    # Generate AI response with context
    ai_text, structured, response_time = await generate_ai_response(
        conversation, content, profile, messages + [user_msg], db, input.language or "en"
    )
    
    ai_msg = ChatMessage(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_text,
        structured_data=structured,
        ai_model="gemini-pro",
        response_time_ms=response_time,
        language=input.language,
        suggested_followups=generate_followup_suggestions(conversation.mode, content, ai_text),
    )
    db.add(ai_msg)
    
    # Update conversation stats
    conversation.message_count += 2
    conversation.last_message_at = datetime.utcnow()
    
    # Generate title from first message if not set
    if not conversation.title and conversation.message_count == 2:
        conversation.title = content[:50] + ("..." if len(content) > 50 else "")
    
    # Update profile stats
    profile.total_messages += 2
    
    await db.commit()
    await db.refresh(conversation)
    
    return ChatSendResponse(
        user_message=user_msg,
        ai_response=ai_msg,
        conversation=conversation,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    conversation_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages from a conversation with pagination."""
    
    # Verify conversation ownership
    conv_result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Build query
    query = select(ChatMessage).where(ChatMessage.conversation_id == conversation_id)
    
    if before_id:
        query = query.where(ChatMessage.id < before_id)
    
    query = query.order_by(desc(ChatMessage.id)).limit(limit)
    
    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))  # Reverse to get chronological order
    
    return messages
