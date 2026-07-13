from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class InteractionRecord(Base):
    __tablename__ = "interaction_records"

    id = Column(Integer, primary_key=True)
    healthcare_professional_id = Column(Integer, ForeignKey("healthcare_professionals.id"), nullable=False)

    hcp_name = Column(String, default="")
    interaction_date = Column(DateTime(timezone=True))
    interaction_time = Column(String, default="")
    interaction_type = Column(String, default="visit")
    hospital = Column(String, default="")
    specialization = Column(String, default="")
    products_discussed = Column(JSON, default=list)
    discussion_notes = Column(Text, default="")
    objections_raised = Column(JSON, default=list)
    materials_shared = Column(JSON, default=list)
    samples_provided = Column(Integer, default=0)
    sentiment = Column(String, default="neutral")
    priority = Column(String, default="medium")
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(String, default="")
    reminder_date = Column(String, default="")
    tags = Column(JSON, default=list)
    attachments = Column(JSON, default=list)
    attendees = Column(JSON, default=list)
    interaction_summary = Column(Text, default="")
    ai_confidence_score = Column(Float, default=0.0)
    created_by = Column(String, default="AI Assistant")
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    tool_used = Column(String, default="")
    interaction_status = Column(String, default="draft")
    status = Column(String, default="draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    healthcare_professional = relationship("HealthcareProfessional", back_populates="interactions")

    def __repr__(self):
        return f"<InteractionRecord {self.id}>"
