# api.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
import os
import cv2
import shutil
from layers import L1Dist
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import models
from database import engine, get_db
from typing import List
from pydantic import BaseModel
import logging

# Constants - FIXED: Adjusted threshold for better matching
DETECTION_THRESHOLD = 0.6  # Increased threshold - lower scores = better match

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Initialize FastAPI
app = FastAPI(
    title="Face Verification API",
    description="API for face verification using Siamese Neural Networks",
    version="1.0.0"
)

# Configure CORS with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://192.168.100.62:8081",
        "http://192.168.193.130:8081",
        "exp://192.168.100.62:8081",
        "exp://192.168.193.130:8081"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load model with error handling
MODEL_PATH = "siamesemodelv2.h5"
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model file not found: {MODEL_PATH}")

try:
    # Load the model with custom objects
    model = tf.keras.models.load_model(
        MODEL_PATH,
        custom_objects={'L1Dist': L1Dist},
        compile=False  # Load without compilation first
    )
    
    # Compile the model with appropriate parameters
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
except Exception as e:
    raise RuntimeError(f"Failed to load model: {str(e)}")

def preprocess(file_path):
    """Enhanced preprocessing with better error handling"""
    try:
        byte_img = tf.io.read_file(file_path)
        img = tf.io.decode_jpeg(byte_img)
        img = tf.image.resize(img, (100,100))
        img = img / 255.0
        logger.info(f"Preprocessed image: shape={img.shape}, dtype={img.dtype}, min={tf.reduce_min(img).numpy():.3f}, max={tf.reduce_max(img).numpy():.3f}")
        return img
    except Exception as e:
        logger.error(f"Error preprocessing image {file_path}: {str(e)}")
        raise

# Pydantic models for request/response
class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str

class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    verification_image_path: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class AttendanceStats(BaseModel):
    total_employees: int
    present_today: int
    absent_today: int
    late_today: int
    attendance_rate: float

@app.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    first_name: str = Form(...),
    last_name: str = Form(...),
    verification_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Save verification image
        verification_path = f"application_data/verification_images/{first_name}_{last_name}.jpg"
        os.makedirs(os.path.dirname(verification_path), exist_ok=True)
        
        with open(verification_path, "wb") as f:
            shutil.copyfileobj(verification_image.file, f)

        # Create employee record
        db_employee = models.Employee(
            first_name=first_name,
            last_name=last_name,
            verification_image_path=verification_path
        )
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/employees/", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).all()

