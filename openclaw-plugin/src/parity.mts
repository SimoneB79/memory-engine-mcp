#!/usr/bin/env node
// F1 parity CLI: node dist/parity.mjs <db-path>
import { parityReport } from "./db.js";
const path = process.argv[2];
if (!path) {
  console.error("uso: parity.mjs <db.sqlite>");
  process.exit(2);
}
console.log(JSON.stringify(parityReport(path), null, 2));
