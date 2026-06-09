import sqlite3
import pandas as pd
from server.config import DB_TYPE, SQLITE_PATH, POSTGRES_URL, MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB

def get_connection():
    """Returns a connection based on the configured database type."""
    if DB_TYPE == "postgres":
        import psycopg2
        return psycopg2.connect(POSTGRES_URL)
    elif DB_TYPE == "mysql":
        import pymysql
        return pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor
        )
    else:
        # Default to SQLite
        return sqlite3.connect(SQLITE_PATH)

def execute_query(query: str):
    """Executes a validated read-only query and returns the results as a list of dicts."""
    conn = get_connection()
    try:
        if DB_TYPE == "mysql":
            with conn.cursor() as cursor:
                cursor.execute(query)
                return cursor.fetchall()
        else:
            df = pd.read_sql_query(query, conn)
            return df.to_dict(orient="records")
    finally:
        conn.close()
