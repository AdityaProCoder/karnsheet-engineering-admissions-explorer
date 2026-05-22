import os
import re
import sys
import camelot
import pdfplumber
import pandas as pd

# Paths
PDF_PATH = "Engineering_Cut_Off_Ranks_after_Round_3_Allotment__Notified_on_22_08_2025.pdf"
CSV_PATH = "cutoff.csv"

def standardize_course_header(header):
    """Standardizes a course column header to 'CODE - Description' format."""
    header = str(header).replace('\n', ' ').strip()
    header = ' '.join(header.split()) # Compress multiple spaces
    if '-' in header:
        parts = header.split('-', 1)
        code = parts[0].strip()
        desc = parts[1].strip()
        # Compress any multiple spaces in code and desc
        code = ' '.join(code.split())
        desc = ' '.join(desc.split())
        return f"{code} - {desc}"
    return header

def process_df(df, page_num):
    """Processes a raw pandas DataFrame extracted from a PDF page."""
    # Find the header row in the DataFrame (first row containing both 'college' and 'code' in the first cell)
    header_row_idx = None
    for idx, row in df.iterrows():
        cell_0 = str(row.iloc[0]).replace('\n', ' ').strip().lower()
        if "college" in cell_0 and "code" in cell_0:
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        # Fallback: assume row 0 is the header if we can't find it dynamically
        header_row_idx = 0

    header_row = df.iloc[header_row_idx]
    
    # Extract and standardize course column headers for columns 3 onwards
    page_course_headers = {}
    for col_idx in range(3, len(df.columns)):
        raw_h = header_row.iloc[col_idx]
        if pd.isna(raw_h) or str(raw_h).strip() == "":
            cleaned_h = f"UNKNOWN_COL_{col_idx}"
        else:
            cleaned_h = standardize_course_header(raw_h)
        page_course_headers[col_idx] = cleaned_h

    # Extract and clean data rows (all rows after the header row)
    cleaned_page_rows = []
    for idx in range(header_row_idx + 1, len(df)):
        row = df.iloc[idx]
        
        # Check if this row is a repeated header row by accident
        cell_0_lower = str(row.iloc[0]).replace('\n', ' ').strip().lower()
        if "college" in cell_0_lower and "code" in cell_0_lower:
            continue
            
        c_code = str(row.iloc[0]).replace('\n', ' ').strip()
        c_name = str(row.iloc[1]).replace('\n', ' ').strip()
        c_cat = str(row.iloc[2]).replace('\n', ' ').strip()
        
        # Filter out rows that are entirely empty or just noise
        row_values_str = "".join([str(x).strip() for x in row.tolist()])
        if not row_values_str:
            continue

        # Check for multiline continuation:
        # If code and seat category are empty, but the name is not empty
        if c_code == '' and c_cat == '' and c_name != '':
            if cleaned_page_rows:
                # Merge college name with the previous row
                cleaned_page_rows[-1]['college_name'] += " " + c_name
                # Also merge any rank values if they happened to be split across lines
                for col_idx in range(3, len(row)):
                    val = str(row.iloc[col_idx]).replace('\n', ' ').strip()
                    if val:
                        cleaned_page_rows[-1]['courses'][col_idx] = val
        else:
            # Regular row
            courses_data = {}
            for col_idx in range(3, len(row)):
                val = str(row.iloc[col_idx]).replace('\n', ' ').strip()
                courses_data[col_idx] = val
                
            cleaned_page_rows.append({
                'college_code': c_code,
                'college_name': c_name,
                'seat_category': c_cat,
                'courses': courses_data
            })
            
    return cleaned_page_rows, page_course_headers

