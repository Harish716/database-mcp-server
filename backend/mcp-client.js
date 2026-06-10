const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require('path');

let mcpClient = null;
let mcpTransport = null;

async function initMcpClient() {
    if (mcpClient) return mcpClient;

    const serverPath = path.resolve(__dirname, '../mcp-server/index.js');
    
    mcpTransport = new StdioClientTransport({
        command: "node",
        args: [serverPath]
    });

    mcpClient = new Client(
        { name: "aethon-backend-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await mcpClient.connect(mcpTransport);
    console.log("MCP Client connected to MCP Server.");
    return mcpClient;
}

async function getTools() {
    const client = await initMcpClient();
    const response = await client.listTools();
    return response.tools;
}

async function callTool(toolName, args) {
    const client = await initMcpClient();
    try {
        const response = await client.callTool({
            name: toolName,
            arguments: args
        });
        
        if (response.isError) {
            throw new Error(`MCP Tool Error: ${response.content.map(c => c.text).join(', ')}`);
        }
        
        // Return parsed text
        const textContent = response.content.find(c => c.type === 'text')?.text || "{}";
        return JSON.parse(textContent);
    } catch (err) {
        console.error("Error calling tool:", err);
        throw err;
    }
}

module.exports = {
    initMcpClient,
    getTools,
    callTool
};
