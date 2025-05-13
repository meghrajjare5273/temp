import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from sklearn.model_selection import train_test_split
import joblib
from ml.preprocess import preprocess_data, save_preprocessed_data, suggest_missing_strategy
from ml.models import train_model, save_model
from ml.utils import get_dataset_insights
from dotenv import load_dotenv
import uvicorn

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)





@app.post("/upload")
async def upload_file(files: list[UploadFile] = File(...)):
    try:
        results = {}
        os.makedirs("uploads", exist_ok=True)
        for file in files:
            file_location = f"uploads/{file.filename}"
            with open(file_location, "wb") as f:
                f.write(await file.read())
            
            df = pd.read_csv(file_location)
            summary = {
                "columns": list(df.columns),
                "rows": len(df),
                "data_types": df.dtypes.astype(str).to_dict(),
                "missing_values": df.isnull().sum().to_dict(),
                "unique_values": {col: df[col].nunique() for col in df.columns},  # Added unique value counts
                "stats": {
                    col: df[col].describe().to_dict() 
                    for col in df.select_dtypes(include=['float64', 'int64']).columns  # Descriptive stats for numeric columns
                }
            }
            insights_data = get_dataset_insights(summary, df)
            suggested_missing_strategy = suggest_missing_strategy(df)
            print(f"File: {file.filename}, Suggested missing strategy: {suggested_missing_strategy}")
            print(f"File: {file.filename}, Suggested task type: {insights_data['suggested_task_type']}")
            print(f"File: {file.filename}, Suggested target column: {insights_data['suggested_target_column']}")
            results[file.filename] = {
                "summary": summary,
                "insights": insights_data["insights"],
                "suggested_task_type": insights_data["suggested_task_type"],
                "suggested_target_column": insights_data["suggested_target_column"],
                "suggested_missing_strategy": suggested_missing_strategy
            }
        return JSONResponse(content=results)
    except Exception as e:
        print(f"Error in /upload endpoint: {str(e)}")
        return JSONResponse(content={"error": f"Upload failed: {str(e)}"}, status_code=500)
    





    
@app.post("/configure")
async def configure_data(
    files: list[UploadFile] = File(...),
    task_type: str = Form(...),
    target_column: str = Form(None),
    selected_features: list[str] = Form(None),  # Will be used in Feature 2
    missing_strategy: str = Form(...),
    scaling: bool = Form(...),
    encoding: str = Form(...)
):
    try:
        results = {}
        os.makedirs("uploads", exist_ok=True)
        for file in files:
            file_location = f"uploads/{file.filename}"
            with open(file_location, "wb") as f:
                f.write(await file.read())
            
            df = pd.read_csv(file_location)
            if selected_features:
                feature_cols = [col for col in selected_features if col in df.columns]
                if task_type in ["classification", "regression"] and target_column:
                    df = df[feature_cols + [target_column]]
                else:
                    df = df[feature_cols]
            
            # Split data first to prevent leakage
            train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
            
            # Preprocess training data
            df_processed = preprocess_data(
                train_df,
                missing_strategy=missing_strategy,
                scaling=scaling,
                encoding=encoding,
                target_column=target_column
            )
            
            # Save preprocessor and preprocessed data
            preprocessor = df_processed.attrs.get('preprocessor')  # We'll modify preprocess_data to return this
            preprocessor_file = f"uploads/preprocessor_{file.filename.split('.')[0]}.pkl"
            joblib.dump(preprocessor, preprocessor_file)
            preprocessed_file = save_preprocessed_data(df_processed, filename=f"preprocessed_{file.filename}")
            
            results[file.filename] = {
                "preprocessed_file": preprocessed_file,
                "preprocessor_file": preprocessor_file
            }
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(content={"error": f"Configuration failed: {str(e)}"}, status_code=500)
    






@app.post("/preprocess")
async def preprocess_endpoint(
    files: list[UploadFile] = File(...),
    missing_strategy: str = Form(...),
    scaling: bool = Form(...),
    encoding: str = Form(...),
    target_column: str = Form(None),
    selected_features_json: str = Form(None)  # New parameter for JSON string
):
    try:
        results = {}
        os.makedirs("uploads", exist_ok=True)
        
        # Parse selected_features_json if provided
        selected_features_dict = {}
        if selected_features_json:
            selected_features_dict = json.loads(selected_features_json)
        
        for file in files:
            file_location = f"uploads/{file.filename}"
            with open(file_location, "wb") as f:
                f.write(await file.read())
            
            df = pd.read_csv(file_location)
            
            # Apply feature selection for this file
            selected_features = selected_features_dict.get(file.filename, df.columns.tolist())
            if selected_features:
                feature_cols = [col for col in selected_features if col in df.columns]
                if target_column and target_column in df.columns:
                    # Ensure target_column is included if specified
                    if target_column not in feature_cols:
                        feature_cols.append(target_column)
                    df = df[feature_cols]
                else:
                    df = df[feature_cols]
            
            # Validate encoding and target_column compatibility
            if encoding in ["target", "kfold"] and (not target_column or target_column not in df.columns):
                raise ValueError(f"Target column '{target_column}' is required and must exist in the dataset for {encoding} encoding")
            
            df_processed = preprocess_data(df, missing_strategy=missing_strategy, scaling=scaling, encoding=encoding, target_column=target_column)
            preprocessed_file = save_preprocessed_data(df_processed, filename=f"preprocessed_{file.filename}")
            results[file.filename] = {"preprocessed_file": preprocessed_file}
        return JSONResponse(content=results)
    except Exception as e:
        print(f"Error in /preprocess endpoint: {str(e)}")
        return JSONResponse(content={"error": f"Preprocessing failed: {str(e)}"}, status_code=500)
    





