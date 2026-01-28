import json
import os
import pandas as pd
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CTG_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'ctg-studies.json')
CTIS_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'CTIS_trials_20251028.csv')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_timeline_data.json')

def get_ctg_date(study):
    struct = study.get('protocolSection', {}).get('statusModule', {})
    date_str = struct.get('completionDateStruct', {}).get('date') or \
               struct.get('primaryCompletionDateStruct', {}).get('date') or \
               struct.get('startDateStruct', {}).get('date')
    
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
    except ValueError:
        try:
            return datetime.strptime(date_str, '%Y-%m').strftime('%Y-%m-01')
        except ValueError:
            return None

def process_ctg():
    print("Processing CTG data...")
    with open(CTG_PATH, 'r') as f:
        studies = json.load(f)

    failed = []
    for study in studies:
        status_module = study.get('protocolSection', {}).get('statusModule', {})
        status = status_module.get('overallStatus')
        
        if status in ["TERMINATED", "SUSPENDED", "WITHDRAWN"]:
            date = get_ctg_date(study)
            if date:
                reason = status_module.get('whyStopped', 'Reason not specified')
                nct_id = study.get('protocolSection', {}).get('identificationModule', {}).get('nctId')
                condition = study.get('protocolSection', {}).get('conditionsModule', {}).get('conditions', ['Unknown'])[0]
                phase = study.get('protocolSection', {}).get('designModule', {}).get('phases', ['N/A'])[0]
                
                failed.append({
                    "id": nct_id,
                    "status": status.title(),
                    "date": date,
                    "reason": reason,
                    "phase": phase,
                    "condition": condition,
                    "source": "ClinicalTrials.gov"
                })
    return failed

def process_ctis():
    print("Processing CTIS data...")
    try:
        df = pd.read_csv(CTIS_PATH, on_bad_lines='skip')
        
        # Filter statuses
        target_statuses = ['Temporarily halted', 'Suspended', 'Revoked']
        df_failed = df[df['Overall trial status'].isin(target_statuses)].copy()
        
        failed = []
        print(f"CTIS: Found {len(df_failed)} potential failed trials.")
        
        for _, row in df_failed.iterrows():
            # Date parsing
            date_str = row.get('Global end of the trial')
            if pd.isna(date_str):
                date_str = row.get('End date')
            if pd.isna(date_str):
                date_str = row.get('Decision date')
                
            if pd.isna(date_str):
                # print(f"Skipping {row.get('Trial number')}: No date")
                continue
                
            try:
                date = pd.to_datetime(date_str).strftime('%Y-%m-%d')
            except:
                # print(f"Skipping {row.get('Trial number')}: Invalid date {date_str}")
                continue
                
            failed.append({
                "id": row.get('Trial number', 'Unknown'),
                "status": row.get('Overall trial status', 'Unknown'),
                "date": date,
                "reason": "Status: " + str(row.get('Overall trial status', 'Unknown')),
                "phase": str(row.get('Trial phase', 'N/A')),
                "condition": str(row.get('Medical conditions', 'Unknown')),
                "source": "EU CTIS"
            })
        print(f"CTIS: Successfully extracted {len(failed)} trials with dates.")
        return failed
    except Exception as e:
        print(f"Error processing CTIS: {e}")
        return []

def main():
    ctg_data = process_ctg()
    ctis_data = process_ctis()
    
    merged = ctg_data + ctis_data
    merged.sort(key=lambda x: x['date'])
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(merged, f, indent=2)
        
    print(f"Successfully merged {len(merged)} trials ({len(ctg_data)} CTG, {len(ctis_data)} CTIS) to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
