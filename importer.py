"""
Memory Engine — Markdown Importer
Reads existing markdown files and creates atoms.
One-way: markdown → SQLite. Never writes back to markdown.
"""
import os
import re
import json
import time
from pathlib import Path
from db import DB


class MarkdownImporter:
    def __init__(self, db: DB, source_dir: str):
        self.db = db
        self.source_dir = Path(source_dir)

    def import_all(self, verbose: bool = False) -> dict:
        """
        Walk the markdown directory and import all .md files.
        Returns summary statistics.
        """
        stats = {"imported": 0, "skipped": 0, "errors": 0, "files": []}
        if not self.source_dir.exists():
            return {**stats, "error": f"Source dir {self.source_dir} does not exist"}

        for md_file in sorted(self.source_dir.rglob("*.md")):
            try:
                result = self.import_file(str(md_file))
                if result["action"] == "imported":
                    stats["imported"] += 1
                elif result["action"] == "updated":
                    stats["imported"] += 1
                else:
                    stats["skipped"] += 1
                stats["files"].append(result)
                if verbose:
                    print(f"  {'+' if result['action'] != 'skipped' else '-'} {md_file}")
            except Exception as e:
                stats["errors"] += 1
                stats["files"].append({"file": str(md_file), "action": "error", "error": str(e)})

        return stats

    def import_file(self, filepath: str) -> dict:
        """Import a single markdown file into the memory engine."""
        path = Path(filepath)
        if not path.exists():
            return {"file": filepath, "action": "error", "error": "File not found"}

        content = path.read_text(encoding="utf-8")
        if not content.strip():
            return {"file": filepath, "action": "skipped", "reason": "Empty file"}

        # Check if already imported (by source_path)
        with self.db.conn() as c:
            existing = c.execute(
                "SELECT id, updated_at FROM atoms WHERE source_path = ?", (str(path),)
            ).fetchone()

        # Parse markdown
        parsed = self._parse_markdown(content, path)
        tags = parsed["tags"]
        domain = parsed["domain"]
        atom_type = parsed["type"]
        confidence = parsed["confidence"]

        if existing:
            # Check if file was modified since last import
            file_mtime = int(path.stat().st_mtime)
            if file_mtime <= existing["updated_at"]:
                return {"file": filepath, "action": "skipped", "reason": "Not modified"}

            # Update existing atom
            atom = self.db.update_atom(
                existing["id"],
                title=parsed["title"],
                body=content,
                tags=tags,
                domain=domain,
                type=atom_type,
                confidence=confidence,
                changed_by="import",
                change_reason=f"Re-imported from {path.name}",
            )
            return {"file": filepath, "action": "updated", "atom_id": existing["id"]}

        # Create new atom
        atom = self.db.create_atom(
            title=parsed["title"],
            body=content,
            type=atom_type,
            domain=domain,
            confidence=confidence,
            tags=tags,
            source="markdown",
            source_path=str(path),
            meta={"original_path": str(path)},
        )
        return {"file": filepath, "action": "imported", "atom_id": atom["id"]}

    def _parse_markdown(self, content: str, path: Path) -> dict:
        """
        Extract metadata from markdown content.
        Uses heuristics based on path, frontmatter, and content.
        """
        rel_path = path.relative_to(self.source_dir) if path.is_relative_to(self.source_dir) else path
        parts = list(rel_path.parts)

        # Determine domain from path
        if "facts" in parts:
            domain = parts[parts.index("facts") + 1] if parts.index("facts") + 1 < len(parts) else "facts"
            domain = f"facts/{domain.replace('.md', '')}"
            atom_type = "fact"
        elif "decisions" in parts:
            domain = "decisions"
            atom_type = "decision"
            domain = f"decisions/{path.stem}"
        elif "procedures" in parts:
            domain = "procedures"
            atom_type = "procedure"
            domain = f"procedures/{path.stem}"
        elif "projects" in parts:
            idx = parts.index("projects")
            domain = parts[idx + 1] if idx + 1 < len(parts) else "projects"
            domain = f"projects/{domain.replace('.md', '')}"
            atom_type = "project"
        elif "daily" in parts:
            domain = f"daily/{path.stem}"
            atom_type = "log"
        else:
            domain = path.stem
            atom_type = "note"

        # Title: first H1 or filename
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else path.stem

        # Tags: extract from content (#tag patterns or frontmatter)
        tags = set()
        # Inline tags: #word at end of lines (Obsidian style)
        for m in re.finditer(r"#([a-zA-Z0-9_\-]+)", content):
            tag = m.group(1).lower()
            if tag not in ("md", "sql", "py"):
                tags.add(tag)

        # Confidence: default 0.7 for markdown (human-written, reasonably reliable)
        confidence = 0.7

        return {
            "title": title[:200],
            "tags": sorted(tags)[:15],
            "domain": domain[:100],
            "type": atom_type,
            "confidence": confidence,
        }

    def auto_bond(self) -> int:
        """
        After import, try to create bonds between atoms with overlapping tags.
        Returns number of bonds created.
        """
        created = 0
        atoms = self.db.list_atoms(status="active", limit=500)

        for i, a in enumerate(atoms):
            tags_a = set(json.loads(a.get("tags") or "[]"))
            if not tags_a:
                continue
            for b in atoms[i + 1:]:
                tags_b = set(json.loads(b.get("tags") or "[]"))
                overlap = tags_a & tags_b
                if len(overlap) >= 2:  # At least 2 shared tags
                    strength = min(1.0, len(overlap) / max(len(tags_a | tags_b), 1))
                    try:
                        self.db.create_bond(
                            a["id"], b["id"], "related_to",
                            strength=round(strength, 3),
                            evidence=f"Shared tags: {', '.join(sorted(overlap)[:5])}",
                        )
                        created += 1
                    except Exception:
                        pass  # Bond may already exist
        return created
