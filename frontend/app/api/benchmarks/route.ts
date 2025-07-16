import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const indexPath = path.join(process.cwd(), 'public', 'data', 'benchmarks.index.json');

    if (!fs.existsSync(indexPath)) {
      return NextResponse.json({ error: 'Benchmark index not found' }, { status: 404 });
    }

    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    return NextResponse.json(indexData);
  } catch (error) {
    console.error('Error loading benchmark index:', error);
    return NextResponse.json({ error: 'Failed to load benchmark index' }, { status: 500 });
  }
} 