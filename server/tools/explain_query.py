from server.db.connection import execute_query
from server.db.safety import validate_query_safety, UnsafeQueryError

def explain_query(query: str) -> str:
    """Returns the execution plan for a given SELECT query."""
    try:
        validate_query_safety(query)
        
        from server.config import DB_TYPE
        
        clean_query = query.strip()
        if not clean_query.upper().startswith("EXPLAIN"):
            if DB_TYPE in ["postgres", "mysql"]:
                explain_sql = f"EXPLAIN {clean_query}"
            else:
                explain_sql = f"EXPLAIN QUERY PLAN {clean_query}"
        else:
            explain_sql = clean_query
            
        results = execute_query(explain_sql)
        
        lines = []
        for row in results:
            line = " | ".join(f"{k}: {v}" for k, v in row.items())
            lines.append(line)
            
        return "Execution Plan:\n" + "\n".join(lines)
    except UnsafeQueryError as e:
        return f"Query Blocked: {str(e)}"
    except Exception as e:
        return f"Execution Error: {str(e)}"
