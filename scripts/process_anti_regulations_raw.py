import pandas as pd
import os
import json

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'crispr_gene_editing_regulations_combined.csv')
OUTPUT_REGULATION = os.path.join(BASE_DIR, 'data', 'processed', 'anti_regulation_data.json')
OUTPUT_CHOROPLETH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_choropleth_data.json')

def main():
    print("Processing Anti-CRISPR Regulations from raw CSV...")
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    try:
        df = pd.read_csv(INPUT_PATH)
        
        # Ensure numeric values
        df['Value'] = pd.to_numeric(df['Value'], errors='coerce')
        df = df.dropna(subset=['Value', 'Country_Region'])
        
        # Aggregate max value per country (Risk Level)
        country_max = df.groupby('Country_Region')['Value'].max().reset_index()
        
        # --- 1. Generate Choropleth Data ---
        choropleth_data = []
        for _, row in country_max.iterrows():
            choropleth_data.append({
                "country": row['Country_Region'],
                "value": float(row['Value'])
            })
            
        with open(OUTPUT_CHOROPLETH, 'w') as f:
            json.dump(choropleth_data, f, indent=2)
        print(f"Generated {OUTPUT_CHOROPLETH} with {len(choropleth_data)} countries.")

        # --- 2. Generate Regulation Bar Chart Data ---
        # Count countries by category
        # 0-3: Restrictive, 4-6: Regulated, 7-10: Permissive
        counts = { "Restrictive": 0, "Regulated": 0, "Permissive": 0 }
        
        for val in country_max['Value']:
            if val <= 3:
                counts["Restrictive"] += 1
            elif val <= 6:
                counts["Regulated"] += 1
            else:
                counts["Permissive"] += 1
                
        regulation_data = [
            { "category": "Restrictive", "value": counts["Restrictive"] },
            { "category": "Regulated", "value": counts["Regulated"] },
            { "category": "Permissive", "value": counts["Permissive"] }
        ]
        
        with open(OUTPUT_REGULATION, 'w') as f:
            json.dump(regulation_data, f, indent=2)
        print(f"Generated {OUTPUT_REGULATION}.")
        print(json.dumps(regulation_data, indent=2))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
