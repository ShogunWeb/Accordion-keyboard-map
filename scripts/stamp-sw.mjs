import { readFile, writeFile } from "node:fs/promises";

const createBuildVersion = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now.toISOString().slice(11, 16).replace(":", "");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `${date}-${time}-${random}`;
};

const swPath = new URL("../dist/sw.js", import.meta.url);
const buildVersion = process.env.AKM_BUILD_VERSION ?? createBuildVersion();
const source = await readFile(swPath, "utf8");

await writeFile(swPath, source.replaceAll("__AKM_BUILD_VERSION__", buildVersion));
