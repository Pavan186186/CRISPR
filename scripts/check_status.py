import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'ctg-studies.json')

with open(INPUT_PATH, 'r') as f:
    studies = json.load(f)

statuses = set()
for study in studies:
    status = study.get('protocolSection', {}).get('statusModule', {}).get('overallStatus')
    if status:
        statuses.add(status)

print("Unique Statuses Found:", statuses)
