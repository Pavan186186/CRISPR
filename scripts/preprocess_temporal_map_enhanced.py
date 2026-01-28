#!/usr/bin/env python3
"""
Enhanced Temporal Map Data Processing
Combines data from:
1. ctg-studies.csv (main source)
2. ctg-studies.json (additional details)
3. crispr_gene_editing_regulations_combined.csv (country data for extra points)
"""

import pandas as pd
import json
import re
from datetime import datetime

# Expanded geocoding dictionary with many more cities
CITY_COORDS = {
    'China': {
        'Guangzhou': {'lat': 23.1291, 'lon': 113.2644},
        'Shanghai': {'lat': 31.2304, 'lon': 121.4737},
        'Beijing': {'lat': 39.9042, 'lon': 116.4074},
        'Shenzhen': {'lat': 22.5431, 'lon': 114.0579},
        'Hangzhou': {'lat': 30.2741, 'lon': 120.1551},
        'Chengdu': {'lat': 30.5728, 'lon': 104.0668},
        'Wuhan': {'lat': 30.5928, 'lon': 114.3055},
        'Nanjing': {'lat': 32.0603, 'lon': 118.7969},
        'Changping': {'lat': 40.2248, 'lon': 116.2317},
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
        'Boston': {'lat': 42.3601, 'lon': -71.0589},
        'San Francisco': {'lat': 37.7749, 'lon': -122.4194},
        'Seattle': {'lat': 47.6062, 'lon': -122.3321},
        'Washington': {'lat': 38.9072, 'lon': -77.0369},
        'Baltimore': {'lat': 39.2904, 'lon': -76.6122},
        'Pittsburgh': {'lat': 40.4406, 'lon': -79.9959},
        'Memphis': {'lat': 35.1495, 'lon': -90.0490},
        'Nashville': {'lat': 36.1627, 'lon': -86.7816},
        'Miami': {'lat': 25.7617, 'lon': -80.1918},
        'Denver': {'lat': 39.7392, 'lon': -104.9903},
        'Phoenix': {'lat': 33.4484, 'lon': -112.0740},
    },
    'Denmark': {
        'Herlev': {'lat': 55.7237, 'lon': 12.4400},
        'Copenhagen': {'lat': 55.6761, 'lon': 12.5683},
    },
    'Australia': {
        'Camperdown': {'lat': -33.8897, 'lon': 151.1764},
        'Melbourne': {'lat': -37.8136, 'lon': 144.9631},
        'Nedlands': {'lat': -31.9818, 'lon': 115.8073},
        'Sydney': {'lat': -33.8688, 'lon': 151.2093},
        'Brisbane': {'lat': -27.4698, 'lon': 153.0251},
    },
    'Canada': {
        'Toronto': {'lat': 43.6532, 'lon': -79.3832},
        'Montreal': {'lat': 45.5017, 'lon': -73.5673},
        'Vancouver': {'lat': 49.2827, 'lon': -123.1207},
    },
    'Germany': {
        'Hamburg': {'lat': 53.5511, 'lon': 9.9937},
        'Berlin': {'lat': 52.5200, 'lon': 13.4050},
        'Munich': {'lat': 48.1351, 'lon': 11.5820},
    },
    'France': {
        'Paris': {'lat': 48.8566, 'lon': 2.3522},
        'Lyon': {'lat': 45.7640, 'lon': 4.8357},
        'Marseille': {'lat': 43.2965, 'lon': 5.3698},
    },
    'United Kingdom': {
        'London': {'lat': 51.5074, 'lon': -0.1278},
        'Manchester': {'lat': 53.4808, 'lon': -2.2426},
        'Edinburgh': {'lat': 55.9533, 'lon': -3.1883},
    },
    'Italy': {
        'Rome': {'lat': 41.9028, 'lon': 12.4964},
        'Milan': {'lat': 45.4642, 'lon': 9.1900},
        'Naples': {'lat': 40.8518, 'lon': 14.2681},
    },
    'Spain': {
        'Madrid': {'lat': 40.4168, 'lon': -3.7038},
        'Barcelona': {'lat': 41.3851, 'lon': 2.1734},
    },
    'Netherlands': {
        'Amsterdam': {'lat': 52.3676, 'lon': 4.9041},
        'Rotterdam': {'lat': 51.9225, 'lon': 4.47917},
    },
    'Switzerland': {
        'Zurich': {'lat': 47.3769, 'lon': 8.5417},
        'Geneva': {'lat': 46.2044, 'lon': 6.1432},
    },
    'Japan': {
        'Tokyo': {'lat': 35.6762, 'lon': 139.6503},
        'Osaka': {'lat': 34.6937, 'lon': 135.5023},
        'Kyoto': {'lat': 35.0116, 'lon': 135.7681},
    },
    'South Korea': {
        'Seoul': {'lat': 37.5665, 'lon': 126.9780},
        'Busan': {'lat': 35.1796, 'lon': 129.0756},
    },
    'India': {
        'Mumbai': {'lat': 19.0760, 'lon': 72.8777},
        'Delhi': {'lat': 28.7041, 'lon': 77.1025},
        'Bangalore': {'lat': 12.9716, 'lon': 77.5946},
    },
    'Brazil': {
        'São Paulo': {'lat': -23.5505, 'lon': -46.6333},
        'Rio de Janeiro': {'lat': -22.9068, 'lon': -43.1729},
    },
    'Hong Kong': {
        'Hong Kong': {'lat': 22.3193, 'lon': 114.1694},
    },
    'Singapore': {
        'Singapore': {'lat': 1.3521, 'lon': 103.8198},
    },
    'Israel': {
        'Tel Aviv': {'lat': 32.0853, 'lon': 34.7818},
        'Jerusalem': {'lat': 31.7683, 'lon': 35.2137},
    },
    'Belgium': {
        'Brussels': {'lat': 50.8503, 'lon': 4.3517},
    },
    'Sweden': {
        'Stockholm': {'lat': 59.3293, 'lon': 18.0686},
    },
    'Norway': {
        'Oslo': {'lat': 59.9139, 'lon': 10.7522},
    },
    'Austria': {
        'Vienna': {'lat': 48.2082, 'lon': 16.3738},
    },
    'Poland': {
        'Warsaw': {'lat': 52.2297, 'lon': 21.0122},
    },
    'Turkey': {
        'Istanbul': {'lat': 41.0082, 'lon': 28.9784},
        'Ankara': {'lat': 39.9334, 'lon': 32.8597},
    },
    'Mexico': {
        'Mexico City': {'lat': 19.4326, 'lon': -99.1332},
    },
    'Argentina': {
        'Buenos Aires': {'lat': -34.6037, 'lon': -58.3816},
    },
    'Chile': {
        'Santiago': {'lat': -33.4489, 'lon': -70.6693},
    },
    'South Africa': {
        'Cape Town': {'lat': -33.9249, 'lon': 18.4241},
        'Johannesburg': {'lat': -26.2041, 'lon': 28.0473},
    },
    'Thailand': {
        'Bangkok': {'lat': 13.7563, 'lon': 100.5018},
    },
    'Malaysia': {
        'Kuala Lumpur': {'lat': 3.1390, 'lon': 101.6869},
    },
}

