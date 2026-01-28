import json
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'bloom_data.json')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_choropleth_data.json')

def main():
    print("Processing Anti-CRISPR choropleth data...")
    
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
            
    # Convert to list of objects
    output_data = [
        { "country": country, "value": val }
        for country, val in country_values.items()
    ]
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Successfully processed {len(output_data)} countries to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
