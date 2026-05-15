import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const createBuildVersion = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toISOString().slice(11, 16).replace(":", "");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `${date}-${time}-${random}`;
};

const buildVersion = process.env.AKM_BUILD_VERSION ?? createBuildVersion();
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
await writeFile(
  new URL("../dist/version.json", import.meta.url),
  `${JSON.stringify({ version: buildVersion })}\n`
);
await run("node", ["scripts/stamp-sw.mjs"]);
