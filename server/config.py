import os
from dotenv import load_dotenv

# Define absolute paths to ensure reliability when run from Claude Desktop
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Load .env explicitly from the project root
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()

# MySQL configuration
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "employee_database")

# Ensure the SQLite path is absolute regardless of where Claude Desktop runs the script
_sqlite_path = os.getenv("SQLITE_PATH", os.path.join(PROJECT_ROOT, "data", "database.db"))
if not os.path.isabs(_sqlite_path):
    SQLITE_PATH = os.path.abspath(os.path.join(PROJECT_ROOT, _sqlite_path))
else:
    SQLITE_PATH = _sqlite_path

POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://user:pass@localhost:5432/mcpdb")
