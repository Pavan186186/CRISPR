#!/usr/bin/env python3
"""
Enhanced Timeline Data Preprocessing
Extracts accurate yearly trial counts from ctg-studies.json
Includes all trials from 2012-2025 for better exponential curve
"""

import json
from collections import defaultdict
from datetime import datetime

# Load clinical trials data
with open('../data/raw/ctg-studies.json', 'r', encoding='utf-8') as f:
    studies = json.load(f)

print(f"Loaded {len(studies)} studies")

# Extract start years from all studies
yearly_counts = defaultdict(int)
trials_by_year = defaultdict(list)

for study in studies:
    try:
        protocol = study.get('protocolSection', {})
        status_module = protocol.get('statusModule', {})

        # Try to get start date
        start_date_struct = status_module.get('startDateStruct', {})
        date_str = start_date_struct.get('date')

        if date_str:
            # Parse date (format: YYYY-MM-DD or YYYY-MM or YYYY)
            year = int(date_str.split('-')[0])

            # Filter to reasonable range (2012-2025)
            if 2012 <= year <= 2025:
                yearly_counts[year] += 1

                # Store trial info
                ident = protocol.get('identificationModule', {})
                trials_by_year[year].append({
                    'nctId': ident.get('nctId', 'Unknown'),
                    'title': ident.get('briefTitle', 'Unknown Trial')
                })

    except (ValueError, KeyError, TypeError) as e:
        continue

# Sort years and create timeline data
years = sorted(yearly_counts.keys())
timeline = []
cumulative = 0

print("\n=== Yearly Trial Counts ===")
for year in years:
    count = yearly_counts[year]
    cumulative += count
    timeline.append({
        'year': year,
        'trials': count,
        'cumulative': cumulative
    })
    print(f"{year}: {count} new trials (cumulative: {cumulative})")

# Enhanced milestones based on actual data
milestones = [
    {
        'year': 2016,
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
        'year': 2021,
        'title': 'Global Expansion',
        'description': 'Peak year with maximum new trials launched worldwide',
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
        'totalTrials': cumulative,
        'yearRange': f'{years[0]}-{years[-1]}',
        'peakYear': max(yearly_counts.items(), key=lambda x: x[1])[0],
        'peakTrials': max(yearly_counts.values()),
        'growthRate': f'{((yearly_counts[years[-1]] / yearly_counts[years[0]]) ** (1 / len(years)) - 1) * 100:.1f}%'
    }
}

# Save to processed data
output_path = '../data/processed/timeline_data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)

print(f"\n✅ Timeline data saved to {output_path}")
print(f"Total trials: {cumulative}")
print(f"Peak year: {output_data['summary']['peakYear']} with {output_data['summary']['peakTrials']} trials")
print(f"Average annual growth rate: {output_data['summary']['growthRate']}")
