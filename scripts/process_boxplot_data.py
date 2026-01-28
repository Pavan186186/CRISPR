import pandas as pd
import os

# Define paths relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
raw_data_path = os.path.join(script_dir, '../data/raw/allframe_update_addEpige.txt')
processed_data_path = os.path.join(script_dir, '../data/processed/anti_boxplot_data.csv')

# Ensure processed directory exists
os.makedirs(os.path.dirname(processed_data_path), exist_ok=True)

print(f"Reading raw data from {raw_data_path}...")

try:
    # Read the tab-separated file
    df = pd.read_csv(raw_data_path, sep='\t', low_memory=False)
    
    # Check if required columns exist
    required_columns = ['Cas9_type', 'Score']
    if not all(col in df.columns for col in required_columns):
        print(f"Error: Missing required columns. Found columns: {df.columns.tolist()}")
        exit(1)
        
    # Select only relevant columns
    df_processed = df[required_columns].copy()
    
    # Filter out rows with missing values
    initial_count = len(df_processed)
    df_processed = df_processed.dropna()
    final_count = len(df_processed)
    
    print(f"Filtered {initial_count - final_count} rows with missing values.")
    print(f"Saving {final_count} rows to {processed_data_path}...")
    
    # Save to CSV
    df_processed.to_csv(processed_data_path, index=False)
    print("Processing complete.")

except Exception as e:
    print(f"An error occurred: {e}")
    exit(1)
