import test from "ava";
import fs from "fs";
import os from "os";
import path from "path";
import { loadConfigFromCwd, mergeConfig, type RTSOptions } from "../src/config";

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "rts-config-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, content);
  return file;
}

function cleanupDir(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
  fs.rmdirSync(dir);
}

test("loadConfigFromCwd loads JSON config", (t) => {
  const dir = createTempDir();
  try {
    writeFile(
      dir,
      "rts.config.json",
      JSON.stringify({
        alias: { "@components": "./src/components", "@utils": ["./src/utils"] },
        transformers: [],
      }),
    );

    const result = loadConfigFromCwd(dir) as RTSOptions;
    t.truthy(result);
    t.is(result.alias?.["@components"], "./src/components");
    t.deepEqual(result.alias?.["@utils"], ["./src/utils"]);
    t.deepEqual(result.transformers, []);
  } finally {
    cleanupDir(dir);
  }
});

test("loadConfigFromCwd loads JS config (module.exports)", (t) => {
  const dir = createTempDir();
  try {
    writeFile(
      dir,
      "rts.config.js",
      "module.exports = { alias: { '@a': './a' }, transformers: [] };",
    );
    const result = loadConfigFromCwd(dir) as RTSOptions;
    t.truthy(result);
    t.is(result.alias?.["@a"], "./a");
    t.deepEqual(result.transformers, []);
  } finally {
    cleanupDir(dir);
  }
});

test("loadConfigFromCwd returns undefined when no file", (t) => {
  const dir = createTempDir();
  try {
    const result = loadConfigFromCwd(dir);
    t.is(result, undefined);
  } finally {
    cleanupDir(dir);
  }
});

test("mergeConfig merges alias and appends transformers", (t) => {
  const base: RTSOptions = {
    alias: { "@a": "./a" },
    transformers: [
      {
        exts: [".x"],
        transformSync: (code: Buffer) => ({ code: Buffer.from(code) })
      },
    ],
  };
  const next: RTSOptions = {
    alias: { "@b": "./b" },
    transformers: [
      {
        exts: [".y"],
        transformSync: (code: Buffer) => ({ code: code.toString() })
      },
    ],
  };

  const merged = mergeConfig(base, next);
  t.deepEqual(merged.alias, { "@a": "./a", "@b": "./b" });
  t.is(merged.transformers?.length, 2);
});

test("mergeConfig keeps options precedence on simple fields", (t) => {
  const base = {} as RTSOptions;
  const next = { alias: { "@x": "./x" } } as RTSOptions;
  const merged = mergeConfig(base, next);
  t.deepEqual(merged.alias, { "@x": "./x" });
});
