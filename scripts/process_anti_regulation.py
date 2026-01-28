import json
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'bloom_data.json')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_regulation_data.json')

def main():
    print("Processing Anti-CRISPR regulation data...")
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return

    with open(INPUT_PATH, 'r') as f:
        data = json.load(f)

    # Aggregate max value per country
    country_values = {}
    for entry in data:
        country = entry.get('Country_Region')
        val = float(entry.get('Value', 0))
        if country:
            country_values[country] = max(country_values.get(country, 0), val)
            
    # Count categories
    counts = { "Restrictive": 0, "Regulated": 0, "Permissive": 0 }
    
    for val in country_values.values():
        if val <= 3:
            counts["Restrictive"] += 1
        elif val <= 6:
            counts["Regulated"] += 1
        else:
            counts["Permissive"] += 1
            
    output_data = [
        { "category": "Restrictive", "value": counts["Restrictive"] },
        { "category": "Regulated", "value": counts["Regulated"] },
        { "category": "Permissive", "value": counts["Permissive"] }
    ]
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Successfully processed regulation data to {OUTPUT_PATH}")
    print(json.dumps(output_data, indent=2))

if __name__ == "__main__":
    main()
