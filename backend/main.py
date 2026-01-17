import bcrypt
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
import io
from PIL import Image
from ultralytics import YOLO

from database import get_db
from models import Driver, Route, DriverRoute, DriverStatus
from geojson_utils import find_route_geometry, load_geojson
from schemas import (
    DriverCreate, DriverOut,
    RouteOut,
    DriverRouteAssign,
    DriverStatusCreate, DriverStatusOut,
    DriverLogin,
    DriverCrowdUpdate,
)

# Load GeoJSON on startup (or first request)
load_geojson()

# Initialize YOLO model
try:
    print("Loading YOLOv8 model...")
    model = YOLO("yolov8n.pt")
    print("Model loaded successfully.")
except Exception as e:
    print(f"Failed to load YOLO model: {e}")
    model = None

def count_passengers_in_image(image_bytes: bytes) -> int:
    """
    Runs YOLOv8 on the image bytes and counts class 'person' (id=0).
    """
    if model is None:
        print("⚠️ Model is not loaded. Returning 0.")
        return 0

    # Open image from bytes
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"Error opening image: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Run inference
    try:
        results = model(img, conf=0.4, verbose=False) 
    except Exception as e:
        print(f"Inference failed: {e}")
        return 0

    # Check the first result (since we sent one image)
    if not results:
        return 0
        
    result = results[0]
    
    # Count boxes with class_id == 0 (person)
    count = 0
    for box in result.boxes:
        cls_id = int(box.cls[0])
        if cls_id == 0:  # 0 is 'person' in COCO
            count += 1
            
    print(f"🔍 Detection complete: Found {count} passengers.")
    return count

def determine_crowd_level(count: int, max_capacity: int = 18) -> str:
    """
    Helper to map count to spacious/crowded/full.
    Default max_capacity is 18 (typical jeepney).
    """
    if max_capacity <= 0:
        max_capacity = 18 # Fallback
        
    ratio = count / max_capacity
    
    if ratio <= 0.50:
        return "spacious"
    elif ratio <= 0.90:
        return "crowded"
    else:
        return "full"


app = FastAPI(title="IQmmute API")

