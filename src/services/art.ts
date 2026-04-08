import * as fs from 'fs';
import * as path from 'path';

export interface ArtEntry {
  name: string;
  minDistance: number;
  content: string[];
}

const SAMPLE_DIR = path.join(__dirname, '..', '..', 'sample_receipts');

function loadArt(filename: string): string[] {
  const filePath = path.join(SAMPLE_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

const artTiers: ArtEntry[] = [
  { name: 'flower', minDistance: 0, content: loadArt('flower.txt') },
  { name: 'dogs', minDistance: 1000, content: loadArt('dog.txt') },
  { name: 'parachute', minDistance: 5000, content: loadArt('parachute.txt') },
  { name: 'dog_vertical', minDistance: 15000, content: loadArt('dog_vertical.txt') },
];

export interface ArtSelection {
  tier: ArtEntry | null;
  tierIndex: number;
  isNewTier: boolean;
}

/**
 * Finds the highest tier whose minDistance threshold has been crossed.
 * `printedTiers` tracks which tiers have already been printed so each
 * art only fires once per session.
 */
export function selectArt(
  totalDistance: number,
  printedTiers: Set<number>,
): ArtSelection {
  let currentTierIndex = -1;
  for (let i = artTiers.length - 1; i >= 0; i--) {
    if (totalDistance >= artTiers[i].minDistance) {
      currentTierIndex = i;
      break;
    }
  }

  if (currentTierIndex < 0) {
    return { tier: null, tierIndex: -1, isNewTier: false };
  }

  const isNewTier = !printedTiers.has(currentTierIndex);
  return {
    tier: artTiers[currentTierIndex],
    tierIndex: currentTierIndex,
    isNewTier,
  };
}

export function buildDistanceIndicator(totalDistance: number, width = 48): string {
  const label = `--- ${Math.round(totalDistance)} px ---`;
  const pad = Math.max(0, Math.floor((width - label.length) / 2));
  return ' '.repeat(pad) + label;
}

export function getArtTiers(): ArtEntry[] {
  return artTiers;
}
