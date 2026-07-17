# Installation

Memory Engine MCP can run with Docker or directly with Python.

## Docker

```bash
git clone https://github.com/SimoneB79/memory-engine-mcp.git
cd memory-engine-mcp
docker compose up -d --build
```

Endpoint:

```text
http://localhost:8085/sse
```

The default `docker-compose.yml` mounts two optional local folders:

- `./memory` → `/workspace/memory:ro` for one-way markdown import
- `./sessions` → `/sessions:ro` for optional OpenClaw session watching

Create them if you want to use those features:

```bash
mkdir -p memory sessions
```

## Local Python

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

## MCP client configuration

### Generic SSE client

```json
{
  "mcpServers": {
    "memory-engine": {
      "url": "http://localhost:8085/sse",
      "transport": "sse"
    }
  }
}
```

### Claude Desktop / Cursor / Cline

Use the same SSE configuration if your client supports SSE MCP servers.

If your client only supports stdio, run Memory Engine behind an SSE-capable MCP proxy or use a client that supports HTTP/SSE transports.

### OpenClaw

Example config fragment:

```json
{
  "mcp": {
    "servers": {
      "memory-engine": {
        "type": "sse",
        "url": "http://memory-engine:8085/sse"
      }
    }
  }
}
```

Adjust the hostname depending on your Docker network. If OpenClaw and Memory Engine are on the same Docker network, use the container name (`memory-engine`). From the host, use `localhost`.

## Ollama embeddings

Semantic search is optional but recommended.

Default config expects Ollama at:

```text
http://ollama:11434
```

Recommended model:

```bash
ollama pull nomic-embed-text
```

If you do not use Ollama, edit `config.json`:

```json
{
  "ollama": {
    "enabled": false
  }
}
```

FTS-based recall still works without embeddings.

## First steps

1. Start the server.
2. Connect your MCP client.
3. Create a first atom with `remember`.
4. Query it with `recall`.
5. If you have markdown notes, run `import_markdown`.
6. Run `cognitive_status` to inspect graph health.