# Allow CORS for frontend interaction
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # React default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    # bcrypt expects bytes, so we encode the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    # bcrypt.checkpw expects (password_bytes, hashed_bytes)
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/cv/detect")
async def detect_passengers(
    driver_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Receives an image file + driver_id.
    Runs YOLO detection -> updates DB -> returns count & level.
    """
    # 1. Validate driver
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # 2. Read image bytes
    content = await file.read()
    
    # 3. Detect
    passenger_count = count_passengers_in_image(content)
    
    # 4. Determine crowd level
    # Use driver's specific max capacity if set, else default 18
    cap = driver.max_passenger_count if driver.max_passenger_count else 18
    crowd_level = determine_crowd_level(passenger_count, cap)
    
    # 5. Update Database (DriverStatus)
    now = datetime.now(timezone.utc)
    
    # We might want to know the driver's current route to log it in status
    # Let's see if they have an active route assignment
    # This matches the logic in 'create_driver_status' but automatically inferred
    status_entry = DriverStatus(
        driver_id=driver_id,
        current_passenger_count=passenger_count,
        crowd_level=crowd_level,
        reported_at=now,
    )
    
    # Optional: fetch active route to link this status
    active_assignment = (
        db.query(DriverRoute)
        .filter(DriverRoute.driver_id == driver_id)
        .order_by(desc(DriverRoute.assigned_at))
        .first()
    )
    if active_assignment:
        # We need the route_code from the route_id
        route = db.query(Route).filter(Route.id == active_assignment.route_id).first()
        if route:
            status_entry.route_code = route.route_code

    db.add(status_entry)
    db.commit()
    db.refresh(status_entry)
    
    return {
        "driver_id": driver_id,
        "passenger_count": passenger_count,
        "crowd_level": crowd_level,
        "max_capacity": cap
    }


@app.get("/routes", response_model=list[RouteOut])
def get_routes(db: Session = Depends(get_db)):
    routes = (
        db.query(Route)
        .filter(Route.is_active == True)
        .order_by(Route.route_code)
        .all()
    )
    return routes

@app.post("/drivers", response_model=DriverOut, status_code=201)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    # Normalize email
    email_norm = payload.email.strip().lower()

    # Unique checks
    existing_email = db.query(Driver).filter(Driver.email == email_norm).first()
    if existing_email:
        raise HTTPException(status_code=409, detail="email already exists")

    existing_plate = db.query(Driver).filter(Driver.plate_no == payload.plate_no).first()
    if existing_plate:
        raise HTTPException(status_code=409, detail="plate_no already exists")

    if payload.license_no:
        existing_lic = db.query(Driver).filter(Driver.license_no == payload.license_no).first()
        if existing_lic:
            raise HTTPException(status_code=409, detail="license_no already exists")


    d = Driver(
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        email=email_norm,
        password_hash=hash_password(payload.password),
        license_no=payload.license_no,
        plate_no=payload.plate_no,
        operator_name=payload.operator_name,
        max_passenger_count=payload.max_passenger_count,
    )

    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@app.post("/auth/driver/login")
def driver_login(payload: DriverLogin, db: Session = Depends(get_db)):
    email_norm = payload.email.strip().lower()
    driver = db.query(Driver).filter(Driver.email == email_norm).first()

    if not driver or not verify_password(payload.password, driver.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login OK",
        "driver_id": driver.id,
        "email": driver.email,
        "first_name": driver.first_name,
        "last_name": driver.last_name,
    }


@app.post("/driver-routes")
def assign_driver_route(payload: DriverRouteAssign, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    route = db.query(Route).filter(Route.route_code == payload.route_code).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    # For this system, let's assume one driver can only have one active route.
    # We clear previous assignments first.
    db.query(DriverRoute).filter(DriverRoute.driver_id == payload.driver_id).delete()

    dr = DriverRoute(driver_id=payload.driver_id, route_id=route.id)
    db.add(dr)
    db.commit()
    return {"message": "Assigned", "driver_id": payload.driver_id, "route_code": payload.route_code}


@app.get("/driver-routes/{driver_id}")
def get_driver_assigned_route(driver_id: int, db: Session = Depends(get_db)):
    assignment = (
        db.query(DriverRoute)
        .filter(DriverRoute.driver_id == driver_id)
        .order_by(desc(DriverRoute.assigned_at))
        .first()
    )
    if not assignment:
        return {"assigned": False}

    route = db.query(Route).filter(Route.id == assignment.route_id).first()
    return {
        "assigned": True,
        "route_code": route.route_code,
        "route_name": route.route_name
    }


@app.get("/routes/{route_code}/geometry")
def get_route_geometry(route_code: str):
    geometry = find_route_geometry(route_code)
    if not geometry:
        raise HTTPException(status_code=404, detail="Route geometry not found")
    return geometry


@app.post("/driver-status", response_model=DriverStatusOut, status_code=201)
def create_driver_status(payload: DriverStatusCreate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Validate route_code exists if provided
    if payload.route_code:
        route = db.query(Route).filter(Route.route_code == payload.route_code).first()
        if not route:
            raise HTTPException(status_code=404, detail="Route not found (invalid route_code)")

    # Validate passenger count does not exceed max (if max exists)
    if driver.max_passenger_count is not None and payload.current_passenger_count > driver.max_passenger_count:
        raise HTTPException(
            status_code=422,
            detail=f"current_passenger_count exceeds max_passenger_count ({driver.max_passenger_count})"
        )

    s = DriverStatus(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@app.get("/driver-status/latest", response_model=DriverStatusOut)
def latest_status(driver_id: int, db: Session = Depends(get_db)):
    s = (
        db.query(DriverStatus)
        .filter(DriverStatus.driver_id == driver_id)
        .order_by(desc(DriverStatus.reported_at))
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="No status yet for this driver")
    return s

@app.post("/cv/crowd")
def update_crowd(payload: DriverCrowdUpdate, db: Session = Depends(get_db)):
    # Ensure driver exists
    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    # Optional safety: enforce max capacity if you have it
    if driver.max_passenger_count is not None and payload.current_passenger_count > driver.max_passenger_count:
        raise HTTPException(
            status_code=422,
            detail=f"current_passenger_count exceeds max_passenger_count ({driver.max_passenger_count})"
        )

    now = datetime.now(timezone.utc)

    # Insert a new status row (keeps history)
    status = DriverStatus(
        driver_id=payload.driver_id,
        current_passenger_count=payload.current_passenger_count,
        crowd_level=payload.crowd_level,
        reported_at=now,
    )
    db.add(status)
    db.commit()
    return {"ok": True, "driver_id": payload.driver_id}
