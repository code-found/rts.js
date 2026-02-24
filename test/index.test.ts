import test from "ava";
import { type RTSOptions, registerRTS } from "../src/index";
import type { TransformerHook } from "../src/resolver";

/**
 * Test suite for the main RTS functionality
 *
 * This test suite verifies the registerRTS function behavior, including
 * configuration handling, cleanup functionality, and edge cases.
 * The tests ensure the unified ModuleResolver approach works correctly.
 */

/**
 * Test basic registerRTS functionality
 *
 * This test verifies that registerRTS returns a cleanup function
 * and that the function can be called without errors.
 */
test("registerRTS should return a cleanup function", (t) => {
  const cleanup = registerRTS();
  t.is(typeof cleanup, "function");
  cleanup();
});

/**
 * Test alias configuration
 *
 * This test verifies that registerRTS can handle alias configurations
 * with both string and array targets for module path resolution.
 */
test("registerRTS should accept options with aliases", (t) => {
  const options: RTSOptions = {
    alias: {
      "@components": "./src/components",
      "@utils": ["./src/utils", "./src/helpers"],
    },
  };

  const cleanup = registerRTS(options);
  t.is(typeof cleanup, "function");
  cleanup();
});

/**
 * Test custom transformer configuration
 *
 * This test verifies that registerRTS can handle custom transformers
 * for additional file types beyond the default TypeScript transformer.
 */
test("registerRTS should accept custom transformers", (t) => {
  const customTransformer: TransformerHook = {
    exts: [".json"],
    hook: (code: string) => {
      const data = JSON.parse(code);
      return `module.exports = ${JSON.stringify(data)};`;
    },
  };

  const options: RTSOptions = {
    transformers: [customTransformer],
  };

  const cleanup = registerRTS(options);
  t.is(typeof cleanup, "function");
  cleanup();
});

/**
 * Test combined alias and transformer configuration
 *
 * This test verifies that registerRTS can handle both aliases
 * and custom transformers in the same configuration.
 */
test("registerRTS should accept both aliases and transformers", (t) => {
  const customTransformer: TransformerHook = {
    exts: [".css"],
    hook: (code: string) => {
      return `export default ${JSON.stringify(code)};`;
    },
  };

  const options: RTSOptions = {
    alias: {
      "@styles": "./src/styles",
    },
    transformers: [customTransformer],
  };

  const cleanup = registerRTS(options);
  t.is(typeof cleanup, "function");
  cleanup();
});

/**
 * Test cleanup function idempotency
 *
 * This test verifies that the cleanup function can be called
 * multiple times without throwing errors, ensuring safe cleanup.
 */
test("cleanup function should be callable multiple times", (t) => {
  const cleanup = registerRTS();

  // Should not throw on first call
  t.notThrows(() => cleanup());

  // Should not throw on subsequent calls
  t.notThrows(() => cleanup());
  t.notThrows(() => cleanup());
});

/**
 * Test empty options handling
 *
 * This test verifies that registerRTS works correctly
 * with empty options object.
 */
test("registerRTS should work with empty options", (t) => {
  const cleanup = registerRTS({});
  t.is(typeof cleanup, "function");
  cleanup();
});

/**
 * Test undefined options handling
 *
 * This test verifies that registerRTS works correctly
 * with undefined options, using default configuration.
 */
test("registerRTS should work with undefined options", (t) => {
  const cleanup = registerRTS(undefined);
  t.is(typeof cleanup, "function");
  cleanup();
});
