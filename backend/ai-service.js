const OpenAI = require('openai');
const mcpClient = require('./mcp-client');
const db = require('./db/sqlite-service');

const openai = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY
});

// Session memory: mapping sessionId -> Array of messages
const memory = new Map();

const systemInstruction = `You are AETHON, an interactive and conversational AI Database Controller. You use tools to interact with a SQLite database.
Your main objective is to fulfill the user's request in a natural, friendly, and basic way.

IMPORTANT CONVERSATIONAL RULES:
1. If the user asks to add, update, or delete a record (e.g. "add an employee" or "delete emp id 5") but does NOT provide all the necessary details, DO NOT guess or fail. Instead, politely ask them for the missing information (e.g., "Sure, I can add an employee! What is their name, email, and department?").
2. Only call the database tools once you have gathered all the necessary information from the user.
3. When you have all the data to modify (INSERT, UPDATE, DELETE), DO NOT do it immediately! First, call the explain_query tool to get the risk level.
4. Warn the user of the risk and ask for final confirmation. Only if the user says "Yes, proceed" should you call the actual mutation tool.
5. The database has separate tables for 'employees' and 'attendance'. The 'attendance' table links to 'employees' via 'employee_id'. To check an employee's attendance, you must query the 'attendance' table. Do not assume 'employees' has an attendance column. Always use get_schema to verify table structures!`;

function convertSchemaToOpenAI(schema) {
    if (!schema) return { type: "object", properties: {} };
    // MCP schema is JSON Schema, which OpenAI accepts directly
    return {
        type: schema.type || "object",
        properties: schema.properties || {},
        required: schema.required || []
    };
}

async function saveMessage(sessionId, message) {
    await db.run('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)', [sessionId, message.role, JSON.stringify(message)]);
}

