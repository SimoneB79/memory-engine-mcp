FROM python:3.12-slim

LABEL org.opencontainers.image.title="Memory Engine"
LABEL org.opencontainers.image.description="MCP Server for dynamic AI memory with decay, learning, and knowledge graph"
LABEL org.opencontainers.image.license="MIT"

WORKDIR /app

# System deps (sqlite3 already in slim, but ensure)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Source code
COPY schema.sql .
COPY db.py .
COPY engine.py .
COPY learning.py .
COPY importer.py .
COPY server.py .
COPY config.json .

# Persistent SQLite DB
VOLUME /data

# Markdown workspace (mount read-only)
VOLUME /workspace

EXPOSE 8085

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8085/sse', timeout=3)" || exit 0

CMD ["python3", "server.py"]
