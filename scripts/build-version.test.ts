import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const buildVersionPattern = /^\d{8}-\d{4}-\d{4}$/;

const readText = (path: string) => readFileSync(path, "utf8");

describe("build version", () => {
  it("keeps the service worker source ready for build-time stamping", () => {
    expect(readText("public/sw.js")).toContain('__AKM_BUILD_VERSION__');
    expect(readText("scripts/stamp-sw.mjs")).toContain('__AKM_BUILD_VERSION__');
  });

  it("uses one stamped build version across generated files when dist exists", () => {
    if (!existsSync("dist/version.json")) {
      return;
    }

    const versionJson = JSON.parse(readText("dist/version.json")) as { version?: string };
    expect(versionJson.version).toMatch(buildVersionPattern);

    const serviceWorkerVersion = readText("dist/sw.js").match(/APP_VERSION = "([^"]+)"/)?.[1];
    expect(serviceWorkerVersion).toBe(versionJson.version);

    const jsBundle = readdirSync("dist/assets").find((file) => file.endsWith(".js"));
    expect(jsBundle).toBeDefined();

    const appBuildVersions = [
      ...readText(join("dist/assets", jsBundle!)).matchAll(/"(\d{8}-\d{4}-\d{4})"/g),
    ].map((match) => match[1]);

    expect(appBuildVersions).toContain(versionJson.version);
  });
});
