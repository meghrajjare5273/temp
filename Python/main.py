import json
import os
import asyncio
import hashlib
from datetime import datetime
from uuid import uuid4
from typing import List, Optional, Dict, Any
import tempfile
import shutil

from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import pandas as pd
import psutil
import structlog
from sklearn.model_selection import train_test_split
import joblib
import uvicorn

# Import your existing modules
from ml.preprocess import preprocess_data, save_preprocessed_data, suggest_missing_strategy
from ml.models import train_model, save_model
from ml.utils import get_dataset_insights

# Configuration Management
class Settings(BaseModel):
    max_file_size_mb: int = 100
    allowed_file_types: List[str] = [".csv", ".xlsx", ".json"]
    upload_dir: str = "uploads"
    max_chunk_size: int = 10000
    max_memory_gb: float = None
    max_workers: int = 4
    cors_origins: List[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

settings = Settings()

# Enhanced Logging Setup
def setup_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

setup_logging()
logger = structlog.get_logger()

# Request Validation Models
class DatasetUploadRequest(BaseModel):
    max_file_size_mb: int = 100
    allowed_extensions: List[str] = ['.csv', '.xlsx', '.json']
    
    @field_validator('max_file_size_mb')
    def validate_file_size(cls, v):
        if v > 500:  # 500MB limit
            raise ValueError('File size too large')
        return v

class PreprocessingRequest(BaseModel):
    missing_strategy: str
    scaling: bool
    encoding: str
    target_column: Optional[str] = None
    
    @field_validator('missing_strategy')
    def validate_missing_strategy(cls, v):
        allowed = ['mean', 'median', 'mode', 'drop', 'forward_fill', 'interpolate']
        if v not in allowed:
            raise ValueError(f'Invalid missing strategy. Must be one of {allowed}')
        return v
    
    @field_validator('encoding')
    def validate_encoding(cls, v):
        allowed = ['onehot', 'label', 'target', 'binary', 'ordinal']
        if v not in allowed:
            raise ValueError(f'Invalid encoding. Must be one of {allowed}')
        return v

# Memory Management & Chunked Processing
class ChunkedDataProcessor:
    def __init__(self, chunk_size=10000, max_memory_gb=None):
        self.chunk_size = chunk_size
        self.max_memory_gb = max_memory_gb
        
    async def process_large_csv(self, file_path, process_func):
        """Process large CSV files in chunks to manage memory"""
        chunks = []
        try:
            for chunk in pd.read_csv(file_path, chunksize=self.chunk_size):
                if self._check_memory_usage():
                    processed_chunk = await asyncio.get_event_loop().run_in_executor(
                        None, process_func, chunk
                    )
                    chunks.append(processed_chunk)
                else:
                    raise MemoryError("Memory limit exceeded")
            return pd.concat(chunks, ignore_index=True)
        except Exception as e:
            logger.error("Error processing large CSV", error=str(e), file_path=file_path)
            raise
    
    def _check_memory_usage(self):
        """Check current memory usage against limits"""
        if self.max_memory_gb is None:
            return True  # No limit set, always return True
        memory_gb = psutil.virtual_memory().used / (1024**3)
        return memory_gb < self.max_memory_gb

    def validate_csv_structure(self, file_path, sample_size=1000):
        """Validate CSV structure without loading entire file"""
        try:
            sample_df = pd.read_csv(file_path, nrows=sample_size)
            
            # Efficiently count total rows
            with open(file_path, 'r') as f:
                total_rows = sum(1 for _ in f) - 1  # Subtract header
            
            estimated_memory_mb = (total_rows * sample_df.memory_usage(deep=True).sum()) / (1024**2)
            
            return {
                "sample_data": sample_df,
                "estimated_total_rows": total_rows,
                "columns": list(sample_df.columns),
                "estimated_memory_mb": float(estimated_memory_mb),
                "dtypes": sample_df.dtypes.astype(str).to_dict()
            }
        except Exception as e:
            logger.error("Error validating CSV structure", error=str(e), file_path=file_path)
            raise

# Task Management for Background Processing
class TaskManager:
    def __init__(self):
        self.task_status = {}
    
    def create_task(self, task_type: str) -> str:
        task_id = str(uuid4())
        self.task_status[task_id] = {
            "status": "pending",
            "progress": 0,
            "result": None,
            "error": None,
            "task_type": task_type,
            "created_at": datetime.now().isoformat()
        }
        logger.info("Task created", task_id=task_id, task_type=task_type)
        return task_id
    
    def update_task(self, task_id: str, status: str, progress: int = None, 
                   result: dict = None, error: str = None):
        if task_id in self.task_status:
            self.task_status[task_id].update({
                "status": status,
                "progress": progress or self.task_status[task_id]["progress"],
                "result": result,
                "error": error,
                "updated_at": datetime.now().isoformat()
            })
            logger.info("Task updated", task_id=task_id, status=status, progress=progress)
    
    def get_task(self, task_id: str) -> dict:
        return self.task_status.get(task_id, {"error": "Task not found"})
    
    def cleanup_old_tasks(self, hours_old=24):
        """Clean up tasks older than specified hours"""
        cutoff_time = datetime.now().timestamp() - (hours_old * 3600)
        tasks_to_remove = []
        
        for task_id, task_info in self.task_status.items():
            created_time = datetime.fromisoformat(task_info["created_at"]).timestamp()
            if created_time < cutoff_time:
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self.task_status[task_id]
        
        logger.info(f"Cleaned up {len(tasks_to_remove)} old tasks")

# Security utilities
class SecurityManager:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize uploaded filename to prevent path traversal"""
        import re
        # Remove any path components and special characters
        safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', os.path.basename(filename))
        return safe_filename[:100]  # Limit length
    
    @staticmethod
    def validate_file_type(filename: str, allowed_types: List[str]) -> bool:
        """Validate file extension"""
        file_ext = os.path.splitext(filename)[1].lower()
        return file_ext in allowed_types
    
    @staticmethod
    def validate_file_size(file_size: int, max_size_mb: int) -> bool:
        """Validate file size"""
        max_size_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_size_bytes

# Initialize components
app = FastAPI()
task_manager = TaskManager()
data_processor = ChunkedDataProcessor(
    chunk_size=settings.max_chunk_size,
    max_memory_gb=None
)
security = SecurityManager()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced File Upload Endpoint
@app.post("/upload")
async def upload_file(files: list[UploadFile] = File(...)):
    """Enhanced file upload with validation and chunked processing"""
    try:
        results = {}
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        for file in files:
            # Security validations
            safe_filename = security.sanitize_filename(file.filename)
            if not security.validate_file_type(safe_filename, settings.allowed_file_types):
                raise HTTPException(
                    status_code=400, 
                    detail=f"File type not allowed: {file.filename}"
                )
            
            # Read file content
            file_content = await file.read()
            file_size_mb = len(file_content) / (1024 * 1024)
            
            if not security.validate_file_size(len(file_content), settings.max_file_size_mb):
                raise HTTPException(
                    status_code=413, 
                    detail=f"File too large: {file_size_mb:.2f}MB > {settings.max_file_size_mb}MB"
                )
            
            # Save file
            file_location = os.path.join(settings.upload_dir, safe_filename)
            with open(file_location, "wb") as f:
                f.write(file_content)
            
            # Log file upload
            logger.info(
                "File uploaded successfully",
                filename=safe_filename,
                size_mb=file_size_mb,
                file_path=file_location
            )
            
            # Process file based on size
            if file_size_mb > 50:  # Use chunked processing for large files
                validation_result = data_processor.validate_csv_structure(file_location)
                df_sample = validation_result["sample_data"]
                
                logger.warning(
                    "Large file detected - using sample for analysis",
                    filename=safe_filename,
                    estimated_rows=validation_result["estimated_total_rows"],
                    estimated_memory_mb=validation_result["estimated_memory_mb"]
                )
            else:
                # Process normally for smaller files
                df_sample = pd.read_csv(file_location)
                validation_result = {"estimated_total_rows": len(df_sample)}
            
            # Generate summary
            summary = {
                "columns": list(df_sample.columns),
                "rows": validation_result["estimated_total_rows"],
                "sample_rows": len(df_sample),
                "data_types": df_sample.dtypes.astype(str).to_dict(),
                "missing_values": df_sample.isnull().sum().to_dict(),
                "unique_values": {col: df_sample[col].nunique() for col in df_sample.columns},
                "stats": {
                    col: df_sample[col].describe().to_dict() 
                    for col in df_sample.select_dtypes(include=['float64', 'int64']).columns
                },
                "file_size_mb": file_size_mb,
                "is_large_file": file_size_mb > 50
            }
            
            # Get insights and suggestions
            insights_data = get_dataset_insights(summary, df_sample)
            suggested_missing_strategy = suggest_missing_strategy(df_sample)
            
            logger.info(
                "File analysis complete",
                filename=safe_filename,
                suggested_task_type=insights_data['suggested_task_type'],
                suggested_target_column=insights_data['suggested_target_column'],
                suggested_missing_strategy=suggested_missing_strategy
            )
            
            results[safe_filename] = {
                "summary": summary,
                "insights": insights_data["insights"],
                "suggested_task_type": insights_data["suggested_task_type"],
                "suggested_target_column": insights_data["suggested_target_column"],
                "suggested_missing_strategy": suggested_missing_strategy
            }
        
        return JSONResponse(content=results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in upload endpoint", error=str(e))
        return JSONResponse(
            content={"error": f"Upload failed: {str(e)}"}, 
            status_code=500
        )

# Background task for model training
async def train_model_background(
    task_id: str,
    preprocessed_filenames: list[str],
    target_column: str,
    task_type: str,
    model_type: str
):
    """Background task for model training"""
    try:
        task_manager.update_task(task_id, "running", 10)
        
        results = {}
        target_columns = json.loads(target_column) if target_column else {}
        
        for i, filename in enumerate(preprocessed_filenames):
            # Update progress
            progress = 20 + (i / len(preprocessed_filenames)) * 60
            task_manager.update_task(task_id, "running", int(progress))
            
            file_location = filename
            if not os.path.exists(file_location):
                raise FileNotFoundError(f"Preprocessed file {filename} not found")
            
            # Load data
            df_processed = pd.read_csv(file_location)
            basename = os.path.basename(filename)
            original_filename = basename.replace("preprocessed_", "", 1)
            file_target = target_columns.get(original_filename, None)
            
            # Train model
            result = train_model(df_processed, file_target, task_type, model_type)
            
            if "model" in result:
                model_filename = f"trained_model_{original_filename.split('.')[0]}.pkl"
                save_model(result["model"], file_path=f"{settings.upload_dir}/{model_filename}")
                del result["model"]  # Remove model object from result
            
            results[filename] = result
        
        task_manager.update_task(task_id, "completed", 100, results)
        logger.info("Background training completed", task_id=task_id)
        
    except Exception as e:
        error_msg = f"Training failed: {str(e)}"
        task_manager.update_task(task_id, "failed", error=error_msg)
        logger.error("Background training failed", task_id=task_id, error=str(e))

# Asynchronous training endpoint
@app.post("/train-async")
async def train_model_async(
    background_tasks: BackgroundTasks,
    preprocessed_filenames: list[str] = Form(...),
    target_column: str = Form(None),
    task_type: str = Form(...),
    model_type: str = Form(None)
):
    """Start model training as background task"""
    try:
        # Validate inputs
        if task_type not in ["classification", "regression", "clustering", "dimensionality_reduction"]:
            raise HTTPException(status_code=400, detail=f"Invalid task type: {task_type}")
        
        # Create task
        task_id = task_manager.create_task("model_training")
        
        # Start background task
        background_tasks.add_task(
            train_model_background,
            task_id, preprocessed_filenames, target_column, task_type, model_type
        )
        
        return JSONResponse(content={
            "task_id": task_id,
            "status": "started",
            "message": "Model training started in background"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error starting async training", error=str(e))
        return JSONResponse(
            content={"error": f"Failed to start training: {str(e)}"}, 
            status_code=500
        )

# Task status endpoint
@app.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """Get status of background task"""
    task_info = task_manager.get_task(task_id)
    return JSONResponse(content=task_info)

# Enhanced preprocessing endpoint
@app.post("/preprocess")
async def preprocess_endpoint(
    files: list[UploadFile] = File(...),
    missing_strategy: str = Form(...),
    scaling: bool = Form(...),
    encoding: str = Form(...),
    target_column: str = Form(None),
    selected_features_json: str = Form(None)
):
    """Enhanced preprocessing with better error handling"""
    try:
        # Validate preprocessing parameters
        validation_request = PreprocessingRequest(
            missing_strategy=missing_strategy,
            scaling=scaling,
            encoding=encoding,
            target_column=target_column
        )
        
        results = {}
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # Parse selected features
        selected_features_dict = {}
        if selected_features_json:
            try:
                selected_features_dict = json.loads(selected_features_json)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid selected_features_json format")
        
        for file in files:
            safe_filename = security.sanitize_filename(file.filename)
            file_location = os.path.join(settings.upload_dir, safe_filename)
            
            # Save file
            file_content = await file.read()
            with open(file_location, "wb") as f:
                f.write(file_content)
            
            # Load and process data
            df = pd.read_csv(file_location)
            
            # Apply feature selection
            selected_features = selected_features_dict.get(safe_filename, df.columns.tolist())
            if selected_features:
                feature_cols = [col for col in selected_features if col in df.columns]
                if target_column and target_column in df.columns:
                    if target_column not in feature_cols:
                        feature_cols.append(target_column)
                df = df[feature_cols]
            
            # Validate encoding requirements
            if encoding in ["target", "kfold"] and (not target_column or target_column not in df.columns):
                raise HTTPException(
                    status_code=400,
                    detail=f"Target column '{target_column}' is required for {encoding} encoding"
                )
            
            # Preprocess data
            df_processed = preprocess_data(
                df, 
                missing_strategy=missing_strategy, 
                scaling=scaling, 
                encoding=encoding, 
                target_column=target_column
            )
            
            # Save preprocessed data
            preprocessed_file = save_preprocessed_data(
                df_processed, 
                filename=f"preprocessed_{safe_filename}"
            )
            
            logger.info(
                "Preprocessing completed",
                filename=safe_filename,
                original_shape=df.shape,
                processed_shape=df_processed.shape,
                preprocessing_params={
                    "missing_strategy": missing_strategy,
                    "scaling": scaling,
                    "encoding": encoding,
                    "target_column": target_column
                }
            )
            
            results[safe_filename] = {"preprocessed_file": preprocessed_file}
        
        return JSONResponse(content=results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in preprocessing", error=str(e))
        return JSONResponse(
            content={"error": f"Preprocessing failed: {str(e)}"}, 
            status_code=500
        )

# Keep existing synchronous train endpoint for backward compatibility
# Replace the existing synchronous train endpoint with this fixed version
@app.post("/train")
async def train_model_endpoint(
    preprocessed_filenames: list[str] = Form(...),
    target_column: str = Form(None),
    task_type: str = Form(...),
    model_type: str = Form(None)
):
    """Synchronous model training endpoint (for backward compatibility)"""
    try:
        # For large datasets, recommend using async endpoint
        total_size_mb = 0
        for filename in preprocessed_filenames:
            if os.path.exists(filename):
                size_mb = os.path.getsize(filename) / (1024 * 1024)
                total_size_mb += size_mb
        
        if total_size_mb > 100:  # 100MB threshold
            logger.warning(
                "Large dataset detected for synchronous training",
                total_size_mb=total_size_mb,
                recommendation="Consider using /train-async endpoint"
            )
        
        results = {}
        target_columns = json.loads(target_column) if target_column else {}
        
        for filename in preprocessed_filenames:
            if not os.path.exists(filename):
                raise HTTPException(status_code=404, detail=f"File {filename} not found")
            
            df_processed = pd.read_csv(filename)
            basename = os.path.basename(filename)
            original_filename = basename.replace("preprocessed_", "", 1)
            file_target = target_columns.get(original_filename, None)
            
            # Run the async train_model function in the current event loop
            result = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: train_model(df_processed, file_target, task_type, model_type)
            )
            
            if "model" in result:
                model_filename = f"trained_model_{original_filename.split('.')[0]}.pkl"
                save_model(result["model"], file_path=f"{settings.upload_dir}/{model_filename}")
                del result["model"]
            
            results[filename] = result
        
        return JSONResponse(content=results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in synchronous training", error=str(e))
        return JSONResponse(
            content={"error": f"Training failed: {str(e)}"}, 
            status_code=500
        )
    

# Keep existing endpoints for backward compatibility
@app.get("/download-model/{filename}")
async def download_model(filename: str):
    """Download trained model"""
    try:
        safe_filename = security.sanitize_filename(filename)
        model_file = os.path.join(settings.upload_dir, f"trained_model_{safe_filename.split('.')[0]}.pkl")
        
        if os.path.exists(model_file):
            return FileResponse(
                model_file, 
                filename=f"trained_model_{safe_filename.split('.')[0]}.pkl"
            )
        
        raise HTTPException(status_code=404, detail="Model file not found")
        
    except Exception as e:
        logger.error("Error downloading model", filename=filename, error=str(e))
        return JSONResponse(
            content={"error": f"Download failed: {str(e)}"}, 
            status_code=500
        )

@app.get("/download-preprocessed/{filename}")
async def download_preprocessed(filename: str):
    """Download preprocessed data"""
    try:
        safe_filename = security.sanitize_filename(filename)
        preprocessed_file = os.path.join(settings.upload_dir, f"preprocessed_{safe_filename}")
        
        if os.path.exists(preprocessed_file):
            return FileResponse(
                preprocessed_file, 
                filename=f"preprocessed_{safe_filename}"
            )
        
        raise HTTPException(status_code=404, detail="Preprocessed file not found")
        
    except Exception as e:
        logger.error("Error downloading preprocessed data", filename=filename, error=str(e))
        return JSONResponse(
            content={"error": f"Download failed: {str(e)}"}, 
            status_code=500
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint with system metrics"""
    memory_usage = psutil.virtual_memory()
    disk_usage = psutil.disk_usage(settings.upload_dir)
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "system_metrics": {
            "memory_usage_percent": memory_usage.percent,
            "memory_available_gb": memory_usage.available / (1024**3),
            "disk_usage_percent": disk_usage.percent,
            "disk_free_gb": disk_usage.free / (1024**3)
        },
        "active_tasks": len(task_manager.task_status),
        "settings": {
            "max_file_size_mb": settings.max_file_size_mb,
            "max_memory_gb": settings.max_memory_gb,
            "max_chunk_size": settings.max_chunk_size
        }
    }

# Cleanup endpoint for maintenance
@app.post("/admin/cleanup")
async def cleanup_old_data():
    """Admin endpoint to cleanup old files and tasks"""
    try:
        # Cleanup old tasks
        task_manager.cleanup_old_tasks(hours_old=24)
        
        # Count files cleaned (you can implement file cleanup logic here)
        logger.info("Cleanup completed")
        
        return {
            "status": "success",
            "message": "Cleanup completed successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error("Error during cleanup", error=str(e))
        return JSONResponse(
            content={"error": f"Cleanup failed: {str(e)}"}, 
            status_code=500
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)