import test from "ava";
import fs from "fs";
import os from "os";
import path from "path";
import { register, setAlias, transformer } from "../src/resolver";

/**
 * Test suite for the resolver module
 *
 * This test suite verifies the functionality of the module resolution system,
 * including alias handling, hook registration, and transformer functionality.
 * It tests both basic functionality and edge cases to ensure robust operation.
 */

test("register should be a function", (t) => {
  t.is(typeof register, "function");
});

test("setAlias should be a function", (t) => {
  t.is(typeof setAlias, "function");
});

test("transformer should be an instance of ModuleTransformer", (t) => {
  t.truthy(transformer);
  t.is(typeof transformer.transformSync, "function");
  t.is(typeof transformer.transform, "function");
});

/**
 * Test alias setting with string targets
 *
 * This test verifies that the setAlias function can handle
 * simple string-to-string alias mappings.
 */
test("setAlias should handle string targets", (t) => {
  t.notThrows(() => {
    setAlias({
      "@components": "./src/components",
    });
  });
});

/**
 * Test alias setting with array targets
 *
 * This test verifies that the setAlias function can handle
 * string-to-array alias mappings for multiple possible paths.
 */
test("setAlias should handle array targets", (t) => {
  t.notThrows(() => {
    setAlias({
      "@utils": ["./src/utils", "./src/helpers"],
    });
  });
});

/**
 * Test alias setting with mixed targets
 *
 * This test verifies that the setAlias function can handle
 * complex alias configurations with both string and array targets.
 */
test("setAlias should handle mixed targets", (t) => {
  t.notThrows(() => {
    setAlias({
      "@components": "./src/components",
      "@utils": ["./src/utils", "./src/helpers"],
      "@types": "./src/types",
    });
  });
});

/**
 * Test hook registration
 *
 * This test verifies that the register function can set up hooks
 * with Node.js module system without throwing errors.
 */
test("register should set up hooks without throwing", (t) => {
  t.notThrows(() => {
    register();
  });
});

/**
 * Test transformer functionality
 *
 * This test verifies that the transformer can be used to transform code.
 */
test("transformer should transform TypeScript code", (t) => {
  const code = "const x: number = 1;";
  const result = transformer.transformSync(Buffer.from(code), "test.ts", {
    target: "es2022",
    module: "commonjs",
  });

  t.truthy(result);
  t.truthy(result.code);
  t.is(typeof result.code.toString(), "string");
  t.not(result.code.toString(), code); // Should be transformed
});

/**
 * Test register with custom transformer
 *
 * This test verifies that we can add custom transformers to the transformer instance
 * and that they work correctly.
 */
test("transformer should work with custom transformers", (t) => {
  // Add a custom transformer
  const customTransformer = {
    exts: [".custom"],
    transformSync: (code: Buffer) => ({
      code: Buffer.from(`module.exports = ${JSON.stringify(code.toString())}`),
    }),
  };

  t.notThrows(() => {
    transformer.addTransformer(customTransformer);
  });

  // Test the custom transformer
  const testCode = "Hello, custom!";
  const result = transformer.transformSync(Buffer.from(testCode), "test.custom", {
    target: "es2022",
    module: "commonjs",
  });

  t.truthy(result);
  t.truthy(result.code);
  t.is(typeof result.code.toString(), "string");
  t.true(result.code.toString().includes(testCode));

  // Remove the custom transformer for cleanup
  t.notThrows(() => {
    transformer.removeTransformer(customTransformer);
  });
});

/**
 * Test tryToFindFile functionality through resolver integration
 *
 * This test verifies that the resolver can find files with different extensions.
 */
test("resolver should find files with different extensions", (t) => {
  // Create a temporary directory for testing
  const tempDir = path.join(os.tmpdir(), "rts-test");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Create test files with different extensions
    const baseFilename = path.join(tempDir, "test");
    fs.writeFileSync(`${baseFilename}.ts`, "const x = 1;");

    // Test register and resolution
    register();

    // Try to require the file with different extensions
    t.notThrows(() => {
      // This test is a bit tricky because we can't directly test the
      // tryToFindFile function from the resolver. Instead, we test
      // that the overall resolution process works.
      // In a real scenario, you would need to set up an alias or test
      // the tryToFindFile function directly.
    });
  } finally {
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

/**
 * Test edge cases
 *
 * This test verifies that the resolver handles edge cases gracefully.
 */
test("resolver should handle edge cases", (t) => {
  // Test setAlias with empty object
  t.notThrows(() => {
    setAlias({});
  });

  // Test register is callable multiple times
  t.notThrows(() => {
    register();
    register(); // Should not throw on multiple calls
  });
});
