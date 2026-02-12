import { dirname, resolve as pathResolve } from "node:path";
import type { ResolveHookContext, registerHooks } from "node:module";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
  getAliases,
  getCache,
  isBuiltinModule,
  tryToFindFile,
  addCache,
} from "./utils";
import { transformer } from "./transformer";
type LoadFunction = Required<Parameters<typeof registerHooks>[0]>["load"];

export const loadSync: LoadFunction = (url, parent, nextLoad) => {
  // if it is not a builtin module
  if (!isBuiltinModule(url)) {
    const filename = url.startsWith("file:") ? fileURLToPath(url) : url;
    const { code, format } = transformer.transformCodeSync(
      fs.readFileSync(filename, "utf-8"),
      filename,
    );
    if (code) {
      return {
        format,
        source: code,
        shortCircuit: true,
      };
    }
  }

  return nextLoad(url, parent);
};
export const load: (
  ...args: Parameters<LoadFunction>
) => Promise<ReturnType<LoadFunction>> = async (url, parent, nextLoad) => {
  // if it is not a builtin module
  if (!isBuiltinModule(url)) {
    const filename = url.startsWith("file:") ? fileURLToPath(url) : url;
    const { code, format } = await transformer.transformCode(
      fs.readFileSync(filename, "utf-8"),
      filename,
    );
    if (code) {
      return {
        format,
        source: code,
        shortCircuit: true,
      };
    }
  }

  return nextLoad(url, parent);
};

const resolveModule = (specifier: string, context: ResolveHookContext) => {
  /**
   * bugfix: fix the bug that context is null on node 18.
   *
   * on node 18,context will be null.
   * not very clear know if only node 18 is like this.
   * on my windows with node 23 it sis ok.
   * but on mac with node 18 the bug come out.
   *
   */
  const { parentURL = "" } = context || {};
  const cacheKey = `${specifier}:${parentURL}`;
  let url = getCache(cacheKey);

  if (!url) {
    // Check if the specifier matches any registered aliases
    for (const [alias, targets] of [...getAliases(), ["", [""]] as const]) {
      if (specifier.startsWith(alias)) {
        for (const target of targets) {
          let file: string | null = null;
          file = specifier.replace(alias, target);
          // resolve the relative path
          if (file.startsWith("./") || file.startsWith("../")) {
            file = parentURL ? pathResolve(dirname(parentURL), file) : file;
          }
          if (!isBuiltinModule(file)) {
            file = tryToFindFile(file ?? "");
            if (file) {
              url = file;
              addCache(cacheKey, url);
              return { url };
            }
          }
        }
      }
    }
  }

  return {
    url,
  };
};

type ResolveFunction = Required<Parameters<typeof registerHooks>[0]>["resolve"];
export const resolveSync: ResolveFunction = (
  specifier: string,
  context: ResolveHookContext,
  nextResolve,
) => {
  const { url } = resolveModule(specifier, context);
  if (url) {
    return {
      url,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
};

export const resolve: (
  ...args: Parameters<ResolveFunction>
) => Promise<ReturnType<ResolveFunction>> = async (
  specifier,
  context,
  nextResolve,
) => {
  return new Promise((resolve) => {
    resolve(resolveSync(specifier, context, nextResolve));
  });
};
