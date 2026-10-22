// Post-build: turn dist/client/* into a classic static dist/ (index.html + assets/)
import { existsSync, readdirSync, renameSync, rmSync, copyFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dist = "dist";
const client = join(dist, "client");

if (!existsSync(join(client, "index.html"))) {
  console.error("[flatten-dist] dist/client/index.html not found - did the SPA prerender run?");
  process.exit(1);
}

// move client output out of the way, wipe dist, then move it back flat
const tmp = mkdtempSync(join(tmpdir(), "dist-"));
const staged = join(tmp, "client");
renameSync(client, staged);
rmSync(dist, { recursive: true, force: true });
renameSync(staged, dist);

// SPA fallback for hosts that serve 404.html (GitHub Pages, etc.)
copyFileSync(join(dist, "index.html"), join(dist, "404.html"));

console.log("[flatten-dist] dist/ ->", readdirSync(dist).join(", "));
