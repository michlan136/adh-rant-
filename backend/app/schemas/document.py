from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    id: int
    name: str
    category: str
    type: str
    size: Optional[str] = None
    url: str
    created_at: datetime

    class Config:
        from_attributes = True
