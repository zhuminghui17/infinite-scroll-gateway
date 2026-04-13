import * as fs from 'fs';
import * as path from 'path';

const RECEIPT_WIDTH = 48;

const MILESTONES_DIR = path.join(__dirname, '..', '..', 'contents', 'milestones');

/** Half-open tiers [min, max) in cm; final tier is [500, ∞). */
const MILESTONE_TIERS: { min: number; max: number; file: string }[] = [
  { min: 0, max: 15, file: 'dandelion.txt' },
  { min: 15, max: 20, file: 'book.txt' },
  { min: 20, max: 30, file: 'banana.txt' },
  { min: 30, max: 35, file: 'flower.txt' },
  { min: 35, max: 40, file: 'bowling.txt' },
  { min: 40, max: 50, file: 'cat.txt' },
  { min: 50, max: 70, file: 'dog.txt' },
  { min: 70, max: 77, file: 'golden_retriever.txt' },
  { min: 77, max: 100, file: 'mona_lisa.txt' },
  { min: 100, max: 110, file: 'guitar.txt' },
  { min: 110, max: 120, file: 'boy.txt' },
  { min: 120, max: 140, file: 'broom.txt' },
  { min: 140, max: 170, file: 'piano.txt' },
  { min: 170, max: 200, file: 'sunflower.txt' },
  { min: 200, max: 250, file: 'bed.txt' },
  { min: 250, max: 350, file: 'ploar_bear.txt' },
  { min: 350, max: 430, file: 'car.txt' },
  { min: 430, max: 500, file: 'house.txt' },
  { min: 500, max: Number.POSITIVE_INFINITY, file: 'giraffe.txt' },
];

export function milestoneFilenameForDepth(scrollDepthCm: number): string {
  const d = Math.max(0, scrollDepthCm);
  for (const t of MILESTONE_TIERS) {
    if (d >= t.min && d < t.max) return t.file;
  }
  return 'giraffe.txt';
}

