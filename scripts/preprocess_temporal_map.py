#!/usr/bin/env python3
"""
Preprocess CTG studies data for Clinical Trials Global Distribution (Temporal Map)
Extracts: NCT ID, Title, Year, City, Country, Lat, Lon, Status, Enrollment
"""

import pandas as pd
import json
import re
from datetime import datetime

# Read the CTG studies data
input_file = "../data/raw/ctg-studies.csv"
output_file = "../data/processed/temporal_map_data.json"

print("Loading CTG studies data...")
df = pd.read_csv(input_file)

print(f"Total studies: {len(df)}")

# Function to extract year from date string
def extract_year(date_str):
    if pd.isna(date_str) or date_str == '':
        return None
    # Try to parse various date formats
    try:
        # Format: YYYY-MM-DD
        if '-' in str(date_str):
            return int(str(date_str).split('-')[0])
        # Format: YYYY
        if len(str(date_str)) == 4:
            return int(date_str)
    except:
        pass
    return None

# Function to parse location string and extract city, state, country
def parse_location(loc_str):
    """
    Parse location string like:
    'City Name, State, Zip, Country'
    or 'City Name, Country'
    """
    if pd.isna(loc_str) or loc_str == '':
        return []

    locations = []
    # Split by | if multiple locations
    locs = str(loc_str).split('|')

    for loc in locs:
        parts = [p.strip() for p in loc.split(',')]
        if len(parts) >= 2:
            city = parts[0]
            country = parts[-1]
            state = parts[1] if len(parts) > 2 else ''
            locations.append({
                'city': city,
                'state': state,
                'country': country
            })

    return locations

# Simple geocoding dictionary for major cities (you can expand this)
CITY_COORDS = {
    'China': {
        'Guangzhou': {'lat': 23.1291, 'lon': 113.2644},
        'Shanghai': {'lat': 31.2304, 'lon': 121.4737},
        'Beijing': {'lat': 39.9042, 'lon': 116.4074},
    },
    'United States': {
        'Duarte': {'lat': 34.1395, 'lon': -117.9773},
        'Los Angeles': {'lat': 34.0522, 'lon': -118.2437},
        'Stanford': {'lat': 37.4241, 'lon': -122.1661},
        'New Haven': {'lat': 41.3083, 'lon': -72.9279},
        'Atlanta': {'lat': 33.7490, 'lon': -84.3880},
        'Chicago': {'lat': 41.8781, 'lon': -87.6298},
        'Westwood': {'lat': 39.0406, 'lon': -94.6169},
        'Minneapolis': {'lat': 44.9778, 'lon': -93.2650},
        'St Louis': {'lat': 38.6270, 'lon': -90.1994},
        'New York': {'lat': 40.7128, 'lon': -74.0060},
        'The Bronx': {'lat': 40.8448, 'lon': -73.8648},
        'Portland': {'lat': 45.5152, 'lon': -122.6784},
        'Philadelphia': {'lat': 39.9526, 'lon': -75.1652},
        'Dallas': {'lat': 32.7767, 'lon': -96.7970},
        'Houston': {'lat': 29.7604, 'lon': -95.3698},
        'San Antonio': {'lat': 29.4241, 'lon': -98.4936},
        'Salt Lake City': {'lat': 40.7608, 'lon': -111.8910},
    },
    'Denmark': {
        'Herlev': {'lat': 55.7237, 'lon': 12.4400},
    },
    'Australia': {
        'Camperdown': {'lat': -33.8897, 'lon': 151.1764},
        'Melbourne': {'lat': -37.8136, 'lon': 144.9631},
        'Nedlands': {'lat': -31.9818, 'lon': 115.8073},
    },
    'Canada': {
        'Toronto': {'lat': 43.6532, 'lon': -79.3832},
    },
    'Germany': {
        'Hamburg': {'lat': 53.5511, 'lon': 9.9937},
    },
}

# Country-level fallback coordinates
COUNTRY_COORDS = {
    'China': {'lat': 35.0, 'lon': 105.0},
    'United States': {'lat': 37.0902, 'lon': -95.7129},
    'Denmark': {'lat': 56.2639, 'lon': 9.5018},
    'Australia': {'lat': -25.2744, 'lon': 133.7751},
    'Canada': {'lat': 56.1304, 'lon': -106.3468},
    'Germany': {'lat': 51.1657, 'lon': 10.4515},
}

def get_coordinates(city, country):
    """Get lat/lon for a city, or country-level if city not found"""
    if country in CITY_COORDS and city in CITY_COORDS[country]:
        return CITY_COORDS[country][city]
    elif country in COUNTRY_COORDS:
        return COUNTRY_COORDS[country]
    else:
        return {'lat': 0, 'lon': 0}

# Process each study
processed_data = []

for idx, row in df.iterrows():
    # Extract year from Start Date
    year = extract_year(row['Start Date'])
    if year is None:
        continue  # Skip studies without start date

    # Only include studies from 2015 onwards (CRISPR clinical trials era)
    if year < 2015:
        continue

    # Parse locations
    locations = parse_location(row['Locations'])

    if not locations:
        continue  # Skip if no location data

    # Take the first location (primary site)
    primary_loc = locations[0]
    coords = get_coordinates(primary_loc['city'], primary_loc['country'])

    # Create study record
    study = {
        'nctId': row['NCT Number'],
        'title': row['Study Title'][:100] + '...' if len(str(row['Study Title'])) > 100 else row['Study Title'],
        'year': year,
        'city': primary_loc['city'],
        'country': primary_loc['country'],
        'lat': coords['lat'],
        'lon': coords['lon'],
        'status': row['Study Status'],
        'enrollment': int(row['Enrollment']) if pd.notna(row['Enrollment']) else 0,
        'phase': row['Phases'] if pd.notna(row['Phases']) else 'N/A',
    }

    processed_data.append(study)

# Sort by year
processed_data.sort(key=lambda x: x['year'])

print(f"\nProcessed {len(processed_data)} studies with valid year and location data")
print(f"Year range: {min(s['year'] for s in processed_data)} - {max(s['year'] for s in processed_data)}")

# Save to JSON
with open(output_file, 'w') as f:
    json.dump(processed_data, f, indent=2)

print(f"\nSaved to: {output_file}")

# Print summary statistics
years = [s['year'] for s in processed_data]
countries = [s['country'] for s in processed_data]

print(f"\nStudies by year:")
for year in sorted(set(years)):
    count = years.count(year)
    print(f"  {year}: {count} studies")

print(f"\nStudies by country:")
from collections import Counter
country_counts = Counter(countries)
for country, count in country_counts.most_common(10):
    print(f"  {country}: {count} studies")
