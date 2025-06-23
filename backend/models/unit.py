from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..db.database import Base


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    bin = Column(String(12), index=True, nullable=True)
    code = Column(String(20), index=True, nullable=True)
    code_abp = Column(Integer, index=True, nullable=True)
    parent_id = Column(Integer, ForeignKey("units.id"), index=True, nullable=True)
    level = Column(Integer, index=True, nullable=False)
    direct_children_count = Column(Integer, default=0)
    total_descendants_count = Column(Integer, default=0)

    parent = relationship("Unit", remote_side=[id], backref="children", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Unit id={self.id} name='{self.name}'>"