function loadMilestoneArtLines(scrollDepthCm: number): string[] {
  const file = milestoneFilenameForDepth(scrollDepthCm);
  const fullPath = path.join(MILESTONES_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
  return raw.replace(/\n$/, '').split('\n');
}

export function receiptRow(leftLabel: string, rightValue: string, width = RECEIPT_WIDTH): string {
  const rv = rightValue.trim();
  let lv = leftLabel.trim();
  let dotsLen = width - lv.length - rv.length - 2;
  if (dotsLen >= 1) {
    return (lv + ' ' + '.'.repeat(dotsLen) + ' ' + rv).slice(0, width);
  }
  let truncatedRv = rv;
  let maxRv = width - lv.length - 4;
  if (maxRv < 4) {
    lv = lv.slice(0, Math.max(4, width - 8));
    maxRv = width - lv.length - 4;
    truncatedRv = rv.slice(0, Math.max(1, maxRv));
  } else {
    truncatedRv = rv.slice(0, maxRv);
  }
  dotsLen = width - lv.length - truncatedRv.length - 2;
  if (dotsLen < 1) {
    return (lv + ' ' + truncatedRv).slice(0, width);
  }
  return (lv + ' ' + '.'.repeat(dotsLen) + ' ' + truncatedRv).slice(0, width);
}

export function centerLine(text: string, width = RECEIPT_WIDTH): string {
  const t = text.trim();
  if (t.length >= width) return t.slice(0, width);
  const pad = width - t.length;
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + t + ' '.repeat(width - left - t.length);
}

const SEP_EQ = '='.repeat(RECEIPT_WIDTH);
const SEP_DASH = '-'.repeat(RECEIPT_WIDTH);

function rngDefault(): number {
  return Math.random();
}

function pickN<T>(items: T[], n: number, rng: () => number): T[] {
  const copy = [...items];
  const out: T[] = [];
  const take = Math.min(n, copy.length);
  for (let i = 0; i < take; i++) {
    const j = Math.floor(rng() * copy.length);
    out.push(copy[j]);
    copy.splice(j, 1);
  }
  return out;
}

export interface ReceiptInput {
  /** Print-session scroll depth (cm), from client PPI. */
  scrollDepthCm: number;
  /** Lifetime / app total scroll distance (cm), same basis as Scroll Stats “Distance”. */
  accumulatedDistanceCm: number;
  durationMs: number;
  scrollTouches: number;
  rng?: () => number;
  /** Override milestone ASCII (e.g. tests); default loads from contents/milestones by depth. */
  milestoneLines?: string[];
}

interface ReceiptKV {
  label: string;
  value: string;
}

/**
 * EYES + SHOULD count as one outcome; each rest line is another outcome.
 * P(blink pair) = 1 / (1 + restPool.length); else two random distinct rest lines.
 */
function selectBodyRows(minutes: number, scrollTouches: number, rng: () => number): ReceiptKV[] {
  const m = minutes;
  const t = scrollTouches;
  const eyesBlinked = Math.round(15 * m);
  const shouldHaveBlinked = Math.round(22 * m);
  const blinksSkipped = Math.max(0, shouldHaveBlinked - eyesBlinked);

  const blinkPair: ReceiptKV[] = [
    { label: 'EYES BLINKED', value: `${eyesBlinked} times` },
    { label: 'SHOULD HAVE BLINKED', value: `${shouldHaveBlinked} times` },
  ];

  const restPool: ReceiptKV[] = [
    { label: 'BLINKS SKIPPED', value: `${blinksSkipped} times` },
    { label: 'DRY EYE WARNING', value: 'active' },
    { label: 'DRY EYE STATUS', value: 'forming' },
    { label: 'FOCUS MUSCLES', value: 'engaged' },
    { label: 'THUMB MOVEMENT', value: `${t} touches` },
    { label: 'WRIST ANGLE', value: 'unchanged' },
    { label: 'POSTURE', value: 'static' },
    { label: 'BODY MOVEMENT', value: 'minimal' },
    { label: 'NECK ANGLE', value: '~45 degrees' },
    { label: 'MELATONIN SUPPRESSION', value: 'pending' },
  ];

  const slot = Math.floor(rng() * (1 + restPool.length));
  if (slot === 0) {
    return blinkPair;
  }
  return pickN(restPool, 2, rng);
}

function environmentPool(minutes: number): ReceiptKV[] {
  const m = minutes;
  return [
    { label: 'CO2 EMITTED', value: `${(m * 1.5).toFixed(2)} g` },
    { label: 'DATA TRANSFERRED', value: `${Math.round(m * 30)} MB` },
    { label: 'ENERGY USED', value: `${(m * 0.05).toFixed(3)} Wh` },
    { label: 'WATER (COOL SERVERS)', value: `${Math.round(m * 30)} ml` },
  ];
}

function dataMonPool(scrollTouches: number): ReceiptKV[] {
  const t = scrollTouches;
  const revenue = (t / 5) * 0.00025;
  return [
    { label: 'AD REVENUE', value: `$${revenue.toFixed(6)}` },
    { label: 'AD IMPRESSIONS', value: String(Math.round(t / 3)) },
    { label: 'ALGORITHM CONFIDENCE', value: 'increasing' },
  ];
}

function displacementPool(scrollDepthCm: number, minutes: number): ReceiptKV[] {
  const candidates: ReceiptKV[] = [];
  const steps = scrollDepthCm / 60;
  if (steps > 3) {
    candidates.push({ label: 'WALK (NOT TAKEN)', value: `${Math.round(steps)} steps` });
  }
  const miles = scrollDepthCm / 160934;
  if (miles > 0.5) {
    candidates.push({ label: 'RUN (NOT COMPLETED)', value: `${miles.toFixed(2)} mi` });
  }
  candidates.push({ label: 'PAGES (NOT READ)', value: `${(minutes * 0.8).toFixed(1)}` });
  candidates.push({ label: 'SUNLIGHT (NOT SEEN)', value: 'negligible' });
  return candidates;
}

const CONTENT_POOL: ReceiptKV[] = [
  { label: 'CONTENT ABSORBED', value: 'unclear' },
  { label: 'CONTENT RETAINED', value: 'minimal' },
  { label: 'CONTENT FORGOTTEN', value: 'immediate' },
];

const INTENTION_POOL: ReceiptKV[] = [
  { label: 'INITIAL INTENTION', value: 'not found' },
  { label: 'ENTRY POINT', value: 'unknown' },
  { label: 'SEARCH GOAL', value: 'unresolved' },
  { label: 'PURPOSE', value: 'unclear' },
];

export function buildReceiptLines(input: ReceiptInput): string[] {
  const rng = input.rng ?? rngDefault;
  const { scrollDepthCm, accumulatedDistanceCm, durationMs, scrollTouches } = input;
  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    throw new Error('scrollDepthCm must be a finite number');
  }
  if (typeof accumulatedDistanceCm !== 'number' || !Number.isFinite(accumulatedDistanceCm)) {
    throw new Error('accumulatedDistanceCm must be a finite number');
  }
  const timeElapsedSec = Math.round(durationMs / 1000);
  const minutes = durationMs / 60_000;

  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const lines: string[] = [];
  lines.push(SEP_EQ);
  lines.push(centerLine('SCROLL RECEIPT'));
  lines.push(centerLine(date));
  lines.push(SEP_EQ);
  const depthStr = `${scrollDepthCm.toFixed(1)} cm`;
  const accumulatedStr = `${accumulatedDistanceCm.toFixed(1)} cm`;
  lines.push(receiptRow('YOUR SCROLL DISTANCE', depthStr));
  lines.push(receiptRow('TIME ELAPSED', `${timeElapsedSec} seconds`));
  lines.push(SEP_DASH);

  const bodyPicks = selectBodyRows(minutes, scrollTouches, rng);
  for (const row of bodyPicks) {
    lines.push(receiptRow(row.label, row.value));
  }

  lines.push(SEP_DASH);
  const envPicks = pickN(environmentPool(minutes), 2, rng);
  for (const row of envPicks) {
    lines.push(receiptRow(row.label, row.value));
  }

  lines.push(SEP_DASH);
  const dmPicks = pickN(dataMonPool(scrollTouches), 2, rng);
  for (const row of dmPicks) {
    lines.push(receiptRow(row.label, row.value));
  }

  lines.push(SEP_DASH);
  const dispCandidates = displacementPool(scrollDepthCm, minutes);
  const dispPicks = pickN(dispCandidates, 2, rng);
  for (const row of dispPicks) {
    lines.push(receiptRow(row.label, row.value));
  }

  lines.push(SEP_DASH);
  const cPick = CONTENT_POOL[Math.floor(rng() * CONTENT_POOL.length)];
  const iPick = INTENTION_POOL[Math.floor(rng() * INTENTION_POOL.length)];
  lines.push(receiptRow(cPick.label, cPick.value));
  lines.push(receiptRow(iPick.label, iPick.value));

  lines.push(SEP_DASH);
  lines.push('');
  lines.push(centerLine('You have scrolled'));
  const milestoneLines = input.milestoneLines ?? loadMilestoneArtLines(scrollDepthCm);
  for (const line of milestoneLines) {
    lines.push(line);
  }
  lines.push('');
  lines.push(SEP_EQ);
  lines.push(receiptRow('ACCUMULATED DISTANCE', accumulatedStr));
  lines.push(SEP_EQ);
  lines.push(centerLine('No refunds. No exchanges.'));
  lines.push(SEP_EQ);

  return lines;
}
