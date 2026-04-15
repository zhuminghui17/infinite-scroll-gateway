import * as fs from 'fs';
import * as path from 'path';

const CONTENTS_DIR = path.join(__dirname, '..', '..', 'contents');

export const MAIN_SETS = ['cloud', 'money', 'surf'] as const;
export type MainSetId = (typeof MAIN_SETS)[number];

let currentSessionSet: MainSetId = MAIN_SETS[0];
let nextMainSetIndex = 0;

export function getCurrentSessionMainSet(): MainSetId {
  return currentSessionSet;
}

export function loadMainContentLines(set: MainSetId, filename: string): string[] {
  const filePath = path.join(CONTENTS_DIR, 'main', set, filename);
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

export function pickNewSessionContentSet(): { startLines: string[]; repeatLines: string[] } {
  currentSessionSet = MAIN_SETS[nextMainSetIndex % MAIN_SETS.length];
  nextMainSetIndex = (nextMainSetIndex + 1) % MAIN_SETS.length;
  return {
    startLines: loadMainContentLines(currentSessionSet, 'start.txt'),
    repeatLines: loadMainContentLines(currentSessionSet, 'repeat.txt'),
  };
}
