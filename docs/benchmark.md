# Performance Benchmarks & Determinism Report

> **Notice**: Results may vary by machine. Performance measurements below represent factual executions on the test system.

## Benchmark Environment

- **Node Version**: `v24.15.0`
- **OS**: `Windows_NT 10.0.26200 (x64)`
- **CPU**: `Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz` (12 cores)
- **Runtime**: `Node.js V8`
- **Fixture**: `tests/fixtures/rocket-badge.png (1024x1024 RGBA)`
- **Parameters**: Palette: `mard-compatible-base-221`, Process Mode: `cartoon`, Max Colors: 32, Iterations: 5

## Benchmark Results across Standard Grid Dimensions

The grid sizes below correspond to the core pegboard dimensions designated in `ROADMAP.md` (16, 24, 32, 48, 60 cells):

| Grid Size | Total Cells | Avg Duration (ms) | Min (ms) | Max (ms) | Total Beads | Unique Colors | Result Checksum (SHA-256) | Determinism |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **16x16** | 256 | **353.25** | 145.32 | 674.58 | 122 | 4 | `3b04bbd47b0a2ef9` | 100% bitwise identical |
| **24x24** | 576 | **151.51** | 115.35 | 266.93 | 268 | 7 | `e9586bb308017a4a` | 100% bitwise identical |
| **32x32** | 1024 | **168.89** | 127.52 | 199.58 | 466 | 8 | `be70ae3da006ec70` | 100% bitwise identical |
| **48x48** | 2304 | **238.24** | 125.62 | 392.85 | 1028 | 9 | `8c46216637a038bd` | 100% bitwise identical |
| **60x60** | 3600 | **134.84** | 123.84 | 142.69 | 1594 | 9 | `5bb97a407d69b902` | 100% bitwise identical |

## Reproducibility & Determinism Guarantee

All quantization operations in `@bead-grid/core` are 100% deterministic:
- Consecutive executions over identical inputs produce bitwise-identical cell matrices.
- Sorting of material codes breaks ties by lexicographical bead code (`code.localeCompare()`).
- Test suite `npm run test:determinism` validates determinism on every test run.

## How to Reproduce

```bash
npm run benchmark
```
