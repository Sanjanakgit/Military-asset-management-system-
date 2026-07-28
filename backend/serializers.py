def base_to_dict(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "location": row.get("location"),
    }


def equipment_type_to_dict(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "unit": row.get("unit"),
    }


def user_brief_to_dict(row):
    if not row:
        return None
    return {"id": row["id"], "username": row["username"], "fullName": row["full_name"]}


def purchase_row_to_dict(row):
    return {
        "id": row["id"],
        "baseId": row["base_id"],
        "equipmentTypeId": row["equipment_type_id"],
        "quantity": row["quantity"],
        "unitCost": row["unit_cost"],
        "date": str(row["date"]) if row["date"] else None,
        "vendor": row["vendor"],
        "notes": row["notes"],
        "createdBy": row["created_by"],
        "base": {"id": row["base_id"], "name": row["base_name"], "location": row.get("base_location")},
        "equipmentType": {
            "id": row["equipment_type_id"],
            "name": row["equipment_name"],
            "category": row["equipment_category"],
            "unit": row.get("equipment_unit"),
        },
        "creator": {"id": row["created_by"], "username": row["creator_username"], "fullName": row["creator_full_name"]},
    }


def transfer_row_to_dict(row):
    return {
        "id": row["id"],
        "fromBaseId": row["from_base_id"],
        "toBaseId": row["to_base_id"],
        "equipmentTypeId": row["equipment_type_id"],
        "quantity": row["quantity"],
        "date": str(row["date"]) if row["date"] else None,
        "status": row["status"],
        "notes": row["notes"],
        "createdBy": row["created_by"],
        "fromBase": {"id": row["from_base_id"], "name": row["from_base_name"]},
        "toBase": {"id": row["to_base_id"], "name": row["to_base_name"]},
        "equipmentType": {
            "id": row["equipment_type_id"],
            "name": row["equipment_name"],
            "category": row["equipment_category"],
            "unit": row.get("equipment_unit"),
        },
        "creator": {"id": row["created_by"], "username": row["creator_username"], "fullName": row["creator_full_name"]},
    }


def assignment_row_to_dict(row):
    return {
        "id": row["id"],
        "baseId": row["base_id"],
        "equipmentTypeId": row["equipment_type_id"],
        "personnelName": row["personnel_name"],
        "personnelServiceId": row["personnel_service_id"],
        "quantity": row["quantity"],
        "date": str(row["date"]) if row["date"] else None,
        "status": row["status"],
        "returnedDate": str(row["returned_date"]) if row["returned_date"] else None,
        "notes": row["notes"],
        "createdBy": row["created_by"],
        "base": {"id": row["base_id"], "name": row["base_name"]},
        "equipmentType": {
            "id": row["equipment_type_id"],
            "name": row["equipment_name"],
            "category": row["equipment_category"],
            "unit": row.get("equipment_unit"),
        },
        "creator": {"id": row["created_by"], "username": row["creator_username"], "fullName": row["creator_full_name"]},
    }


def expenditure_row_to_dict(row):
    return {
        "id": row["id"],
        "baseId": row["base_id"],
        "equipmentTypeId": row["equipment_type_id"],
        "quantity": row["quantity"],
        "date": str(row["date"]) if row["date"] else None,
        "reason": row["reason"],
        "createdBy": row["created_by"],
        "base": {"id": row["base_id"], "name": row["base_name"]},
        "equipmentType": {
            "id": row["equipment_type_id"],
            "name": row["equipment_name"],
            "category": row["equipment_category"],
            "unit": row.get("equipment_unit"),
        },
        "creator": {"id": row["created_by"], "username": row["creator_username"], "fullName": row["creator_full_name"]},
    }
