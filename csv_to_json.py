import json
import pandas as pd

def main():
    csv_path = "cutoff.csv"
    json_path = "cutoff.json"
    
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    
    colleges = []
    
    # Ranks columns start from index 3 onwards
    rank_cols = df.columns[3:]
    
    for idx, row in df.iterrows():
        code = str(row['College Code']).strip()
        name = str(row['College Name']).strip()
        cat = str(row['Seat Category']).strip()
        
        # Parse city dynamically from the college name (after the last comma)
        if "," in name:
            city = name.split(",")[-1].strip()
        else:
            # Fallback check
            city = "Other"
            for possible_city in ["Bengaluru", "Bangalore", "Mysuru", "Mysore", "Mangaluru", "Mangalore", "Belagavi", "Belgaum", "Davanagere", "Hubballi", "Hubli", "Dharwad", "Chikkamagaluru", "Tumakuru", "Tumkur", "Udupi", "Shimoga", "Shivamogga"]:
                if possible_city.lower() in name.lower():
                    city = possible_city
                    break
        
        # Standardize city names
        if city == "Bangalore":
            city = "Bengaluru"
        elif city == "Mysore":
            city = "Mysuru"
        elif city == "Mangalore":
            city = "Mangaluru"
        elif city == "Belgaum":
            city = "Belagavi"
        elif city == "Hubli":
            city = "Hubballi"
        elif city == "Tumkur":
            city = "Tumakuru"
            
        ranks = {}
        for col in rank_cols:
            val = row[col]
            if pd.notna(val) and str(val).strip() != "" and str(val).strip() != "nan":
                try:
                    ranks[col] = int(float(val))
                except ValueError:
                    pass
                    
        colleges.append({
            "code": code,
            "name": name,
            "city": city,
            "category": cat,
            "ranks": ranks
        })
        
    print(f"Successfully processed {len(colleges)} colleges.")
    print(f"Saving to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(colleges, f, indent=2, ensure_ascii=False)
    print("Done!")

if __name__ == "__main__":
    main()
