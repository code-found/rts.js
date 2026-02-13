# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## Project Overview
This is a Node.js runtime transformer system (RTS) that enables direct execution of TypeScript, JSX, TSX, and CSS files without requiring pre-compilation. Built with SWC for fast compilation and designed for seamless integration with Node.js module system.

## Package Management
- **Use pnpm as the package manager**
- Always use `pnpm install` instead of `npm install`
- Use `pnpm add <package>` for adding dependencies
- Use `pnpm add -D <package>` for adding dev dependencies
- Use `pnpm remove <package>` for removing dependencies
- Use `pnpm run <script>` for running scripts

## Code Style and Comments
- **All comments must be in English**
- Use JSDoc style comments for functions and classes
- Include comprehensive parameter descriptions
- Add usage examples in comments where appropriate
- Use clear, descriptive variable and function names
- Follow TypeScript best practices

## Commit Messages
- **All commit messages must be in English**
- Use conventional commit format: `type(scope): description`
- Examples:
  - `feat(resolver): add module alias support`
  - `fix(transformer): handle JSX syntax correctly`
  - `docs(readme): update installation instructions`
  - `test(integration): add end-to-end test cases`
  
## Project Conventions

- **Package manager**: Use `pnpm` (not npm or yarn)
- **Comments**: All comments and commit messages must be in English
- **Documentation**: Bilingual (English and Chinese) in `docs/` folder
- **File naming**: kebab-case for files, PascalCase for classes, camelCase for functions/variables
- **Exports**: Named exports preferred, avoid `export default` unless specifically requested
- **Test files**: Use `*.test.ts` pattern
- **Commit format**: `type(scope): description` (e.g., `feat(resolver): add module alias support`)

## Development Commands

```bash
# Package management
pnpm install
pnpm add <package>
pnpm add -D <package>
pnpm remove <package>

# Run TypeScript files directly with rts.js
node -r ./run-ts.js src/bin/index.ts

# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run check

# Fix type checking issues
pnpm run check:fix

# Format code
pnpm run format

# Create a changeset (for release)
pnpm changeset

# Full release process
pnpm run release

# Release dry run
pnpm run release --dry-run
```

## Architecture Overview

RTS (Runtime Transformer System) is a Node.js runtime transformer that enables direct execution of TypeScript, JSX, TSX, and CSS files without pre-compilation. It uses SWC for fast compilation.

### Core Components

**src/index.ts**: Main entry point exporting `registerRTS()`. This function:
- Loads configuration from cwd (`rts.config.json` or `rtsrts.config.js`)
- Merges configuration (default, file, and options)
- Applies aliases and transformers to a global ModuleResolver instance
- Registers hooks with Node.js module system
- Returns cleanup function

**src/register.ts**: Auto-registration module used via `node -r rts.js/register`. Simply calls `registerRTS()` with defaults.

**src/resolver/index.ts**: `ModuleResolver` class - the heart of the system that:
- Extends `ModuleTransformer` from `t-packer` dependency
- Handles module path resolution with alias support
- Caches resolved paths
- Integrates with Node.js module system via hooks
- Supports both Node.js >=24 (native `Module.registerHooks`) and <24 (polyfill)
  - Native: Uses `resolve` and `load` hooks
  - Polyfill: Overrides `_resolveFilename` and `_extensions`
- Uses `tryToFindFile()` for file discovery

**src/config/index.ts** and **src/config/loader.ts**: Configuration management:
- `RTSOptions` interface with `alias` and `transformers` fields
- `mergeConfig()` deep-merges configs (alias merged, transformers concatenated)
- `loadConfigFromCwd()` loads `rts.config.json` or `rts.config.js`

**src/bin/index.ts**: CLI entry point that spawns a new node process with `rts.js/register` preloaded.

**run-ts.js**: Standalone CommonJS module that registers a `.ts` loader using SWC directly. Used by the project itself to run TypeScript files (like in npm scripts and AVA config).

### Key Patterns

- Configuration hierarchy: default → file config → options (merged sequentially)
- Module resolution: first checks aliases, then tries file system lookup with supported extensions
- Node.js version compatibility: Detected at runtime via `process.versions.node`
- Transformer chain: Multiple transformers can be registered and applied in sequence

### Dependencies

- `@swc/core`: Fast TypeScript/JSX compilation
- `t-packer`: Provides `ModuleTransformer` base class and `TransformerHook` type
- `@changesets/cli`: Version management and releases

### Testing

Tests use AVA framework. Configuration in `ava.config.js`:
- Requires `./run-ts.js` for TypeScript support
- 2-minute timeout
- Files in `test/**/*.ts`

Test structure:
- `test/index.test.ts` - Main functionality tests
- `test/resolver.test.ts` - Module resolver tests
- `test/transformer.test.ts` - Transformer tests
- `test/config.test.ts` - Configuration tests
- `test/integration.test.ts` - Integration tests
- Temporary test files should be placed in `test/temp/` and cleaned up after tests

Test guidelines:
- Use descriptive test names
- Test both success and failure scenarios
- Clean up resources after tests
- Mock external dependencies when appropriate
- Aim for high test coverage

### Release Process

Uses Changesets:
1. Create changeset: `pnpm changeset`
2. Release: `pnpm run release` (builds, tests, versions, publishes, tags)
3. Build uses `t-packer`'s `assemble()` function

## Code Quality Guidelines

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Use ES modules (`import`/`export`)
- Include JSDoc comments for functions and classes with parameter descriptions
- Add usage examples in comments where appropriate

### Error Handling
- Implement proper error handling with try-catch blocks where appropriate
- Provide clear, descriptive error messages with context
- Include actionable suggestions in error messages
- Use English for all error messages

### Performance
- Cache frequently accessed data
- Minimize file system operations
- Use efficient algorithms
- Consider memory usage for large files

### Security
- Validate all inputs
- Sanitize file paths
- Handle file system operations safely
- Avoid code injection vulnerabilities

## File Organization

```
src/
├── index.ts           # Main entry
├── register.ts        # Auto-registration module
├── resolver/          # Module resolver
├── config/            # Configuration utilities
└── bin/               # CLI entry

test/
├── temp/              # Temporary test files (cleaned up after tests)
└── *.test.ts          # Test files

docs/
├── en/                # English documentation
└── zh/                # Chinese documentation

scripts/               # Build and utility scripts
```
