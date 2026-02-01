"""Add PDF and vectorization fields to teacher_content

Revision ID: content_pdf_vector_001
Revises: f8f520bc480f
Create Date: 2026-01-31 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'content_pdf_vector_001'
down_revision: Union[str, None] = 'user_settings_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to teacher_content table
    op.add_column('teacher_content', sa.Column('pdf_path', sa.String(500), nullable=True))
    op.add_column('teacher_content', sa.Column('pdf_url', sa.String(1000), nullable=True))
    op.add_column('teacher_content', sa.Column('file_size_bytes', sa.Integer(), nullable=True))
    op.add_column('teacher_content', sa.Column('is_vectorized', sa.Boolean(), server_default='false', nullable=False))
    
    # Add new content types to the enum
    # First, we need to add the new enum values
    op.execute("ALTER TYPE contenttype ADD VALUE IF NOT EXISTS 'quick_reference'")
    op.execute("ALTER TYPE contenttype ADD VALUE IF NOT EXISTS 'study_guide'")
    op.execute("ALTER TYPE contenttype ADD VALUE IF NOT EXISTS 'explanation'")


def downgrade() -> None:
    # Remove the columns
    op.drop_column('teacher_content', 'is_vectorized')
    op.drop_column('teacher_content', 'file_size_bytes')
    op.drop_column('teacher_content', 'pdf_url')
    op.drop_column('teacher_content', 'pdf_path')
    
    # Note: Removing enum values is complex in PostgreSQL and typically not done in downgrade
