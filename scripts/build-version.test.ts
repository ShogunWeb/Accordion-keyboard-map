import { existsSync, readFileSync } from "node:fs";
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

    // Lazy-loaded features add bundles: inspect the actual application entry.
    const jsBundle = readText("dist/index.html")
      .match(/<script\b[^>]*\bsrc="[^"]*\/assets\/([^"/]+\.js)"/)?.[1];
    expect(jsBundle).toBeDefined();

    const appBuildVersions = [
      ...readText(join("dist/assets", jsBundle!)).matchAll(/"(\d{8}-\d{4}-\d{4})"/g),
    ].map((match) => match[1]);

    expect(appBuildVersions).toContain(versionJson.version);
  });
});
