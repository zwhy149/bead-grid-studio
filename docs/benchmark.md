# Performance Benchmarks & Quality Metrics

This document details the performance characteristics, throughput, and determinism of the `@bead-grid/core` quantization engine.

## Benchmark Methodology

Benchmarks measure the full computational pipeline under Node.js:
1. **Source Complexity Analysis**: Edge density detection, contrast variance, and line-art classification.
2. **Perceptual Downsampling**: Spatial downsampling from high-resolution master images to target pegboard dimensions (16x16, 29x29, 52x52, etc.).
3. **DeltaE / OKLab Quantization**: Distance calculations in perceptual color space to map millions of RGB combinations to discrete physical bead codes.
4. **Palette Consolidation**: Graph/cluster merging of nearby color codes subject to user maximum color limits.
5. **Deterministic Serialization**: Generation of structured pattern exchange objects conforming to `schema/pattern.schema.json`.

## How to Run Locally

```bash
# Run benchmark suite and output benchmarks/results.json
npm run benchmark
```

## Scenario Profiles

| Scenario | Target Grid | Mode | Source Resolution | Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Small Grid** | 16 x 16 | Cartoon | 1024 x 1024 PNG | Ultra-fast badge/icon conversion (< 15ms) |
| **Mini Pegboard (Standard)** | 29 x 29 | Cartoon | 1024 x 1024 PNG | Common 2.6mm mini pegboard standard (< 30ms) |
| **Large Pegboard** | 52 x 52 | Cartoon | 1024 x 1024 PNG | High bead density, 48 max colors (< 70ms) |
| **HD Detail Mode** | 52 x 52 | Detail | 1024 x 1024 PNG | Preserves subtle highlights and fine texturing |
| **Constrained Palette** | 29 x 29 | Cartoon | 1024 x 1024 PNG | Evaluates search speed on small 12-color kit (< 15ms) |
| **High-Entropy Gradient** | 40 x 40 | Photo | 256 x 256 Procedural | Continuous gradient quantization stress test |
| **Complexity Analysis** | Full Image | Analyzer | 1024 x 1024 PNG | Edge detection and document/photo heuristic analysis |

## Determinism & Reproducibility Guarantee

All quantization operations in `@bead-grid/core` are 100% deterministic:
- Identical input pixel buffers with identical parameters produce bitwise-identical cell matrices.
- Sorting of top material codes breaks ties by lexicographical bead code (`code.localeCompare()`).
- Automated tests in `tests/unit/core.test.js` assert that consecutive runs over identical buffers yield zero variance.

## Memory Footprint

The engine utilizes typed arrays (`Uint8ClampedArray`, `Int16Array`, `Uint8Array`) with zero memory leaks, allowing it to execute smoothly on resource-constrained embedded devices, mobile browsers, and serverless edge functions.