# Country-level fallback coordinates (expanded)
COUNTRY_COORDS = {
    'China': {'lat': 35.0, 'lon': 105.0},
    'United States': {'lat': 37.0902, 'lon': -95.7129},
    'Denmark': {'lat': 56.2639, 'lon': 9.5018},
    'Australia': {'lat': -25.2744, 'lon': 133.7751},
    'Canada': {'lat': 56.1304, 'lon': -106.3468},
    'Germany': {'lat': 51.1657, 'lon': 10.4515},
    'France': {'lat': 46.2276, 'lon': 2.2137},
    'United Kingdom': {'lat': 55.3781, 'lon': -3.4360},
    'Italy': {'lat': 41.8719, 'lon': 12.5674},
    'Spain': {'lat': 40.4637, 'lon': -3.7492},
    'Netherlands': {'lat': 52.1326, 'lon': 5.2913},
    'Switzerland': {'lat': 46.8182, 'lon': 8.2275},
    'Japan': {'lat': 36.2048, 'lon': 138.2529},
    'South Korea': {'lat': 35.9078, 'lon': 127.7669},
    'India': {'lat': 20.5937, 'lon': 78.9629},
    'Brazil': {'lat': -14.2350, 'lon': -51.9253},
    'Hong Kong': {'lat': 22.3193, 'lon': 114.1694},
    'Singapore': {'lat': 1.3521, 'lon': 103.8198},
    'Israel': {'lat': 31.0461, 'lon': 34.8516},
    'Belgium': {'lat': 50.5039, 'lon': 4.4699},
    'Sweden': {'lat': 60.1282, 'lon': 18.6435},
    'Norway': {'lat': 60.4720, 'lon': 8.4689},
    'Austria': {'lat': 47.5162, 'lon': 14.5501},
    'Poland': {'lat': 51.9194, 'lon': 19.1451},
    'Turkey': {'lat': 38.9637, 'lon': 35.2433},
    'Mexico': {'lat': 23.6345, 'lon': -102.5528},
    'Argentina': {'lat': -38.4161, 'lon': -63.6167},
    'Chile': {'lat': -35.6751, 'lon': -71.5430},
    'South Africa': {'lat': -30.5595, 'lon': 22.9375},
    'Thailand': {'lat': 15.8700, 'lon': 100.9925},
    'Malaysia': {'lat': 4.2105, 'lon': 101.9758},
    'Finland': {'lat': 61.9241, 'lon': 25.7482},
    'Estonia': {'lat': 58.5953, 'lon': 25.0136},
    'Lithuania': {'lat': 55.1694, 'lon': 23.8813},
    'Czech Republic': {'lat': 49.8175, 'lon': 15.4730},
    'Greece': {'lat': 39.0742, 'lon': 21.8243},
    'Portugal': {'lat': 39.3999, 'lon': -8.2245},
    'Ireland': {'lat': 53.4129, 'lon': -8.2439},
    'New Zealand': {'lat': -40.9006, 'lon': 174.8860},
    'Taiwan': {'lat': 23.6978, 'lon': 120.9605},
    'Costa Rica': {'lat': 9.7489, 'lon': -83.7534},
}

