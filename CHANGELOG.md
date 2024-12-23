# Changelog

All notable changes to Flyde will be documented in this file.

## [0.106.1] - 2024-12-23

### What's Changed

- custom node related fixes by @GabiGrin in https://github.com/flydelabs/flyde/pull/177

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.106.0...v0.106.1

## [0.106.0] - 2024-12-23

### What's Changed

- custom nodes creation + stdlib cleanup + fork any node preps by @GabiGrin in https://github.com/flydelabs/flyde/pull/175
- allow switching between macros in the same namespace by @GabiGrin in https://github.com/flydelabs/flyde/pull/172
- fix display of custom svg icons by @GabiGrin in https://github.com/flydelabs/flyde/pull/173
- Improved macro node API by @GabiGrin in https://github.com/flydelabs/flyde/pull/174

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.105.2...v0.106.0

## [0.105.0] - 2024-10-05

### What's Changed

- various ux tweaks by @GabiGrin in https://github.com/flydelabs/flyde/pull/159
- improved macro node by @GabiGrin in https://github.com/flydelabs/flyde/pull/162
- Update JSONStringify.flyde.ts by @akim-muto in https://github.com/flydelabs/flyde/pull/163

### Breaking changes

- Most macro nodes in the stdlib were converted to [an improved version](https://github.com/flydelabs/flyde/blob/main/stdlib/src/ImprovedMacros/improvedMacros.ts), most cases should be fixed automatically by [this migration](https://github.com/flydelabs/flyde/blob/main/resolver/src/serdes/migrations/macroNodeV2.ts)
- Conditional node was simplified and changed (see #162 -> Conditional), will require manual fixing

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.104.0...v0.105.0

## [0.104.0] - 2024-09-15

### What's Changed

- support longtext in macro editor by @GabiGrin in https://github.com/flydelabs/flyde/pull/153
- macro editor tweaks by @GabiGrin in https://github.com/flydelabs/flyde/pull/155
- fixes dragging main pin ends being selected + ability to connect main input to output by @GabiGrin in https://github.com/flydelabs/flyde/pull/154
- simplify value and function node by @GabiGrin in https://github.com/flydelabs/flyde/pull/156
- various tweaks by @GabiGrin in https://github.com/flydelabs/flyde/pull/157

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.103.0...v0.104.0

## [0.103.0] - 2024-09-08

- allow panning using space+drag, adds onboarding tips by @GabiGrin in https://github.com/flydelabs/flyde/pull/152, fixes #60
- enables adding nodes by dragging from the nodes library by @GabiGrin in https://github.com/flydelabs/flyde/pull/149
- fixes connection hover errors, fixes #145 by @GabiGrin in https://github.com/flydelabs/flyde/pull/147

- visual nodes logic refactor by @GabiGrin in https://github.com/flydelabs/flyde/pull/150
- refactor visual node editor context menu by @GabiGrin in https://github.com/flydelabs/flyde/pull/148
- editor refactors by @GabiGrin in https://github.com/flydelabs/flyde/pull/151

## [0.102.5] - 2024-09-06

- rename "Inline Value" to "Value"
- rename "Inline Code" to "Function"
- Lengthen time of visual feedback of the remote debugger

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.102.4...v0.102.5

## [0.102.4] - 2024-08-30

- improve set attribute node by @GabiGrin in https://github.com/flydelabs/flyde/pull/142
- Comment Node tweaks + AI generation refinement by @GabiGrin in https://github.com/flydelabs/flyde/pull/143
- Fixes comment node lighting up when flow runs by @GabiGrin in https://github.com/flydelabs/flyde/pull/144

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.102.3...v0.102.4

## [0.102.3] - 2024-08-27

- fixes issue #138 by @GabiGrin in https://github.com/flydelabs/flyde/pull/140

## [0.102.2] - 2024-08-22

- upgrades Typescript by @GabiGrin in https://github.com/flydelabs/flyde/pull/134
- @flyde/core cleanups by @GabiGrin in https://github.com/flydelabs/flyde/pull/135
- fixes inline value label not updating by @GabiGrin in https://github.com/flydelabs/flyde/pull/136
- new logo by @GabiGrin in https://github.com/flydelabs/flyde/pull/137

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.102.0...v0.102.1

## [0.102.0] - 2024-07-29

- adds comment node by @GabiGrin in https://github.com/flydelabs/flyde/pull/133

## [0.101.2] - 2024-07-02

- Removes hardcoded debugging string that slipped into the version by mistake

## [0.101.1] - 2024-07-01

- Fixes broken npm release

## [0.101.0] - 2024-07-01

- AI node generator by @GabiGrin in https://github.com/flydelabs/flyde/pull/132

**Full Changelog**: https://github.com/flydelabs/flyde/compare/v0.100.0...v0.101.0

## [0.100.0] - 2024-06-13

Note: this is the first up-to-date changelog for Flyde. Beforehand, versions for the various npm packages and extension were not in sync. Starting with this change, all Flyde-related artifacts will have the same version.

### What's Changed

- adds the ability to select and remove connections, fixes #107 by @Tokyros in https://github.com/flydelabs/flyde/pull/116
- resolving of ui bundle missed path by 1 level #120 by @akim-muto in https://github.com/flydelabs/flyde/pull/124
- fixes hotkeys on windows, resolves #127 by @GabiGrin in https://github.com/flydelabs/flyde/pull/128

### New Contributors

- @akim-muto made their first contribution in https://github.com/flydelabs/flyde/pull/124

**Full Changelog**: https://github.com/flydelabs/flyde/commits/v0.100.0
