"""Admin configuration API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.models.config import State, District, Block, Cluster, Subject, Grade, Board, Medium, AcademicYear, School
from app.models.user import User, UserRole
from app.routers.auth import require_role


router = APIRouter(prefix="/admin/config", tags=["Configuration"])


# ==================== SCHEMAS ====================

class StateCreate(BaseModel):
    name: str
    code: str

class StateResponse(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool
    class Config:
        from_attributes = True

class DistrictCreate(BaseModel):
    name: str
    state_id: int

class DistrictResponse(BaseModel):
    id: int
    name: str
    state_id: int
    is_active: bool
    class Config:
        from_attributes = True

class BlockCreate(BaseModel):
    name: str
    district_id: int

class BlockResponse(BaseModel):
    id: int
    name: str
    district_id: int
    is_active: bool
    class Config:
        from_attributes = True

class ClusterCreate(BaseModel):
    name: str
    block_id: int

class ClusterResponse(BaseModel):
    id: int
    name: str
    block_id: int
    is_active: bool
    class Config:
        from_attributes = True

class SubjectCreate(BaseModel):
    name: str
    code: str
    name_hindi: Optional[str] = None

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    name_hindi: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

class GradeCreate(BaseModel):
    number: int
    name: str
    alias: Optional[str] = None

class GradeResponse(BaseModel):
    id: int
    number: int
    name: str
    alias: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

class BoardCreate(BaseModel):
    name: str
    code: str
    full_name: Optional[str] = None

class BoardResponse(BaseModel):
    id: int
    name: str
    code: str
    full_name: Optional[str]
    is_active: bool
    class Config:
        from_attributes = True

class MediumCreate(BaseModel):
    name: str
    code: str

class MediumResponse(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool
    class Config:
        from_attributes = True

class AcademicYearCreate(BaseModel):
    name: str
    start_year: int
    end_year: int
    is_current: bool = False

class AcademicYearResponse(BaseModel):
    id: int
    name: str
    start_year: int
    end_year: int
    is_current: bool
    is_active: bool
    class Config:
        from_attributes = True


class SchoolCreate(BaseModel):
    name: str
    code: Optional[str] = None
    block_id: int
    cluster_id: Optional[int] = None
    board_id: Optional[int] = None
    medium_id: Optional[int] = None
    address: Optional[str] = None
    teacher_count: int = 0
    student_count: int = 0


class SchoolResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    block_id: int
    cluster_id: Optional[int]
    board_id: Optional[int]
    medium_id: Optional[int]
    address: Optional[str]
    teacher_count: int
    student_count: int
    is_active: bool
    class Config:
        from_attributes = True


# ==================== STATES ====================

@router.get("/states", response_model=List[StateResponse])
async def list_states(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(State).order_by(State.name))
    return result.scalars().all()

@router.post("/states", response_model=StateResponse)
async def create_state(
    data: StateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    state = State(name=data.name, code=data.code.upper())
    db.add(state)
    await db.commit()
    await db.refresh(state)
    return state

@router.put("/states/{state_id}", response_model=StateResponse)
async def update_state(
    state_id: int,
    data: StateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    state.name = data.name
    state.code = data.code.upper()
    await db.commit()
    await db.refresh(state)
    return state

@router.delete("/states/{state_id}")
async def delete_state(
    state_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    state.is_active = False
    await db.commit()
    return {"message": "State deactivated"}

@router.delete("/states/{state_id}/permanent")
async def permanent_delete_state(
    state_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    await db.delete(state)
    await db.commit()
    return {"message": "State deleted permanently"}

@router.patch("/states/{state_id}/toggle", response_model=StateResponse)
async def toggle_state_status(
    state_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(State).where(State.id == state_id))
    state = result.scalar_one_or_none()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    state.is_active = not state.is_active
    await db.commit()
    await db.refresh(state)
    return state


# ==================== DISTRICTS ====================

@router.get("/districts", response_model=List[DistrictResponse])
async def list_districts(
    state_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    query = select(District)
    if state_id:
        query = query.where(District.state_id == state_id)
    result = await db.execute(query.order_by(District.name))
    return result.scalars().all()

@router.post("/districts", response_model=DistrictResponse)
async def create_district(
    data: DistrictCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    district = District(name=data.name, state_id=data.state_id)
    db.add(district)
    await db.commit()
    await db.refresh(district)
    return district

@router.put("/districts/{district_id}", response_model=DistrictResponse)
async def update_district(
    district_id: int,
    data: DistrictCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    district.name = data.name
    district.state_id = data.state_id
    await db.commit()
    await db.refresh(district)
    return district

@router.delete("/districts/{district_id}")
async def delete_district(
    district_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    # Check for schools/blocks before permanent delete would be good, but users said "delete permaneentaly"
    await db.delete(district)
    await db.commit()
    return {"message": "District deleted permanently"}

@router.patch("/districts/{district_id}/toggle", response_model=DistrictResponse)
async def toggle_district_status(
    district_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    district.is_active = not district.is_active
    await db.commit()
    await db.refresh(district)
    return district


# ==================== BLOCKS ====================

@router.get("/blocks", response_model=List[BlockResponse])
async def list_blocks(
    district_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    query = select(Block)
    if district_id:
        query = query.where(Block.district_id == district_id)
    result = await db.execute(query.order_by(Block.name))
    return result.scalars().all()

@router.post("/blocks", response_model=BlockResponse)
async def create_block(
    data: BlockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    block = Block(name=data.name, district_id=data.district_id)
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return block

@router.put("/blocks/{block_id}", response_model=BlockResponse)
async def update_block(
    block_id: int,
    data: BlockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Block).where(Block.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    block.name = data.name
    block.district_id = data.district_id
    await db.commit()
    await db.refresh(block)
    return block

@router.delete("/blocks/{block_id}")
async def delete_block(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Block).where(Block.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    await db.delete(block)
    await db.commit()
    return {"message": "Block deleted permanently"}

@router.patch("/blocks/{block_id}/toggle", response_model=BlockResponse)
async def toggle_block_status(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Block).where(Block.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    block.is_active = not block.is_active
    await db.commit()
    await db.refresh(block)
    return block


# ==================== CLUSTERS ====================

@router.get("/clusters", response_model=List[ClusterResponse])
async def list_clusters(
    block_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    query = select(Cluster)
    if block_id:
        query = query.where(Cluster.block_id == block_id)
    result = await db.execute(query.order_by(Cluster.name))
    return result.scalars().all()

@router.post("/clusters", response_model=ClusterResponse)
async def create_cluster(
    data: ClusterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    cluster = Cluster(name=data.name, block_id=data.block_id)
    db.add(cluster)
    await db.commit()
    await db.refresh(cluster)
    return cluster

@router.put("/clusters/{cluster_id}", response_model=ClusterResponse)
async def update_cluster(
    cluster_id: int,
    data: ClusterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    cluster.name = data.name
    cluster.block_id = data.block_id
    await db.commit()
    await db.refresh(cluster)
    return cluster

@router.delete("/clusters/{cluster_id}")
async def delete_cluster(
    cluster_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    await db.delete(cluster)
    await db.commit()
    return {"message": "Cluster deleted permanently"}

@router.patch("/clusters/{cluster_id}/toggle", response_model=ClusterResponse)
async def toggle_cluster_status(
    cluster_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    cluster.is_active = not cluster.is_active
    await db.commit()
    await db.refresh(cluster)
    return cluster


# ==================== SCHOOLS ====================

@router.get("/schools", response_model=List[SchoolResponse])
async def list_schools(
    block_id: Optional[int] = None,
    cluster_id: Optional[int] = None,
    district_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    query = select(School)
    if cluster_id:
        query = query.where(School.cluster_id == cluster_id)
    if block_id:
        query = query.where(School.block_id == block_id)
    if district_id:
        # Get all blocks for this district then filter schools
        blocks_result = await db.execute(select(Block.id).where(Block.district_id == district_id))
        block_ids = [b for b in blocks_result.scalars().all()]
        if block_ids:
            query = query.where(School.block_id.in_(block_ids))
    result = await db.execute(query.order_by(School.name))
    return result.scalars().all()

@router.get("/schools/{school_id}", response_model=SchoolResponse)
async def get_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school

@router.post("/schools", response_model=SchoolResponse)
async def create_school(
    data: SchoolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    school = School(
        name=data.name,
        code=data.code,
        block_id=data.block_id,
        cluster_id=data.cluster_id,
        board_id=data.board_id,
        medium_id=data.medium_id,
        address=data.address,
        teacher_count=data.teacher_count,
        student_count=data.student_count
    )
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school

@router.put("/schools/{school_id}", response_model=SchoolResponse)
async def update_school(
    school_id: int,
    data: SchoolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    school.name = data.name
    school.code = data.code
    school.block_id = data.block_id
    school.cluster_id = data.cluster_id
    school.board_id = data.board_id
    school.medium_id = data.medium_id
    school.address = data.address
    school.teacher_count = data.teacher_count
    school.student_count = data.student_count
    await db.commit()
    await db.refresh(school)
    return school

@router.delete("/schools/{school_id}")
async def delete_school(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    await db.delete(school)
    await db.commit()
    return {"message": "School deleted permanently"}

@router.patch("/schools/{school_id}/toggle", response_model=SchoolResponse)
async def toggle_school_status(
    school_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    school.is_active = not school.is_active
    await db.commit()
    await db.refresh(school)
    return school

# ==================== SUBJECTS ====================

@router.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Subject).where(Subject.is_active == True).order_by(Subject.name))
    return result.scalars().all()

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    subject = Subject(name=data.name, code=data.code.upper(), name_hindi=data.name_hindi)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject.name = data.name
    subject.code = data.code.upper()
    subject.name_hindi = data.name_hindi
    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    subject.is_active = False
    await db.commit()
    return {"message": "Subject deleted"}


# ==================== GRADES ====================

@router.get("/grades", response_model=List[GradeResponse])
async def list_grades(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Grade).where(Grade.is_active == True).order_by(Grade.number))
    return result.scalars().all()

@router.post("/grades", response_model=GradeResponse)
async def create_grade(
    data: GradeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    grade = Grade(number=data.number, name=data.name, alias=data.alias)
    db.add(grade)
    await db.commit()
    await db.refresh(grade)
    return grade

@router.delete("/grades/{grade_id}")
async def delete_grade(
    grade_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Grade).where(Grade.id == grade_id))
    grade = result.scalar_one_or_none()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    grade.is_active = False
    await db.commit()
    return {"message": "Grade deleted"}


# ==================== BOARDS ====================

@router.get("/boards", response_model=List[BoardResponse])
async def list_boards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Board).where(Board.is_active == True).order_by(Board.name))
    return result.scalars().all()

@router.post("/boards", response_model=BoardResponse)
async def create_board(
    data: BoardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    board = Board(name=data.name, code=data.code.upper(), full_name=data.full_name)
    db.add(board)
    await db.commit()
    await db.refresh(board)
    return board

@router.delete("/boards/{board_id}")
async def delete_board(
    board_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Board).where(Board.id == board_id))
    board = result.scalar_one_or_none()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    board.is_active = False
    await db.commit()
    return {"message": "Board deleted"}


# ==================== MEDIUMS ====================

@router.get("/mediums", response_model=List[MediumResponse])
async def list_mediums(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(Medium).where(Medium.is_active == True).order_by(Medium.name))
    return result.scalars().all()

@router.post("/mediums", response_model=MediumResponse)
async def create_medium(
    data: MediumCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    medium = Medium(name=data.name, code=data.code.upper())
    db.add(medium)
    await db.commit()
    await db.refresh(medium)
    return medium


# ==================== ACADEMIC YEARS ====================

@router.get("/academic-years", response_model=List[AcademicYearResponse])
async def list_academic_years(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    result = await db.execute(select(AcademicYear).where(AcademicYear.is_active == True).order_by(AcademicYear.start_year.desc()))
    return result.scalars().all()

@router.post("/academic-years", response_model=AcademicYearResponse)
async def create_academic_year(
    data: AcademicYearCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    academic_year = AcademicYear(
        name=data.name, 
        start_year=data.start_year, 
        end_year=data.end_year,
        is_current=data.is_current
    )
    db.add(academic_year)
    await db.commit()
    await db.refresh(academic_year)
    return academic_year


# ==================== PUBLIC ENDPOINTS (no auth) ====================

@router.get("/public/subjects", response_model=List[SubjectResponse])
async def public_list_subjects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Subject).where(Subject.is_active == True).order_by(Subject.name))
    return result.scalars().all()

@router.get("/public/grades", response_model=List[GradeResponse])
async def public_list_grades(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Grade).where(Grade.is_active == True).order_by(Grade.number))
    return result.scalars().all()

@router.get("/public/states", response_model=List[StateResponse])
async def public_list_states(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(State).where(State.is_active == True).order_by(State.name))
    return result.scalars().all()

@router.get("/public/districts", response_model=List[DistrictResponse])
async def public_list_districts(state_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(District).where(District.is_active == True)
    if state_id:
        query = query.where(District.state_id == state_id)
    result = await db.execute(query.order_by(District.name))
    return result.scalars().all()

@router.get("/public/mediums", response_model=List[MediumResponse])
async def public_list_mediums(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Medium).where(Medium.is_active == True).order_by(Medium.name))
    return result.scalars().all()

@router.get("/public/boards", response_model=List[BoardResponse])
async def public_list_boards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Board).where(Board.is_active == True).order_by(Board.name))
    return result.scalars().all()

@router.get("/public/blocks", response_model=List[BlockResponse])
async def public_list_blocks(district_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    """Public endpoint to list blocks for CRP/ARP users."""
    query = select(Block).where(Block.is_active == True)
    if district_id:
        query = query.where(Block.district_id == district_id)
    result = await db.execute(query.order_by(Block.name))
    return result.scalars().all()

@router.get("/public/clusters", response_model=List[ClusterResponse])
async def public_list_clusters(
    block_id: Optional[int] = None, 
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to list clusters for CRP/ARP users."""
    query = select(Cluster).where(Cluster.is_active == True)
    if block_id:
        query = query.where(Cluster.block_id == block_id)
    result = await db.execute(query.order_by(Cluster.name))
    return result.scalars().all()


