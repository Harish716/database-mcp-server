# Claude Desktop MCP Integration Demonstration

This document demonstrates how to configure Claude Desktop to connect directly to the AETHON MCP Server. The MCP Server acts as a bridge to the SQLite database.

## Prerequisites
1. You must have Claude Desktop installed.
2. The `aethon/mcp-server` must be installed. If you haven't already, run `npm install` inside the `aethon/mcp-server` directory.

## Configuration

1. Open your Claude Desktop configuration file.
   - **Windows:** `%APPDATA%\\Claude\\claude_desktop_config.json`
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   
2. Update the configuration to include the AETHON MCP Server:

```json
{
  "mcpServers": {
    "aethon-mcp-server": {
      "command": "node",
      "args": [
        "C:/Users/safis/.gemini/antigravity/scratch/aethon/mcp-server/index.js"
      ]
    }
  }
}
```
*(Make sure to use the correct absolute path to the `mcp-server/index.js` file on your system)*

3. **Restart Claude Desktop.**

## Demonstration Workflow

Once Claude Desktop is restarted, it will automatically connect to the MCP server. You will see a small "hammer" or "plug" icon in Claude Desktop indicating tools are available.

### Try These Prompts

1. **"List all tables"**
   *Claude will call `list_tables` and respond with the names of the tables in your database.*

2. **"Show employee attendance"**
   *Claude will call `get_schema` for the attendance tables, and then call `run_select` to fetch and format the data for you.*

3. **"Show employees below 80% attendance"**
   *Claude will formulate a `SELECT` query to filter employees and calculate attendance percentages, then execute it via `run_select`.*

4. **"Delete the employee named John Doe"**
   *Claude will first call `explain_query` with operation type "DELETE". The MCP server will return a `CRITICAL` risk level and the number of affected rows. Claude will then display a warning and ask for your explicit confirmation before proceeding with the `delete_record` tool.*
