import pandas as pd
import os
import csv

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'allframe_update_addEpige.txt')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_boxplot_data.csv')

def main():
    print("Processing Anti-CRISPR Boxplot data from raw file...")
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    try:
        # Read TSV file (handling potential quoting issues)
        df = pd.read_csv(INPUT_PATH, sep='\t', on_bad_lines='skip', low_memory=False)
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        # Check columns
        if 'Cas9_type' not in df.columns or 'Identity' not in df.columns or 'Indel_treatment%' not in df.columns:
            print("Error: Required columns not found.")
            print("Available columns:", df.columns.tolist())
            return

        # Filter for OFF-target sites
        off_target_df = df[df['Identity'] == 'OFF'].copy()
        
        # Clean Indel_treatment% (convert to numeric, coerce errors)
        off_target_df['Indel_treatment%'] = pd.to_numeric(off_target_df['Indel_treatment%'], errors='coerce')
        
        # Drop NaNs
        off_target_df = off_target_df.dropna(subset=['Indel_treatment%'])
        
        # Select relevant columns
        result_df = off_target_df[['Cas9_type', 'Indel_treatment%']]
        result_df.columns = ['Cas9 Variant', 'Off-Target Score']
        
        # Clean Variant names (optional, e.g., remove extra info)
        # result_df['Cas9 Variant'] = result_df['Cas9 Variant'].str.split().str[0]

        # Save to CSV
        result_df.to_csv(OUTPUT_PATH, index=False)
        
        print(f"Successfully processed {len(result_df)} off-target records to {OUTPUT_PATH}")
        print("Sample data:")
        print(result_df.head())
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
