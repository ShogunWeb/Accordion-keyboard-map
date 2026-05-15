import { readFile, writeFile } from "node:fs/promises";

const swPath = new URL("../dist/sw.js", import.meta.url);
const buildVersion = process.env.AKM_BUILD_VERSION ?? new Date().toISOString().replace(/[-:.TZ]/g, "");
const source = await readFile(swPath, "utf8");

await writeFile(swPath, source.replaceAll("__AKM_BUILD_VERSION__", buildVersion));
