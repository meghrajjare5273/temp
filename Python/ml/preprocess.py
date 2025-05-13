# Python/ml/preprocess.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import KFold

def suggest_missing_strategy(df):
    # Existing code remains unchanged
    missing_counts = df.isnull().sum()
    total_rows = len(df)
    if missing_counts.sum() == 0:
        return 'mean'
    missing_percentages = missing_counts / total_rows
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    if any(missing_percentages > 0.5):
        return 'drop'
    if numeric_cols.isin(missing_counts[missing_counts > 0].index).any():
        skewness = df[numeric_cols].skew()
        if any(abs(skewness) > 1):
            return 'median'
        return 'mean'
    if categorical_cols.isin(missing_counts[missing_counts > 0].index).any():
        return 'mode'
    return 'mean'

def target_encode(df, categorical_col, target_col):
    """Perform target encoding on a categorical column using the target variable."""
    target_means = df.groupby(categorical_col)[target_col].mean()
    return df[categorical_col].map(target_means)

def kfold_target_encode(df, categorical_col, target_col, n_splits=5):
    """Perform K-Fold target encoding to prevent data leakage."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    df_encoded = df.copy()
    encoded_col = np.zeros(len(df))
    
    for train_idx, val_idx in kf.split(df):
        train_df, val_df = df.iloc[train_idx], df.iloc[val_idx]
        target_means = train_df.groupby(categorical_col)[target_col].mean()
        encoded_col[val_idx] = val_df[categorical_col].map(target_means).fillna(train_df[target_col].mean())
    
    df_encoded[categorical_col] = encoded_col
    return df_encoded

def preprocess_data(df, missing_strategy='mean', scaling=True, encoding='onehot', target_column=None):
    """
    Preprocess a dataset by handling missing values, scaling numeric columns, and encoding categorical columns.
    
    Parameters:
    - df: Input DataFrame
    - missing_strategy: Strategy for missing values ('mean', 'median', 'mode', 'drop')
    - scaling: Boolean to enable/disable scaling of numeric columns
    - encoding: Encoding method for categorical columns ('onehot', 'label')
    - target_column: Name of the target column to preserve (e.g., 'Price')
    
    Returns:
    - Preprocessed DataFrame
    """
    try:
        # Create a copy of the DataFrame
        df_processed = df.copy()

        # Ensure target column is numeric if specified
        if target_column and target_column in df_processed.columns:
            df_processed[target_column] = pd.to_numeric(df_processed[target_column], errors='coerce')
            print(f"Target column '{target_column}' converted to numeric")

        # Handle missing values
        print(f"Handling missing values with strategy: {missing_strategy}")
        if missing_strategy == 'mean':
            numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                df_processed[col] = df_processed[col].fillna(df_processed[col].mean())
        elif missing_strategy == 'median':
            numeric_cols = df_processed.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                df_processed[col] = df_processed[col].fillna(df_processed[col].median())
        elif missing_strategy == 'mode':
            for col in df_processed.columns:
                df_processed[col] = df_processed[col].fillna(df_processed[col].mode()[0])
        elif missing_strategy == 'drop':
            df_processed = df_processed.dropna()

        # Identify numeric and categorical columns
        numeric_cols = df_processed.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df_processed.select_dtypes(include=['object', 'category']).columns.tolist()

        # Exclude target column from features
        if target_column and target_column in numeric_cols:
            numeric_cols.remove(target_column)
        elif target_column and target_column in categorical_cols:
            categorical_cols.remove(target_column)

        print(f"Numeric columns: {numeric_cols}")
        print(f"Categorical columns: {categorical_cols}")

        # Define preprocessing pipeline
        transformers = []
        if numeric_cols and scaling:
            transformers.append(('num', StandardScaler(), numeric_cols))
        elif numeric_cols:
            transformers.append(('num', 'passthrough', numeric_cols))
        
        if categorical_cols:
            if encoding == 'onehot':
                transformers.append(('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_cols))
            elif encoding == 'label':
                # Note: Label encoding is applied directly for simplicity here
                for col in categorical_cols:
                    df_processed[col] = df_processed[col].astype('category').cat.codes
                transformers.append(('cat', 'passthrough', categorical_cols))
            else:
                print(f"Warning: Invalid encoding '{encoding}'. Using one-hot encoding.")
                transformers.append(('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_cols))

        # If no columns to preprocess, return the DataFrame with target column first
        if not transformers:
            print("No columns to preprocess after handling missing values")
            if target_column and target_column in df.columns:
                return df_processed[[target_column] + [col for col in df_processed.columns if col != target_column]]
            return df_processed

        # Apply preprocessing
        preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')
        transformed_data = preprocessor.fit_transform(df_processed)

        # Get feature names after transformation
        feature_names = []
        for name, transformer, cols in preprocessor.transformers_:
            if name == 'num':
                feature_names.extend(cols)
            elif name == 'cat' and encoding == 'onehot':
                feature_names.extend(preprocessor.named_transformers_['cat'].get_feature_names_out(cols))
            else:
                feature_names.extend(cols)

        # Create preprocessed DataFrame
        df_processed = pd.DataFrame(transformed_data, columns=feature_names)

        # Add target column back
        if target_column and target_column in df.columns:
            df_processed[target_column] = df[target_column].reset_index(drop=True)

        return df_processed

    except Exception as e:
        print(f"Error in preprocess_data: {str(e)}")
        raise

def save_preprocessed_data(df, filename="preprocessed_data.csv"):
    try:
        file_path = f"uploads/{filename}"
        df.to_csv(file_path, index=False)
        return file_path
    except Exception as e:
        print(f"Error saving preprocessed data: {str(e)}")
        raise