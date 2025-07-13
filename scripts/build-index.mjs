#!/usr/bin/env node
/**
 * Build script for ChipBenchmark dashboard
 * Globs all benchmarks/result.json files and creates results.index.json
 */

import { glob } from 'glob';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function buildDataIndex() {
    try {
        console.log('🔍 Scanning for benchmark results...');

        // Find all result.json files in benchmarks directory
        const resultFiles = await glob('benchmarks/**/result.json', {
            cwd: projectRoot,
            absolute: true
        });

        console.log(`📊 Found ${resultFiles.length} benchmark results`);

        // Read and parse all result files
        const results = [];
        for (const file of resultFiles) {
            try {
                const content = await readFile(file, 'utf-8');
                const result = JSON.parse(content);
                results.push(result);
                console.log(`✅ Loaded ${result.model} on ${result.chip} (${result.precision})`);
            } catch (error) {
                console.error(`❌ Error reading ${file}:`, error.message);
            }
        }

        // Sort results by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Ensure frontend/public/data directory exists
        const dataDir = join(projectRoot, 'frontend/public/data');
        await mkdir(dataDir, { recursive: true });

        // Write results.index.json
        const indexPath = join(dataDir, 'results.index.json');
        await writeFile(indexPath, JSON.stringify(results, null, 2));

        console.log(`📝 Created results.index.json with ${results.length} entries`);

            // Copy individual result files to frontend/public/data
    for (const file of resultFiles) {
      const content = await readFile(file, 'utf-8');
      const result = JSON.parse(content);
      const fileName = `${result.chip.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${result.model.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${result.precision.toLowerCase()}.json`;
      
      const destPath = join(dataDir, fileName);
      await writeFile(destPath, content);
      console.log(`📄 Copied to ${fileName}`);
    }

        console.log('✨ Data index build completed successfully!');

    } catch (error) {
        console.error('💥 Build failed:', error.message);
        process.exit(1);
    }
}

buildDataIndex(); 