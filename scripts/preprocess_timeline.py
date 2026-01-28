#!/usr/bin/env python3
"""
Preprocess CTG studies data for Exponential Hope Timeline
Aggregates number of trials starting each year (2015-2025)
Includes milestone annotations
"""

import pandas as pd
import json

# Read the CTG studies data
input_file = "../data/raw/ctg-studies.csv"
output_file = "../data/processed/timeline_data.json"

print("Loading CTG studies data...")
df = pd.read_csv(input_file)

# Function to extract year from date string
def extract_year(date_str):
    if pd.isna(date_str) or date_str == '':
        return None
    try:
        if '-' in str(date_str):
            return int(str(date_str).split('-')[0])
        if len(str(date_str)) == 4:
            return int(date_str)
    except:
        pass
    return None

# Extract years
df['Year'] = df['Start Date'].apply(extract_year)

# Filter for years 2015-2025
df_filtered = df[(df['Year'] >= 2015) & (df['Year'] <= 2025)].copy()

print(f"Total studies 2015-2025: {len(df_filtered)}")

# Count trials per year
yearly_counts = df_filtered.groupby('Year').size().reset_index(name='count')

# Create complete year range
all_years = range(2015, 2026)
timeline_data = []

for year in all_years:
    year_data = yearly_counts[yearly_counts['Year'] == year]
    count = int(year_data['count'].values[0]) if len(year_data) > 0 else 0

    timeline_data.append({
        'year': year,
        'trials': count
    })

# Define milestones
milestones = [
    {
        'year': 2015,
        'title': 'First CRISPR Clinical Trial',
        'description': 'The journey begins - one pioneering trial to treat cancer',
        'icon': '🚀'
    },
    {
        'year': 2018,
        'title': 'Acceleration Phase',
        'description': 'Research activity doubles as confidence grows',
        'icon': '📈'
    },
    {
        'year': 2023,
        'title': 'FDA Approves Casgevy',
        'description': 'Historic approval of first CRISPR therapy for sickle cell disease',
        'icon': '🏆'
    }
]

# Calculate cumulative trials
cumulative = 0
for item in timeline_data:
    cumulative += item['trials']
    item['cumulative'] = cumulative

# Save to JSON
output = {
    'timeline': timeline_data,
    'milestones': milestones,
    'summary': {
        'totalTrials': cumulative,
        'yearRange': f'2015-2025',
        'peakYear': max(timeline_data, key=lambda x: x['trials'])['year'],
        'peakTrials': max(item['trials'] for item in timeline_data)
    }
}

with open(output_file, 'w') as f:
    json.dump(output, f, indent=2)

print(f"\nSaved to: {output_file}")
print(f"\nSummary:")
print(f"  Total trials (2015-2025): {cumulative}")
print(f"  Peak year: {output['summary']['peakYear']} with {output['summary']['peakTrials']} trials")

print(f"\nYearly breakdown:")
for item in timeline_data:
    print(f"  {item['year']}: {item['trials']} new trials (cumulative: {item['cumulative']})")
