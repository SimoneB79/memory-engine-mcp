FROM python:3.12-slim

LABEL maintainer="SimoneB79"
LABEL description="Memory Engine MCP — local-first graph-aware long-term memory for AI assistants"
LABEL org.opencontainers.image.title="Memory Engine MCP"
LABEL org.opencontainers.image.description="Local-first, graph-aware long-term memory MCP server for AI assistants"
LABEL org.opencontainers.image.source="https://github.com/SimoneB79/memory-engine-mcp"
LABEL org.opencontainers.image.licenses="MIT"
LABEL io.modelcontextprotocol.server.name="io.github.simoneb79/memory-engine-mcp"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY schema.sql .
COPY db.py .
COPY engine.py .
COPY embeddings.py .
COPY auto_bond.py .
COPY curator.py .
COPY learning.py .
COPY importer.py .
COPY session_watcher.py .
COPY server.py .
COPY config.json .

VOLUME /data
VOLUME /sessions
VOLUME /workspace

EXPOSE 8085

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8085/sse', timeout=3)" || exit 1

CMD ["python3", "server.py"]
