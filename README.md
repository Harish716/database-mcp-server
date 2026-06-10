# AETHON – AI-Powered Database Control System

AETHON is a production-quality enterprise web application that enables non-technical users to interact with databases using natural language via Claude AI connected to a custom Model Context Protocol (MCP) server.

## Features

- **Natural Language Control**: Query, insert, update, and delete database records using plain English.
- **Claude Integration**: Powered by Anthropic's Claude API.
- **MCP Server**: Implements `@modelcontextprotocol/sdk` to securely expose SQLite tools.
- **Safe Execution**: Mutations are halted and evaluated for risk. Claude explains the risk and asks for explicit confirmation before altering data.
- **Enterprise UI**: Vanilla HTML/CSS/JS frontend styled without utility frameworks, featuring GSAP animations and Lenis smooth scrolling.

## Prerequisites

- Node.js (v18+)
- Anthropic API Key (`ANTHROPIC_API_KEY`)

## Installation & Setup

1. **Install Dependencies**
   Navigate to the `backend` and `mcp-server` folders and install the required packages:

   ```bash
   # Terminal 1: Backend
   cd backend
   npm install

   # Terminal 2: MCP Server
   cd ../mcp-server
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3000
   JWT_SECRET=aethon-super-secret-key-change-in-prod
   ANTHROPIC_API_KEY=your_actual_anthropic_key_here
   ```

3. **Seed Database**
   Initialize the SQLite database with seed data:
   ```bash
   cd backend
   npm run seed
   ```

## Running the Application

Because the MCP server is spawned as a child process via `stdio` by the backend, you only need to run the backend server. The backend serves the frontend statically.

```bash
cd backend
npm start
```

Access the application at: `http://localhost:3000`

### Demo Credentials

- **Admin Account**: `admin@aethon.local` | Password: `password123`
- **Employee Account**: Use any of the generated seed emails (e.g., `john.smith1@aethon.local`) | Password: `password123`

## Claude Desktop Compatibility

The custom MCP server can also be used directly with Claude Desktop. Edit your Claude Desktop config file (usually located at `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "aethon-mcp-server": {
      "command": "node",
      "args": [
        "C:/absolute/path/to/aethon/mcp-server/index.js"
      ]
    }
  }
}
```

## Testing Workflow

1. Login as the Admin user.
2. Navigate to the **AI Command Center**.
3. Type: "Show me all employees in the Sales department."
4. Watch the pipeline visualization execute the tool and return data.
5. Type: "Give them 100 reward points for excellent performance."
6. Claude will evaluate the query, determine the risk, and ask for confirmation.
7. Type: "Yes, confirm."
8. Verify the changes using the **Database Explorer** or by navigating to **Audit Logs**.
