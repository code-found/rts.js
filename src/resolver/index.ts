import Module from "node:module";
import process from "node:process";
import { ModuleTransformer, type TransformerHook } from "t-packer";
import { loadSync, resolveSync } from "./hooks";

export { ModuleTransformer, type TransformerHook };

// Get Node.js major version for compatibility handling
// `process.versions.node` is like "20.11.1"; take the first segment as a number
const majorVersion = process.versions.node.split(".")[0];
const major = Number(
  majorVersion[0] === "v" ? majorVersion.slice(1) : majorVersion,
);

export const register = () => {
  if (major >= 22) {
    // Use native registerHooks for Node.js >=22
    Module.registerHooks({
      resolve: resolveSync,
      load: loadSync,
    });
  } else {
    // remove the support for node < 12
    throw new Error("Node.js version < 22 is not supported");
  }
};
export { transformer } from "./transformer";
export { setAlias, clearCache, clearAliases, tryToFindFile } from "./utils";
