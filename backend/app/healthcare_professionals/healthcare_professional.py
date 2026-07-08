# backend/app/healthcare_professionals/healthcare_professional.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database.base import Base


class HealthcareProfessional(Base):
    """SQLAlchemy model for a Healthcare Professional."""

    __tablename__ = "healthcare_professionals"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    specialty = Column(String)
    hospital = Column(String)
    city = Column(String)
    email = Column(String)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interactions = relationship("InteractionRecord", back_populates="healthcare_professional")

    def __repr__(self) -> str:
        return f"<HealthcareProfessional id={self.id} name={self.name!r} specialty={self.specialty!r}>"
