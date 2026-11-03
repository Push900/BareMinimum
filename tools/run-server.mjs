import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  throw new Error("Usage: node tools/run-server.mjs <dev|start>");
}

const root = fileURLToPath(new URL("../", import.meta.url));
const isDevelopment = mode === "dev";
const entry = isDevelopment
  ? fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url))
  : fileURLToPath(new URL("../dist/index.js", import.meta.url));
const args = isDevelopment ? [entry, "watch", "server/_core/index.ts"] : [entry];
const child = spawn(process.execPath, args, {
  cwd: root,
  env: { ...process.env, NODE_ENV: isDevelopment ? "development" : "production" },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`Could not start the ${mode} server:`, error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : code ?? 1;
});
