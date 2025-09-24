import os
import sys
import pytest
from fastapi.testclient import TestClient
import base64

# Add backend directory to sys.path
ROOT = os.path.abspath(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app.main import app

@pytest.fixture(scope="session")
def client(monkeypatch_session):
    """
    Create a test client with Basic Authentication headers.
    This client is shared across the entire test session.
    """
    # 1. Set test credentials as environment variables
    monkeypatch_session.setenv("BASIC_AUTH_USERNAME", "testuser")
    monkeypatch_session.setenv("BASIC_AUTH_PASSWORD", "testpass")

    # 2. Create the TestClient instance
    test_client = TestClient(app)

    # 3. Set the Authorization header for all requests from this client
    auth = base64.b64encode(b"testuser:testpass").decode("ascii")
    test_client.headers["Authorization"] = f"Basic {auth}"
    
    yield test_client

@pytest.fixture(scope="session")
def monkeypatch_session(request):
    """
    A session-scoped monkeypatch fixture.
    Pytest's built-in monkeypatch is function-scoped.
    """
    from _pytest.monkeypatch import MonkeyPatch
    mpatch = MonkeyPatch()
    yield mpatch
    mpatch.undo()
