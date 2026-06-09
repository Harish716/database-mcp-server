from flask import Flask, request, jsonify, send_from_directory
import os
import markdown
import ast
from agent.custom_agent import chat_with_agent
from server.tools.list_tables import list_tables
from server.tools.run_select import run_select

app = Flask(__name__, static_folder='static')

@app.route('/')
def serve_index():
    return send_from_directory('static', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    
    if not user_input:
        return jsonify({'error': 'No message provided'}), 400
        
    try:
        # Get raw markdown response from the agent
        raw_response = chat_with_agent(user_input)
        
        # Convert markdown to HTML (enabling tables and code blocks)
        html_response = markdown.markdown(
            raw_response, 
            extensions=['tables', 'fenced_code', 'nl2br']
        )
        
        return jsonify({'response': html_response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tables', methods=['GET'])
def get_tables_data():
    try:
        # Get all tables
        tables_data = list_tables()
        if isinstance(tables_data, str):
            try:
                tables = ast.literal_eval(tables_data)
            except Exception:
                tables = []
        else:
            tables = tables_data
            
        result = []
        for table in tables:
            # Get up to 5 sample rows from each table
            query = f"SELECT * FROM {table} LIMIT 5"
            data_str = run_select(query)
            
            # Convert JSON results to HTML table
            try:
                import json
                rows = json.loads(data_str)
                if rows and isinstance(rows, list):
                    headers = rows[0].keys()
                    html_table = "<table><thead><tr>"
                    for h in headers:
                        html_table += f"<th>{h}</th>"
                    html_table += "</tr></thead><tbody>"
                    for row in rows:
                        html_table += "<tr>"
                        for h in headers:
                            html_table += f"<td>{row.get(h, '')}</td>"
                        html_table += "</tr>"
                    html_table += "</tbody></table>"
                else:
                    html_table = "<p>No data</p>"
            except Exception:
                html_table = f"<pre>{data_str}</pre>"

            result.append({
                "table_name": table,
                "html_data": html_table
            })
            
        return jsonify({"tables": result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
