import { existsSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";

const DIST_DIRS = [".next-dev", ".next-build", ".next"];

function removeDir(dir) {
  if (!existsSync(dir)) {
    return;
  }

  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    return;
  } catch {
    // OneDrive reparse points can fail Node recursive delete; use native fallback.
  }

  try {
    if (process.platform === "win32") {
      execSync(`cmd /c rmdir /s /q "${dir}"`, { stdio: "ignore" });
    } else {
      execSync(`rm -rf "${dir}"`, { stdio: "ignore" });
    }
  } catch {
    // Keep startup resilient; Next will recreate folders if cleanup is partial.
  }
}

for (const dir of DIST_DIRS) {
  removeDir(dir);
}
