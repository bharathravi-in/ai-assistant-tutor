"""Add user_settings and custom_voices tables

Revision ID: user_settings_001
Revises: f8f520bc480f
Create Date: 2026-01-22 16:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'user_settings_001'
down_revision = 'f8f520bc480f'
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists."""
    conn = op.get_bind()
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # Create user_settings table if it doesn't exist
    if not table_exists('user_settings'):
        op.create_table(
            'user_settings',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, index=True, nullable=False),
            sa.Column('selected_voice', sa.String(50), default='voice-1', nullable=False, server_default='voice-1'),
            sa.Column('voice_rate', sa.Float(), default=1.0, nullable=False, server_default='1.0'),
            sa.Column('voice_pitch', sa.Float(), default=1.0, nullable=False, server_default='1.0'),
            sa.Column('auto_play_response', sa.Boolean(), default=False, nullable=False, server_default='false'),
            sa.Column('custom_voices', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        )
    
    # Create custom_voices table if it doesn't exist
    if not table_exists('custom_voices'):
        op.create_table(
            'custom_voices',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), index=True, nullable=False),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('gender', sa.String(10), default='male', nullable=False, server_default='male'),
            sa.Column('audio_filename', sa.String(255), nullable=False),
            sa.Column('audio_url', sa.String(500), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table('custom_voices')
    op.drop_table('user_settings')
