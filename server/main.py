import sys
import os

# Ensure the parent directory is in sys.path so we can import 'server'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.server.fastmcp import FastMCP
from server.tools.list_tables import list_tables
from server.tools.get_schema import get_schema
from server.tools.run_select import run_select
from server.tools.explain_query import explain_query

# Initialize FastMCP Server
mcp = FastMCP("Database_MCP_Server")

# Register tools
@mcp.tool()
def get_list_tables() -> str:
    """List all available tables in the database. ALWAYS call this first to verify the exact spelling of table names (e.g. plural vs singular) before running queries."""
    return str(list_tables())

@mcp.tool()
def get_table_schema(table_name: str) -> str:
    """Get the schema (columns and data types) of a specific table. Use this to understand column names before querying."""
    return str(get_schema(table_name))

@mcp.tool()
def execute_select_query(query: str) -> str:
    """Run a safe, read-only SELECT query against the database. If the user asks for data, use this tool to fetch it."""
    return str(run_select(query))

@mcp.tool()
def get_query_explanation(query: str) -> str:
    """Explain the query execution plan for a SELECT query."""
    return explain_query(query)

if __name__ == "__main__":
    # Start the server on stdio
    mcp.run()