@app.post("/train")
async def train_model_endpoint(
    preprocessed_filenames: list[str] = Form(...),
    target_column: str = Form(None),
    task_type: str = Form(...),
    model_type: str = Form(None)
):
    try:
        results = {}
        try:
            target_columns = json.loads(target_column) if target_column else {}
        except json.JSONDecodeError:
            return JSONResponse(content={"error": "Invalid target_column format"}, status_code=400)
        for filename in preprocessed_filenames:
            file_location = filename
            if not os.path.exists(file_location):
                return JSONResponse(content={"error": f"Preprocessed file {filename} not found"}, status_code=404)
            df_processed = pd.read_csv(file_location)
            basename = os.path.basename(filename)
            original_filename = basename.replace("preprocessed_", "", 1)
            file_target = target_columns.get(original_filename, None)
            result = train_model(df_processed, file_target, task_type, model_type)
            if "model" in result:
                model_filename = f"trained_model_{original_filename.split('.')[0]}.pkl"
                save_model(result["model"], file_path=f"uploads/{model_filename}")
                del result["model"]
            results[filename] = result
        return JSONResponse(content=results)
    except Exception as e:
        print(f"Error in /train endpoint: {str(e)}")
        return JSONResponse(content={"error": f"Training failed: {str(e)}"}, status_code=500)


    

    
@app.get("/download-model/{filename}")
async def download_model(filename: str):
    try:
        model_file = f"uploads/trained_model_{filename.split('.')[0]}.pkl"
        if os.path.exists(model_file):
            return FileResponse(model_file, filename=f"trained_model_{filename.split('.')[0]}.pkl")
        return JSONResponse(content={"error": "Model file not found"}, status_code=404)
    except Exception as e:
        print(f"Error in /download-model endpoint: {str(e)}")
        return JSONResponse(content={"error": f"Download failed: {str(e)}"}, status_code=500)

@app.get("/download-preprocessed/{filename}")
async def download_preprocessed(filename: str):
    try:
        preprocessed_file = f"uploads/preprocessed_{filename}"
        if os.path.exists(preprocessed_file):
            return FileResponse(preprocessed_file, filename=f"preprocessed_{filename}")
        return JSONResponse(content={"error": "Preprocessed file not found"}, status_code=404)
    except Exception as e:
        print(f"Error in /download-preprocessed endpoint: {str(e)}")
        return JSONResponse(content={"error": f"Download failed: {str(e)}"}, status_code=500)
    





@app.post("/predict/{filename}")
async def predict(
    filename: str,
    test_file: UploadFile = File(None),
    single_point: str = Form(None)  # JSON string for single data point
):
    try:
        model_file = f"uploads/trained_model_{filename.split('.')[0]}.pkl"
        preprocessor_file = f"uploads/preprocessor_{filename.split('.')[0]}.pkl"
        if not os.path.exists(model_file) or not os.path.exists(preprocessor_file):
            return JSONResponse(content={"error": "Model or preprocessor not found"}, status_code=404)
        
        model = joblib.load(model_file)
        preprocessor = joblib.load(preprocessor_file)
        
        if test_file:
            test_df = pd.read_csv(test_file.file)
        elif single_point:
            import json
            data = json.loads(single_point)
            test_df = pd.DataFrame([data])
        else:
            return JSONResponse(content={"error": "No test data provided"}, status_code=400)
        
        # Ensure test data has the same features
        expected_features = preprocessor.feature_names_in_
        missing_cols = set(expected_features) - set(test_df.columns)
        if missing_cols:
            return JSONResponse(content={"error": f"Missing features: {missing_cols}"}, status_code=400)
        test_df = test_df[expected_features]
        
        # Transform test data
        X_test = preprocessor.transform(test_df)
        predictions = model.predict(X_test)
        
        return JSONResponse(content={"predictions": predictions.tolist()})
    except Exception as e:
        return JSONResponse(content={"error": f"Prediction failed: {str(e)}"}, status_code=500)
    

    

if __name__ == "__main__":
    uvicorn.run(app, port=8000)