import fs from "node:fs";
import path from "node:path";
import test from "ava";

import {
  cleanupFixture,
  createFixture,
  getDistRegisterPath,
  runWithDistRegister,
} from "../helpers/runtime-fixture";

test.before(() => {
  const registerPath = getDistRegisterPath();
  if (!fs.existsSync(registerPath)) {
    throw new Error(
      `Missing dist register file: ${registerPath}. Run "pnpm run release:build" first.`,
    );
  }
});

test("runs TypeScript entry with real file imports", (t) => {
  const fixture = createFixture("ts-multi-file", {
    "entry.ts": `
      import fs from "node:fs";
      import { add } from "./math.ts";
      fs.writeFileSync("result.txt", String(add(1, 2)));
    `,
    "math.ts": `
      export const add = (a: number, b: number): number => a + b;
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
    });

    t.is(result.status, 0, result.stderr);
    t.is(fs.readFileSync(path.join(fixture, "result.txt"), "utf8"), "3");
  } finally {
    cleanupFixture(fixture);
  }
});

test("runs TSX and JSX files as real runtime modules", (t) => {
  const fixture = createFixture("tsx-jsx-runtime", {
    "entry.ts": `
      import fs from "node:fs";
      import valueFromTsx from "./value-tsx.tsx";
      import valueFromJsx from "./value-jsx.jsx";
      fs.writeFileSync("values.txt", valueFromTsx + ":" + valueFromJsx);
    `,
    "value-tsx.tsx": `
      const value: number = 42;
      export default value;
    `,
    "value-jsx.jsx": `
      const value = 7;
      export default value;
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
    });

    t.is(result.status, 0, result.stderr);
    t.is(fs.readFileSync(path.join(fixture, "values.txt"), "utf8"), "42:7");
  } finally {
    cleanupFixture(fixture);
  }
});

test("resolves aliases from rts.config.js", (t) => {
  const fixture = createFixture("alias-resolution", {
    "package.json": `{"name":"runtime-alias-test","version":"1.0.0"}`,
    "rts.config.js": `
      const path = require("node:path");
      module.exports = {
        alias: {
          "@lib": path.join(process.cwd(), "src/lib")
        }
      };
    `,
    "src/lib/math.ts": `
      export const value = 99;
    `,
    "entry.ts": `
      const fs = require("node:fs");
      const { value } = require("@lib/math");
      fs.writeFileSync("alias.txt", String(value));
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
      nodeArgs: ["--format=cjs"],
    });

    t.is(result.status, 0, result.stderr);
    t.is(fs.readFileSync(path.join(fixture, "alias.txt"), "utf8"), "99");
  } finally {
    cleanupFixture(fixture);
  }
});

test("resolves directory import to index file", (t) => {
  const fixture = createFixture("index-resolution", {
    "entry.ts": `
      const fs = require("node:fs");
      const message = require("./feature");
      fs.writeFileSync("index.txt", String(message.default));
    `,
    "feature/index.ts": `
      const message = "ok";
      export default message;
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
      nodeArgs: ["--format=cjs"],
    });

    t.is(result.status, 0, result.stderr);
    t.is(fs.readFileSync(path.join(fixture, "index.txt"), "utf8"), "ok");
  } finally {
    cleanupFixture(fixture);
  }
});

test("runs custom transformer from rts.config.js", (t) => {
  const fixture = createFixture("custom-transformer", {
    "package.json": `{"name":"runtime-transformer-test","version":"1.0.0"}`,
    "rts.config.js": `
      module.exports = {
        transformers: [
          {
            exts: [".txt"],
            transformSync: (code) => ({
              code: Buffer.from("module.exports = " + JSON.stringify(String(code)))
            })
          }
        ]
      };
    `,
    "entry.ts": `
      const fs = require("node:fs");
      const message = require("./raw.txt");
      fs.writeFileSync("transformer.txt", message.trim());
    `,
    "raw.txt": "hello transformer",
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
      nodeArgs: ["--format=cjs"],
    });

    t.is(result.status, 0, result.stderr);
    t.is(
      fs.readFileSync(path.join(fixture, "transformer.txt"), "utf8"),
      "hello transformer",
    );
  } finally {
    cleanupFixture(fixture);
  }
});

test("supports cjs mode for require-based runtime", (t) => {
  const fixture = createFixture("module-modes", {
    "entry.ts": `
      const out = require("node:fs");
      const fs = require("node:fs");
      out.writeFileSync(
        "mode.txt",
        typeof fs.readFileSync === "function" ? "mode=cjs" : "mode=unknown",
      );
    `,
  });

  try {
    const esmResult = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
    });
    t.not(esmResult.status, 0);

    const cjsResult = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
      nodeArgs: ["--format=cjs"],
    });
    t.is(cjsResult.status, 0, cjsResult.stderr);
    t.is(fs.readFileSync(path.join(fixture, "mode.txt"), "utf8"), "mode=cjs");
  } finally {
    cleanupFixture(fixture);
  }
});

test("fails with syntax errors in source files", (t) => {
  const fixture = createFixture("syntax-error", {
    "entry.ts": `
      import "./broken";
    `,
    "broken.ts": `
      const = ;
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
    });

    t.not(result.status, 0);
    t.true(/syntax|unexpected|swc/i.test(result.stderr));
  } finally {
    cleanupFixture(fixture);
  }
});

test("fails with missing module resolution error", (t) => {
  const fixture = createFixture("missing-module", {
    "entry.ts": `
      import "./not-exists";
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "entry.ts"),
    });

    t.not(result.status, 0);
    t.true(
      /cannot find module|err_module_not_found|not found/i.test(result.stderr),
    );
  } finally {
    cleanupFixture(fixture);
  }
});
