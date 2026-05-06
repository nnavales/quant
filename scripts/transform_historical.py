#!/usr/bin/env python3
import argparse
import os
import re

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


def parse_month(val):
    """Convert 'ene-2025' or datetime to '2025-01'."""
    if pd.isna(val):
        return None

    # Handle datetime objects from Excel
    if isinstance(val, (pd.Timestamp,)):
        return val.strftime("%Y-%m")
    if hasattr(val, "year") and hasattr(val, "month"):
        return f"{val.year:04d}-{val.month:02d}"

    s = str(val).strip().lower()

    month_map = {
        "ene": "01",
        "feb": "02",
        "mar": "03",
        "abr": "04",
        "may": "05",
        "jun": "06",
        "jul": "07",
        "ago": "08",
        "sep": "09",
        "sept": "09",
        "oct": "10",
        "nov": "11",
        "dic": "12",
    }

    # Pattern: ene-2025 or ene-25
    match = re.match(r"([a-z]+)[\s\-]+(\d{2,4})", s)
    if match:
        month_abbr = match.group(1)
        year = match.group(2)
        if month_abbr in month_map:
            month = month_map[month_abbr]
            if len(year) == 2:
                year_int = int(year)
                year = "19" + year if year_int >= 50 else "20" + year
            return f"{year}-{month}"

    return None


def main():
    parser = argparse.ArgumentParser(
        description="Transform historical archive from BD Financial Core sheet to CSV"
    )
    parser.add_argument("input", help="Input Excel file")
    parser.add_argument("output_dir", help="Output directory")
    parser.add_argument(
        "--sheet", default="BD Financial Core", help="Sheet name"
    )
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    output_dir = os.path.abspath(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    # Read raw without headers to handle complex layout
    df_raw = pd.read_excel(input_path, sheet_name=args.sheet, header=None)

    # Find the header row containing "Fecha" and "TC" on the right side
    header_row_idx = None
    fecha_col_idx = None
    for idx, row in df_raw.iterrows():
        for col_idx, val in enumerate(row):
            if pd.notna(val) and str(val).strip().lower() == "fecha":
                # Check if next column has "TC"
                if col_idx + 1 < len(row) and pd.notna(row.iloc[col_idx + 1]) and str(row.iloc[col_idx + 1]).strip().lower() == "tc":
                    header_row_idx = idx
                    fecha_col_idx = col_idx
                    break
        if header_row_idx is not None:
            break

    if header_row_idx is None:
        print("ERROR: Could not find header row with 'Fecha' and 'TC'")
        return

    print(f"Found header at row {header_row_idx}, Fecha at column {fecha_col_idx}")

    header_row = df_raw.iloc[header_row_idx]

    # Build column map from header names relative to fecha_col_idx
    col_map = {"month": fecha_col_idx, "exchange_rate": fecha_col_idx + 1}
    for offset, val in enumerate(header_row.iloc[fecha_col_idx:]):
        if pd.isna(val):
            continue
        name = str(val).strip().lower()
        abs_idx = fecha_col_idx + offset
        if "ahorro" in name and "usd" in name and "savings" not in col_map:
            col_map["savings"] = abs_idx
        elif "ingresos" in name and "fijo" in name and "usd" in name and "income_fixed" not in col_map:
            col_map["income_fixed"] = abs_idx
        elif "ingresos" in name and "variable" in name and "usd" in name and "income_variable" not in col_map:
            col_map["income_variable"] = abs_idx
        elif "ingresos" in name and "usd" in name and "income" not in col_map:
            col_map["income"] = abs_idx
        elif "egreso" in name and "fijo" in name and "usd" in name and "expense_fixed" not in col_map:
            col_map["expense_fixed"] = abs_idx
        elif "egreso" in name and "variable" in name and "usd" in name and "expense_variable" not in col_map:
            col_map["expense_variable"] = abs_idx
        elif "egreso" in name and "usd" in name and "expense" not in col_map:
            col_map["expense"] = abs_idx

    print(f"Column map: {col_map}")

    from datetime import datetime

    current_year = datetime.now().year
    rows_out = []
    for idx in range(header_row_idx + 1, len(df_raw)):
        row = df_raw.iloc[idx]
        month_val = row.iloc[col_map["month"]]
        month = parse_month(month_val)
        if not month:
            continue

        # Skip current year and future years
        row_year = int(month.split("-")[0])
        if row_year >= current_year:
            continue

        income = parse_amount(row.iloc[col_map.get("income", -1)])
        income_fixed = parse_amount(row.iloc[col_map.get("income_fixed", -1)])
        income_variable = parse_amount(row.iloc[col_map.get("income_variable", -1)])
        expense = parse_amount(row.iloc[col_map.get("expense", -1)])
        expense_fixed = parse_amount(row.iloc[col_map.get("expense_fixed", -1)])
        expense_variable = parse_amount(row.iloc[col_map.get("expense_variable", -1)])
        exchange_rate = parse_amount(row.iloc[col_map.get("exchange_rate", -1)])
        savings = parse_amount(row.iloc[col_map.get("savings", -1)])

        # Skip rows where all financial values are zero
        if all(
            v == 0
            for v in [
                income,
                income_fixed,
                income_variable,
                expense,
                expense_fixed,
                expense_variable,
                savings,
            ]
        ):
            continue

        rows_out.append(
            {
                "month": month,
                "income": income,
                "income_variable": income_variable,
                "income_fixed": income_fixed,
                "expense": expense,
                "expense_fixed": expense_fixed,
                "expense_variable": expense_variable,
                "exchange_rate": exchange_rate if exchange_rate > 0 else "",
                "savings": savings,
                "source": "historical",
            }
        )

    cols = [
        "month",
        "income",
        "income_variable",
        "income_fixed",
        "expense",
        "expense_fixed",
        "expense_variable",
        "exchange_rate",
        "savings",
        "source",
    ]

    df_out = pd.DataFrame(rows_out, columns=cols)

    # Format: always 2 decimals to avoid Argentine thousands-dot ambiguity
    for col in [
        "income",
        "income_variable",
        "income_fixed",
        "expense",
        "expense_fixed",
        "expense_variable",
        "savings",
    ]:
        df_out[col] = df_out[col].apply(lambda x: f"{x:.2f}")

    df_out["exchange_rate"] = df_out["exchange_rate"].apply(
        lambda x: f"{x:.2f}" if x != "" else ""
    )

    output_path = os.path.join(output_dir, "historical.csv")
    df_out.to_csv(output_path, index=False)
    print(f"Historical: {output_path} ({len(df_out)} registros)")


if __name__ == "__main__":
    main()
