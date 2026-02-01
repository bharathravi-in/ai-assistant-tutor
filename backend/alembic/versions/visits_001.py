"""Add visits table

Revision ID: visits_001
Revises: 
Create Date: 2026-02-01

Migrates visit scheduling from in-memory storage to PostgreSQL.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'visits_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create visits table
    op.create_table(
        'visits',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=True),
        sa.Column('crp_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=True),
        sa.Column('school_id', sa.Integer(), nullable=True),
        sa.Column('teacher_name', sa.String(100), nullable=True),
        sa.Column('school_name', sa.String(200), nullable=True),
        sa.Column('visit_date', sa.Date(), nullable=False),
        sa.Column('visit_time', sa.Time(), nullable=True),
        sa.Column('visit_time_str', sa.String(10), nullable=True),
        sa.Column('purpose', sa.Enum('routine', 'follow_up', 'training', 'observation', 'support', 'assessment', name='visitpurpose'), nullable=False, server_default='routine'),
        sa.Column('status', sa.Enum('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled', name='visitstatus'), nullable=False, server_default='scheduled'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('teacher_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('teacher_acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('teacher_response', sa.Enum('pending', 'accepted', 'reschedule_requested', name='teachervisitresponse'), nullable=False, server_default='pending'),
        sa.Column('teacher_response_notes', sa.Text(), nullable=True),
        sa.Column('proposed_reschedule_date', sa.Date(), nullable=True),
        sa.Column('proposed_reschedule_time', sa.String(10), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('completed_notes', sa.Text(), nullable=True),
        sa.Column('observation_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['crp_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='SET NULL'),
    )
    
    # Create indices for common queries
    op.create_index('ix_visits_organization_id', 'visits', ['organization_id'])
    op.create_index('ix_visits_crp_id', 'visits', ['crp_id'])
    op.create_index('ix_visits_teacher_id', 'visits', ['teacher_id'])
    op.create_index('ix_visits_visit_date', 'visits', ['visit_date'])
    op.create_index('ix_visits_status', 'visits', ['status'])
    
    # Composite index for common CRP query (their visits by date)
    op.create_index('ix_visits_crp_date', 'visits', ['crp_id', 'visit_date'])
    
    # Composite index for teacher query (their visits by status)
    op.create_index('ix_visits_teacher_status', 'visits', ['teacher_id', 'status'])


def downgrade() -> None:
    # Drop indices
    op.drop_index('ix_visits_teacher_status', 'visits')
    op.drop_index('ix_visits_crp_date', 'visits')
    op.drop_index('ix_visits_status', 'visits')
    op.drop_index('ix_visits_visit_date', 'visits')
    op.drop_index('ix_visits_teacher_id', 'visits')
    op.drop_index('ix_visits_crp_id', 'visits')
    op.drop_index('ix_visits_organization_id', 'visits')
    
    # Drop table
    op.drop_table('visits')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS visitpurpose')
    op.execute('DROP TYPE IF EXISTS visitstatus')
    op.execute('DROP TYPE IF EXISTS teachervisitresponse')
