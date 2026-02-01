"""Merge visits and notifications

Revision ID: 67f3bbda7e6a
Revises: 348778f0a511, visits_001
Create Date: 2026-02-01 23:18:01.355056

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '67f3bbda7e6a'
down_revision: Union[str, None] = ('348778f0a511', 'visits_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
