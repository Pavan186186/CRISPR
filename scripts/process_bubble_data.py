import csv
import os

def process_bubble_data():
    input_path = '../data/raw/bubble_chart_data.csv'
    output_path = '../data/processed/bubble_chart_data.csv'
    
    # Resolve absolute paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_abs_path = os.path.join(script_dir, input_path)
    output_abs_path = os.path.join(script_dir, output_path)
    
    print(f"Reading from: {input_abs_path}")
    
    if not os.path.exists(input_abs_path):
        print(f"Error: Input file not found at {input_abs_path}")
        return

    row_count = 0
    valid_count = 0
    
    try:
        with open(input_abs_path, 'r', encoding='utf-8', errors='replace') as infile, \
             open(output_abs_path, 'w', newline='', encoding='utf-8') as outfile:
            
            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames
            
            # Ensure required columns exist
            required_columns = ['YEAR', 'ORGANISM_OFFICIAL', 'FULL_SIZE', 'CELL_TYPE']
            for col in required_columns:
                if col not in fieldnames:
                    print(f"Error: Missing required column '{col}' in input CSV")
                    return

            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                row_count += 1
                
                # Basic validation similar to bubble_chart.js
                year = row.get('YEAR')
                organism = row.get('ORGANISM_OFFICIAL')
                
                try:
                    year_num = int(year) if year else 0
                    has_valid_year = (year and year != "NaN" and year != "" and 
                                    year != "null" and year_num > 1900 and year_num < 2100)
                except ValueError:
                    has_valid_year = False
                    
                has_valid_org = (organism and organism != "" and 
                               organism != "null" and organism.strip() != "")
                
                if has_valid_year and has_valid_org:
                    writer.writerow(row)
                    valid_count += 1
                    
        print(f"Successfully processed {valid_count} valid rows out of {row_count} total rows.")
        print(f"Output written to: {output_abs_path}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_bubble_data()
