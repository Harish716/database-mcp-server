import json
import decimal
from datetime import date, datetime
from server.db.connection import execute_query
from server.db.safety import validate_query_safety, UnsafeQueryError

def custom_serializer(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def run_select(query: str) -> str:
    """Executes a SELECT query safely and returns the result as JSON."""
    try:
        validate_query_safety(query)
        results = execute_query(query)
        return json.dumps(results, indent=2, default=custom_serializer)
    except UnsafeQueryError as e:
        return f"Query Blocked: {str(e)}"
    except Exception as e:
        return f"Execution Error: {str(e)}"
