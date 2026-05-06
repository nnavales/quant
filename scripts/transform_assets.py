#!/usr/bin/env python3
import argparse
import os

import pandas as pd


def parse_amount(val):
    """Parse Argentine-formatted numbers: 1.234.567,89 or 1.234 or 1234,56"""
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return 0.0

    # Remove currency symbols and spaces
    s = s.replace("$", "").replace("%", "").strip()

    last_comma = s.rfind(",")
    last_dot = s.rfind(".")

    if last_comma != -1:
        # Comma is decimal separator, dots are thousands
        s = s.replace(".", "").replace(",", ".")
    else:
        # No comma, all dots are thousands separators
        s = s.replace(".", "")

    try:
        return float(s)
    except ValueError:
        return 0.0


def main():
    parser = argparse.ArgumentParser(
        description="Transform Patrimonio sheet to assets CSV"
    )
    parser.add_argument("input", help="Input Excel file")
    parser.add_argument("output_dir", help="Output directory")
    parser.add_argument(
        "--sheet", default="Patrimonio", help="Sheet name"
    )
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    output_dir = os.path.abspath(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    df_raw = pd.read_excel(input_path, sheet_name=args.sheet, header=None)

    # Find header row with ARS and USD
    header_row_idx = None
    ars_col_idx = None
    usd_col_idx = None

    for idx, row in df_raw.iterrows():
        for col_idx, val in enumerate(row):
            if pd.notna(val) and str(val).strip().lower() == "ars":
                # Look for USD nearby (within 5 columns)
                for offset in range(1, 6):
                    if col_idx + offset < len(row):
                        next_val = row.iloc[col_idx + offset]
                        if pd.notna(next_val) and str(next_val).strip().lower() == "usd":
                            header_row_idx = idx
                            ars_col_idx = col_idx
                            usd_col_idx = col_idx + offset
                            break
                if header_row_idx is not None:
                    break
        if header_row_idx is not None:
            break

    if header_row_idx is None:
        print("ERROR: Could not find ARS/USD header row")
        return

    # Name column is typically just left of ARS column
    name_col_idx = ars_col_idx - 1

    print(f"Found header at row {header_row_idx}, name col {name_col_idx}, ARS col {ars_col_idx}, USD col {usd_col_idx}")

    # Find section markers (use first occurrence only, skip summary rows)
    liquid_start = None
    physical_start = None

    for idx in range(header_row_idx + 1, len(df_raw)):
        row = df_raw.iloc[idx]
        for col_idx, val in enumerate(row):
            if pd.notna(val):
                text = str(val).strip().lower()
                if text == "liquido":
                    liquid_start = idx
                elif ("fisico" in text or "bienes" in text) and not text.startswith("suma"):
                    if physical_start is None:
                        physical_start = idx
                    break

    print(f"Liquid section starts at row {liquid_start}, Physical at row {physical_start}")

    skip_names = {
        "liquido", "fisico", "bienes", "fisico/bienes",
        "composición del patrimonio", "patrimonio",
        "ars", "usd", "mes", "total usd", "total ars",
        "mod",
    }

    rows_out = []

    def read_section(start_idx, end_idx, asset_type):
        if start_idx is None:
            return
        for idx in range(start_idx + 1, end_idx):
            row = df_raw.iloc[idx]
            name_val = row.iloc[name_col_idx]
            if pd.isna(name_val):
                continue
            name = str(name_val).strip()
            name_lower = name.lower()
            if not name or name_lower in skip_names:
                continue
            if name_lower.startswith("suma") or name_lower.startswith("total") or "target" in name_lower:
                continue

            ars_amount = parse_amount(row.iloc[ars_col_idx])
            usd_amount = parse_amount(row.iloc[usd_col_idx])

            if ars_amount > 0:
                rows_out.append({
                    "name": name,
                    "amount": ars_amount,
                    "currency": "ARS",
                    "type": asset_type,
                })
            if usd_amount > 0:
                rows_out.append({
                    "name": name,
                    "amount": usd_amount,
                    "currency": "USD",
                    "type": asset_type,
                })

    if liquid_start is not None:
        end = physical_start if physical_start is not None else len(df_raw)
        read_section(liquid_start, end, "liquid")

    if physical_start is not None:
        read_section(physical_start, len(df_raw), "physical")

    cols = ["name", "amount", "currency", "type"]
    df_out = pd.DataFrame(rows_out, columns=cols)

    # Disambiguate duplicate names by appending currency
    name_counts = df_out["name"].value_counts()
    dupes = name_counts[name_counts > 1].index.tolist()
    df_out.loc[df_out["name"].isin(dupes), "name"] = (
        df_out["name"] + " (" + df_out["currency"] + ")"
    )

    # Format amounts with 2 decimals
    df_out["amount"] = df_out["amount"].apply(lambda x: f"{x:.2f}")

    output_path = os.path.join(output_dir, "assets.csv")
    df_out.to_csv(output_path, index=False)
    print(f"Assets: {output_path} ({len(df_out)} registros)")


if __name__ == "__main__":
    main()