@router.get("/public/schools", response_model=List[SchoolResponse])
async def public_list_schools(
    cluster_id: Optional[int] = None,
    block_id: Optional[int] = None,
    district_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to list schools for CRP/ARP users."""
    query = select(School).where(School.is_active == True)
    if cluster_id:
        query = query.where(School.cluster_id == cluster_id)
    if block_id:
        query = query.where(School.block_id == block_id)
    if district_id:
        # Get all blocks for this district then filter schools
        blocks_result = await db.execute(select(Block.id).where(Block.district_id == district_id))
        block_ids = [b for b in blocks_result.scalars().all()]
        if block_ids:
            query = query.where(School.block_id.in_(block_ids))
    result = await db.execute(query.order_by(School.name))
    return result.scalars().all()


# ==================== SEED DATA ====================

import csv
import io


@router.post("/seed-data")
async def seed_master_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Seed master data with predefined Indian state/board/subject/grade data."""
    
    # Predefined States
    states_data = [
        ("Andhra Pradesh", "AP"), ("Arunachal Pradesh", "AR"), ("Assam", "AS"),
        ("Bihar", "BR"), ("Chhattisgarh", "CG"), ("Goa", "GA"), ("Gujarat", "GJ"),
        ("Haryana", "HR"), ("Himachal Pradesh", "HP"), ("Jharkhand", "JH"),
        ("Karnataka", "KA"), ("Kerala", "KL"), ("Madhya Pradesh", "MP"),
        ("Maharashtra", "MH"), ("Manipur", "MN"), ("Meghalaya", "ML"),
        ("Mizoram", "MZ"), ("Nagaland", "NL"), ("Odisha", "OD"), ("Punjab", "PB"),
        ("Rajasthan", "RJ"), ("Sikkim", "SK"), ("Tamil Nadu", "TN"),
        ("Telangana", "TS"), ("Tripura", "TR"), ("Uttar Pradesh", "UP"),
        ("Uttarakhand", "UK"), ("West Bengal", "WB"),
        ("Delhi", "DL"), ("Jammu and Kashmir", "JK"), ("Ladakh", "LA"),
    ]
    
    # Predefined Subjects
    subjects_data = [
        ("Mathematics", "MATH", "गणित"),
        ("Science", "SCI", "विज्ञान"),
        ("Social Studies", "SST", "सामाजिक अध्ययन"),
        ("English", "ENG", "अंग्रेज़ी"),
        ("Hindi", "HIN", "हिंदी"),
        ("Kannada", "KAN", "ಕನ್ನಡ"),
        ("Tamil", "TAM", "தமிழ்"),
        ("Telugu", "TEL", "తెలుగు"),
        ("Marathi", "MAR", "मराठी"),
        ("Bengali", "BEN", "বাংলা"),
        ("EVS", "EVS", "पर्यावरण अध्ययन"),
        ("Computer Science", "CS", "कंप्यूटर विज्ञान"),
        ("Physical Education", "PE", "शारीरिक शिक्षा"),
        ("Art", "ART", "कला"),
        ("Music", "MUS", "संगीत"),
    ]
    
    # Predefined Grades (Class 1-12)
    grades_data = [
        (1, "Class 1", "I"), (2, "Class 2", "II"), (3, "Class 3", "III"),
        (4, "Class 4", "IV"), (5, "Class 5", "V"), (6, "Class 6", "VI"),
        (7, "Class 7", "VII"), (8, "Class 8", "VIII"), (9, "Class 9", "IX"),
        (10, "Class 10", "X"), (11, "Class 11", "XI"), (12, "Class 12", "XII"),
    ]
    
    # Predefined Boards
    boards_data = [
        ("CBSE", "CBSE", "Central Board of Secondary Education"),
        ("ICSE", "ICSE", "Indian Certificate of Secondary Education"),
        ("Karnataka State Board", "KAR", "Karnataka Secondary Education Examination Board"),
        ("Tamil Nadu State Board", "TN", "Tamil Nadu Board of Secondary Education"),
        ("Maharashtra State Board", "MH", "Maharashtra State Board of Secondary and Higher Secondary Education"),
        ("Andhra Pradesh State Board", "AP", "Board of Secondary Education, Andhra Pradesh"),
        ("Telangana State Board", "TS", "Telangana State Board of Intermediate Education"),
        ("Gujarat State Board", "GJ", "Gujarat Secondary and Higher Secondary Education Board"),
        ("Rajasthan State Board", "RJ", "Board of Secondary Education, Rajasthan"),
        ("Uttar Pradesh State Board", "UP", "UP Board of High School and Intermediate Education"),
    ]
    
    # Predefined Mediums
    mediums_data = [
        ("English", "EN"), ("Hindi", "HI"), ("Kannada", "KN"),
        ("Tamil", "TA"), ("Telugu", "TE"), ("Marathi", "MR"),
        ("Bengali", "BN"), ("Gujarati", "GU"), ("Malayalam", "ML"),
        ("Punjabi", "PA"), ("Odia", "OR"), ("Urdu", "UR"),
    ]
    
    counts = {"states": 0, "subjects": 0, "grades": 0, "boards": 0, "mediums": 0}
    
    # Insert States
    for name, code in states_data:
        existing = await db.execute(select(State).where(State.code == code))
        if not existing.scalar_one_or_none():
            db.add(State(name=name, code=code))
            counts["states"] += 1
    
    # Insert Subjects
    for name, code, name_hindi in subjects_data:
        existing = await db.execute(select(Subject).where(Subject.code == code))
        if not existing.scalar_one_or_none():
            db.add(Subject(name=name, code=code, name_hindi=name_hindi))
            counts["subjects"] += 1
    
    # Insert Grades
    for number, name, alias in grades_data:
        existing = await db.execute(select(Grade).where(Grade.number == number))
        if not existing.scalar_one_or_none():
            db.add(Grade(number=number, name=name, alias=alias))
            counts["grades"] += 1
    
    # Insert Boards
    for name, code, full_name in boards_data:
        existing = await db.execute(select(Board).where(Board.code == code))
        if not existing.scalar_one_or_none():
            db.add(Board(name=name, code=code, full_name=full_name))
            counts["boards"] += 1
    
    # Insert Mediums
    for name, code in mediums_data:
        existing = await db.execute(select(Medium).where(Medium.code == code))
        if not existing.scalar_one_or_none():
            db.add(Medium(name=name, code=code))
            counts["mediums"] += 1
    
    await db.commit()
    
    # Now insert districts (need state IDs first)
    districts_by_state = {
        "KA": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Hubli-Dharwad", "Belagavi", 
               "Tumkur", "Davanagere", "Ballari", "Kalaburagi", "Raichur", "Bidar", "Hassan", "Mandya"],
        "TN": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore",
               "Erode", "Thoothukkudi", "Dindigul", "Thanjavur", "Tiruppur", "Kanchipuram"],
        "MH": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur", "Kolhapur",
               "Ahmednagar", "Amravati", "Akola", "Jalgaon", "Latur", "Satara"],
        "KL": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha",
               "Palakkad", "Malappuram", "Kottayam", "Pathanamthitta", "Idukki"],
        "AP": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati",
               "Kakinada", "Kadapa", "Anantapur", "Eluru"],
        "TS": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahbubnagar",
               "Nalgonda", "Adilabad", "Suryapet"],
        "GJ": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar",
               "Anand", "Mehsana", "Bharuch"],
        "RJ": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", 
               "Bharatpur", "Sikar", "Pali"],
        "UP": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj", "Ghaziabad", "Noida",
               "Aligarh", "Moradabad", "Bareilly", "Gorakhpur", "Mathura", "Firozabad"],
        "DL": ["Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", 
               "New Delhi", "North East Delhi", "North West Delhi", "South West Delhi", "Shahdara", "South East Delhi"],
        "BR": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Bihar Sharif", "Arrah"],
        "WB": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Bardhaman", "Malda", "Kharagpur"],
    }
    
    counts["districts"] = 0
    for state_code, district_names in districts_by_state.items():
        # Get state ID
        state_result = await db.execute(select(State).where(State.code == state_code))
        state = state_result.scalar_one_or_none()
        if state:
            for district_name in district_names:
                existing = await db.execute(
                    select(District).where(District.name == district_name, District.state_id == state.id)
                )
                if not existing.scalar_one_or_none():
                    db.add(District(name=district_name, state_id=state.id))
                    counts["districts"] += 1
    
    await db.commit()
    
    # Now insert blocks and clusters for key districts to enable testing
    test_districts = ["Bengaluru Urban", "Chennai", "Mumbai"]
    counts["blocks"] = 0
    counts["clusters"] = 0
    
    for d_name in test_districts:
        d_res = await db.execute(select(District).where(District.name == d_name))
        district = d_res.scalar_one_or_none()
        if district:
            # Add 2 blocks per district
            for i in range(1, 3):
                b_name = f"{d_name} Block {i}"
                b_exists = await db.execute(select(Block).where(Block.name == b_name, Block.district_id == district.id))
                block = b_exists.scalar_one_or_none()
                if not block:
                    block = Block(name=b_name, district_id=district.id)
                    db.add(block)
                    await db.flush()
                    counts["blocks"] += 1
                
                # Add 2 clusters per block
                for j in range(1, 3):
                    c_name = f"{b_name} Cluster {j}"
                    c_exists = await db.execute(select(Cluster).where(Cluster.name == c_name, Cluster.block_id == block.id))
                    if not c_exists.scalar_one_or_none():
                        cluster = Cluster(name=c_name, block_id=block.id)
                        db.add(cluster)
                        counts["clusters"] += 1

    await db.commit()
    
    return {
        "message": "Master data seeded successfully",
        "created": counts
    }


