"""add_chat_conversations

Revision ID: 24d4f373d4b6
Revises: add_app_lang_001
Create Date: 2026-01-31 19:37:09.550279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24d4f373d4b6'
down_revision: Union[str, None] = 'add_app_lang_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create teacher_profiles table
    op.create_table(
        'teacher_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('primary_grades', sa.JSON(), nullable=True),
        sa.Column('primary_subjects', sa.JSON(), nullable=True),
        sa.Column('school_type', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=True),
        sa.Column('teaching_style', sa.String(length=50), nullable=True),
        sa.Column('preferred_ai_tone', sa.String(length=20), nullable=True),
        sa.Column('common_challenges', sa.JSON(), nullable=True),
        sa.Column('favorite_topics', sa.JSON(), nullable=True),
        sa.Column('total_conversations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_messages', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teacher_profiles_user_id'), 'teacher_profiles', ['user_id'], unique=True)

    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('mode', sa.Enum('EXPLAIN', 'PLAN', 'ASSIST', 'ASK', 'GENERAL', name='chatmode'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('grade', sa.Integer(), nullable=True),
        sa.Column('subject', sa.String(length=100), nullable=True),
        sa.Column('topic', sa.String(length=300), nullable=True),
        sa.Column('context_data', sa.JSON(), nullable=True),
        sa.Column('message_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversations_user_id'), 'conversations', ['user_id'], unique=False)
    op.create_index(op.f('ix_conversations_created_at'), 'conversations', ['created_at'], unique=False)

    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('ai_model', sa.String(length=50), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('structured_data', sa.JSON(), nullable=True),
        sa.Column('suggested_followups', sa.JSON(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.Column('was_voice_input', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_conversation_id'), 'chat_messages', ['conversation_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_created_at'), 'chat_messages', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_created_at'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_conversation_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    
    op.drop_index(op.f('ix_conversations_created_at'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_user_id'), table_name='conversations')
    op.drop_table('conversations')
    
    op.drop_index(op.f('ix_teacher_profiles_user_id'), table_name='teacher_profiles')
    op.drop_table('teacher_profiles')
    
    op.execute('DROP TYPE chatmode')
