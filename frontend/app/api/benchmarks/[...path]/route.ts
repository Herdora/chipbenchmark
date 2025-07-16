import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[]; }>; }
) {
  try {
    const { path: pathSegments } = await params;

    // Expected path format: model/tensorParallelism/chip/precision/filename
    if (pathSegments.length !== 5) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 });
    }

    const [model, tensorParallelism, chip, precision, filename] = pathSegments;

    // Validate filename
    if (filename !== 'data.json' && filename !== 'hardware.json') {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      'public',
      'data',
      'benchmarks',
      model,
      tensorParallelism,
      chip,
      precision,
      filename
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `${filename} not found` }, { status: 404 });
    }

    // Read and return file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Error loading benchmark file:', error);
    return NextResponse.json({ error: 'Failed to load benchmark file' }, { status: 500 });
  }
} 