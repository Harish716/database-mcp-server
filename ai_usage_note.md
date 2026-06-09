# AI Usage Note

## 1. What AI Helped With
The AI agent was instrumental throughout the entire software development lifecycle of this Employee Database project:
* **Architecture & Scaffolding**: Initially generated the complete folder structure and boilerplate code for the Model Context Protocol (MCP) server, including the database connection logic, safety validators, and tool schemas.
* **Troubleshooting & Debugging**: Successfully diagnosed and fixed multiple authentication issues (e.g., Anthropic `401 - invalid x-api-key`), API token rate limits (Groq `429` errors), and model capability bugs.
* **Full-Stack UI Migration**: Completely transformed the backend CLI script into a fully functional Flask web application. It generated responsive HTML, CSS, and Vanilla JavaScript, ensuring strict adherence to the requested Python/Vanilla JS tech stack without relying on Node.js.
* **Advanced Features**: Designed and integrated complex features from scratch, such as dynamic Database Table Exploration and a custom DOM parser to export HTML tables to CSV/Excel seamlessly.

## 2. What AI Got Wrong
* **Tool Calling Hallucinations**: When the primary Groq Llama 3.3 70B model hit its free-tier rate limit, the AI automatically fell back to smaller models (like Llama 3.1 8B). However, these smaller models struggled to format JSON correctly, occasionally hallucinating XML-style tags (`<function=execute_select_query>`) instead of invoking the actual database tool.
* **API Parameter Clashing**: The AI discovered that explicitly instructing the Groq API on *how* to format tool JSON in the system prompt actually caused it to fail. The AI had to correct its own mistake by simplifying the system prompt.

## 3. Best Prompts Used
The most effective prompts were direct, goal-oriented, and set strict boundaries:
* *"yeah now its working perfect, (i want the agent to do only the given 4 tool , if the user enters or asks query which is not in the 4 tools it must tell the user that i have not permission to do those operations but i can help you to do that operations by giving steps) the agent must be very interactive"* (Excellent for establishing strong, strict guardrails).
* *"instead of this boring cli i want attractive and interactive UI... please ensure that we are maintaining the suggested tech stack"* (Excellent for triggering a major architectural shift while maintaining system constraints).
* *"remove the powered by gorq and llama text and also remove unnecessary files,directories,code lines, and also in UI remove unwanted tabs in view tables tab it must show all the table(sample data) which are available in the database (whole sql) and also whatever the data it shows as result it must have some export option which includes csv,excel and so on"* (Highly effective mega-prompt that successfully dictated multiple frontend features, backend routes, and file cleanups simultaneously).
