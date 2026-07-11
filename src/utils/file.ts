/// <reference types="node" />

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

/**
 * Writes content to outputDir/filename, creating any missing directories.
 */
export async function writeOutput(
  outputDir: string,
  filename: string,
  content: string
): Promise<void> {
  const filePath = join(outputDir, filename);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
  console.log(`  ✓ Wrote ${filePath}`);
}

/**
 * Creates a directory (and parents) if it doesn't exist.
 */
export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}
