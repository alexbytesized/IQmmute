from sqlalchemy import Column, BigInteger, Text, Boolean, TIMESTAMP, Float, Integer, ForeignKey, func
from database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(BigInteger, primary_key=True, index=True)

    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    phone = Column(Text, nullable=True)

    license_no = Column(Text, unique=True, nullable=True)
    plate_no = Column(Text, unique=True, nullable=False)
    operator_name = Column(Text, nullable=True)

    max_passenger_count = Column(Integer, nullable=True)

    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)

class Route(Base):
    __tablename__ = "routes"

    id = Column(BigInteger, primary_key=True, index=True)

    route_code = Column(Text, unique=True, nullable=False)
    route_name = Column(Text, nullable=False)
    origin = Column(Text, nullable=False)
    destination = Column(Text, nullable=False)
    via = Column(Text, nullable=True)

    is_active = Column(Boolean, nullable=False, server_default="true")


class DriverRoute(Base):
    __tablename__ = "driver_routes"

    id = Column(BigInteger, primary_key=True, index=True)
    driver_id = Column(BigInteger, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    route_id = Column(BigInteger, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class DriverStatus(Base):
    __tablename__ = "driver_status"

    id = Column(BigInteger, primary_key=True, index=True)
    driver_id = Column(BigInteger, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)

    route_code = Column(Text, ForeignKey("routes.route_code", ondelete="SET NULL"), nullable=True)
    direction = Column(Text, nullable=True)  # inbound/outbound

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    crowd_level = Column(Text, nullable=True)
    current_passenger_count = Column(Integer, nullable=False, server_default="0")

    reported_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
