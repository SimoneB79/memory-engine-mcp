"""
Minimal web UI for Memory Engine — graph explorer + contradictions.

Runs as a separate HTTP server on port 8086 (configurable via MEM_UI_PORT).
Does NOT interfere with the MCP SSE transport on 8085.
"""

import json
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from db import DB

DB_PATH = os.environ.get("MEMORY_DB_PATH", "/data/memory.db")
UI_PORT = int(os.environ.get("MEM_UI_PORT", "6000"))

_db: DB | None = None


def get_db() -> DB:
    global _db
    if _db is None:
        _db = DB(DB_PATH)
    return _db

HTML_PAGE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🧠 Memory Engine — Graph Explorer</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0d1117; color: #c9d1d9; }
#app { display: flex; height: 100vh; }
#sidebar { width: 380px; min-width: 380px; background: #161b22; border-right: 1px solid #30363d; overflow-y: auto; padding: 16px; }
#main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
#header { padding: 12px 20px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; align-items: center; gap: 16px; }
#header h1 { font-size: 16px; color: #58a6ff; white-space: nowrap; }
#header input { flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; padding: 6px 12px; border-radius: 6px; font-size: 13px; }
#header input:focus { outline: none; border-color: #58a6ff; }
#header button { background: #238636; color: #fff; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: nowrap; }
#header button:hover { background: #2ea043; }
#viz { flex: 1; overflow: hidden; background: #0d1117; position: relative; }
#tabs { display: flex; background: #161b22; border-bottom: 1px solid #30363d; }
.tab { padding: 8px 20px; cursor: pointer; font-size: 13px; color: #8b949e; border-bottom: 2px solid transparent; }
.tab.active { color: #58a6ff; border-bottom-color: #58a6ffff; }
.tab:hover { color: #c9d1d9; }
#info-panel { position: absolute; top: 12px; right: 12px; width: 340px; max-width: calc(100vw - 400px); background: #161b22ee; border: 1px solid #30363d; border-radius: 8px; padding: 14px; max-height: calc(100vh - 80px); overflow-y: auto; display: none; font-size: 12px; z-index: 10; box-sizing: border-box; }
#info-panel h3 { color: #58a6ff; margin-bottom: 8px; font-size: 14px; }
#info-panel .meta { color: #8b949e; margin-bottom: 4px; }
#info-panel .body { margin-top: 8px; white-space: pre-wrap; word-wrap: break-word; max-height: 250px; overflow-y: auto; padding: 8px; background: #0d1117; border-radius: 4px; font-size: 11px; }
#info-panel::-webkit-scrollbar, #info-panel .body::-webkit-scrollbar { width: 6px; }
#info-panel::-webkit-scrollbar-track, #info-panel .body::-webkit-scrollbar-track { background: transparent; }
#info-panel::-webkit-scrollbar-thumb, #info-panel .body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
#info-panel::-webkit-scrollbar-thumb:hover, #info-panel .body::-webkit-scrollbar-thumb:hover { background: #484f58; }
#info-panel .close { position: absolute; top: 8px; right: 12px; cursor: pointer; color: #8b949e; font-size: 18px; }
#info-panel .close:hover { color: #f85149; }
.atom-list-item { padding: 8px 10px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; font-size: 12px; border: 1px solid transparent; }
.atom-list-item:hover { background: #21262d; border-color: #30363d; }
.atom-list-item .title { color: #c9d1d9; font-weight: 500; }
.atom-list-item .sub { color: #8b949e; font-size: 11px; margin-top: 2px; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-left: 4px; }
.badge.active { background: #1a7f3744; color: #3fb950; }
.badge.superseded { background: #da363344; color: #f85149; }
.badge.episodic { background: #1f6feb33; color: #58a6ff; }
.badge.semantic { background: #8957e533; color: #bc8cff; }
.badge.procedural { background: #d2992233; color: #e3b341; }
.contradiction-item { padding: 8px; border-left: 3px solid #f85149; margin-bottom: 6px; background: #0d1117; border-radius: 4px; font-size: 12px; }
.contradiction-item .reason { color: #f85149; font-size: 11px; margin-top: 4px; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.stat { background: #0d1117; border-radius: 6px; padding: 8px 10px; }
.stat .num { font-size: 20px; font-weight: 700; color: #58a6ff; }
.stat .lbl { font-size: 10px; color: #8b949e; text-transform: uppercase; }
svg { width: 100%; height: 100%; }
.node-circle { cursor: pointer; }
.node-circle:hover { stroke: #58a6ff; stroke-width: 2; }
.edge-line { stroke: #30363d; stroke-width: 1; pointer-events: none; }
.edge-text { fill: #6e7681; font-size: 9px; pointer-events: none; }
.section-title { color: #58a6ff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #30363d; }
#loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #8b949e; font-size: 14px; }
</style>
</head>
<body>
<div id="app">
  <div id="sidebar">
    <div id="sidebar-content"></div>
  </div>
  <div id="main">
    <div id="header">
      <h1>🧠 Memory Engine</h1>
      <input id="search" placeholder="Search atoms..." />
      <button onclick="doSearch()">Search</button>
    </div>
    <div id="tabs">
      <div class="tab active" onclick="switchTab('graph')">Graph</div>
      <div class="tab" onclick="switchTab('contradictions')">Contradictions</div>
      <div class="tab" onclick="switchTab('stats')">Stats</div>
    </div>
    <div id="viz">
      <div id="loading">Loading...</div>
      <svg id="svg"></svg>
      <div id="info-panel"></div>
    </div>
  </div>
</div>
<script>
let currentTab = 'graph';
let graphData = null;

async function api(path) {
  const r = await fetch('/api/' + path);
  return r.json();
}

function badge(status, tier) {
  let s = '';
  if (status) s += `<span class="badge ${status}">${status}</span>`;
  if (tier) s += `<span class="badge ${tier}">${tier}</span>`;
  return s;
}

async function loadStats() {
  const stats = await api('stats');
  const summary = await api('summary');
  document.getElementById('sidebar-content').innerHTML = `
    <div class="stats">
      <div class="stat"><div class="num">${stats.atom_count||0}</div><div class="lbl">Atoms</div></div>
      <div class="stat"><div class="num">${stats.bond_count||0}</div><div class="lbl">Bonds</div></div>
      <div class="stat"><div class="num">${stats.contradiction_count||0}</div><div class="lbl">Contradictions</div></div>
      <div class="stat"><div class="num">${stats.pending_questions||0}</div><div class="lbl">Pending Q</div></div>
    </div>
    <div class="section-title">By Domain</div>
    ${(summary.domains||[]).map(d => `<div class="atom-list-item" onclick="searchDomain('${d.domain}')"><div class="title">${d.domain}</div><div class="sub">${d.atom_count} atoms, ${d.bond_count} bonds</div></div>`).join('')}
  `;
}

async function loadContradictions() {
  const items = await api('contradictions?limit=50');
  if (!items.length) {
    document.getElementById('sidebar-content').innerHTML = '<div style="color:#8b949e;padding:16px;">No contradictions found.</div>';
    document.getElementById('viz').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8b949e;">No contradictions in memory.</div>';
    return;
  }
  document.getElementById('sidebar-content').innerHTML = items.map(c => `
    <div class="contradiction-item">
      <div><strong>${c.old_atom_id}</strong> → <strong>${c.new_atom_id}</strong></div>
      <div class="reason">${c.reason || '(no reason)'}</div>
      <div style="margin-top:4px;color:#8b949e;">${new Date(c.created_at*1000).toLocaleString()}</div>
    </div>
  `).join('');
}

async function doSearch() {
  const q = document.getElementById('search').value.trim();
  if (!q) return loadGraph();
  const results = await api('search?q=' + encodeURIComponent(q));
  document.getElementById('sidebar-content').innerHTML = results.map(a => `
    <div class="atom-list-item" onclick="showAtom('${a.id}')">
      <div class="title">${a.title}${badge(a.status, a.memory_tier)}</div>
      <div class="sub">${a.domain} · ${a.type}</div>
    </div>
  `).join('');
}

async function searchDomain(d) {
  document.getElementById('search').value = '';
  const results = await api('atoms?domain=' + encodeURIComponent(d) + '&limit=50');
  document.getElementById('sidebar-content').innerHTML = results.map(a => `
    <div class="atom-list-item" onclick="showAtom('${a.id}')">
      <div class="title">${a.title}${badge(a.status, a.memory_tier)}</div>
      <div class="sub">${a.type} · conf ${a.confidence}</div>
    </div>
  `).join('');
}

async function showAtom(id) {
  const atom = await api('atom?id=' + encodeURIComponent(id));
  const impact = await api('impact?id=' + encodeURIComponent(id));
  const panel = document.getElementById('info-panel');
  panel.style.display = 'block';
  panel.innerHTML = `
    <span class="close" onclick="this.parentElement.style.display='none'">&times;</span>
    <h3>${atom.title}</h3>
    <div class="meta">ID: ${atom.id}</div>
    <div class="meta">Type: ${atom.type} · Tier: ${atom.memory_tier} · Status: ${atom.status}</div>
    <div class="meta">Domain: ${atom.domain} · Confidence: ${atom.confidence}</div>
    <div class="meta">Bonds: ${impact.total_edges} · Dependents: ${impact.direct_dependents} · Contradictions: ${impact.contradictions_count}</div>
    ${atom.tags && atom.tags.length ? `<div class="meta">Tags: ${atom.tags.join(', ')}</div>` : ''}
    <div class="body">${(atom.body||'').substring(0,2000)}</div>
    ${impact.contradictions.length ? `<div class="section-title" style="margin-top:10px;">Contradictions</div>${impact.contradictions.map(c=>`<div class="contradiction-item"><div>${c.old_atom_id} → ${c.new_atom_id}</div><div class="reason">${c.reason||''}</div></div>`).join('')}` : ''}
    ${impact.edges.length ? `<div class="section-title" style="margin-top:10px;">Connected (${impact.total_edges})</div>${impact.edges.slice(0,15).map(e=>`<div style="font-size:11px;color:#8b949e;margin-bottom:2px;">${e.from_id} —${e.relation}→ ${e.to_id}</div>`).join('')}` : ''}
  `;
}

async function loadGraph() {
  document.getElementById('loading').style.display = 'block';
  graphData = await api('graph?limit=200');
  document.getElementById('loading').style.display = 'none';
  const atoms = await api('atoms?limit=200');
  document.getElementById('sidebar-content').innerHTML = atoms.map(a => `
    <div class="atom-list-item" onclick="showAtom('${a.id}')">
      <div class="title">${a.title}${badge(a.status, a.memory_tier)}</div>
      <div class="sub">${a.domain} · ${a.type}</div>
    </div>
  `).join('');
  drawGraph();
}

function drawGraph() {
  if (!graphData) return;
  const svg = document.getElementById('svg');
  const W = svg.clientWidth || 800, H = svg.clientHeight || 600;
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];
  const cx = W/2, cy = H/2;

  // Circle layout
  const n = nodes.length;
  const R = Math.min(W, H) * 0.38;
  nodes.forEach((node, i) => {
    const angle = (i / n) * 2 * Math.PI;
    node.x = cx + R * Math.cos(angle);
    node.y = cy + R * Math.sin(angle);
  });

  const colors = {active:'#3fb950', superseded:'#f85149', archived:'#8b949e'};
  const tierColors = {episodic:'#58a6ff', semantic:'#bc8cff', procedural:'#e3b341'};

  let html = '';
  // Edges
  edges.forEach(e => {
    const from = nodes.find(n=>n.id===e.from_id);
    const to = nodes.find(n=>n.id===e.to_id);
    if (!from || !to) return;
    html += `<line class="edge-line" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`;
  });
  // Nodes
  nodes.forEach(node => {
    const color = colors[node.status] || '#8b949e';
    const tierColor = tierColors[node.memory_tier] || '#8b949e';
    const r = node.status === 'active' ? 6 : 4;
    html += `<circle class="node-circle" cx="${node.x}" cy="${node.y}" r="${r}" fill="${color}" stroke="${tierColor}" stroke-width="2" onclick="showAtom('${node.id}')"><title>${node.title}</title></circle>`;
    if (n <= 60) {
      const label = (node.title||'').substring(0,20);
      html += `<text x="${node.x}" y="${node.y-10}" text-anchor="middle" fill="#8b949e" font-size="9" pointer-events="none">${label}</text>`;
    }
  });

  svg.innerHTML = html;
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('info-panel').style.display = 'none';
  if (tab === 'graph') loadGraph();
  else if (tab === 'contradictions') loadContradictions();
  else if (tab === 'stats') loadStats();
}

document.getElementById('search').addEventListener('keydown', e => { if(e.key==='Enter') doSearch(); });
window.addEventListener('resize', () => { if(currentTab==='graph') drawGraph(); });
loadGraph();
</script>
</body>
</html>"""


class UIHandler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # suppress access log

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _html(self, text):
        body = text.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)

        if path == "/" or path == "/ui":
            return self._html(HTML_PAGE)

        if path == "/api/stats":
            return self._json(self._get_stats())

        if path == "/api/summary":
            return self._json(self._get_summary())

        if path == "/api/atoms":
            domain = qs.get("domain", [None])[0]
            limit = int(qs.get("limit", ["50"])[0])
            return self._json(self._get_atoms(domain, limit))

        if path == "/api/atom":
            atom_id = qs.get("id", [None])[0]
            if not atom_id:
                return self._json({"error": "missing id"}, 400)
            atom = get_db().get_atom(atom_id)
            if not atom:
                return self._json({"error": "not found"}, 404)
            return self._json(atom)

        if path == "/api/search":
            q = qs.get("q", [""])[0]
            limit = int(qs.get("limit", ["30"])[0])
            return self._json(self._search(q, limit))

        if path == "/api/graph":
            limit = int(qs.get("limit", ["200"])[0])
            return self._json(self._get_graph(limit))

        if path == "/api/impact":
            atom_id = qs.get("id", [None])[0]
            depth = int(qs.get("depth", ["2"])[0])
            if not atom_id:
                return self._json({"error": "missing id"}, 400)
            result = get_db().get_impact(atom_id, depth=min(depth, 5))
            return self._json(result or {"error": "not found"}, 404 if not result else 200)

        if path == "/api/contradictions":
            limit = int(qs.get("limit", ["50"])[0])
            return self._json(get_db().list_contradictions(limit=limit))

        self._json({"error": "not found"}, 404)

    # ─── Data helpers ──────────────────────────────────────

    @staticmethod
    def _get_stats():
        with get_db().conn() as c:
            atom_count = c.execute("SELECT COUNT(*) FROM atoms").fetchone()[0]
            bond_count = c.execute("SELECT COUNT(*) FROM bonds").fetchone()[0]
            contradiction_count = c.execute("SELECT COUNT(*) FROM memory_contradictions").fetchone()[0]
            pending = c.execute("SELECT COUNT(*) FROM human_questions WHERE status='pending'").fetchone()[0]
            active = c.execute("SELECT COUNT(*) FROM atoms WHERE status='active'").fetchone()[0]
            superseded = c.execute("SELECT COUNT(*) FROM atoms WHERE status='superseded'").fetchone()[0]
            tier_counts = {}
            for row in c.execute("SELECT memory_tier, COUNT(*) as cnt FROM atoms GROUP BY memory_tier").fetchall():
                tier_counts[row[0] or "semantic"] = row[1]
        return {
            "atom_count": atom_count, "bond_count": bond_count,
            "contradiction_count": contradiction_count, "pending_questions": pending,
            "active_atoms": active, "superseded_atoms": superseded,
            "tier_counts": tier_counts,
        }

    @staticmethod
    def _get_summary():
        with get_db().conn() as c:
            domains = c.execute(
                "SELECT domain, COUNT(*) as atom_count FROM atoms WHERE status='active' GROUP BY domain ORDER BY atom_count DESC LIMIT 30"
            ).fetchall()
            # bond count per domain
            result = []
            for d in domains:
                bc = c.execute(
                    "SELECT COUNT(*) FROM bonds WHERE from_id IN (SELECT id FROM atoms WHERE domain=?) OR to_id IN (SELECT id FROM atoms WHERE domain=?)",
                    (d[0], d[0]),
                ).fetchone()[0]
                result.append({"domain": d[0], "atom_count": d[1], "bond_count": bc})
        return {"domains": result}

    @staticmethod
    def _get_atoms(domain, limit):
        query = "SELECT id, title, type, domain, status, memory_tier, confidence FROM atoms WHERE status='active'"
        params = []
        if domain:
            query += " AND domain=?"
            params.append(domain)
        query += " ORDER BY weight DESC LIMIT ?"
        params.append(limit)
        with get_db().conn() as c:
            rows = c.execute(query, params).fetchall()
        return [dict(r) for r in rows]

    @staticmethod
    def _search(q, limit):
        if not q:
            return []
        with get_db().conn() as c:
            rows = c.execute(
                "SELECT id, title, type, domain, status, memory_tier, confidence FROM atoms WHERE title LIKE ? OR body LIKE ? ORDER BY weight DESC LIMIT ?",
                (f"%{q}%", f"%{q}%", limit),
            ).fetchall()
        return [dict(r) for r in rows]

    @staticmethod
    def _get_graph(limit):
        with get_db().conn() as c:
            atoms = c.execute(
                "SELECT id, title, type, domain, status, memory_tier FROM atoms WHERE status IN ('active','superseded') ORDER BY weight DESC LIMIT ?",
                (limit,),
            ).fetchall()
            ids = [r["id"] for r in atoms]
            edges = []
            if ids:
                placeholders = ",".join("?" for _ in ids)
                edges = [dict(r) for r in c.execute(
                    f"SELECT from_id, to_id, relation, strength FROM bonds WHERE from_id IN ({placeholders}) AND to_id IN ({placeholders})",
                    (*ids, *ids),
                ).fetchall()]
        return {"nodes": [dict(r) for r in atoms], "edges": edges}


def main():
    print(f"🖥️  Memory Engine UI starting on port {UI_PORT}")
    server = HTTPServer(("0.0.0.0", UI_PORT), UIHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
