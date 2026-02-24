import fs from "node:fs";
import path from "node:path";
import test from "ava";

import {
  cleanupFixture,
  createFixture,
  getDistRegisterPath,
  runWithDistRegister,
} from "./helpers/runtime-fixture";

test.before(() => {
  if (!fs.existsSync(getDistRegisterPath())) {
    throw new Error("Runtime integration tests require built dist output.");
  }
});

test("real-world project fixture runs through dist register", (t) => {
  const fixture = createFixture("real-world-smoke", {
    "package.json": `{"name":"real-world-smoke","version":"1.0.0"}`,
    "rts.config.js": `
      const path = require("node:path");
      module.exports = {
        alias: {
          "@utils": path.join(process.cwd(), "src/utils")
        }
      };
    `,
    "src/utils/format.ts": `
      export const format = (v: string): string => "[" + v.toUpperCase() + "]";
    `,
    "src/math/index.ts": `
      export const mul = (a: number, b: number): number => a * b;
    `,
    "src/entry.ts": `
      import fs from "node:fs";
      import { format } from "@utils/format";
      import { mul } from "./math/index.ts";
      fs.writeFileSync("result.txt", format(String(mul(6, 7))));
    `,
  });

  try {
    const result = runWithDistRegister({
      cwd: fixture,
      entry: path.join(fixture, "src/entry.ts"),
    });
    t.is(result.status, 0, result.stderr);
    t.is(fs.readFileSync(path.join(fixture, "result.txt"), "utf8"), "[42]");
  } finally {
    cleanupFixture(fixture);
  }
});