def main():
    print("Starting Engineering Cutoff PDF Table Extraction...")
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF file not found at {PDF_PATH}")
        sys.exit(1)

    consolidated_data = {}
    all_course_headers = set()

    for page_num in range(1, 81):
        print(f"Processing Page {page_num}/80...", end="", flush=True)
        success = False
        df = None

        # 1. Attempt Camelot lattice extraction
        try:
            tables = camelot.read_pdf(PDF_PATH, pages=str(page_num), flavor='lattice')
            if tables and len(tables) > 0:
                df = tables[0].df
                success = True
                print(" [Camelot Success]", end="", flush=True)
        except Exception as e:
            print(f" [Camelot Failed: {e}]", end="", flush=True)

        # 2. Fallback to pdfplumber
        if not success or df is None or df.empty:
            try:
                print(" [Attempting pdfplumber fallback]...", end="", flush=True)
                with pdfplumber.open(PDF_PATH) as pdf:
                    page = pdf.pages[page_num - 1]
                    tables = page.extract_tables()
                    if tables and len(tables) > 0:
                        df = pd.DataFrame(tables[0])
                        success = True
                        print(" [pdfplumber Success]", end="", flush=True)
                    else:
                        print(" [pdfplumber found no tables]", end="", flush=True)
            except Exception as e:
                print(f" [pdfplumber Failed: {e}]", end="", flush=True)

        if not success or df is None or df.empty:
            print(" -> FAILED to extract page!")
            continue

        # 3. Clean and process the DataFrame
        try:
            cleaned_rows, page_course_headers = process_df(df, page_num)
            
            # Record course headers in global set
            for h in page_course_headers.values():
                all_course_headers.add(h)

            # Consolidate data by College Code
            for row_data in cleaned_rows:
                code = row_data['college_code']
                if not code:
                    # Skip rows with no college code
                    continue

                if code not in consolidated_data:
                    consolidated_data[code] = {
                        'College Code': code,
                        'College Name': row_data['college_name'],
                        'Seat Category': row_data['seat_category']
                    }
                else:
                    # Keep the longest/cleanest name
                    if len(row_data['college_name']) > len(consolidated_data[code]['College Name']):
                        consolidated_data[code]['College Name'] = row_data['college_name']
                    # Keep the seat category if it was missing
                    if not consolidated_data[code]['Seat Category'] and row_data['seat_category']:
                        consolidated_data[code]['Seat Category'] = row_data['seat_category']

                # Fill course values
                for col_idx, rank in row_data['courses'].items():
                    course_header = page_course_headers[col_idx]
                    if rank:
                        # Clean rank string: remove any extra spaces
                        rank_clean = rank.strip()
                        # If we already have a rank for this course, warning could be log but usually keep first/last.
                        consolidated_data[code][course_header] = rank_clean

            print(f" -> Processed {len(cleaned_rows)} rows successfully.")
        except Exception as e:
            print(f" -> Error during cleaning page {page_num}: {e}")

    # 4. Convert consolidated dictionary to a final DataFrame
    print("\nConsolidating all pages into a unified DataFrame...")
    final_rows = list(consolidated_data.values())
    final_df = pd.DataFrame(final_rows)

    # Sort course columns alphabetically to keep the output beautiful and organized
    sorted_course_cols = sorted(list(all_course_headers))
    metadata_cols = ['College Code', 'College Name', 'Seat Category']
    
    # Ensure all metadata columns exist
    for col in metadata_cols:
        if col not in final_df.columns:
            final_df[col] = ""

    # Reorder columns
    ordered_cols = metadata_cols + sorted_course_cols
    # Reindex DataFrame to match these columns, filling missing courses with empty string
    final_df = final_df.reindex(columns=ordered_cols).fillna("")

    # Sort DataFrame by College Code (natural ordering, e.g. E001, E002, ...)
    final_df = final_df.sort_values(by='College Code').reset_index(drop=True)

    # 5. Run Post-processing Validation
    print("Running post-processing validations...")
    errors = []
    
    # Check College Code format: E\d{3}
    for idx, code in enumerate(final_df['College Code']):
        if not re.match(r'^E\d{3}$', str(code)):
            errors.append(f"Row {idx}: Invalid college code '{code}'")

    # Check Seat Category is GM
    for idx, cat in enumerate(final_df['Seat Category']):
        if str(cat) != 'GM':
            errors.append(f"Row {idx} ({final_df.iloc[idx]['College Code']}): Unexpected seat category '{cat}' (expected 'GM')")

    # Check that rank values are completely empty or digits only
    for col in sorted_course_cols:
        for idx, val in enumerate(final_df[col]):
            val_str = str(val).strip()
            if val_str and not val_str.isdigit():
                errors.append(f"Row {idx} ({final_df.iloc[idx]['College Code']}), Course '{col}': Non-numeric rank '{val_str}' detected!")

    if errors:
        print(f"\n[WARNING] Validation checks found {len(errors)} potential issues:")
        for err in errors[:20]: # Limit to first 20 errors to avoid flooding
            print(f"  - {err}")
        if len(errors) > 20:
            print(f"  - ... and {len(errors) - 20} more issues.")
    else:
        print("[SUCCESS] All post-processing validation checks passed! No cell shifts detected.")

    # 6. Save to CSV
    final_df.to_csv(CSV_PATH, index=False)
    print(f"\nCompleted successfully! Clean CSV saved to: {os.path.abspath(CSV_PATH)}")
    print(f"Total Colleges Consolidated: {len(final_df)}")
    print(f"Total Course Columns Extracted: {len(sorted_course_cols)}")

if __name__ == "__main__":
    main()
