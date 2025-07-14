import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[]; }>; }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid path. Expected: /api/benchmarks/{model}/{chip}/{precision}/data.json' },
        { status: 400 }
      );
    }

    const [model, chip, precision, filename] = pathSegments;

    if (filename !== 'data.json') {
      return NextResponse.json(
        { error: 'Only data.json files are supported' },
        { status: 400 }
      );
    }

    const benchmarksPath = path.join(process.cwd(), '..', 'benchmarks');
    const dataPath = path.join(benchmarksPath, model, chip, precision.toUpperCase(), 'data.json');

    try {
      const data = await fs.readFile(dataPath, 'utf-8');
      const jsonData = JSON.parse(data);

      return NextResponse.json(jsonData);
    } catch (error) {
      console.error(`Error reading data file: ${dataPath}`, error);
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error in benchmarks API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 