async function processPrompt(userId, role, prompt, sessionId = 'default') {
    const pipeline = [];
    const logPipeline = (step, details) => pipeline.push({ step, timestamp: new Date(), details });
    
    logPipeline('Prompt Received', prompt);

    let mcpTools = await mcpClient.getTools();
    
    // Strict Role Security: Strip mutation tools from employees
    if (role !== 'ADMIN') {
        mcpTools = mcpTools.filter(t => !["insert_record", "update_record", "delete_record"].includes(t.name));
    }
    
    const openAiTools = mcpTools.map(t => ({
        type: "function",
        function: {
            name: t.name,
            description: t.description,
            parameters: convertSchemaToOpenAI(t.inputSchema)
        }
    }));

    let messages = [];

    // Load or Initialize Session from DB
    const existingSession = await db.query('SELECT * FROM chat_sessions WHERE session_id = ? AND user_id = ?', [sessionId, userId]);
    
    if (existingSession.length === 0) {
        // Create new session
        const title = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
        await db.run('INSERT INTO chat_sessions (session_id, user_id, title) VALUES (?, ?, ?)', [sessionId, userId, title]);
        
        let instruction = role === 'ADMIN' 
            ? systemInstruction 
            : `You are an AI Assistant for AETHON. You are interacting with a standard user. Answer questions nicely. Do NOT expose sensitive info or perform destructive database operations. Use read-only tools if necessary to help them.`;
            
        const sysMsg = { role: 'system', content: instruction };
        messages.push(sysMsg);
        await saveMessage(sessionId, sysMsg);
    } else {
        // Load existing messages
        const dbMessages = await db.query('SELECT content FROM chat_messages WHERE session_id = ? ORDER BY message_id ASC', [sessionId]);
        messages = dbMessages.map(m => JSON.parse(m.content));
        
        // Update session timestamp
        await db.run('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = ?', [sessionId]);
    }
    
    const initialMessageCount = messages.length;
    
    const userMsg = { role: 'user', content: prompt };
    messages.push(userMsg);
    await saveMessage(sessionId, userMsg);

    logPipeline('AI Processing', 'Sending to Groq API');
    
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
        try {
            while (true) {
                const completion = await openai.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    tools: openAiTools.length > 0 ? openAiTools : undefined,
                    tool_choice: openAiTools.length > 0 ? "auto" : "none"
                });

                const msg = completion.choices[0].message;
                messages.push(msg); // Add assistant message to history array
                await saveMessage(sessionId, msg); // Persist assistant message

                if (msg.tool_calls && msg.tool_calls.length > 0) {
                    for (const call of msg.tool_calls) {
                        // Fix for Llama 3 hallucinating arguments into the function name
                        if (call.function.name && call.function.name.includes('{')) {
                            const parts = call.function.name.split('{');
                            call.function.name = parts[0].trim();
                            if (!call.function.arguments || call.function.arguments.trim() === '') {
                                call.function.arguments = '{' + parts.slice(1).join('{');
                            }
                        }

                        logPipeline('MCP Tool Selected', `Executing ${call.function.name}`);
                        
                        let toolArgs = {};
                        try {
                            toolArgs = JSON.parse(call.function.arguments);
                        } catch (e) {
                            console.error("Failed to parse tool args", e);
                        }

                        let mcpResult;
                        try {
                            mcpResult = await mcpClient.callTool(call.function.name, toolArgs);
                        } catch (toolErr) {
                            logPipeline('Database Error', toolErr.message);
                            mcpResult = { error: toolErr.message, instruction: "Please review the database schema using get_schema before making another attempt." };
                        }
                        
                        logPipeline('Database Execution', mcpResult);
                        
                        // Track ai_activity
                        const isMutation = ["insert_record", "update_record", "delete_record"].includes(call.function.name);
                        const operationType = call.function.name.split('_')[0].toUpperCase();
                        
                        await db.run(
                            'INSERT INTO ai_activity (user_id, prompt, operation_type, risk_level, execution_status) VALUES (?, ?, ?, ?, ?)',
                            [userId, prompt, operationType, 'N/A', mcpResult.error ? 'FAILED' : 'SUCCESS']
                        );
                        
                        if (isMutation && !mcpResult.error) {
                            await db.run(
                                'INSERT INTO audit_logs (user_id, action_type, table_name, affected_rows, risk_level, query_summary) VALUES (?, ?, ?, ?, ?, ?)',
                                [userId, operationType, toolArgs.table_name || 'unknown', mcpResult.changes || 1, 'MUTATION', JSON.stringify(toolArgs)]
                            );
                        }

                        logPipeline('Result Generated', 'Asking AI to summarize');
                        
                        // Send tool result back to OpenRouter/Groq
                        const toolMsg = {
                            role: 'tool',
                            tool_call_id: call.id,
                            name: call.function.name,
                            content: typeof mcpResult === 'string' ? mcpResult : JSON.stringify(mcpResult)
                        };
                        messages.push(toolMsg);
                        await saveMessage(sessionId, toolMsg);
                    }
                    
                } else {
                    // No more function calls, exit the loop and return text
                    const textContent = msg.content || "Action completed successfully.";
                    return { answer: textContent, pipeline };
                }
            }

        } catch (err) {
            console.error(`AI Error (Attempt ${retries + 1}):`, err.message);
            if (err.message.includes('Failed to call a function') && retries < maxRetries) {
                retries++;
                logPipeline('Retry Triggered', `API Error, retrying attempt ${retries}`);
                // Since we persisted messages to DB, rollback is harder. For now, we will just delete the faulty messages from DB and memory.
                await db.run('DELETE FROM chat_messages WHERE session_id = ? AND message_id NOT IN (SELECT message_id FROM chat_messages WHERE session_id = ? ORDER BY message_id ASC LIMIT ?)', [sessionId, sessionId, initialMessageCount + 1]);
                while (messages.length > initialMessageCount + 1) {
                    messages.pop();
                }
                continue; 
            }
            
            return { answer: "Error processing your request: " + err.message, pipeline };
        }
    }
}

module.exports = {
    processPrompt
};
