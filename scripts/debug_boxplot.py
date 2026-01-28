import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'allframe_update_addEpige.txt')

def debug_boxplot():
    try:
        df = pd.read_csv(INPUT_PATH, sep='\t', on_bad_lines='skip', low_memory=False)
        df.columns = df.columns.str.strip()
        
        off = df[df['Identity'] == 'OFF'].copy()
        print(f"Total OFF rows: {len(off)}")
        
        # Check Indel_treatment%
        off['Indel_numeric'] = pd.to_numeric(off['Indel_treatment%'], errors='coerce')
        valid_indel = off.dropna(subset=['Indel_numeric'])
        print(f"Rows with valid Indel_treatment%: {len(valid_indel)}")
        
        # Check Cas9_type
        valid_cas9 = valid_indel.dropna(subset=['Cas9_type'])
        print(f"Rows with valid Indel AND Cas9_type: {len(valid_cas9)}")
        
        if len(valid_cas9) < len(off):
            print("Sample invalid Indel values:", off[off['Indel_numeric'].isna()]['Indel_treatment%'].unique()[:10])

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_boxplot()
