import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
if (!existsSync(join(root, ".git"))) {
  process.stdout.write("Git repository not initialized; hook setup skipped.\n");
  process.exit(0);
}

const safeRoot = root.replaceAll("\\", "/").replace(/\/$/, "");
execFileSync(
  "git",
  [
    "-c",
    `safe.directory=${safeRoot}`,
    "config",
    "--local",
    "core.hooksPath",
    ".githooks",
  ],
  {
    cwd: root,
    stdio: "inherit",
  },
);
process.stdout.write("Git pre-commit hook enabled.\n");
