import { spawn } from "node:child_process";

const buildVersion = process.env.AKM_BUILD_VERSION ?? new Date().toISOString().replace(/[-:.TZ]/g, "");
const env = { ...process.env, AKM_BUILD_VERSION: buildVersion };

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });

await run("tsc", ["-b"]);
await run("vite", ["build"]);
await run("node", ["scripts/stamp-sw.mjs"]);
