const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../backend/db/aethon.db');
const db = new sqlite3.Database(dbPath);

const server = new Server(
  { name: "aethon-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_schema",
        description: "Get the schema for a specific table",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string", description: "Name of the table" }
          },
          required: ["table_name"]
        }
      },
      {
        name: "run_select",
        description: "Run a SELECT query on the database. ONLY SELECT queries.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The SELECT query to run" }
          },
          required: ["query"]
        }
      },
      {
        name: "explain_query",
        description: "Explain the risk and affected rows of an INSERT, UPDATE, or DELETE query.",
        inputSchema: {
          type: "object",
          properties: {
            operation_type: { type: "string", enum: ["INSERT", "UPDATE", "DELETE"] },
            table_name: { type: "string" },
            where_clause: { type: "string", description: "The WHERE clause (without the WHERE keyword). If none, say 'NONE'" }
          },
          required: ["operation_type", "table_name", "where_clause"]
        }
      },
      {
        name: "insert_record",
        description: "Insert a record into a table.",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
            data: { type: "object", description: "Key-value pairs of column to value to insert." }
          },
          required: ["table_name", "data"]
        }
      },
      {
        name: "update_record",
        description: "Update records in a table.",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
            data: { type: "object", description: "Key-value pairs to update." },
            where_clause: { type: "string", description: "WHERE clause for the update. e.g. 'id = 5'" }
          },
          required: ["table_name", "data", "where_clause"]
        }
      },
      {
        name: "delete_record",
        description: "Delete records from a table.",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string" },
            where_clause: { type: "string", description: "WHERE clause for the deletion. e.g. 'id = 5'" }
          },
          required: ["table_name", "where_clause"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_tables") {
      const rows = await query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      return { content: [{ type: "text", text: JSON.stringify(rows.map(r => r.name)) }] };
    }
    
    if (name === "get_schema") {
      const rows = await query(`PRAGMA table_info(${args.table_name})`);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }
    
    if (name === "run_select") {
      if (!args.query.toUpperCase().trim().startsWith("SELECT")) {
        throw new Error("Only SELECT queries are allowed for this tool.");
      }
      const rows = await query(args.query);
      return { content: [{ type: "text", text: JSON.stringify(rows) }] };
    }
    
    if (name === "explain_query") {
      let riskLevel = "LOW";
      let affectedRows = 0;
      
      if (args.operation_type === "INSERT") {
        affectedRows = 1; // Generally 1 for standard single insert
        riskLevel = "LOW";
      } else {
        const where = args.where_clause !== "NONE" ? `WHERE ${args.where_clause}` : "";
        const countQuery = `SELECT COUNT(*) as count FROM ${args.table_name} ${where}`;
        const rows = await query(countQuery);
        affectedRows = rows[0].count;
        
        if (args.operation_type === "UPDATE") {
          riskLevel = affectedRows > 10 ? "HIGH" : (affectedRows > 0 ? "MEDIUM" : "LOW");
          if (args.where_clause === "NONE") riskLevel = "CRITICAL";
        } else if (args.operation_type === "DELETE") {
          riskLevel = affectedRows > 1 ? "CRITICAL" : (affectedRows === 1 ? "HIGH" : "LOW");
          if (args.where_clause === "NONE") riskLevel = "CRITICAL";
        }
      }
      
      return { content: [{ type: "text", text: JSON.stringify({ affectedRows, riskLevel }) }] };
    }

    if (name === "insert_record") {
      const keys = Object.keys(args.data);
      const values = Object.values(args.data);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO ${args.table_name} (${keys.join(", ")}) VALUES (${placeholders})`;
      const result = await run(sql, values);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, lastID: result.lastID }) }] };
    }

    if (name === "update_record") {
      const keys = Object.keys(args.data);
      const values = Object.values(args.data);
      const setClause = keys.map(k => `${k} = ?`).join(", ");
      const sql = `UPDATE ${args.table_name} SET ${setClause} WHERE ${args.where_clause}`;
      const result = await run(sql, values);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, changes: result.changes }) }] };
    }

    if (name === "delete_record") {
      const sql = `DELETE FROM ${args.table_name} WHERE ${args.where_clause}`;
      const result = await run(sql);
      return { content: [{ type: "text", text: JSON.stringify({ success: true, changes: result.changes }) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error executing tool: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aethon MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
