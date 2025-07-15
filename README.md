# Chip Benchmark

A platform for visualizing chip benchmark results.

![Chip Benchmark Banner](assets/banner.png)


## Quick Start

```bash
git clone <repository-url>
cd chipbenchmark/frontend
yarn install
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Adding Data

Put your benchmark data in `benchmarks/` then run:

```bash
node scripts/sync-benchmark-data.mjs
```

