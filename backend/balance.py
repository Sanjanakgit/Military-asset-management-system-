import datetime

from db import get_cursor


def _day_before(date_str):
    d = datetime.date.fromisoformat(date_str) - datetime.timedelta(days=1)
    return d.isoformat()


def _sum_query(cur, table, base_column, base_id, equipment_type_id, start_date, end_date, extra_where=""):
    sql = f"SELECT COALESCE(SUM(quantity), 0) AS total FROM {table} WHERE 1=1"
    params = []

    if base_id:
        sql += f" AND {base_column} = ?"
        params.append(base_id)
    if equipment_type_id:
        sql += " AND equipment_type_id = ?"
        params.append(equipment_type_id)
    if start_date:
        sql += " AND date >= ?"
        params.append(start_date)
    if end_date:
        sql += " AND date <= ?"
        params.append(end_date)
    if extra_where:
        sql += f" AND {extra_where}"

    cur.execute(sql, tuple(params))
    row = cur.fetchone()
    return int(row["total"] or 0)


def _get_opening_balance(cur, base_id, equipment_type_id, start_date):
    if not start_date:
        return 0

    cutoff = _day_before(start_date)

    purchases_before = _sum_query(cur, "purchases", "base_id", base_id, equipment_type_id, None, cutoff)
    transfers_in_before = _sum_query(
        cur, "transfers", "to_base_id", base_id, equipment_type_id, None, cutoff, extra_where="status = 'completed'"
    )
    transfers_out_before = _sum_query(
        cur, "transfers", "from_base_id", base_id, equipment_type_id, None, cutoff, extra_where="status = 'completed'"
    )
    expended_before = _sum_query(cur, "expenditures", "base_id", base_id, equipment_type_id, None, cutoff)

    return purchases_before + transfers_in_before - transfers_out_before - expended_before


def get_dashboard_metrics(base_id=None, equipment_type_id=None, start_date=None, end_date=None):
    with get_cursor() as cur:
        purchases = _sum_query(cur, "purchases", "base_id", base_id, equipment_type_id, start_date, end_date)
        transfers_in = _sum_query(
            cur, "transfers", "to_base_id", base_id, equipment_type_id, start_date, end_date,
            extra_where="status = 'completed'",
        )
        transfers_out = _sum_query(
            cur, "transfers", "from_base_id", base_id, equipment_type_id, start_date, end_date,
            extra_where="status = 'completed'",
        )
        expended = _sum_query(cur, "expenditures", "base_id", base_id, equipment_type_id, start_date, end_date)
        assigned = _sum_query(
            cur, "assignments", "base_id", base_id, equipment_type_id, start_date, end_date,
            extra_where="status = 'assigned'",
        )
        opening_balance = _get_opening_balance(cur, base_id, equipment_type_id, start_date)

    net_movement = purchases + transfers_in - transfers_out
    closing_balance = opening_balance + net_movement - expended

    return {
        "openingBalance": opening_balance,
        "closingBalance": closing_balance,
        "netMovement": net_movement,
        "purchases": purchases,
        "transfersIn": transfers_in,
        "transfersOut": transfers_out,
        "assigned": assigned,
        "expended": expended,
    }
