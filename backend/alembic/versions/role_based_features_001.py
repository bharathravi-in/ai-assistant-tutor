"""Add role-based features models

Revision ID: role_based_features_001
Revises: 
Create Date: 2026-01-16

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'role_based_features_001'
down_revision: Union[str, None] = '2d7ab1367007'  # Chain to existing head
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add created_by_id to users table
    op.add_column('users', sa.Column('created_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_users_created_by_id',
        'users', 'users',
        ['created_by_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create feedback_requests table
    op.create_table('feedback_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('requester_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('target_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_feedback_requests_requester_id', 'feedback_requests', ['requester_id'])
    op.create_index('ix_feedback_requests_target_user_id', 'feedback_requests', ['target_user_id'])
    
    # Create feedback_responses table
    op.create_table('feedback_responses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('request_id', sa.Integer(), sa.ForeignKey('feedback_requests.id'), nullable=False),
        sa.Column('responder_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('additional_notes', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), server_default=sa.func.now()),
    )
    
    # Create query_shares table
    op.create_table('query_shares',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('query_id', sa.Integer(), sa.ForeignKey('queries.id'), nullable=False),
        sa.Column('shared_with_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('mentor_notes', sa.Text(), nullable=True),
        sa.Column('is_reviewed', sa.Boolean(), default=False),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_query_shares_query_id', 'query_shares', ['query_id'])
    
    # Create surveys table
    op.create_table('surveys',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('target_role', sa.String(50), default='teacher'),
        sa.Column('target_user_ids', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), default='draft'),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('is_ai_generated', sa.Boolean(), default=False),
        sa.Column('generation_context', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create survey_responses table
    op.create_table('survey_responses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('survey_id', sa.Integer(), sa.ForeignKey('surveys.id'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_survey_responses_survey_id', 'survey_responses', ['survey_id'])
    
    # Create survey_assignments table
    op.create_table('survey_assignments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('survey_id', sa.Integer(), sa.ForeignKey('surveys.id'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.func.now()),
    )
    
    # Create programs table
    op.create_table('programs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('grade', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(100), nullable=True),
        sa.Column('cover_image_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(50), default='draft'),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('published_at', sa.DateTime(), nullable=True),
    )
    
    # Create program_resources table
    op.create_table('program_resources',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('program_id', sa.Integer(), sa.ForeignKey('programs.id'), nullable=False),
        sa.Column('resource_id', sa.Integer(), sa.ForeignKey('resources.id'), nullable=False),
        sa.Column('order', sa.Integer(), default=0),
        sa.Column('section_name', sa.String(255), nullable=True),
        sa.Column('section_order', sa.Integer(), default=0),
        sa.Column('added_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_program_resources_program_id', 'program_resources', ['program_id'])
    
    # Create resource_publish_requests table
    op.create_table('resource_publish_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('resource_id', sa.Integer(), sa.ForeignKey('resources.id'), nullable=False),
        sa.Column('requested_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reviewed_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('requested_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
    )
    
    # Add is_published column to resources table if not exists
    try:
        op.add_column('resources', sa.Column('is_published', sa.Boolean(), default=False, nullable=True))
    except Exception:
        pass  # Column might already exist


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('resource_publish_requests')
    op.drop_table('program_resources')
    op.drop_table('programs')
    op.drop_table('survey_assignments')
    op.drop_table('survey_responses')
    op.drop_table('surveys')
    op.drop_table('query_shares')
    op.drop_table('feedback_responses')
    op.drop_table('feedback_requests')
    
    # Remove created_by_id from users
    op.drop_constraint('fk_users_created_by_id', 'users', type_='foreignkey')
    op.drop_column('users', 'created_by_id')
