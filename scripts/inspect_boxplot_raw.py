import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'allframe_update_addEpige.txt')

try:
    df = pd.read_csv(INPUT_PATH, sep='\t', on_bad_lines='skip', nrows=10000, low_memory=False)
    df.columns = df.columns.str.strip()
    print("Cleaned Columns:", df.columns.tolist())
    if 'Identity' in df.columns:
        print("Unique Identity values:", df['Identity'].unique())
    if 'Validation' in df.columns:
        print("Unique Validation values:", df['Validation'].unique())
except Exception as e:
    print(f"Error: {e}")
