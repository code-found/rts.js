import type { TransformerHook } from "t-packer";

/**
 * Configuration options for the RTS (Runtime Transformer System)
 */
export interface RTSOptions {
  /** Module alias mapping for path resolution */
  alias?: Record<string, string[] | string>;
  /** Custom transformers for additional file type support */
  transformers?: TransformerHook[];
}

/**
 * Deep-merge two RTS configuration objects into a new object.
 *
 * - Does not mutate the `oldConfig` or `newConfig` inputs.
 * - Shallow-merges non-object fields.
 * - For known fields:
 *   - `alias`: merged with later values overwriting earlier ones per key
 *   - `transformers`: concatenated in order
 *
 * @param oldConfig - Base configuration (left-side)
 * @param newConfig - Configuration to apply (right-side)
 * @returns A new merged configuration object
 *
 * @example
 * ```typescript
 * const baseConfig = { alias: { '@components': './src/components' } };
 * const addlConfig = { alias: { '@utils': './src/utils' }, debug: true as any };
 * const merged = mergeConfig(baseConfig, addlConfig);
 * // alias => { '@components': './src/components', '@utils': './src/utils' }
 * // debug => true
 * ```
 */
export function mergeConfig(
  oldConfig: Partial<RTSOptions>,
  newConfig: Partial<RTSOptions>,
): RTSOptions {
  if (!newConfig || typeof newConfig !== "object")
    return oldConfig as RTSOptions;
  const target: RTSOptions = { ...oldConfig };
  for (const key in newConfig) {
    switch (key) {
      case "alias":
        target.alias = { ...(target.alias ?? {}), ...(newConfig.alias ?? {}) };
        break;
      case "transformers":
        target.transformers = [
          ...(target.transformers ?? []),
          ...(newConfig.transformers ?? []),
        ];
        break;
      default:
        target[key] = newConfig[key];
    }
  }
  return target;
}

export { loadConfigFromCwd } from "./loader";
