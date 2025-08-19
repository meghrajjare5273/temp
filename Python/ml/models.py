import logging
import joblib
import pandas as pd
import numpy as np
import asyncio
import psutil
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC, SVR
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import silhouette_score, calinski_harabasz_score
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import multiprocessing
from functools import partial
import gc
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ModelTrainingResult:
    """Data class for model training results"""
    task_type: str
    model_type: str
    results: Dict[str, Any]
    feature_importance: Optional[List[tuple]] = None
    model: Optional[Any] = None
    training_time: Optional[float] = None
    memory_usage: Optional[float] = None
    error: Optional[str] = None

class MemoryManager:
    """Memory management utilities"""
    
    @staticmethod
    def get_memory_usage_gb() -> float:
        """Get current memory usage in GB"""
        return psutil.virtual_memory().used / (1024**3)
    
    @staticmethod
    def check_memory_limit(max_memory_gb: float = 16.0) -> bool:
        """Check if memory usage is within limits"""
        current_usage = MemoryManager.get_memory_usage_gb()
        return current_usage < max_memory_gb
    
    @staticmethod
    def optimize_dataframe_memory(df: pd.DataFrame) -> pd.DataFrame:
        """Optimize DataFrame memory usage"""
        start_memory = df.memory_usage(deep=True).sum() / 1024**2
        
        # Optimize numeric columns
        for col in df.select_dtypes(include=[np.number]).columns:
            col_type = df[col].dtype
            if col_type != 'object':
                c_min = df[col].min()
                c_max = df[col].max()
                
                if str(col_type)[:3] == 'int':
                    if c_min > np.iinfo(np.int8).min and c_max < np.iinfo(np.int8).max:
                        df[col] = df[col].astype(np.int8)
                    elif c_min > np.iinfo(np.int16).min and c_max < np.iinfo(np.int16).max:
                        df[col] = df[col].astype(np.int16)
                    elif c_min > np.iinfo(np.int32).min and c_max < np.iinfo(np.int32).max:
                        df[col] = df[col].astype(np.int32)
                else:
                    if c_min > np.finfo(np.float32).min and c_max < np.finfo(np.float32).max:
                        df[col] = df[col].astype(np.float32)
        
        # Optimize categorical columns
        for col in df.select_dtypes(include=['object']).columns:
            num_unique_values = len(df[col].unique())
            num_total_values = len(df[col])
            if num_unique_values / num_total_values < 0.5:
                df[col] = df[col].astype('category')
        
        end_memory = df.memory_usage(deep=True).sum() / 1024**2
        logger.info(f"Memory optimization: {start_memory:.2f}MB -> {end_memory:.2f}MB "
                   f"({100 * (start_memory - end_memory) / start_memory:.1f}% reduction)")
        
        return df

