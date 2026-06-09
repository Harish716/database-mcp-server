import os
import sys
from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import our custom database tools
from server.tools.list_tables import list_tables
from server.tools.get_schema import get_schema
from server.tools.run_select import run_select
from server.tools.explain_query import explain_query

import os
import sys
import json
from dotenv import load_dotenv

# Try importing the OpenAI SDK
try:
    from openai import OpenAI
except ImportError:
    print("Error: The 'openai' package is not installed.")
    print("Run: pip install openai")
    sys.exit(1)

# Import our database tools
from server.tools.list_tables import list_tables
from server.tools.get_schema import get_schema
from server.tools.run_select import run_select
from server.tools.explain_query import explain_query

def get_list_tables() -> str:
    return str(list_tables())

def get_table_schema(table_name: str) -> str:
    return str(get_schema(table_name))

def execute_select_query(query: str) -> str:
    return str(run_select(query))

def get_query_explanation(query: str) -> str:
    return str(explain_query(query))

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_list_tables",
            "description": "List all available tables in the connected SQL database.",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_table_schema",
            "description": "Get the schema (columns and data types) of a specific table.",
            "parameters": {
                "type": "object",
                "properties": {"table_name": {"type": "string"}},
                "required": ["table_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_select_query",
            "description": "Run a safe, read-only SELECT query against the database.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string", "description": "The SQL SELECT query"}},
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_query_explanation",
            "description": "Explain the query execution plan for a SELECT query.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    }
]

client = None
chat_history = []

def init_agent():
    global client, chat_history
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY is not set in the environment.", file=sys.stderr)
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    chat_history = [
        {
            "role": "system",
            "content": (
                "You are an energetic, highly interactive, and helpful AI database assistant. "
                "You have access to exactly 4 tools:\n"
                "1. get_list_tables\n"
                "2. get_table_schema\n"
                "3. execute_select_query (Use this to run SELECT statements and show data to the user)\n"
                "4. get_query_explanation\n\n"
                "CRITICAL RULES:\n"
                "- Always use your tools to fulfill user requests involving the database. Do not output raw SQL or raw tool calls in the chat. Just invoke the tool directly.\n"
                "- You MUST use execute_select_query when the user asks to see, show, or list specific data (e.g., 'show the employee where id=5').\n"
                "- ALWAYS use get_list_tables to verify the exact spelling of table names (e.g. plural vs singular) BEFORE running any queries, especially if the user's plain text isn't an exact match. Be intelligent in inferring the correct table name from the user's plain text.\n"
                "- If the user asks you to perform ANY write operation (such as INSERT, UPDATE, DELETE, CREATE, DROP, etc.), you MUST politely inform them using this EXACT phrase: 'I don't have permission for that in addition'. However, immediately offer to help them by providing step-by-step instructions and the exact SQL code they can run manually.\n"
                "- Always format data results as beautiful Markdown tables.\n"
                "- Always be conversational, friendly, and interactive!"
            )
        }
    ]

def chat_with_agent(user_input: str) -> str:
    global client, chat_history
    if client is None:
        init_agent()
        
    chat_history.append({"role": "user", "content": user_input})
    
    try:
        response = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=chat_history,
            tools=tools,
            tool_choice="auto",
            max_tokens=4096
        )
        
        response_message = response.choices[0].message
        chat_history.append(response_message)
        
        iterations = 0
        while response_message.tool_calls and iterations < 5:
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                try:
                    function_args = json.loads(tool_call.function.arguments)
                except Exception:
                    function_args = {}
                
                if function_name == "get_list_tables":
                    function_response = get_list_tables()
                elif function_name == "get_table_schema":
                    function_response = get_table_schema(function_args.get("table_name", ""))
                elif function_name == "execute_select_query":
                    function_response = execute_select_query(function_args.get("query", ""))
                elif function_name == "get_query_explanation":
                    function_response = get_query_explanation(function_args.get("query", ""))
                else:
                    function_response = f"Unknown tool: {function_name}"
                    
                chat_history.append(
                    {
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response,
                    }
                )
            
            # Get the next response from Gemini
            response = client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=chat_history,
                tools=tools,
                tool_choice="auto",
                max_tokens=4096
            )
            response_message = response.choices[0].message
            chat_history.append(response_message)
            iterations += 1

        content = response_message.content
        return content if content is not None else "Completed task."
            
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    print("Welcome to the Database CLI Agent! Type 'exit' or 'quit' to stop.")
    while True:
        try:
            user_input = input("\nYou: ")
            if user_input.lower() in ['exit', 'quit']:
                print("Goodbye!")
                break
            if not user_input.strip():
                continue
            
            response = chat_with_agent(user_input)
            print(f"\nAgent: {response}")
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"\nAn error occurred: {e}")
