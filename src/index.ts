import { loadConfigFromCwd, mergeConfig, type RTSOptions } from "./config";
import {
  clearAliases,
  clearCache,
  register,
  setAlias,
  transformer,
} from "./resolver";

export type { RTSOptions } from "./config";

// Track registration state to prevent duplicate registrations
let isRegistered = false;

/**
 * Register RTS (Runtime Transformer System) hooks for Node.js module loading
 *
 * This function sets up custom resolve and load hooks to transform various file types
 * including TypeScript (.ts), TypeScript JSX (.tsx), JavaScript (.js), JSX (.jsx),
 * and CSS files at runtime without requiring pre-compilation.
 *
 * The function uses a centralized ModuleResolver instance that handles both
 * module resolution and code transformation in a unified way.
 *
 * Features:
 * - Runtime TypeScript compilation using SWC
 * - Module alias resolution with flexible path mapping
 * - Extensible transformer system for custom file types
 * - Node.js version compatibility (supports both <24 and >=24)
 * - Automatic cleanup and resource management
 *
 * @param options - Optional configuration for RTS system
 * @returns A cleanup function that can be called to deregister all hooks
 *
 * @example
 * ```typescript
 * // Basic usage with default TypeScript transformer
 * const cleanup = registerRTS();
 *
 * // With custom aliases for cleaner imports
 * const cleanup = registerRTS({
 *   alias: {
 *     '@components': './src/components',
 *     '@utils': ['./src/utils', './src/helpers']
 *   }
 * });
 *
 * // With custom transformers for additional file types
 * const customCSSHook: TransformerHook = {
 *   exts: ['.css'],
 *   hook: (code: string) => `export default ${JSON.stringify(code)};`
 * };
 *
 * const cleanup = registerRTS({
 *   transformers: [customCSSHook]
 * });
 *
 * // With both aliases and custom transformers
 * const cleanup = registerRTS({
 *   alias: { '@styles': './src/styles' },
 *   transformers: [customCSSHook]
 * });
 *
 * // Cleanup when done (idempotent - safe to call multiple times)
 * cleanup();
 * ```
 */
export const registerRTS = (options?: RTSOptions): (() => void) => {
  //  default config
  const base: RTSOptions = {};

  //  load config from cwd
  const fileConfig = loadConfigFromCwd() as Partial<RTSOptions> | undefined;

  //  merge config
  const finalOptions = mergeConfig(
    mergeConfig({ ...base }, fileConfig ?? {}),
    options ?? {},
  ) as RTSOptions;

  //  create resolver with module type configuration

  //  apply alias
  if (finalOptions.alias) {
    setAlias(finalOptions.alias);
  }
  if (finalOptions.transformers) {
    for (const transformerHook of finalOptions.transformers) {
      transformer.addTransformer(transformerHook);
    }
  }
  transformer.module = finalOptions.module || "esm";

  //  register hooks (prevent duplicate registration)
  if (!isRegistered) {
    register();
    isRegistered = true;
  }

  //  return cleanup function
  return () => {
    isRegistered = false;
    clearCache();
    clearAliases();
  };
};