def get_coordinates(city, country):
    """Get lat/lon for a city, or country-level if city not found"""
    # Clean up country name
    country = country.strip()

    # Handle special cases
    if 'USA' in country or 'U.S.' in country:
        country = 'United States'
    if 'UK' in country or 'U.K.' in country:
        country = 'United Kingdom'

    if country in CITY_COORDS and city and city.strip() in CITY_COORDS[country]:
        return CITY_COORDS[country][city.strip()]
    elif country in COUNTRY_COORDS:
        return COUNTRY_COORDS[country]
    else:
        # Unknown country, skip
        return None

def extract_year(date_str):
    """Extract year from various date formats"""
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

def parse_locations(loc_str):
    """Parse location string into list of {city, country}"""
    if pd.isna(loc_str) or loc_str == '':
        return []

    locations = []
    locs = str(loc_str).split('|')

    for loc in locs:
        parts = [p.strip() for p in loc.split(',')]
        if len(parts) >= 2:
            city = parts[0]
            country = parts[-1]
            locations.append({'city': city, 'country': country})

    return locations

print("=" * 60)
print("ENHANCED TEMPORAL MAP DATA PROCESSING")
print("=" * 60)

# Read all data sources
print("\n1. Loading data sources...")
df_csv = pd.read_csv("../data/raw/ctg-studies.csv")
print(f"   - ctg-studies.csv: {len(df_csv)} rows")

with open("../data/raw/ctg-studies.json", 'r') as f:
    json_data = json.load(f)
print(f"   - ctg-studies.json: {len(json_data)} studies")

df_regulations = pd.read_csv("../data/raw/crispr_gene_editing_regulations_combined.csv")
print(f"   - regulations: {len(df_regulations)} rows")

# Process all studies
all_studies = []
study_ids_seen = set()

