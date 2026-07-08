# backend/app/interaction_records/interaction_record.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database.base import Base


class InteractionRecord(Base):
    __tablename__ = "interaction_records"

    id = Column(Integer, primary_key=True)
    healthcare_professional_id = Column(Integer, ForeignKey("healthcare_professionals.id"), nullable=False)
    interaction_type = Column(String)
    date = Column(DateTime(timezone=True))
    time = Column(String)
    attendees = Column(JSON)
    discussion = Column(JSON)
    summary = Column(Text)
    sentiment = Column(String)
    materials = Column(JSON)
    samples = Column(Integer)
    outcomes = Column(JSON)
    follow_up = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    healthcare_professional = relationship("HealthcareProfessional", back_populates="interactions")

    def __repr__(self):
        return f"<InteractionRecord {self.id}>"
