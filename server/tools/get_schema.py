from server.db.connection import execute_query
from server.config import DB_TYPE

def get_schema(table_name: str) -> str:
    """Returns the schema (columns and types) for a given table."""
    clean_table = ''.join(c for c in table_name if c.isalnum() or c == '_')
    
    if DB_TYPE == "postgres":
        query = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{clean_table}';"
    elif DB_TYPE == "mysql":
        query = f"DESCRIBE {clean_table};"
    else:
        query = f"PRAGMA table_info({clean_table});"
        
    results = execute_query(query)
    
    if not results:
        return f"Table '{clean_table}' not found or has no columns."
        
    schema_lines = []
    for row in results:
        if DB_TYPE == "postgres":
            col = row.get("column_name")
            dtype = row.get("data_type")
        elif DB_TYPE == "mysql":
            col = row.get("Field")
            dtype = row.get("Type")
        else:
            col = row.get("name")
            dtype = row.get("type")
        schema_lines.append(f"- {col}: {dtype}")
            
    return f"Schema for {clean_table}:\n" + "\n".join(schema_lines)
