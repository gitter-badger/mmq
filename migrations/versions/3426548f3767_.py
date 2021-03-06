"""empty message

Revision ID: 3426548f3767
Revises: 29e14530360
Create Date: 2015-05-15 16:29:34.919799

"""

# revision identifiers, used by Alembic.
revision = '3426548f3767'
down_revision = '29e14530360'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('channel', sa.Column('volume', sa.Integer(), nullable=True))
    op.alter_column('channel', 'slug',
               existing_type=mysql.VARCHAR(length=64),
               nullable=True)
    op.alter_column('video', 'duration',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=True)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('video', 'duration',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=False)
    op.alter_column('channel', 'slug',
               existing_type=mysql.VARCHAR(length=64),
               nullable=False)
    op.drop_column('channel', 'volume')
    ### end Alembic commands ###
