# backend/app/healthcare_professionals/healthcare_professional_dto.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class HealthcareProfessionalBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    city: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class CreateHealthcareProfessionalRequest(HealthcareProfessionalBase):
    """Payload for creating a new Healthcare Professional record."""
    pass


class UpdateHealthcareProfessionalRequest(BaseModel):
    """Payload for partially updating a Healthcare Professional record."""
    name: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    city: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class HealthcareProfessionalResponse(HealthcareProfessionalBase):
    """Healthcare Professional data returned from the API."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
