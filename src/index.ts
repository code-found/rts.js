import { loadConfigFromCwd, mergeConfig, type RTSOptions } from "./config";
import { ModuleResolver } from "./resolver";

// Create a module resolver instance for handling module resolution
// This resolver will handle TypeScript, JSX, TSX, and CSS file transformations
const resolver = new ModuleResolver();

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

  //  apply alias
  if (finalOptions.alias) {
    resolver.setAlias(finalOptions.alias);
  }

  //  apply transformers
  if (finalOptions.transformers) {
    for (const transformer of finalOptions.transformers) {
      resolver.addTransformer(transformer);
    }
  }

  //  register hooks
  resolver.register();

  //  return cleanup function
  return () => {
    resolver.revert();
  };
};
