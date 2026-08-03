"""
Shared fixtures for Memory Engine tests.
Uses in-memory SQLite (shared via URI) for isolation and speed.
"""
import pytest
import sys
from pathlib import Path

# Add project root to sys.path so we can import db, engine directly
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from db import DB
from engine import Engine


TEST_CONFIG = {
    "ranking": {
        "fts_weight": 0.30,
        "semantic_weight": 0.30,
        "confidence_weight": 0.20,
        "recency_weight": 0.10,
        "weight_factor": 0.10,
        "tier_boosts": {
            "semantic": 0.04,
            "procedural": 0.03,
            "episodic": 0.0,
        },
        "status_penalties": {
            "superseded": -0.25,
            "archived": -0.15,
            "stale": -0.10,
            "merged": -0.35,
        },
    },
    "decay": {
        "interval_days": 30,
        "factor": 0.95,
    },
}


@pytest.fixture
def db():
    """Fresh in-memory DB for each test."""
    # Use file-based temp DB to allow WAL and multiple connections
    import tempfile, os
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        instance = DB(path)
        yield instance
    finally:
        os.unlink(path)


@pytest.fixture
def engine(db):
    """Engine wired to the test DB."""
    return Engine(db, TEST_CONFIG)


@pytest.fixture
def db_with_atoms(db):
    """DB pre-populated with a few atoms for search/graph tests."""
    db.create_atom("Python programming language", "Python is a high-level language", type="fact", domain="tech")
    db.create_atom("Rust programming language", "Rust is a systems language focused on safety", type="fact", domain="tech")
    db.create_atom("Docker containers", "Docker packages software into containers", type="fact", domain="devops")
    db.create_atom("Kubernetes orchestration", "Kubernetes orchestrates container clusters", type="fact", domain="devops")
    db.create_atom("Memory Engine", "A knowledge graph MCP server", type="fact", domain="projects")
    return db
