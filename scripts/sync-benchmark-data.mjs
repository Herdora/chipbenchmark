#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const benchmarksDir = path.join(__dirname, '../benchmarks');
const frontendDataDir = path.join(__dirname, '../frontend/public/data');
const frontendBenchmarksDir = path.join(frontendDataDir, 'benchmarks');

// Ensure frontend data directories exist
if (!fs.existsSync(frontendDataDir)) {
    fs.mkdirSync(frontendDataDir, { recursive: true });
}

if (!fs.existsSync(frontendBenchmarksDir)) {
    fs.mkdirSync(frontendBenchmarksDir, { recursive: true });
}

// Function to fix common JSON issues
function fixJsonString(jsonString) {
    // Remove trailing commas before closing braces and brackets
    return jsonString
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/([}\]]),(\s*[}\]])/g, '$1$2'); // Remove commas between closing braces
}

// Function to safely parse JSON with error recovery
function safeJsonParse(jsonString, filePath) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.log(`⚠️  JSON parse error in ${filePath}, attempting to fix...`);
        try {
            const fixedJson = fixJsonString(jsonString);
            const result = JSON.parse(fixedJson);
            console.log(`✓ Successfully fixed JSON in ${filePath}`);
            return result;
        } catch (fixError) {
            console.error(`✗ Could not fix JSON in ${filePath}:`, fixError.message);
            throw fixError;
        }
    }
}

// Function to recursively traverse benchmark directories
function traverseBenchmarkDirectories(baseDir, relativePath = '') {
    const results = [];
    const fullPath = path.join(baseDir, relativePath);

    if (!fs.existsSync(fullPath)) {
        return results;
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(relativePath, item.name);
        const fullItemPath = path.join(baseDir, itemPath);

        if (item.isDirectory()) {
            // Recursively traverse subdirectories
            results.push(...traverseBenchmarkDirectories(baseDir, itemPath));
        } else if (item.name === 'data.json') {
            // Found a data.json file, process it
            try {
                const jsonString = fs.readFileSync(fullItemPath, 'utf8');
                const data = safeJsonParse(jsonString, fullItemPath);

                // Extract model, chip, precision from the path
                const pathParts = relativePath.split(path.sep);
                if (pathParts.length >= 3) {
                    const [model, chip, precision] = pathParts;

                    // Check for hardware.json in the same directory
                    const hardwareJsonPath = path.join(path.dirname(fullItemPath), 'hardware.json');
                    let hardwareData = null;
                    
                    if (fs.existsSync(hardwareJsonPath)) {
                        try {
                            const hardwareJsonString = fs.readFileSync(hardwareJsonPath, 'utf8');
                            hardwareData = safeJsonParse(hardwareJsonString, hardwareJsonPath);
                        } catch (error) {
                            console.error(`✗ Error loading hardware.json ${hardwareJsonPath}:`, error.message);
                        }
                    }

                    results.push({
                        model,
                        chip,
                        precision,
                        path: relativePath,
                        data: data,
                        hardwareData: hardwareData,
                        sourcePath: fullItemPath,
                        hardwareSourcePath: hardwareData ? hardwareJsonPath : null
                    });

                    console.log(`✓ Found benchmark: ${model}/${chip}/${precision} (${data.length} data points)`);
                }
            } catch (error) {
                console.error(`✗ Error loading ${fullItemPath}:`, error.message);
            }
        }
    }

    return results;
}

// Function to copy benchmark data to frontend structure
function copyBenchmarkData(benchmarkInfo) {
    const { model, chip, precision, data, hardwareData, sourcePath, hardwareSourcePath } = benchmarkInfo;

    // Create target directory structure
    const targetDir = path.join(frontendBenchmarksDir, model, chip, precision);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy data.json file
    const targetPath = path.join(targetDir, 'data.json');
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));

    console.log(`✓ Copied: ${model}/${chip}/${precision}/data.json`);

    // Copy hardware.json file if it exists
    if (hardwareData && hardwareSourcePath) {
        const hardwareTargetPath = path.join(targetDir, 'hardware.json');
        fs.writeFileSync(hardwareTargetPath, JSON.stringify(hardwareData, null, 2));
        console.log(`✓ Copied: ${model}/${chip}/${precision}/hardware.json`);
    }

    return {
        model,
        chip,
        precision,
        dataPoints: data.length,
        targetPath,
        hasHardwareData: hardwareData !== null
    };
}

// Function to create index file with metadata
function createIndexFile(copiedBenchmarks) {
    const indexData = {
        lastUpdated: new Date().toISOString(),
        benchmarks: copiedBenchmarks.map(b => ({
            model: b.model,
            chip: b.chip,
            precision: b.precision,
            dataPoints: b.dataPoints,
            path: `benchmarks/${b.model}/${b.chip}/${b.precision}/data.json`,
            hasHardwareData: b.hasHardwareData
        }))
    };

    const indexPath = path.join(frontendDataDir, 'benchmarks.index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

    console.log(`✓ Created index file: ${indexPath}`);
    return indexPath;
}

// Main function
function syncBenchmarkData() {
    console.log('🔄 Syncing benchmark data...');

    // Check if benchmarks directory exists
    if (!fs.existsSync(benchmarksDir)) {
        console.error('✗ Benchmarks directory not found:', benchmarksDir);
        return;
    }

    // Traverse and collect all benchmark data
    const benchmarkInfos = traverseBenchmarkDirectories(benchmarksDir);

    if (benchmarkInfos.length === 0) {
        console.log('⚠️  No benchmark data found');
        return;
    }

    console.log(`📊 Found ${benchmarkInfos.length} benchmark configurations`);

    // Copy each benchmark to frontend structure
    const copiedBenchmarks = [];
    for (const benchmarkInfo of benchmarkInfos) {
        const copied = copyBenchmarkData(benchmarkInfo);
        copiedBenchmarks.push(copied);
    }

    // Create index file
    createIndexFile(copiedBenchmarks);

    // Summary
    const totalDataPoints = copiedBenchmarks.reduce((sum, b) => sum + b.dataPoints, 0);
    const hardwareFiles = copiedBenchmarks.filter(b => b.hasHardwareData).length;
    console.log(`✅ Sync complete! Copied ${copiedBenchmarks.length} benchmarks with ${totalDataPoints} total data points`);
    if (hardwareFiles > 0) {
        console.log(`📋 Also copied ${hardwareFiles} hardware.json files`);
    }
}

// Run the sync
syncBenchmarkData(); 