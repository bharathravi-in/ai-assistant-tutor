"""
Learning & Scenarios Router - Micro-learning modules and scenario templates
"""
from fastapi import APIRouter, Depends, HTTPException, Query as QueryParam
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, update
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.learning import (
    LearningModule, ModuleProgress, ScenarioTemplate,
    LearningModuleCategory, LearningModuleDifficulty
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/learning", tags=["Learning"])


# ===== Schemas =====

class ModuleResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    duration_minutes: int
    tags: Optional[List[str]] = None
    grades: Optional[List[int]] = None
    subjects: Optional[List[str]] = None
    is_featured: bool
    view_count: int
    completion_count: int
    rating_avg: float
    rating_count: int
    user_progress: Optional[dict] = None
    
    class Config:
        from_attributes = True


class ScenarioResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    tags: Optional[List[str]] = None
    grades: Optional[List[int]] = None
    subjects: Optional[List[str]] = None
    is_featured: bool
    view_count: int
    usage_count: int
    helpful_count: int
    
    class Config:
        from_attributes = True


class ModuleDetailResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    content: dict
    duration_minutes: int
    tags: Optional[List[str]] = None
    prerequisites: Optional[List[int]] = None
    related_modules: Optional[List[int]] = None
    grades: Optional[List[int]] = None
    subjects: Optional[List[str]] = None
    resources: Optional[List[dict]] = None
    user_progress: Optional[dict] = None
    
    class Config:
        from_attributes = True


class ScenarioDetailResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    situation: str
    context: Optional[dict] = None
    solution_framework: dict
    expert_tips: Optional[List[str]] = None
    common_mistakes: Optional[List[str]] = None
    related_modules: Optional[List[int]] = None
    related_resources: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class ProgressUpdateInput(BaseModel):
    completion_percentage: Optional[int] = None
    time_spent_minutes: Optional[int] = None
    is_completed: Optional[bool] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    is_bookmarked: Optional[bool] = None


# ===== Micro-Learning Modules =====

@router.get("/modules", response_model=List[ModuleResponse])
async def list_learning_modules(
    category: Optional[LearningModuleCategory] = None,
    difficulty: Optional[LearningModuleDifficulty] = None,
    search: Optional[str] = None,
    featured_only: bool = False,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all available learning modules with filters."""
    
    query = select(LearningModule).where(LearningModule.is_active == True)
    
    if category:
        query = query.where(LearningModule.category == category)
    if difficulty:
        query = query.where(LearningModule.difficulty == difficulty)
    if featured_only:
        query = query.where(LearningModule.is_featured == True)
    if search:
        query = query.where(
            or_(
                LearningModule.title.ilike(f"%{search}%"),
                LearningModule.description.ilike(f"%{search}%"),
                LearningModule.keywords.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(desc(LearningModule.is_featured), desc(LearningModule.rating_avg))
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    modules = result.scalars().all()
    
    # Get user progress for each module
    progress_result = await db.execute(
        select(ModuleProgress)
        .where(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_id.in_([m.id for m in modules])
        )
    )
    progress_map = {p.module_id: p for p in progress_result.scalars().all()}
    
    response = []
    for module in modules:
        module_dict = {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "category": module.category.value,
            "difficulty": module.difficulty.value,
            "duration_minutes": module.duration_minutes,
            "tags": module.tags,
            "grades": module.grades,
            "subjects": module.subjects,
            "is_featured": module.is_featured,
            "view_count": module.view_count,
            "completion_count": module.completion_count,
            "rating_avg": module.rating_avg,
            "rating_count": module.rating_count,
            "user_progress": None
        }
        
        if module.id in progress_map:
            p = progress_map[module.id]
            module_dict["user_progress"] = {
                "completion_percentage": p.completion_percentage,
                "is_completed": p.is_completed,
                "is_bookmarked": p.is_bookmarked,
                "rating": p.rating
            }
        
        response.append(ModuleResponse(**module_dict))
    
    return response


@router.get("/modules/{module_id}", response_model=ModuleDetailResponse)
async def get_learning_module(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific learning module."""
    
    result = await db.execute(
        select(LearningModule)
        .where(LearningModule.id == module_id, LearningModule.is_active == True)
    )
    module = result.scalar_one_or_none()
    
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Increment view count
    module.view_count += 1
    
    # Get or create user progress
    progress_result = await db.execute(
        select(ModuleProgress)
        .where(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_id == module_id
        )
    )
    progress = progress_result.scalar_one_or_none()
    
    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_id=module_id
        )
        db.add(progress)
    
    progress.last_accessed_at = datetime.utcnow()
    await db.commit()
    
    module_dict = {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "category": module.category.value,
        "difficulty": module.difficulty.value,
        "content": module.content,
        "duration_minutes": module.duration_minutes,
        "tags": module.tags,
        "prerequisites": module.prerequisites,
        "related_modules": module.related_modules,
        "grades": module.grades,
        "subjects": module.subjects,
        "resources": module.resources,
        "user_progress": {
            "completion_percentage": progress.completion_percentage,
            "time_spent_minutes": progress.time_spent_minutes,
            "is_completed": progress.is_completed,
            "is_bookmarked": progress.is_bookmarked,
            "rating": progress.rating,
            "started_at": progress.started_at.isoformat() if progress.started_at else None
        }
    }
    
    return ModuleDetailResponse(**module_dict)


@router.post("/modules/{module_id}/progress")
async def update_module_progress(
    module_id: int,
    input: ProgressUpdateInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's progress on a learning module."""
    
    # Get or create progress
    result = await db.execute(
        select(ModuleProgress)
        .where(
            ModuleProgress.user_id == current_user.id,
            ModuleProgress.module_id == module_id
        )
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        progress = ModuleProgress(
            user_id=current_user.id,
            module_id=module_id
        )
        db.add(progress)
    
    # Update fields
    if input.completion_percentage is not None:
        progress.completion_percentage = input.completion_percentage
    if input.time_spent_minutes is not None:
        progress.time_spent_minutes += input.time_spent_minutes
    if input.is_completed is not None:
        progress.is_completed = input.is_completed
        if input.is_completed:
            progress.completed_at = datetime.utcnow()
            progress.completion_percentage = 100
            
            # Increment module completion count
            await db.execute(
                update(LearningModule)
                .where(LearningModule.id == module_id)
                .values(completion_count=LearningModule.completion_count + 1)
            )
    
    if input.rating is not None:
        old_rating = progress.rating
        progress.rating = input.rating
        
        # Update module rating
        module_result = await db.execute(
            select(LearningModule).where(LearningModule.id == module_id)
        )
        module = module_result.scalar_one()
        
        if old_rating is None:
            # New rating
            module.rating_count += 1
            module.rating_avg = ((module.rating_avg * (module.rating_count - 1)) + input.rating) / module.rating_count
        else:
            # Update existing rating
            module.rating_avg = ((module.rating_avg * module.rating_count) - old_rating + input.rating) / module.rating_count
    
    if input.feedback is not None:
        progress.feedback = input.feedback
    if input.is_bookmarked is not None:
        progress.is_bookmarked = input.is_bookmarked
    
    progress.last_accessed_at = datetime.utcnow()
    await db.commit()
    
    return {"success": True}


# ===== Scenario Templates =====

@router.get("/scenarios", response_model=List[ScenarioResponse])
async def list_scenarios(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured_only: bool = False,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all available scenario templates."""
    
    query = select(ScenarioTemplate).where(ScenarioTemplate.is_active == True)
    
    if category:
        query = query.where(ScenarioTemplate.category == category)
    if featured_only:
        query = query.where(ScenarioTemplate.is_featured == True)
    if search:
        query = query.where(
            or_(
                ScenarioTemplate.title.ilike(f"%{search}%"),
                ScenarioTemplate.description.ilike(f"%{search}%"),
                ScenarioTemplate.keywords.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(desc(ScenarioTemplate.is_featured), desc(ScenarioTemplate.helpful_count))
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    scenarios = result.scalars().all()
    
    return scenarios


@router.get("/scenarios/{scenario_id}", response_model=ScenarioDetailResponse)
async def get_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific scenario template."""
    
    result = await db.execute(
        select(ScenarioTemplate)
        .where(ScenarioTemplate.id == scenario_id, ScenarioTemplate.is_active == True)
    )
    scenario = result.scalar_one_or_none()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Increment view count
    scenario.view_count += 1
    await db.commit()
    
    return scenario


@router.post("/scenarios/{scenario_id}/apply")
async def apply_scenario(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a scenario as applied/used."""
    
    result = await db.execute(
        select(ScenarioTemplate).where(ScenarioTemplate.id == scenario_id)
    )
    scenario = result.scalar_one_or_none()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario.usage_count += 1
    await db.commit()
    
    return {"success": True}


@router.post("/scenarios/{scenario_id}/helpful")
async def mark_scenario_helpful(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a scenario as helpful."""
    
    result = await db.execute(
        select(ScenarioTemplate).where(ScenarioTemplate.id == scenario_id)
    )
    scenario = result.scalar_one_or_none()
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    scenario.helpful_count += 1
    await db.commit()
    
    return {"success": True}
