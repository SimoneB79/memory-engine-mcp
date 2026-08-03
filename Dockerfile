FROM python:3.12-slim

LABEL maintainer="Simone AI"
LABEL description="Memory Engine — MCP Server for dynamic AI memory"

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
COPY embeddings.py .
COPY auto_bond.py .
COPY curator.py .
COPY learning.py .
COPY importer.py .
COPY session_watcher.py .
COPY auth.py .
COPY config_loader.py .
COPY backup.py .
COPY server.py .
COPY web_ui.py .
COPY config.json .

# Persistent SQLite DB
VOLUME /data

# Markdown workspace (mount read-only)
# OpenClaw sessions (mount for watcher)
VOLUME /sessions

VOLUME /workspace

# MCP (8085) + Web UI (default 8091, override via MEM_UI_PORT env)
EXPOSE 8085 8091 8092 8093

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8085/sse', timeout=3)" || exit 1

CMD ["sh", "-c", "python3 web_ui.py & python3 server.py"]
