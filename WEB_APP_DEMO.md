# AETHON Web Application Demonstration

This document demonstrates how the newly refactored AETHON Web Application uses the Google Gemini API (Free Tier) to communicate with the MCP Server and the database.

## Architecture

The AI Command Center inside AETHON operates via the following chain:
**AETHON Web Application -> Gemini API -> Custom MCP Server -> SQLite Database**

## Demonstration Workflow

1. Start the AETHON Web Application by running `npm start` in the `backend` directory.
2. Open the AETHON web UI in your browser and log in.
3. Open the **AI Command Center**.

### Example 1: Natural Language Query (SELECT)

**User Prompt:**  
`"Show me all the departments in the system."`

**System Execution Flow:**
1. **Prompt Received:** `"Show me all the departments in the system."`
2. **AI Processing:** Request is sent to Gemini 2.5 Flash with the MCP tools schema.
3. **MCP Tool Selection:** Gemini recognizes it needs to fetch data and calls `run_select` with `{"query": "SELECT * FROM departments"}`.
4. **Database Execution:** The MCP server executes the query on the SQLite DB and returns the results to Gemini.
5. **Result Generated:** Gemini receives the raw JSON and generates a natural language response: *"Here are the departments currently in the system: Engineering, HR, and Sales."*

### Example 2: Data Mutation (DELETE)

**User Prompt:**  
`"Delete the attendance record for ID 42."`

**System Execution Flow:**
1. **Prompt Received:** `"Delete the attendance record for ID 42."`
2. **AI Processing:** Request is sent to Gemini.
3. **MCP Tool Selection:** Gemini reads the system instructions stating it must NEVER mutate data directly. It calls `explain_query` with `{"operation_type": "DELETE", "table_name": "attendance", "where_clause": "id = 42"}`.
4. **Database Execution:** The MCP server counts the rows and returns `{"affectedRows": 1, "riskLevel": "HIGH"}`.
5. **Result Generated:** Gemini replies to the user: *"WARNING: You are about to delete 1 record. The risk level is HIGH. Are you sure you want to proceed?"*

*(The user replies "Yes, proceed")*

1. **Prompt Received:** `"Yes, proceed"`
2. **AI Processing:** Gemini processes the confirmation.
3. **MCP Tool Selection:** Gemini now calls `delete_record` with `{"table_name": "attendance", "where_clause": "id = 42"}`.
4. **Database Execution:** The MCP server executes the DELETE query and returns success.
5. **Audit Logging:** The `ai_activity` and `audit_logs` tables automatically log the successful DELETE action, recording the user ID, timestamp, and affected rows.
6. **Result Generated:** Gemini replies: *"The record has been successfully deleted."*
