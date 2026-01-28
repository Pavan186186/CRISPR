import json
import pandas as pd

try:
    with open('data/raw/ctg-studies.json', 'r') as f:
        data = json.load(f)
        print(f"Total items in ctg-studies.json: {len(data)}")
        
        phases = {'Phase 1': 0, 'Phase 2': 0, 'Phase 3': 0, 'Phase 4': 0, 'Approved': 0}
        
        for study in data:
            # Check phases
            if 'protocolSection' in study and 'designModule' in study['protocolSection'] and 'phases' in study['protocolSection']['designModule']:
                study_phases = study['protocolSection']['designModule']['phases']
                for p in study_phases:
                    if 'PHASE1' in p: phases['Phase 1'] += 1
                    if 'PHASE2' in p: phases['Phase 2'] += 1
                    if 'PHASE3' in p: phases['Phase 3'] += 1
                    if 'PHASE4' in p: phases['Phase 4'] += 1
            
            # Check status for approval (simplified)
            if 'protocolSection' in study and 'statusModule' in study['protocolSection']:
                status = study['protocolSection']['statusModule'].get('overallStatus', '')
                if status == 'APPROVED': # This status might not exist, need to check
                    phases['Approved'] += 1

        print("Phases counts:", phases)

except Exception as e:
    print(f"Error reading json: {e}")

try:
    df = pd.read_csv('data/raw/CTIS_trials_20251028.csv')
    print(f"Total rows in CTIS_trials_20251028.csv: {len(df)}")
    
    # Filter for CRISPR in Title or Interventions (assuming columns exist, need to check header)
    # Based on previous analysis, columns might be different. Let's print columns first.
    print("Columns:", df.columns.tolist())
    
    # Filter for "Gene" and "Therapy"
    gene_therapy_df = df[df.apply(lambda row: row.astype(str).str.contains('Gene', case=False).any() and row.astype(str).str.contains('Therapy', case=False).any(), axis=1)]
    print(f"Rows with 'Gene' and 'Therapy': {len(gene_therapy_df)}")
    
    # Filter for "Cell" and "Therapy"
    cell_therapy_df = df[df.apply(lambda row: row.astype(str).str.contains('Cell', case=False).any() and row.astype(str).str.contains('Therapy', case=False).any(), axis=1)]
    print(f"Rows with 'Cell' and 'Therapy': {len(cell_therapy_df)}")
    
    # Filter for "Genetic"
    genetic_df = df[df.apply(lambda row: row.astype(str).str.contains('Genetic', case=False).any(), axis=1)]
    print(f"Rows with 'Genetic': {len(genetic_df)}")

except Exception as e:
    print(f"Error reading csv: {e}")
