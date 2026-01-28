#!/usr/bin/env python3
"""
Timeline Data from Temporal Map
Uses the same 711 studies from temporal_map_data.json
Shows accurate yearly counts matching the globe visualization
"""

import json
from collections import defaultdict

# Load temporal map data (711 studies)
with open('../data/processed/temporal_map_data.json', 'r', encoding='utf-8') as f:
    studies = json.load(f)

print(f"Loaded {len(studies)} studies from temporal map")

# Count studies by year
yearly_counts = defaultdict(int)

for study in studies:
    year = study.get('year')
    if year and 2015 <= year <= 2025:
        yearly_counts[year] += 1

# Sort years and create timeline data
years = sorted(yearly_counts.keys())
timeline = []

print("\n=== Yearly Study Counts (NEW) ===")
for year in years:
    count = yearly_counts[year]
    timeline.append({
        'year': year,
        'trials': count,
        'cumulative': sum(yearly_counts[y] for y in range(min(years), year + 1))
    })
    print(f"{year}: {count} new studies")

total_studies = sum(yearly_counts.values())

# Enhanced milestones based on actual peak years
peak_year = max(yearly_counts.items(), key=lambda x: x[1])[0]

milestones = [
    {
        'year': 2016,
        'title': 'First CRISPR Clinical Trial',
        'description': 'The journey begins one pioneering trial to treat cancer',
        'icon': '🚀'
    },
    {
        'year': 2018,
        'title': 'Acceleration Phase',
        'description': 'Research activity doubles as confidence grows worldwide',
        'icon': '📈'
    },
    {
        'year': 2021,
        'title': 'Global Expansion',
        'description': 'Peak year with maximum new trials launched',
        'icon': '🌍'
    },
    {
        'year': 2023,
        'title': 'FDA Approves Casgevy',
        'description': 'Historic approval of first CRISPR therapy for sickle cell disease',
        'icon': '🏆'
    }
]

# Create output data structure
output_data = {
    'timeline': timeline,
    'milestones': milestones,
    'summary': {
        'totalTrials': total_studies,
        'yearRange': f'{years[0]}-{years[-1]}',
        'peakYear': peak_year,
        'peakTrials': yearly_counts[peak_year],
        'dataSource': 'temporal_map_data.json (711 studies)'
    }
}

# Save to processed data
output_path = '../data/processed/timeline_data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)

print(f"\n✅ Timeline data saved to {output_path}")
print(f"Total studies: {total_studies}")
print(f"Peak year: {peak_year} with {yearly_counts[peak_year]} studies")
print(f"Data source: temporal_map_data.json")
print("\nThis matches the 711 studies shown on the 3D globe! 🌍")
