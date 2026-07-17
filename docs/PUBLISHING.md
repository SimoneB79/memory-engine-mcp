# Publishing checklist

This repo is prepared for MCP directory and registry publication.

## Current identity

- GitHub repo: `https://github.com/SimoneB79/memory-engine-mcp`
- MCP Registry name: `io.github.simoneb79/memory-engine-mcp`
- Current version: `1.5.2`
- License: MIT
- Existing listing: `https://mcpmarket.com/server/memory-engine`

## Official MCP Registry

The official registry stores metadata and validates that the referenced package/image belongs to the publisher.

Prepared files:

- [`server.json`](../server.json) — registry metadata
- [`Dockerfile`](../Dockerfile) — includes `io.modelcontextprotocol.server.name` OCI label
- [`mcp.json`](../mcp.json) — client config example

Expected package path after publishing a container image:

```text
ghcr.io/simoneb79/memory-engine-mcp:1.5.2
```

Recommended flow:

1. Build and publish the Docker image to GHCR.
2. Verify the image contains the MCP ownership label:

   ```bash
   docker inspect ghcr.io/simoneb79/memory-engine-mcp:1.5.2 \
     --format '{{ index .Config.Labels "io.modelcontextprotocol.server.name" }}'
   ```

3. Install the official `mcp-publisher` CLI.
4. Login with GitHub.
5. Run `mcp-publisher publish` from the repo root.

## Directory targets

Good publication targets:

- Official MCP Registry — primary source of truth
- Glama — discovery, scoring, and browser testing
- Smithery — installation/distribution UX
- PulseMCP — ecosystem visibility
- mcp.so / mcp.directory — SEO and directory discovery
- awesome-mcp-servers lists — GitHub discovery

## Repository polish checklist

- [x] Clear README with short value proposition
- [x] Docker quick start
- [x] MCP client config example
- [x] Registry metadata (`server.json`)
- [x] OCI verification label in Dockerfile
- [x] MIT license
- [x] Issue templates
- [ ] Publish GHCR image
- [ ] Publish to Official MCP Registry
- [ ] Submit to Glama
- [ ] Submit to Smithery
- [ ] Submit to awesome lists