@router.post("/bulk-upload/{entity_type}")
async def bulk_upload_master_data(
    entity_type: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """Bulk upload master data from CSV file."""
    if entity_type not in ["states", "subjects", "grades", "boards", "mediums"]:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))
    
    success_count = 0
    failed_count = 0
    
    for row in reader:
        try:
            if entity_type == "states":
                existing = await db.execute(select(State).where(State.code == row.get('code', '').upper()))
                if not existing.scalar_one_or_none():
                    db.add(State(name=row['name'], code=row['code'].upper()))
                    success_count += 1
                    
            elif entity_type == "subjects":
                existing = await db.execute(select(Subject).where(Subject.code == row.get('code', '').upper()))
                if not existing.scalar_one_or_none():
                    db.add(Subject(
                        name=row['name'],
                        code=row['code'].upper(),
                        name_hindi=row.get('name_hindi', '')
                    ))
                    success_count += 1
                    
            elif entity_type == "grades":
                number = int(row.get('number', 0))
                existing = await db.execute(select(Grade).where(Grade.number == number))
                if not existing.scalar_one_or_none():
                    db.add(Grade(
                        number=number,
                        name=row['name'],
                        alias=row.get('alias', '')
                    ))
                    success_count += 1
                    
            elif entity_type == "boards":
                existing = await db.execute(select(Board).where(Board.code == row.get('code', '').upper()))
                if not existing.scalar_one_or_none():
                    db.add(Board(
                        name=row['name'],
                        code=row['code'].upper(),
                        full_name=row.get('full_name', '')
                    ))
                    success_count += 1
                    
            elif entity_type == "mediums":
                existing = await db.execute(select(Medium).where(Medium.code == row.get('code', '').upper()))
                if not existing.scalar_one_or_none():
                    db.add(Medium(name=row['name'], code=row['code'].upper()))
                    success_count += 1
                    
        except Exception as e:
            failed_count += 1
    
    await db.commit()
    
    return {
        "message": f"Uploaded {entity_type}",
        "success": success_count,
        "failed": failed_count
    }


@router.get("/download-template/{entity_type}")
async def download_template(entity_type: str):
    """Get CSV template for master data upload."""
    from fastapi.responses import PlainTextResponse
    
    templates = {
        "states": "name,code\nKarnataka,KA\nTamil Nadu,TN",
        "subjects": "name,code,name_hindi\nMathematics,MATH,गणित\nScience,SCI,विज्ञान",
        "grades": "number,name,alias\n1,Class 1,I\n2,Class 2,II",
        "boards": "name,code,full_name\nCBSE,CBSE,Central Board of Secondary Education",
        "mediums": "name,code\nEnglish,EN\nHindi,HI",
    }
    
    if entity_type not in templates:
        raise HTTPException(status_code=400, detail="Invalid entity type")
    
    return PlainTextResponse(
        content=templates[entity_type],
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={entity_type}_template.csv"}
    )

