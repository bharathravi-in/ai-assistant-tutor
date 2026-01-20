"""Add master data configuration tables

Revision ID: master_data_001
Revises: role_based_features_001
Create Date: 2026-01-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'master_data_001'
down_revision: Union[str, None] = 'role_based_features_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # States table
    op.create_table('states',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('code', sa.String(10), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Districts table
    op.create_table('districts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('state_id', sa.Integer(), sa.ForeignKey('states.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_districts_state_id', 'districts', ['state_id'])

    # Blocks table
    op.create_table('blocks',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('district_id', sa.Integer(), sa.ForeignKey('districts.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_blocks_district_id', 'blocks', ['district_id'])

    # Clusters table
    op.create_table('clusters',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('block_id', sa.Integer(), sa.ForeignKey('blocks.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_clusters_block_id', 'clusters', ['block_id'])

    # Subjects table
    op.create_table('subjects',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('name_hindi', sa.String(100), nullable=True),
        sa.Column('code', sa.String(20), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Grades table
    op.create_table('grades',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('number', sa.Integer(), nullable=False, unique=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('alias', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Boards table
    op.create_table('boards',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('code', sa.String(20), nullable=False, unique=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Mediums table
    op.create_table('mediums',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False, unique=True),
        sa.Column('code', sa.String(10), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Academic Years table
    op.create_table('academic_years',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(20), nullable=False, unique=True),
        sa.Column('start_year', sa.Integer(), nullable=False),
        sa.Column('end_year', sa.Integer(), nullable=False),
        sa.Column('is_current', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Schools table
    op.create_table('schools',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('code', sa.String(50), nullable=True),
        sa.Column('block_id', sa.Integer(), sa.ForeignKey('blocks.id'), nullable=False),
        sa.Column('cluster_id', sa.Integer(), sa.ForeignKey('clusters.id'), nullable=True),
        sa.Column('board_id', sa.Integer(), sa.ForeignKey('boards.id'), nullable=True),
        sa.Column('medium_id', sa.Integer(), sa.ForeignKey('mediums.id'), nullable=True),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('teacher_count', sa.Integer(), default=0),
        sa.Column('student_count', sa.Integer(), default=0),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_schools_block_id', 'schools', ['block_id'])
    op.create_index('ix_schools_cluster_id', 'schools', ['cluster_id'])

    # Seed initial data for Indian states
    op.execute("""
        INSERT INTO states (name, code, is_active) VALUES
        ('Karnataka', 'KA', true),
        ('Tamil Nadu', 'TN', true),
        ('Maharashtra', 'MH', true),
        ('Kerala', 'KL', true),
        ('Andhra Pradesh', 'AP', true),
        ('Telangana', 'TS', true),
        ('Gujarat', 'GJ', true),
        ('Rajasthan', 'RJ', true),
        ('Uttar Pradesh', 'UP', true),
        ('Madhya Pradesh', 'MP', true)
    """)

    # Seed subjects
    op.execute("""
        INSERT INTO subjects (name, code, name_hindi, is_active) VALUES
        ('Mathematics', 'MATH', 'गणित', true),
        ('Science', 'SCI', 'विज्ञान', true),
        ('English', 'ENG', 'अंग्रेज़ी', true),
        ('Hindi', 'HIN', 'हिंदी', true),
        ('Social Studies', 'SST', 'सामाजिक अध्ययन', true),
        ('Kannada', 'KAN', 'कन्नड़', true),
        ('EVS', 'EVS', 'पर्यावरण अध्ययन', true),
        ('Computer Science', 'CS', 'कंप्यूटर विज्ञान', true)
    """)

    # Seed grades
    op.execute("""
        INSERT INTO grades (number, name, alias, is_active) VALUES
        (1, 'Class 1', 'I', true),
        (2, 'Class 2', 'II', true),
        (3, 'Class 3', 'III', true),
        (4, 'Class 4', 'IV', true),
        (5, 'Class 5', 'V', true),
        (6, 'Class 6', 'VI', true),
        (7, 'Class 7', 'VII', true),
        (8, 'Class 8', 'VIII', true),
        (9, 'Class 9', 'IX', true),
        (10, 'Class 10', 'X', true),
        (11, 'Class 11', 'XI', true),
        (12, 'Class 12', 'XII', true)
    """)

    # Seed boards
    op.execute("""
        INSERT INTO boards (name, code, full_name, is_active) VALUES
        ('CBSE', 'CBSE', 'Central Board of Secondary Education', true),
        ('ICSE', 'ICSE', 'Indian Certificate of Secondary Education', true),
        ('Karnataka State Board', 'KAR', 'Karnataka Secondary Education Examination Board', true),
        ('Tamil Nadu State Board', 'TN', 'Tamil Nadu Board of Secondary Education', true),
        ('Maharashtra State Board', 'MH', 'Maharashtra State Board of Secondary and Higher Secondary Education', true)
    """)

    # Seed mediums
    op.execute("""
        INSERT INTO mediums (name, code, is_active) VALUES
        ('English', 'EN', true),
        ('Hindi', 'HI', true),
        ('Kannada', 'KN', true),
        ('Tamil', 'TA', true),
        ('Telugu', 'TE', true),
        ('Marathi', 'MR', true),
        ('Gujarati', 'GU', true)
    """)

    # Seed current academic year
    op.execute("""
        INSERT INTO academic_years (name, start_year, end_year, is_current, is_active) VALUES
        ('2025-26', 2025, 2026, true, true),
        ('2024-25', 2024, 2025, false, true)
    """)


def downgrade() -> None:
    op.drop_table('schools')
    op.drop_table('clusters')
    op.drop_table('academic_years')
    op.drop_table('mediums')
    op.drop_table('boards')
    op.drop_table('grades')
    op.drop_table('subjects')
    op.drop_table('blocks')
    op.drop_table('districts')
    op.drop_table('states')
