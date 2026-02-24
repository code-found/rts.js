import { isBuiltin } from "module";
import fs from "fs";
import path from "path";

/**
 * Check if a module URL or specifier is a Node.js built-in module
 *
 * This function uses Node.js's built-in `isBuiltin` method from `node:module` module,
 * which is the most reliable and future-proof way to detect built-in modules.
 *
 * @param url - The module URL or specifier to check
 * @returns True if it's a built-in module, false otherwise
 *
 * @example
 * isBuiltIn("node:fs") // true
 * isBuiltIn("fs") // true
 * isBuiltIn("node:path") // true
 * isBuiltIn("/path/to/file.js") // false
 * isBuiltIn("./module.js") // false
 */
export const isBuiltinModule = (url: string): boolean => {
  // Normalize URL: remove protocol (node:), query params, and hash
  let normalized = url;

  // Remove node: protocol if present
  if (normalized.startsWith("node:")) {
    normalized = normalized.slice("node:".length);
  }

  // Remove query parameters and hash
  normalized = normalized.split("?")[0].split("#")[0];

  // For file URLs, return false immediately
  if (normalized.startsWith("file:")) {
    return false;
  }

  // Use Node.js's built-in isBuiltin method for reliable detection
  return isBuiltin(normalized);
};

const exists = (path: string) => fs.existsSync(path);

export const EXTENSIONS = [
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
  ".json",
];

// check if the filename has a extension
export const hasExtension = (filename: string) => /\.[^.]+$/.test(filename);

export const tryToFindFile = (filename: string) => {
  if (exists(filename)) {
    if (fs.statSync(filename).isDirectory()) {
      filename = `${filename}${path.sep}index`;
    } else {
      return filename;
    }
  }

  // Try adding extensions for extensionless imports only.
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(filename + ext)) {
      return filename + ext;
    }
  }
  return null;
};

const cache = new Map<string, string>();
/** Map of module aliases to their target paths */
const aliases: [string, string[]][] = [];
/**
 * Register module aliases for path resolution
 *
 * Aliases allow you to use shorter import paths that resolve to actual file paths.
 * For example, '@components' could resolve to './src/components'.
 *
 * @param alias - Object mapping alias paths to target paths
 * @example
 * ```typescript
 * resolver.setAlias({
 *   '@components': './src/components',
 *   '@utils': ['./src/utils', './src/helpers']
 * });
 * ```
 */
export const setAlias = (alias: Record<string, string[] | string>) => {
  for (const [key, target] of Object.entries(alias)) {
    const targets = Array.isArray(target) ? target : [target];
    const alias = aliases.find(([alias]) => alias === key);
    if (alias) {
      alias[1].push(...targets.filter((t) => !alias[1].includes(t)));
    } else {
      aliases.push([key, targets]);
    }
  }
};
export const getAliases = () => aliases;
export const getCache = (key: string) => cache.get(key);
export const addCache = (key: string, value: string) => {
  cache.set(key, value);
};

/**
 * Clear all cached module resolutions
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Clear all registered aliases
 */
export const clearAliases = () => {
  aliases.length = 0;
};