@app.post("/verify")
async def verify_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    logger.info("Received verification request")
    if not file:
        logger.error("No file uploaded")
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    SAVE_PATH = "application_data/input_image/input_image.jpg"
    os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

    try:
        # Save uploaded file
        logger.info(f"Saving uploaded file to {SAVE_PATH}")
        with open(SAVE_PATH, "wb") as f:
            shutil.copyfileobj(file.file, f)
            
        input_img = preprocess(SAVE_PATH)
        input_img = np.expand_dims(input_img, axis=0)
    except Exception as e:
        logger.error(f"Failed to process input image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to process input image: {str(e)}")
        
    employees = db.query(models.Employee).filter(models.Employee.is_active == True).all()
    if not employees:
        logger.error("No active employees found in the system")
        raise HTTPException(status_code=404, detail="No active employees found in the system")
        
    logger.info(f"Processing verification for {len(employees)} employees")
    best_match = None
    best_score = float('inf')  # Lower scores are better
    distances = []
    
    for employee in employees:
        try:
            if not os.path.exists(employee.verification_image_path):
                logger.warning(f"Verification image not found for employee {employee.id}: {employee.verification_image_path}")
                continue
                
            validation_img = preprocess(employee.verification_image_path)
            validation_img = np.expand_dims(validation_img, axis=0)
            result = model.predict([input_img, validation_img], verbose=0)  # Added verbose=0 to reduce logs
            distance = float(result[0][0])
            distances.append(distance)
            
            logger.info(f"Employee {employee.first_name} {employee.last_name} (ID: {employee.id}) - Distance: {distance:.4f}")
            
            if distance < best_score:  # Lower distance = better match
                best_score = distance
                best_match = employee
                
        except Exception as e:
            logger.error(f"Error processing employee {employee.id}: {str(e)}")
            continue
    
    # FIXED: Proper threshold logic and better response
    confidence_score = 1 - best_score if best_score != float('inf') else 0
    
    logger.info(f"Best match: {best_match.first_name if best_match else 'None'}, Distance: {best_score:.4f}, Threshold: {DETECTION_THRESHOLD}")
    
    # Check if verification passes
    if best_score > DETECTION_THRESHOLD or best_match is None:
        logger.info("Verification failed - no match found or confidence too low")
        return {
            "verified": False,
            "score": float(best_score),
            "confidence": float(confidence_score),
            "detection_ratio": float(confidence_score),
            "threshold": DETECTION_THRESHOLD,
            "distances": distances,
            "total_employees_checked": len(employees),
            "error": f"No matching face found or confidence too low. Best score: {best_score:.4f}, required: < {DETECTION_THRESHOLD}"
        }
        
    # Verification successful - record attendance
    try:
        # Check if employee already checked in today
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        existing_attendance = db.query(models.Attendance).filter(
            models.Attendance.employee_id == best_match.id,
            models.Attendance.check_in_time >= today_start,
            models.Attendance.check_in_time <= today_end
        ).first()
        
        if existing_attendance:
            logger.info(f"Employee {best_match.id} already checked in today at {existing_attendance.check_in_time}")
            return {
                "verified": True,
                "score": float(best_score),
                "confidence": float(confidence_score),
                "detection_ratio": float(confidence_score),
                "threshold": DETECTION_THRESHOLD,
                "distances": distances,
                "total_employees_checked": len(employees),
                "employee": {
                    "id": best_match.id,
                    "first_name": best_match.first_name,
                    "last_name": best_match.last_name
                },
                "attendance": {
                    "status": "already_checked_in",
                    "check_in_time": existing_attendance.check_in_time.isoformat(),
                    "message": "Employee already checked in today"
                }
            }
        
        # Record new attendance
        attendance = models.Attendance(employee_id=best_match.id)
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        logger.info(f"Attendance recorded for employee {best_match.id} at {attendance.check_in_time}")
        
        return {
            "verified": True,
            "score": float(best_score),
            "confidence": float(confidence_score),
            "detection_ratio": float(confidence_score),
            "threshold": DETECTION_THRESHOLD,
            "distances": distances,
            "total_employees_checked": len(employees),
            "employee": {
                "id": best_match.id,
                "first_name": best_match.first_name,
                "last_name": best_match.last_name
            },
            "attendance": {
                "status": "checked_in",
                "check_in_time": attendance.check_in_time.isoformat(),
                "message": "Attendance recorded successfully"
            }
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record attendance: {str(e)}")
        # Still return successful verification even if attendance recording fails
        return {
            "verified": True,
            "score": float(best_score),
            "confidence": float(confidence_score),
            "detection_ratio": float(confidence_score),
            "threshold": DETECTION_THRESHOLD,
            "distances": distances,
            "total_employees_checked": len(employees),
            "employee": {
                "id": best_match.id,
                "first_name": best_match.first_name,
                "last_name": best_match.last_name
            },
            "attendance": {
                "status": "verification_success_attendance_failed",
                "error": str(e),
                "message": "Face verified but failed to record attendance"
            }
        }

@app.get("/stats", response_model=AttendanceStats)
def get_attendance_stats(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    total_employees = db.query(models.Employee).filter(models.Employee.is_active == True).count()
    
    # Get today's attendance
    today_attendance = db.query(models.Attendance).filter(
        models.Attendance.check_in_time >= today_start,
        models.Attendance.check_in_time <= today_end
    ).all()
    
    present_today = len(today_attendance)
    absent_today = total_employees - present_today
    
    # Count late employees (check-in after 9:00 AM)
    late_threshold = datetime.combine(today, datetime.strptime("09:00", "%H:%M").time())
    late_today = sum(1 for a in today_attendance if a.check_in_time > late_threshold)
    
    attendance_rate = (present_today / total_employees * 100) if total_employees > 0 else 0
    
    return AttendanceStats(
        total_employees=total_employees,
        present_today=present_today,
        absent_today=absent_today,
        late_today=late_today,
        attendance_rate=attendance_rate
    )

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Face Verification API is running", "status": "healthy", "threshold": DETECTION_THRESHOLD}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "threshold": DETECTION_THRESHOLD,
        "timestamp": datetime.utcnow().isoformat()
    }

# Debug endpoint to test threshold
@app.get("/debug/threshold")
async def get_threshold_info():
    return {
        "current_threshold": DETECTION_THRESHOLD,
        "description": "Lower scores indicate better matches. Scores below threshold are accepted.",
        "recommendation": "If getting false negatives, increase threshold to 0.7 or 0.8"
    }

# To run the app, use the command:
# uvicorn api:app --host 0.0.0.0 --port 8000 --reload