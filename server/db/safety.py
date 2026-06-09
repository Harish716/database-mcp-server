import re

class UnsafeQueryError(Exception):
    """Exception raised when an unsafe query is detected."""
    pass

def validate_query_safety(query: str):
    """
    Validates that a SQL query is strictly read-only and safe to execute.
    Raises UnsafeQueryError if the query is deemed unsafe.
    """
    if not query or not query.strip():
        raise UnsafeQueryError("Query cannot be empty.")
    
    clean_query = query.strip().upper()
    
    # Must start with SELECT or EXPLAIN
    if not (clean_query.startswith("SELECT") or clean_query.startswith("EXPLAIN")):
        raise UnsafeQueryError("Only SELECT or EXPLAIN queries are allowed.")
    
    # Check for forbidden keywords anywhere in the query
    forbidden_keywords = [
        r'\bINSERT\b', r'\bUPDATE\b', r'\bDELETE\b', r'\bDROP\b', 
        r'\bALTER\b', r'\bCREATE\b', r'\bTRUNCATE\b', r'\bGRANT\b', 
        r'\bREVOKE\b', r'\bREPLACE\b', r'\bUPSERT\b', r'\bMERGE\b',
        r'\bEXEC\b', r'\bEXECUTE\b', r'\bCALL\b'
    ]
    
    for pattern in forbidden_keywords:
        if re.search(pattern, clean_query):
            raise UnsafeQueryError(f"Forbidden keyword detected. Query is not read-only.")
