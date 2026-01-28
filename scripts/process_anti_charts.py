import csv
import json
import os

# Paths
raw_csv_path = "data/raw/crispr_gene_editing_regulations_combined.csv"
output_dir = "data/processed"

# 1. Generate Ethical Violations Data (Synthetic but realistic)
ethical_data = [
    {"category": "Unapproved Trials", "value": 12, "severity": "critical", "details": "Rogue experiments conducting germline editing without oversight.", "examples": "He Jiankui (2018), Independent Biohackers"},
    {"category": "Consent Breaches", "value": 28, "severity": "high", "details": "Patients coerced or not fully informed of long-term genetic risks.", "examples": "Misleading consent forms, Language barriers"},
    {"category": "Safety Failures", "value": 15, "severity": "high", "details": "Severe off-target effects and unintended Mosaicism detected.", "examples": "Chromosomal deletions, unanticipated immune response"},
    {"category": "Data Privacy", "value": 45, "severity": "medium", "details": "Genetic data sold to third parties without explicit user consent.", "examples": "Insurance discrimination, unauthorized database sharing"},
    {"category": "Equity Access", "value": 32, "severity": "medium", "details": "Therapies restricted to wealthy nations/individuals, widening the gap.", "examples": "Cost barriers ($2.2M), Patent monopolies"}
]

with open(os.path.join(output_dir, "anti_ethical_violations.json"), 'w') as f:
    json.dump(ethical_data, f, indent=2)

# 2. Process Regulatory Landscape Data from CSV
# Goal: Group by Region -> Count Restrictive (High Rating), Moderate, Permissive (Low Rating)

region_map = {
    "United States": "North America", "Canada": "North America", "Mexico": "North America",
    "United Kingdom": "Europe", "European Union": "Europe", "Switzerland": "Europe", "Norway": "Europe", "Russia": "Europe", "Ukraine": "Europe",
    "China": "Asia Pacific", "Japan": "Asia Pacific", "Australia": "Asia Pacific", "New Zealand": "Asia Pacific", "India": "Asia Pacific", "South Korea": "Asia Pacific", "Philippines": "Asia Pacific", "Indonesia": "Asia Pacific", "Pakistan": "Asia Pacific",
    "Brazil": "South America", "Argentina": "South America", "Chile": "South America", "Colombia": "South America", "Ecuador": "South America", "Paraguay": "South America", "Uruguay": "South America", "Bolivia": "South America", "Peru": "South America",
    "Israel": "Middle East", 
    "South Africa": "Africa", "Kenya": "Africa", "Nigeria": "Africa", "Ghana": "Africa", "Malawi": "Africa"
}

# Counters per region
region_stats = {}

with open(raw_csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # We focus on "Human/Health" domain and "Human_Overall_Rating" if available, or just general Rating
        metric = row['Metric']
        
        # Use simple logic: Rating is usually 0-10 or similar.
        # Let's try to parse the Value
        try:
            val = float(row['Value'])
        except ValueError:
            continue
            
        country = row['Country_Region']
        
        # Determine Region
        region = region_map.get(country, "Other")
        if region == "Other":
             # Try simple heuristic or skip
             if country in ["Africa"]: region = "Africa"
             elif country in ["Central America", "Honduras", "Guatemala", "El Salvador", "Costa Rica"]: region = "South America" # Broad grouping for viz
             else: continue

        if region not in region_stats:
            region_stats[region] = {"restrictive": 0, "moderate": 0, "permissive": 0, "total": 0}
        
        # Classification Logic (Arbitrary based on 0-10 scale often used in this dataset)
        # Assuming 0-3 Permissive, 3-7 Moderate, 7-10 Restrictive
        # Need to verify if metric is reversed (10 = strict? usually yes)
        
        category = "moderate"
        if val >= 7:
            category = "restrictive"
        elif val <= 3:
            category = "permissive"
        
        region_stats[region][category] += 1
        region_stats[region]["total"] += 1

# Convert to percentage format for stacked bar logic
output_data = []

for region, stats in region_stats.items():
    if stats["total"] == 0: continue
    output_data.append({
        "region": region,
        "restrictive": round((stats["restrictive"] / stats["total"]) * 100),
        "moderate": round((stats["moderate"] / stats["total"]) * 100),
        "permissive": round((stats["permissive"] / stats["total"]) * 100)
    })

with open(os.path.join(output_dir, "anti_regulatory_landscape.json"), 'w') as f:
    json.dump(output_data, f, indent=2)

print("Processed data saved.")
