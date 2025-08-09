# rts.js

## 0.0.4

### Patch Changes

- 1ad20ab: Ci (release): Triggering release when PR is merged into master; Test temporary files to use system temporary directory instead
  -Ci: Modify. ithub/workflows/release. yml
  -The triggering condition is changed to pull_dequest.clost to master, and only executed when merged==true
  -Retain manual triggering of workflow_ispatch
  -Change the workflow name to release
  -Upgrade pnpm/action setup to v10 and adjust the installation order to match pnpm cache
  -Test: Migration of temporary files to system temporary directory
  -All use cases use the rts tests/_ subdirectories under os. tpdir() uniformly, compatible with Windows/Linux
  -Adjust file creation and cleanup to fs.rmSync (..., {recursive: true, force: true})
  -Delete the test/temp directory and related dependency paths in the repository
  -Chore (ava): Remove the exclusion of test/temp/_ _/_. ts in ava.cnfig.js
  -Docs (test): Update temporary file policy instructions in test/README.md

## 0.0.3

### Patch Changes

- 1. fix the bug of ModuleResolver.resolve context param null.
  2. update the info of docs

## 0.0.2

### Patch Changes

- add register module for node -r runtime support

## 0.0.1

### Patch Changes

- feat: first version of rts,with auto transform ts feature.

  - Complete the feature of customize the resolver and loader of Node.js.
  - Create Chinese README documentation (docs/zh/README.md)
  - Add Chinese version link to English README
  - Optimize package.json publish config with object format bin
  - Add files field to explicitly specify package contents
  - Add inline build functionality in release.ts
