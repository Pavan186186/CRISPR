import csv
import random
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'anti_boxplot_data.csv')

def generate_data():
    print("Generating synthetic boxplot data...")
    
    # Define Cas9 variants and their "risk profiles" (mean off-target score, std dev)
    variants = [
        {"name": "SpCas9", "mean": 45, "std": 15},
        {"name": "SaCas9", "mean": 35, "std": 10},
        {"name": "Cas12a", "mean": 25, "std": 8},
        {"name": "eSpCas9", "mean": 20, "std": 5},
        {"name": "HypaCas9", "mean": 15, "std": 4},
        {"name": "xCas9", "mean": 30, "std": 12},
        {"name": "SpG-Cas9", "mean": 40, "std": 14},
        {"name": "Nme2Cas9", "mean": 18, "std": 6}
    ]
    
    data = []
    
    # Generate ~50-100 data points for each variant
    for variant in variants:
        num_points = random.randint(50, 100)
        for _ in range(num_points):
            # Generate score, clamp between 0 and 100
            score = random.gauss(variant["mean"], variant["std"])
            score = max(0, min(100, score))
            
            # Add some random outliers
            if random.random() < 0.05:
                score += random.uniform(20, 40)
            
            data.append({
                "Cas9_type": variant["name"],
                "Score": round(score, 2)
            })
            
    # Write to CSV
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["Cas9_type", "Score"])
        writer.writeheader()
        writer.writerows(data)
        
    print(f"Successfully wrote {len(data)} rows to {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_data()
