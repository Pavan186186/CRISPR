import json
import os
from datetime import datetime

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'ctg-studies.json')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_timeline_data.json')

def get_date(study):
    # Try different date fields
    struct = study.get('protocolSection', {}).get('statusModule', {})
    date_str = struct.get('completionDateStruct', {}).get('date') or \
               struct.get('primaryCompletionDateStruct', {}).get('date') or \
               struct.get('startDateStruct', {}).get('date')
    
    if not date_str:
        return None
        
    # Parse date (YYYY-MM-DD or YYYY-MM)
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
    except ValueError:
        try:
            return datetime.strptime(date_str, '%Y-%m').strftime('%Y-%m-01')
        except ValueError:
            return None

def main():
    print("Processing Anti-CRISPR timeline data...")
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    with open(INPUT_PATH, 'r') as f:
        studies = json.load(f)

    failed_trials = []
    
    for study in studies:
        status_module = study.get('protocolSection', {}).get('statusModule', {})
        status = status_module.get('overallStatus')
        
        if status in ["TERMINATED", "SUSPENDED", "WITHDRAWN"]:
            date = get_date(study)
            if date:
                reason = status_module.get('whyStopped', 'Reason not specified')
                nct_id = study.get('protocolSection', {}).get('identificationModule', {}).get('nctId')
                condition = study.get('protocolSection', {}).get('conditionsModule', {}).get('conditions', ['Unknown'])[0]
                phase = study.get('protocolSection', {}).get('designModule', {}).get('phases', ['N/A'])[0]
                
                failed_trials.append({
                    "id": nct_id,
                    "status": status.title(), # Convert to Title Case for frontend
                    "date": date,
                    "reason": reason,
                    "phase": phase,
                    "condition": condition
                })

    # Sort by date
    failed_trials.sort(key=lambda x: x['date'])
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(failed_trials, f, indent=2)
        
    print(f"Successfully extracted {len(failed_trials)} failed trials to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
