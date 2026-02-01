"""add_app_language_table

Revision ID: add_app_lang_001
Revises: f8f520bc480f
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_app_lang_001'
down_revision = 'content_pdf_vector_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create app_languages table for managing UI languages
    op.create_table('app_languages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('native_name', sa.String(100), nullable=False),
        sa.Column('script', sa.String(50), nullable=True),
        sa.Column('direction', sa.String(3), nullable=False, server_default='ltr'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_app_languages_id'), 'app_languages', ['id'], unique=False)
    op.create_index(op.f('ix_app_languages_code'), 'app_languages', ['code'], unique=True)
    
    # Seed default languages (English and Hindi)
    op.execute("""
        INSERT INTO app_languages (code, name, native_name, script, direction, is_active, sort_order)
        VALUES 
            ('en', 'English', 'English', 'Latin', 'ltr', true, 1),
            ('hi', 'Hindi', 'हिन्दी', 'Devanagari', 'ltr', true, 2)
        ON CONFLICT (code) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_app_languages_code'), table_name='app_languages')
    op.drop_index(op.f('ix_app_languages_id'), table_name='app_languages')
    op.drop_table('app_languages')
