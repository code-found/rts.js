import fs from "node:fs";
import Module from "node:module";
import path from "node:path";

/**
 * Load configuration from a JSON file
 *
 * This function reads a JSON configuration file and parses it into a JavaScript object.
 * It's designed to handle configuration files for the RTS system.
 *
 * @param file - Path to the configuration file
 * @returns Parsed configuration object
 * @throws {Error} If the file cannot be read or parsed
 *
 * @example
 * ```typescript
 * const config = loadConfig('./rts.config.json');
 * console.log(config.aliases); // { '@components': './src/components' }
 * ```
 */
const loadConfig = (file: string) => {
  const config = fs.readFileSync(file, "utf8");
  return JSON.parse(config);
};

/**
 * Load configuration file without additional wrapping.
 *
 * This function simply delegates to `loadConfig` so callers can decide how
 * to handle errors (missing files, invalid JSON, etc.).
 *
 * @param file - Path to the configuration file
 * @returns Configuration object
 */
const loadConfigFile = (file: string) => {
  const config = loadConfig(file);
  return config;
};

/**
 * Load JS config synchronously (CommonJS or transpiled ESM default export)
 * Accepts a plain object via `module.exports = {}` or `export default {}`
 */
const loadJsConfigSync = (file: string) => {
  const req = Module.createRequire(path.join(process.cwd(), "package.json"));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = req(file);
  return (mod && (mod.default ?? mod)) as Record<string, unknown>;
};

/**
 * Find configuration file in a directory.
 * Supported filenames: rts.config.json, rts.config.js
 */
const findConfigFile = (cwd: string = process.cwd()): string | undefined => {
  const candidates = ["rts.config.json", "rts.config.js"].map((f) =>
    path.join(cwd, f),
  );
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return undefined;
};

/**
 * Load configuration from current working directory if present.
 */
export const loadConfigFromCwd = (cwd: string = process.cwd()) => {
  const file = findConfigFile(cwd);
  if (!file) return undefined;
  const ext = path.extname(file);
  if (ext === ".json") return loadConfigFile(file);
  if (ext === ".js") return loadJsConfigSync(file);
  return undefined;
};
