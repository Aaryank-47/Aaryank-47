/// <reference types="node" />

/**
 * THE ONLY FILE IN THE ENTIRE PROJECT THAT READS process.env.
 *
 * Token priority:
 *   1. PROFILE_STATS_TOKEN — optional Personal Access Token (enables private stats)
 *   2. GITHUB_TOKEN        — built-in GitHub Actions token (public stats)
 *
 * Username resolution:
 *   1. GITHUB_USERNAME — set manually for local development
 *   2. GITHUB_ACTOR    — automatically set by GitHub Actions
 */

import 'dotenv/config';
import type { AppConfig } from '../interfaces/config.js';

function resolveToken(): string {
  const personal = process.env['PROFILE_STATS_TOKEN'];
  const builtin = process.env['GITHUB_TOKEN'];

  const token = (personal && personal.trim() !== '') ? personal : builtin;

  if (!token || token.trim() === '') {
    throw new Error(
      [
        'GitHub token not found.',
        'For local development: create a .env file with PROFILE_STATS_TOKEN=ghp_...',
        'In GitHub Actions: GITHUB_TOKEN is provided automatically.',
      ].join('\n')
    );
  }

  return token.trim();
}

function resolveUsername(): string {
  const manual = process.env['GITHUB_USERNAME'];
  const actor = process.env['GITHUB_ACTOR'];

  const username = (manual && manual.trim() !== '') ? manual : actor;

  if (!username || username.trim() === '') {
    throw new Error(
      [
        'GitHub username not found.',
        'For local development: add GITHUB_USERNAME=your-username to your .env file.',
        'In GitHub Actions: GITHUB_ACTOR is set automatically.',
      ].join('\n')
    );
  }

  return username.trim();
}

function resolveOutputDir(): string {
  const dir = process.env['OUTPUT_DIR'];
  return (dir && dir.trim() !== '') ? dir.trim() : 'assets';
}

export const config: AppConfig = {
  token: resolveToken(),
  username: resolveUsername(),
  outputDir: resolveOutputDir(),
};
