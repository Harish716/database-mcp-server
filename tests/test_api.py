import pytest
from app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index_page(client):
    """Test that the index page loads successfully (Happy Path)."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'<!DOCTYPE html>' in response.data

def test_api_tables(client):
    """Test that the /api/tables route returns the expected JSON schema (Happy Path)."""
    response = client.get('/api/tables')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Assert that 'tables' key is in the response
    assert 'tables' in data
    # Assert that it's a list
    assert isinstance(data['tables'], list)

def test_api_chat_empty_message(client):
    """Test the chat API with an empty message to ensure it handles it correctly."""
    response = client.post('/api/chat', json={'message': ''})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'error' in data
