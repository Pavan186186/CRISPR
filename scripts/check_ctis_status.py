import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'CTIS_trials_20251028.csv')

try:
    df = pd.read_csv(INPUT_PATH, on_bad_lines='skip')
    if 'Overall trial status' in df.columns:
        print("Unique CTIS Statuses:", df['Overall trial status'].unique())
    else:
        print("'Overall trial status' column not found.")
except Exception as e:
    print(f"Error: {e}")
