"""Configuration models for master data."""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass


class State(Base):
    """Indian states master data."""
    __tablename__ = "states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)  # e.g., KA, TN, MH
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    districts: Mapped[list["District"]] = relationship("District", back_populates="state")


class District(Base):
    """Districts within states."""
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    state_id: Mapped[int] = mapped_column(Integer, ForeignKey("states.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    state: Mapped["State"] = relationship("State", back_populates="districts")
    blocks: Mapped[list["Block"]] = relationship("Block", back_populates="district")


class Block(Base):
    """Blocks within districts."""
    __tablename__ = "blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    district_id: Mapped[int] = mapped_column(Integer, ForeignKey("districts.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    district: Mapped["District"] = relationship("District", back_populates="blocks")
    clusters: Mapped[list["Cluster"]] = relationship("Cluster", back_populates="block")
    schools: Mapped[list["School"]] = relationship("School", back_populates="block")


class Cluster(Base):
    """Clusters within blocks (Indian educational system)."""
    __tablename__ = "clusters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    block_id: Mapped[int] = mapped_column(Integer, ForeignKey("blocks.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    block: Mapped["Block"] = relationship("Block", back_populates="clusters")
    schools: Mapped[list["School"]] = relationship("School", back_populates="cluster")


class Subject(Base):
    """Subjects/courses master data."""
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    name_hindi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # e.g., MATH, SCI, ENG
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Grade(Base):
    """Grade/class levels."""
    __tablename__ = "grades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    number: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)  # 1, 2, 3...12
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # Class 1, Class I
    alias: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # I, II, III
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Board(Base):
    """Education boards (CBSE, ICSE, State boards)."""
    __tablename__ = "boards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # CBSE, ICSE, KAR
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Medium(Base):
    """Language mediums of instruction."""
    __tablename__ = "mediums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)  # EN, HI, KN
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class AcademicYear(Base):
    """Academic years."""
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # 2025-26
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    end_year: Mapped[int] = mapped_column(Integer, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class School(Base):
    """Schools within blocks."""
    __tablename__ = "schools"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # School code/UDISE
    block_id: Mapped[int] = mapped_column(Integer, ForeignKey("blocks.id"), nullable=False)
    cluster_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("clusters.id"), nullable=True)
    board_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("boards.id"), nullable=True)
    medium_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("mediums.id"), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    teacher_count: Mapped[int] = mapped_column(Integer, default=0)
    student_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    block: Mapped["Block"] = relationship("Block", back_populates="schools")
    cluster: Mapped[Optional["Cluster"]] = relationship("Cluster", back_populates="schools")
    board: Mapped[Optional["Board"]] = relationship("Board")
    medium: Mapped[Optional["Medium"]] = relationship("Medium")
