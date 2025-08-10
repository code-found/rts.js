import fs from "node:fs";
import Module, { type ResolveHookContext } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ModuleTransformer, type TransformerHook } from "t-packer";

export { ModuleTransformer, type TransformerHook };

// Get Node.js major version for compatibility handling
// `process.versions.node` is like "20.11.1"; take the first segment as a number
const majorVersion = process.versions.node.split(".")[0];
const major = Number(
  majorVersion[0] === "v" ? majorVersion.slice(1) : majorVersion,
);

interface NodeModuleLike {
  _compile: (code: string, filename: string) => unknown;
}

interface ModuleWithInternals {
  _resolveFilename: (request: string, parent: unknown) => string;
  _extensions: Record<
    string,
    (mod: NodeModuleLike, filename: string) => unknown
  >;
}

/**
 * Module resolver class that handles module path resolution and caching
 *
 * This class provides a comprehensive module resolution system that:
 * - Resolves module paths with alias support
 * - Caches resolved paths for performance
 * - Transforms source code using registered transformers
 * - Supports both Node.js >=24 (native hooks) and <24 (polyfill)
 *
 * The resolver integrates with Node.js module system by overriding
 * the module resolution and loading mechanisms.
 */
export class ModuleResolver extends ModuleTransformer {
  /** Cache for resolved module paths to improve performance */
  private cache: Map<string, string> = new Map();
  /** Map of module aliases to their target paths */
  private aliases: Map<string, string[]> = new Map();

  /** Store original loaders for cleanup */
  private oldLoaders: Map<
    string,
    (mod: NodeModuleLike, filename: string) => unknown
  > = new Map();
  /** Registration cleanup function */
  private revertRegister?: {
    deregister: () => void;
  };

  /**
   * Create a new ModuleResolver instance
   * @param transformers - Initial list of transformers to register
   */
  constructor(transformers: TransformerHook[] = []) {
    super();
    for (const transformer of transformers) {
      this.addTransformer(transformer);
    }
  }

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
  setAlias(alias: Record<string, string[] | string>) {
    for (const [key, target] of Object.entries(alias)) {
      if (Array.isArray(target)) {
        this.aliases.set(key, target);
      } else {
        this.aliases.set(key, [target]);
      }
    }
  }

  /**
   * Register hooks with Node.js module system
   *
   * This method sets up the module resolution and loading hooks.
   * For Node.js >=24, it uses the native registerHooks API.
   * For older versions, it uses a polyfill implementation.
   */
  register() {
    if (major >= 24) {
      // Use native registerHooks for Node.js >=24
      this.revertRegister = Module.registerHooks({
        resolve: (specifier, context, nextResolve) => {
          const { url } = this.resolve(specifier, context);
          return nextResolve(url ?? specifier, context);
        },
        load: (url, parent, nextLoad) => {
          const result = this.load(url);
          if (result) {
            return {
              format: result.format as any,
              source: result.code,
              shortCircuit: true,
            };
          }
          return nextLoad(url, parent);
        },
      });
    } else {
      // Polyfill for Node.js <24
      const origResolve = (Module as unknown as ModuleWithInternals)
        ._resolveFilename;
      (Module as unknown as ModuleWithInternals)._resolveFilename = (
        specifier,
        context,
      ) => {
        const { url } = this.resolve(specifier, context as ResolveHookContext);
        return origResolve.apply(this, [url ?? specifier, context]);
      };

      // Register custom loaders for supported file extensions
      const extensions = Array.from(this.transformers.keys());
      const originJSLoader = (Module as unknown as ModuleWithInternals)
        ._extensions[".js"];
      extensions.forEach((ext) => {
        const originLoader =
          (Module as unknown as ModuleWithInternals)._extensions[ext] ||
          originJSLoader;
        (Module as unknown as ModuleWithInternals)._extensions[ext] = (
          mod,
          filename,
        ) => this.loader(mod, filename, ext);
        this.oldLoaders.set(ext, originLoader);
      });

      this.revertRegister = {
        deregister: () => {
          (Module as unknown as ModuleWithInternals)._resolveFilename =
            origResolve;
          extensions.forEach((ext) => {
            (Module as unknown as ModuleWithInternals)._extensions[ext] =
              this.oldLoaders.get(ext) as (
                mod: NodeModuleLike,
                filename: string,
              ) => unknown;
          });
        },
      };
    }
  }

  /**
   * Revert all registered hooks and restore original module system behavior
   */
  revert() {
    this.revertRegister?.deregister();
  }

  /**
   * Resolve a module specifier to a URL
   *
   * This method handles module path resolution including alias resolution.
   * It caches results for performance and supports multiple alias targets.
   *
   * @param specifier - The module specifier to resolve
   * @param context - The resolution context from Node.js
   * @returns Object containing the resolved URL if found
   */
  private resolve(
    specifier: string,
    context: ResolveHookContext,
  ): { url?: string } {
    const cacheKey = `${specifier}:${context?.parentURL ?? ""}`;
    let url = this.cache.get(cacheKey);

    if (!url) {
      // Check if the specifier matches any registered aliases
      for (const [alias, target] of this.aliases) {
        if (specifier.startsWith(alias)) {
          target.forEach((t) => {
            url = specifier.replace(alias, t);
            if (fs.existsSync(url)) {
              this.cache.set(cacheKey, url);
              return { url };
            }
          });
        }
      }
    }

    return {
      url,
    };
  }

  /**
   * Load and transform a module
   *
   * This method reads the file content and applies any registered transformers
   * based on the file extension. Returns null if no transformers are applicable.
   *
   * @param url - The module URL to load
   * @returns Transformed code with format information, or null if no transformation needed
   */
  private load(url: string): null | { format: string; code: string } {
    const filename = url.startsWith("file:") ? fileURLToPath(url) : url;
    const code = this.transformCode(
      fs.readFileSync(filename, "utf-8"),
      filename,
    );
    if (code) {
      return { format: "commonjs", code };
    }
    return null;
  }

  /**
   * Legacy loader for Node.js <24 compatibility
   *
   * This method handles the older Node.js module loading system by
   * overriding the _compile method to transform code before compilation.
   *
   * @param mod - The module object
   * @param filename - The filename being loaded
   * @param ext - The file extension
   */
  private loader(mod: NodeModuleLike, filename: string, ext: string) {
    const compile = mod._compile;
    const oldLoader = this.oldLoaders.get(ext);
    mod._compile = (code, filename) => {
      const newCode = this.transformCode(code, filename);
      mod._compile = compile;
      return mod._compile(newCode, filename);
    };
    return oldLoader?.(mod, filename);
  }

  /**
   * Transform source code using registered transformers
   *
   * This method applies all registered transformers that match the file extension
   * in sequence. Each transformer receives the output of the previous transformer.
   *
   * @param code - The source code to transform
   * @param filename - The filename for context
   * @returns Transformed code, or empty string if no transformers match
   */
  private transformCode(code: string, filename: string) {
    if (!this.transformers.has(path.extname(filename))) {
      return "";
    }
    return this.transformSync(Buffer.from(code), filename, {
      target: "es2022",
      module: "commonjs",
    }).code.toString();
  }
}
