#!/usr/bin/env python3
import argparse
import os
import re
from datetime import date

import pandas as pd


def parse_amount(val):
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return 0.0
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        s = s.replace(",", ".")
    elif s.count(".") > 1:
        s = s.replace(".", "")
    try:
        return float(s)
    except:
        return 0.0


def parse_date(val):
    if pd.isna(val):
        return None
    if isinstance(val, pd.Timestamp):
        return val
    s = str(val).strip()
    try:
        return pd.to_datetime(s, dayfirst=True)
    except:
        try:
            return pd.to_datetime(s, dayfirst=False)
        except:
            return None


def clean_account(account, channel):
    if pd.isna(account):
        return ""
    s = str(account).strip()
    match = re.search(r"(Credito|Débito|Debito|Signature)\s*(\d+)", s, re.IGNORECASE)
    if match:
        return f"{match.group(1)} {match.group(2)}"
    return s


def main():
    parser = argparse.ArgumentParser(description="Transform transactions Excel to CSV")
    parser.add_argument("input", help="Input Excel file")
    parser.add_argument("output_dir", help="Output directory")
    parser.add_argument("--sheet", default="Movimientos", help="Sheet name")
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    output_dir = os.path.abspath(args.output_dir)

    os.makedirs(output_dir, exist_ok=True)

    df = pd.read_excel(input_path, sheet_name=args.sheet, header=2)
    df.columns = df.columns.str.strip()

    all_rows = []
    for _, r in df.iterrows():
        concept = r.get("Concepto", "")
        fecha = r.get("Fecha", None)
        transaccion = r.get("Transacción", "")
        tipo = r.get("Tipo", "")
        categoria = r.get("Categoría", "")
        subcategoria = r.get("Sub Categoría", "")
        canal = r.get("Canal", "")
        metodo = r.get("Método P/C", "")
        usd = r.get("USD", 0)
        ars = r.get("ARS", 0)

        trans_type = (
            "expense" if str(transaccion).strip().lower() == "egreso" else "income"
        )
        frequency = "fixed" if str(tipo).strip().lower() == "fijo" else "variable"

        fecha_dt = parse_date(fecha)
        amount_usd = parse_amount(usd)
        amount_ars = parse_amount(ars)

        if amount_usd == 0:
            continue
        if not concept or pd.isna(concept):
            continue
        if fecha_dt is None or pd.isna(fecha_dt):
            continue

        channel = str(canal).strip() if pd.notna(canal) else ""
        account = clean_account(
            str(metodo).strip() if pd.notna(metodo) else "", channel
        )

        all_rows.append(
            {
                "description": str(concept).strip(),
                "date": fecha_dt,
                "type": trans_type,
                "frequency": frequency,
                "amount_usd": amount_usd,
                "amount_ars": amount_ars,
                "category": str(categoria).strip() if pd.notna(categoria) else "",
                "subcategory": str(subcategoria).strip()
                if pd.notna(subcategoria)
                else "",
                "channel": channel,
                "account": account,
            }
        )

    df_all = pd.DataFrame(all_rows)
    df_sorted = df_all.sort_values("date")

    cols = [
        "date",
        "description",
        "installment_number",
        "total_installments",
        "group_id",
        "type",
        "frequency",
        "is_done",
        "exchange_rate",
        "amount_ars",
        "amount_usd",
        "currency",
        "category",
        "subcategory",
        "channel",
        "account",
    ]

    today = date.today()
    rows_out = []
    for _, row in df_sorted.iterrows():
        exchange = (
            round(row["amount_ars"] / row["amount_usd"], 2)
            if row["amount_usd"] > 0
            else 1.0
        )
        fecha_dt = pd.to_datetime(row["date"]).date()
        is_done = fecha_dt <= today
        rows_out.append(
            {
                "date": row["date"],
                "description": row["description"],
                "installment_number": "",
                "total_installments": "",
                "group_id": "",
                "type": row["type"],
                "frequency": row["frequency"],
                "is_done": "true" if is_done else "false",
                "exchange_rate": exchange,
                "amount_ars": row["amount_ars"],
                "amount_usd": row["amount_usd"],
                "currency": "ARS",
                "category": row["category"],
                "subcategory": row["subcategory"],
                "channel": row["channel"],
                "account": row["account"],
            }
        )

    df_out = pd.DataFrame(rows_out)
    if len(df_out) > 0:
        df_out = df_out[cols]
        df_out["date"] = pd.to_datetime(df_out["date"]).dt.strftime("%Y-%m-%d")
        df_out["exchange_rate"] = df_out["exchange_rate"].apply(
            lambda x: str(x) if pd.notna(x) else ""
        )
        df_out.to_csv(os.path.join(output_dir, "transactions.csv"), index=False)
        print(
            f"Transacciones: {os.path.join(output_dir, 'transactions.csv')} ({len(df_out)} registros)"
        )
    else:
        pd.DataFrame(columns=cols).to_csv(
            os.path.join(output_dir, "transactions.csv"), index=False
        )
        print(
            f"Transacciones: {os.path.join(output_dir, 'transactions.csv')} (0 registros)"
        )


if __name__ == "__main__":
    main()
