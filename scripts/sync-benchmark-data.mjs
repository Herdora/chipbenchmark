#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const benchmarksDir = path.join(__dirname, '../benchmarks');
const frontendDataDir = path.join(__dirname, '../frontend/public/data');

// Ensure frontend data directory exists
if (!fs.existsSync(frontendDataDir)) {
    fs.mkdirSync(frontendDataDir, { recursive: true });
}

// Function to collect all benchmark results
function collectBenchmarkResults() {
    const results = [];

    // Read all subdirectories in benchmarks
    const benchmarkDirs = fs.readdirSync(benchmarksDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const dir of benchmarkDirs) {
        const resultPath = path.join(benchmarksDir, dir, 'result.json');

        if (fs.existsSync(resultPath)) {
            try {
                const resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
                results.push(resultData);
                console.log(`✓ Loaded benchmark: ${resultData.chip} - ${resultData.model} (${resultData.precision})`);
            } catch (error) {
                console.error(`✗ Error loading ${resultPath}:`, error.message);
            }
        }
    }

    return results;
}

// Main function
function syncBenchmarkData() {
    console.log('🔄 Syncing benchmark data...');

    // Collect all benchmark results
    const results = collectBenchmarkResults();

    if (results.length === 0) {
        console.log('⚠️  No benchmark results found');
        return;
    }

    // Write results.index.json
    const indexPath = path.join(frontendDataDir, 'results.index.json');
    fs.writeFileSync(indexPath, JSON.stringify(results, null, 2));
    console.log(`✓ Written ${results.length} results to ${indexPath}`);

    // Copy individual result files with standardized names
    for (const result of results) {
        const fileName = `${result.chip.toLowerCase().replace(/\s+/g, '-')}-${result.model.toLowerCase().replace(/\s+/g, '-')}-${result.precision.toLowerCase()}.json`;
        const targetPath = path.join(frontendDataDir, fileName);
        fs.writeFileSync(targetPath, JSON.stringify(result, null, 2));
        console.log(`✓ Written individual file: ${fileName}`);
    }

    console.log('✅ Benchmark data sync complete!');
}

// Run the sync
syncBenchmarkData(); 