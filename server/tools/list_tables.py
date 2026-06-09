from server.db.connection import execute_query
from server.config import DB_TYPE

def list_tables() -> str:
    """Returns a list of all tables in the database."""
    if DB_TYPE == "postgres":
        query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    elif DB_TYPE == "mysql":
        query = "SHOW TABLES;"
    else:
        query = "SELECT name AS table_name FROM sqlite_master WHERE type='table';"
    
    results = execute_query(query)
    
    if DB_TYPE == "mysql":
        # PyMySQL DictCursor returns a list of dicts like {'Tables_in_dbname': 'tablename'}
        tables = []
        for row in results:
            tables.extend(row.values())
    else:
        tables = [row.get("table_name", row.get("name")) for row in results]
        
    return tables
