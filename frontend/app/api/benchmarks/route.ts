import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const benchmarksPath = path.join(process.cwd(), '..', 'benchmarks');
    
    // Check if benchmarks directory exists
    try {
      await fs.access(benchmarksPath);
    } catch {
      return NextResponse.json({
        models: [],
        chips: [],
        precisions: [],
        structure: []
      });
    }

    const models = await fs.readdir(benchmarksPath, { withFileTypes: true });
    const availableModels: string[] = [];
    const availableChips: string[] = [];
    const availablePrecisions: string[] = [];
    const structure: { model: string; chip: string; precision: string; hasData: boolean }[] = [];
    
    for (const modelDir of models) {
      if (!modelDir.isDirectory()) continue;
      
      const modelName = modelDir.name;
      availableModels.push(modelName);
      
      const modelPath = path.join(benchmarksPath, modelName);
      const chips = await fs.readdir(modelPath, { withFileTypes: true });
      
      for (const chipDir of chips) {
        if (!chipDir.isDirectory()) continue;
        
        const chipName = chipDir.name;
        if (!availableChips.includes(chipName)) {
          availableChips.push(chipName);
        }
        
        const chipPath = path.join(modelPath, chipName);
        const precisions = await fs.readdir(chipPath, { withFileTypes: true });
        
        for (const precisionDir of precisions) {
          if (!precisionDir.isDirectory()) continue;
          
          const precisionName = precisionDir.name.toLowerCase();
          if (!availablePrecisions.includes(precisionName)) {
            availablePrecisions.push(precisionName);
          }
          
          // Check if data.json exists
          const dataPath = path.join(chipPath, precisionDir.name, 'data.json');
          let hasData = false;
          try {
            await fs.access(dataPath);
            hasData = true;
          } catch {
            // No data.json file
          }
          
          structure.push({
            model: modelName,
            chip: chipName,
            precision: precisionName,
            hasData
          });
        }
      }
    }
    
    return NextResponse.json({
      models: availableModels.sort(),
      chips: availableChips.sort(),
      precisions: availablePrecisions.sort(),
      structure: structure.filter(s => s.hasData) // Only return structures with data
    });
    
  } catch (error) {
    console.error('Error scanning benchmarks directory:', error);
    return NextResponse.json(
      { error: 'Failed to scan benchmarks directory' },
      { status: 500 }
    );
  }
} 