class AsyncModelTrainer:
    """Asynchronous model trainer with memory management and progress tracking"""
    
    def __init__(self, max_memory_gb: float = 16.0, max_workers: Optional[int] = None):
        """Initialize the async model trainer"""
        self.max_memory_gb = max_memory_gb
        self.max_workers = max_workers or min(4, multiprocessing.cpu_count())
        
        self.classification_models = {
            'logistic_regression': LogisticRegression(max_iter=1000),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'decision_tree': DecisionTreeClassifier(random_state=42),
            'knn': KNeighborsClassifier(),
            'svm': SVC(probability=True, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(random_state=42)
        }
        
        self.regression_models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'decision_tree': DecisionTreeRegressor(random_state=42),
            'knn': KNeighborsRegressor(),
            'svm': SVR(),
            'ridge': Ridge(random_state=42),
            'lasso': Lasso(random_state=42),
            'gradient_boosting': GradientBoostingRegressor(random_state=42)
        }
        
        self.clustering_models = {
            'kmeans': KMeans(n_clusters=3, random_state=42, n_init=10),
            'dbscan': DBSCAN(),
            'agglomerative': AgglomerativeClustering(n_clusters=3)
        }
        
        self.dimensionality_reduction = {
            'pca': PCA(n_components=2, random_state=42),
            'tsne': TSNE(n_components=2, random_state=42, n_iter=300)
        }

    async def train_model_async(
        self, 
        df: pd.DataFrame, 
        target_column: Optional[str] = None, 
        task_type: str = "clustering", 
        model_type: Optional[str] = None, 
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """
        Asynchronously train a model with memory management and progress tracking
        """
        start_time = time.time()
        start_memory = MemoryManager.get_memory_usage_gb()
        
        try:
            # Validate inputs
            if not self._validate_inputs(df, target_column, task_type, model_type):
                return ModelTrainingResult(
                    task_type=task_type,
                    model_type=model_type or "unknown",
                    results={},
                    error="Invalid input parameters"
                )
            
            # Update progress
            if progress_callback:
                await progress_callback(10, "Validating data and optimizing memory...")
            
            # Optimize DataFrame memory usage
            df_optimized = MemoryManager.optimize_dataframe_memory(df.copy())
            
            # Check memory usage
            if not MemoryManager.check_memory_limit(self.max_memory_gb):
                return ModelTrainingResult(
                    task_type=task_type,
                    model_type=model_type or "unknown",
                    results={},
                    error=f"Memory usage exceeds limit of {self.max_memory_gb}GB"
                )
            
            # Set default model type
            if model_type is None:
                model_type = self._get_default_model_type(task_type)
            
            if progress_callback:
                await progress_callback(20, "Preparing data...")
            
            # Prepare data based on task type
            data_prep_result = await self._prepare_data_async(
                df_optimized, target_column, task_type
            )
            
            if "error" in data_prep_result:
                return ModelTrainingResult(
                    task_type=task_type,
                    model_type=model_type,
                    results={},
                    error=data_prep_result["error"]
                )
            
            if progress_callback:
                await progress_callback(40, f"Training {model_type} model...")
            
            # Train model asynchronously
            training_result = await self._train_model_by_task_async(
                data_prep_result, task_type, model_type, params, progress_callback
            )
            
            # Calculate training metrics
            training_time = time.time() - start_time
            memory_usage = MemoryManager.get_memory_usage_gb() - start_memory
            
            training_result.training_time = training_time
            training_result.memory_usage = memory_usage
            
            if progress_callback:
                await progress_callback(100, "Training completed!")
            
            # Force garbage collection
            gc.collect()
            
            logger.info(f"Model training completed: {task_type}/{model_type} in {training_time:.2f}s")
            
            return training_result
            
        except Exception as e:
            logger.error(f"Error in async model training: {str(e)}")
            return ModelTrainingResult(
                task_type=task_type,
                model_type=model_type or "unknown",
                results={},
                error=f"Training failed: {str(e)}",
                training_time=time.time() - start_time,
                memory_usage=MemoryManager.get_memory_usage_gb() - start_memory
            )

    async def train_multiple_models_async(
        self,
        df: pd.DataFrame,
        target_column: Optional[str] = None,
        task_type: str = "classification",
        model_types: Optional[List[str]] = None,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, ModelTrainingResult]:
        """Train multiple models in parallel"""
        
        if model_types is None:
            model_types = list(self._get_models_for_task(task_type).keys())
        
        # Limit concurrent training to prevent memory issues
        max_concurrent = min(self.max_workers, len(model_types))
        
        results = {}
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def train_single_model(model_type: str) -> tuple:
            async with semaphore:
                result = await self.train_model_async(
                    df.copy(), target_column, task_type, model_type
                )
                return model_type, result
        
        # Create tasks for all models
        tasks = [train_single_model(mt) for mt in model_types]
        
        # Execute tasks and collect results
        completed_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in completed_results:
            if isinstance(result, Exception):
                logger.error(f"Error in parallel training: {result}")
            else:
                model_type, training_result = result
                results[model_type] = training_result
        
        if progress_callback:
            await progress_callback(100, f"Completed training {len(results)} models")
        
        return results

    async def _prepare_data_async(
        self, 
        df: pd.DataFrame, 
        target_column: Optional[str], 
        task_type: str
    ) -> Dict[str, Any]:
        """Asynchronously prepare data for training"""
        
        try:
            if task_type in ["classification", "regression"]:
                if not target_column or target_column not in df.columns:
                    return {"error": f"No valid target column '{target_column}' for {task_type}"}
                
                X = df.drop(columns=[target_column])
                y = df[target_column]
                
                # Run train-test split in thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                X_train, X_test, y_train, y_test = await loop.run_in_executor(
                    None, 
                    partial(train_test_split, X, y, test_size=0.2, random_state=42)
                )
                
                return {
                    "X_train": X_train,
                    "X_test": X_test,
                    "y_train": y_train,
                    "y_test": y_test,
                    "supervised": True
                }
            else:
                # Unsupervised learning
                X = df
                loop = asyncio.get_event_loop()
                X_train, X_test = await loop.run_in_executor(
                    None,
                    partial(train_test_split, X, test_size=0.2, random_state=42)
                )
                
                return {
                    "X_train": X_train,
                    "X_test": X_test,
                    "supervised": False
                }
                
        except Exception as e:
            return {"error": f"Data preparation failed: {str(e)}"}

    async def _train_model_by_task_async(
        self,
        data_prep: Dict[str, Any],
        task_type: str,
        model_type: str,
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """Train model based on task type asynchronously"""
        
        if task_type == "classification":
            return await self._train_classification_async(data_prep, model_type, params, progress_callback)
        elif task_type == "regression":
            return await self._train_regression_async(data_prep, model_type, params, progress_callback)
        elif task_type == "clustering":
            return await self._train_clustering_async(data_prep, model_type, params, progress_callback)
        elif task_type == "dimensionality_reduction":
            return await self._train_dimensionality_reduction_async(data_prep, model_type, params, progress_callback)
        else:
            return ModelTrainingResult(
                task_type=task_type,
                model_type=model_type,
                results={},
                error=f"Unsupported task type: {task_type}"
            )

    async def _train_classification_async(
        self, 
        data_prep: Dict[str, Any], 
        model_type: str, 
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """Train classification model asynchronously"""
        
        if model_type not in self.classification_models:
            return ModelTrainingResult(
                task_type="classification",
                model_type=model_type,
                results={},
                error=f"Unsupported classification model: {model_type}"
            )
        
        try:
            # Get model and apply parameters
            model = self.classification_models[model_type]
            if params:
                model.set_params(**params)
            
            X_train = data_prep["X_train"]
            X_test = data_prep["X_test"]
            y_train = data_prep["y_train"]
            y_test = data_prep["y_test"]
            
            if progress_callback:
                await progress_callback(50, "Fitting model...")
            
            # Train model in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, model.fit, X_train, y_train)
            
            if progress_callback:
                await progress_callback(70, "Evaluating model...")
            
            # Make predictions
            y_pred = await loop.run_in_executor(None, model.predict, X_test)
            
            # Calculate metrics
            accuracy = await loop.run_in_executor(
                None, accuracy_score, y_test, y_pred
            )
            precision = await loop.run_in_executor(
                None, partial(precision_score, average='weighted', zero_division=0), y_test, y_pred
            )
            recall = await loop.run_in_executor(
                None, partial(recall_score, average='weighted', zero_division=0), y_test, y_pred
            )
            f1 = await loop.run_in_executor(
                None, partial(f1_score, average='weighted', zero_division=0), y_test, y_pred
            )
            
            if progress_callback:
                await progress_callback(90, "Computing cross-validation scores...")
            
            # Cross-validation
            cv_scores = await loop.run_in_executor(
                None, partial(cross_val_score, cv=5), model, X_train, y_train
            )
            
            # Feature importance
            feature_importance = self._get_feature_importance(model, X_train.columns)
            
            results = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "cv_scores": cv_scores.tolist(),
                "cv_mean": float(cv_scores.mean()),
                "cv_std": float(cv_scores.std())
            }
            
            logger.info(f"Classification metrics: {results}")
            
            return ModelTrainingResult(
                task_type="classification",
                model_type=model_type,
                results=results,
                feature_importance=feature_importance,
                model=model
            )
            
        except Exception as e:
            logger.error(f"Error in classification training: {str(e)}")
            return ModelTrainingResult(
                task_type="classification",
                model_type=model_type,
                results={},
                error=f"Classification training failed: {str(e)}"
            )

    async def _train_regression_async(
        self, 
        data_prep: Dict[str, Any], 
        model_type: str, 
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """Train regression model asynchronously"""
        
        if model_type not in self.regression_models:
            return ModelTrainingResult(
                task_type="regression",
                model_type=model_type,
                results={},
                error=f"Unsupported regression model: {model_type}"
            )
        
        try:
            model = self.regression_models[model_type]
            if params:
                model.set_params(**params)
            
            X_train = data_prep["X_train"]
            X_test = data_prep["X_test"]
            y_train = data_prep["y_train"]
            y_test = data_prep["y_test"]
            
            if progress_callback:
                await progress_callback(50, "Fitting regression model...")
            
            # Train model
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, model.fit, X_train, y_train)
            
            if progress_callback:
                await progress_callback(70, "Making predictions...")
            
            # Make predictions
            y_pred = await loop.run_in_executor(None, model.predict, X_test)
            
            # Calculate metrics
            r2 = await loop.run_in_executor(None, r2_score, y_test, y_pred)
            mse = await loop.run_in_executor(None, mean_squared_error, y_test, y_pred)
            mae = await loop.run_in_executor(None, mean_absolute_error, y_test, y_pred)
            
            if progress_callback:
                await progress_callback(90, "Computing cross-validation scores...")
            
            # Cross-validation
            cv_scores = await loop.run_in_executor(
                None, partial(cross_val_score, cv=5, scoring='r2'), model, X_train, y_train
            )
            
            # Feature importance
            feature_importance = self._get_feature_importance(model, X_train.columns)
            
            results = {
                "r2_score": float(r2),
                "mean_squared_error": float(mse),
                "mean_absolute_error": float(mae),
                "cv_scores": cv_scores.tolist(),
                "cv_mean": float(cv_scores.mean()),
                "cv_std": float(cv_scores.std())
            }
            
            logger.info(f"Regression metrics: {results}")
            
            return ModelTrainingResult(
                task_type="regression",
                model_type=model_type,
                results=results,
                feature_importance=feature_importance,
                model=model
            )
            
        except Exception as e:
            logger.error(f"Error in regression training: {str(e)}")
            return ModelTrainingResult(
                task_type="regression",
                model_type=model_type,
                results={},
                error=f"Regression training failed: {str(e)}"
            )

    async def _train_clustering_async(
        self, 
        data_prep: Dict[str, Any], 
        model_type: str, 
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """Train clustering model asynchronously"""
        
        if model_type not in self.clustering_models:
            return ModelTrainingResult(
                task_type="clustering",
                model_type=model_type,
                results={},
                error=f"Unsupported clustering model: {model_type}"
            )
        
        try:
            model = self.clustering_models[model_type]
            if params:
                model.set_params(**params)
            
            X_train = data_prep["X_train"]
            X_test = data_prep["X_test"]
            
            if progress_callback:
                await progress_callback(50, "Fitting clustering model...")
            
            # Train model
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, model.fit, X_train)
            
            if progress_callback:
                await progress_callback(70, "Generating cluster labels...")
            
            # Get labels for test data
            try:
                if hasattr(model, 'predict'):
                    labels = await loop.run_in_executor(None, model.predict, X_test)
                else:
                    labels = await loop.run_in_executor(None, model.fit_predict, X_test)
            except:
                logger.warning(f"Could not get labels for {model_type} on test data")
                labels = None
            
            if progress_callback:
                await progress_callback(90, "Computing clustering metrics...")
            
            # Calculate metrics
            metrics = {}
            if labels is not None and len(np.unique(labels)) > 1 and len(X_test) > 1:
                try:
                    silhouette = await loop.run_in_executor(
                        None, silhouette_score, X_test, labels
                    )
                    metrics["silhouette_score"] = float(silhouette)
                except:
                    logger.warning("Could not calculate silhouette score")
                
                try:
                    calinski = await loop.run_in_executor(
                        None, calinski_harabasz_score, X_test, labels
                    )
                    metrics["calinski_harabasz_score"] = float(calinski)
                except:
                    logger.warning("Could not calculate Calinski-Harabasz score")
            
            # Add model-specific metrics
            if model_type == "kmeans":
                metrics["inertia"] = float(model.inertia_)
                metrics["n_clusters"] = int(model.n_clusters)
            
            logger.info(f"Clustering metrics: {metrics}")
            
            return ModelTrainingResult(
                task_type="clustering",
                model_type=model_type,
                results=metrics,
                model=model
            )
            
        except Exception as e:
            logger.error(f"Error in clustering training: {str(e)}")
            return ModelTrainingResult(
                task_type="clustering",
                model_type=model_type,
                results={},
                error=f"Clustering training failed: {str(e)}"
            )

    async def _train_dimensionality_reduction_async(
        self, 
        data_prep: Dict[str, Any], 
        model_type: str, 
        params: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> ModelTrainingResult:
        """Train dimensionality reduction model asynchronously"""
        
        if model_type not in self.dimensionality_reduction:
            return ModelTrainingResult(
                task_type="dimensionality_reduction",
                model_type=model_type,
                results={},
                error=f"Unsupported dimensionality reduction model: {model_type}"
            )
        
        try:
            model = self.dimensionality_reduction[model_type]
            if params:
                model.set_params(**params)
            
            X_train = data_prep["X_train"]
            
            if progress_callback:
                await progress_callback(50, f"Fitting {model_type} model...")
            
            # Transform data
            loop = asyncio.get_event_loop()
            X_reduced = await loop.run_in_executor(None, model.fit_transform, X_train)
            
            if progress_callback:
                await progress_callback(90, "Computing reduction metrics...")
            
            # Calculate metrics
            metrics = {}
            if model_type == "pca":
                explained_variance = model.explained_variance_ratio_
                metrics["explained_variance_ratio"] = explained_variance.tolist()
                metrics["cumulative_variance"] = np.cumsum(explained_variance).tolist()
                metrics["n_components"] = int(model.n_components)
            
            # Limit transformed data size for response
            max_samples = min(100, len(X_reduced))
            
            logger.info(f"Dimensionality reduction complete: {model_type}")
            
            return ModelTrainingResult(
                task_type="dimensionality_reduction",
                model_type=model_type,
                results={
                    **metrics,
                    "transformed_data": X_reduced[:max_samples].tolist(),
                    "original_shape": list(X_train.shape),
                    "reduced_shape": list(X_reduced.shape)
                },
                model=model
            )
            
        except Exception as e:
            logger.error(f"Error in dimensionality reduction training: {str(e)}")
            return ModelTrainingResult(
                task_type="dimensionality_reduction",
                model_type=model_type,
                results={},
                error=f"Dimensionality reduction failed: {str(e)}"
            )

    def _validate_inputs(
        self, 
        df: pd.DataFrame, 
        target_column: Optional[str], 
        task_type: str, 
        model_type: Optional[str]
    ) -> bool:
        """Validate input parameters"""
        
        if df.empty:
            logger.error("DataFrame is empty")
            return False
        
        if task_type not in ["classification", "regression", "clustering", "dimensionality_reduction"]:
            logger.error(f"Invalid task type: {task_type}")
            return False
        
        if task_type in ["classification", "regression"] and not target_column:
            logger.error(f"Target column required for {task_type}")
            return False
        
        if model_type and model_type not in self._get_models_for_task(task_type):
            logger.error(f"Invalid model type {model_type} for task {task_type}")
            return False
        
        return True

    def _get_models_for_task(self, task_type: str) -> Dict:
        """Get available models for a task type"""
        model_mapping = {
            "classification": self.classification_models,
            "regression": self.regression_models,
            "clustering": self.clustering_models,
            "dimensionality_reduction": self.dimensionality_reduction
        }
        return model_mapping.get(task_type, {})

    def _get_default_model_type(self, task_type: str) -> str:
        """Get default model type for a task"""
        defaults = {
            "classification": "logistic_regression",
            "regression": "linear_regression",
            "clustering": "kmeans",
            "dimensionality_reduction": "pca"
        }
        return defaults.get(task_type, "logistic_regression")

    def _get_feature_importance(self, model: Any, feature_names: List[str]) -> Optional[List[tuple]]:
        """Extract feature importance from a model if available"""
        try:
            importance_dict = {}
            
            if hasattr(model, 'feature_importances_'):
                importance_dict = dict(zip(feature_names, model.feature_importances_))
            elif hasattr(model, 'coef_'):
                if len(model.coef_.shape) == 1:
                    importance_dict = dict(zip(feature_names, abs(model.coef_)))
                else:
                    importance_dict = dict(zip(feature_names, np.mean(abs(model.coef_), axis=0)))
            
            if importance_dict:
                # Sort by importance and return top 10
                sorted_importance = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)
                return sorted_importance[:10]
            
            return None
            
        except Exception as e:
            logger.warning(f"Could not extract feature importance: {str(e)}")
            return None

    async def save_model_async(self, model: Any, file_path: str = "uploads/trained_model.pkl") -> bool:
        """Save a trained model to disk asynchronously"""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, joblib.dump, model, file_path)
            logger.info(f"Model saved to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False

# Legacy compatibility class
class ModelTrainer:
    """Legacy ModelTrainer class for backward compatibility"""
    
    def __init__(self):
        self.async_trainer = AsyncModelTrainer()
    
    def train_model(self, df, target_column=None, task_type="clustering", model_type=None, params=None):
        """Legacy synchronous training method"""
        try:
            # Run async method in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            result = loop.run_until_complete(
                self.async_trainer.train_model_async(
                    df, target_column, task_type, model_type, params
                )
            )
            
            # Convert async result to legacy format for backward compatibility
            legacy_result = {
                "task_type": result.task_type,
                "model_type": result.model_type,
                "results": result.results,
                "model": result.model
            }
            
            if result.feature_importance:
                legacy_result["feature_importance"] = result.feature_importance
            
            if result.error:
                legacy_result["error"] = result.error
            
            loop.close()
            return legacy_result
            
        except Exception as e:
            logger.error(f"Error in legacy train_model: {str(e)}")
            return {"error": f"Training failed: {str(e)}"}
    
    def train_multiple_models(self, df, target_column=None, task_type="classification", model_types=None):
        """Legacy synchronous method for training multiple models"""
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            results = loop.run_until_complete(
                self.async_trainer.train_multiple_models_async(
                    df, target_column, task_type, model_types
                )
            )
            
            # Convert async results to legacy format
            legacy_results = {}
            for model_type, result in results.items():
                legacy_results[model_type] = {
                    "task_type": result.task_type,
                    "model_type": result.model_type,
                    "results": result.results,
                    "model": result.model
                }
                
                if result.feature_importance:
                    legacy_results[model_type]["feature_importance"] = result.feature_importance
                
                if result.error:
                    legacy_results[model_type]["error"] = result.error
            
            loop.close()
            return legacy_results
            
        except Exception as e:
            logger.error(f"Error in legacy train_multiple_models: {str(e)}")
            return {"error": f"Multiple model training failed: {str(e)}"}

# Create a global instance for easier imports
model_trainer = ModelTrainer()

# For backwards compatibility
def train_model(df, target_column=None, task_type="clustering", model_type=None, params=None):
    """Wrapper function for backward compatibility"""
    return model_trainer.train_model(df, target_column, task_type, model_type, params)

def save_model(model, file_path="uploads/trained_model.pkl"):
    """Save a trained model to disk"""
    try:
        joblib.dump(model, file_path)
        logger.info(f"Model saved to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        return False

async def save_model_async(model, file_path="uploads/trained_model.pkl"):
    """Async wrapper for saving models"""
    trainer = AsyncModelTrainer()
    return await trainer.save_model_async(model, file_path)