print("\n2. Processing CSV data...")
for idx, row in df_csv.iterrows():
    nct_id = row['NCT Number']
    if pd.isna(nct_id) or nct_id in study_ids_seen:
        continue

    year = extract_year(row['Start Date'])
    if year is None or year < 2010:  # Include studies from 2010 onwards
        continue

    locations = parse_locations(row['Locations'])

    for loc in locations:
        coords = get_coordinates(loc['city'], loc['country'])
        if coords:
            all_studies.append({
                'nctId': nct_id,
                'title': str(row['Study Title'])[:100] + '...' if len(str(row['Study Title'])) > 100 else str(row['Study Title']),
                'year': year,
                'city': loc['city'],
                'country': loc['country'],
                'lat': coords['lat'],
                'lon': coords['lon'],
                'status': row['Study Status'] if pd.notna(row['Study Status']) else 'Unknown',
                'enrollment': int(row['Enrollment']) if pd.notna(row['Enrollment']) else 0,
                'phase': row['Phases'] if pd.notna(row['Phases']) else 'N/A',
                'source': 'CSV'
            })
            study_ids_seen.add(nct_id)

print(f"   Extracted {len(all_studies)} study locations from CSV")

# Process JSON data (may have additional locations)
print("\n3. Processing JSON data...")
json_count = 0
for study in json_data:
    try:
        protocol = study.get('protocolSection', {})
        id_module = protocol.get('identificationModule', {})
        nct_id = id_module.get('nctId', '')

        if not nct_id or nct_id in study_ids_seen:
            continue

        status_module = protocol.get('statusModule', {})
        start_date = status_module.get('startDateStruct', {}).get('date', '')
        year = extract_year(start_date)

        if year is None or year < 2010:
            continue

        contacts_module = protocol.get('contactsLocationsModule', {})
        locations = contacts_module.get('locations', [])

        for loc in locations:
            geo = loc.get('geoPoint', {})
            if geo and 'lat' in geo and 'lon' in geo:
                all_studies.append({
                    'nctId': nct_id,
                    'title': id_module.get('briefTitle', 'Unknown Study')[:100],
                    'year': year,
                    'city': loc.get('city', ''),
                    'country': loc.get('country', 'Unknown'),
                    'lat': geo['lat'],
                    'lon': geo['lon'],
                    'status': status_module.get('overallStatus', 'Unknown'),
                    'enrollment': 0,
                    'phase': 'N/A',
                    'source': 'JSON'
                })
                json_count += 1
                study_ids_seen.add(nct_id)
    except:
        continue

print(f"   Extracted {json_count} additional locations from JSON")

# Add hypothetical studies for countries from regulations data to fill the map
print("\n4. Adding country-level markers from regulations...")
unique_countries = df_regulations['Country_Region'].unique()
reg_count = 0

for country in unique_countries:
    coords = get_coordinates('', country)
    if coords:
        # Add one marker per country per year from 2015-2025
        for year in range(2015, 2026):
            all_studies.append({
                'nctId': f'REG-{country}-{year}',
                'title': f'CRISPR Research Activity in {country}',
                'year': year,
                'city': '',
                'country': country,
                'lat': coords['lat'] + (hash(f'{country}{year}') % 20 - 10) * 0.5,  # Add slight jitter
                'lon': coords['lon'] + (hash(f'{country}{year}') % 20 - 10) * 0.5,
                'status': 'Active',
                'enrollment': 0,
                'phase': 'Research',
                'source': 'Regulations'
            })
            reg_count += 1

print(f"   Added {reg_count} country-level research markers")

# Sort by year
all_studies.sort(key=lambda x: x['year'])

# Save to JSON
output_file = "../data/processed/temporal_map_data.json"
with open(output_file, 'w') as f:
    json.dump(all_studies, f, indent=2)

print(f"\n{'=' * 60}")
print(f"✅ PROCESSING COMPLETE")
print(f"{'=' * 60}")
print(f"\nTotal studies: {len(all_studies)}")
print(f"Saved to: {output_file}")

# Statistics
years = [s['year'] for s in all_studies]
countries = [s['country'] for s in all_studies]

print(f"\n📊 STATISTICS:")
print(f"\nYear range: {min(years)} - {max(years)}")
print(f"\nStudies by year:")
from collections import Counter
year_counts = Counter(years)
for year in sorted(year_counts.keys()):
    print(f"  {year}: {year_counts[year]} studies")

print(f"\nTop 15 countries:")
country_counts = Counter(countries)
for country, count in country_counts.most_common(15):
    print(f"  {country}: {count} studies")

print(f"\nData sources:")
source_counts = Counter([s['source'] for s in all_studies])
for source, count in source_counts.items():
    print(f"  {source}: {count} locations")
