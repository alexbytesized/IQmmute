from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from pydantic import EmailStr, Field


CrowdLevel = Literal["spacious", "crowded", "full"]
Direction = Literal["inbound", "outbound"]


class DriverCreate(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None

    email: EmailStr
    password: str = Field(min_length=6)

    license_no: Optional[str] = None
    plate_no: str
    operator_name: Optional[str] = None
    max_passenger_count: Optional[int] = Field(default=None, ge=0)

class DriverOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str]
    email: str
    license_no: Optional[str]
    plate_no: str
    operator_name: Optional[str]
    max_passenger_count: Optional[int]

    class Config:
        from_attributes = True

class DriverLogin(BaseModel):
    email: EmailStr
    password: str

class RouteOut(BaseModel):
    id: int
    route_code: str
    route_name: str
    origin: str
    destination: str
    via: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class DriverRouteAssign(BaseModel):
    driver_id: int
    route_code: str


class DriverStatusCreate(BaseModel):
    driver_id: int
    route_code: Optional[str] = None
    direction: Optional[Direction] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crowd_level: Optional[CrowdLevel] = None
    current_passenger_count: int = Field(ge=0)


class DriverStatusOut(BaseModel):
    id: int
    driver_id: int
    route_code: Optional[str]
    direction: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    crowd_level: Optional[str]
    current_passenger_count: int
    reported_at: datetime

    class Config:
        from_attributes = True
