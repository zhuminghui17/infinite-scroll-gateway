const RECEIPT_WIDTH = 48;

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
  scrollDepthCm: number;
  durationMs: number;
  scrollTouches: number;
  rng?: () => number;
}

interface ReceiptKV {
  label: string;
  value: string;
}

function bodyPool(minutes: number, scrollTouches: number): ReceiptKV[] {
  const m = minutes;
  const t = scrollTouches;
  return [
    { label: 'EYES BLINKED', value: `${Math.round(15 * m)} times` },
    { label: 'SHOULD HAVE BLINKED', value: `${Math.round(22 * m)} times` },
    { label: 'BLINKS SKIPPED', value: `${Math.max(0, Math.round(22 * m - 15 * m))} times` },
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
    { label: 'AD IMPRESSIONS', value: `${(t / 3).toFixed(1)}` },
    { label: 'ALGORITHM CONFIDENCE', value: 'increasing' },
  ];
}

function displacementPool(scrollDepthCm: number, minutes: number): ReceiptKV[] {
  const candidates: ReceiptKV[] = [];
  const steps = scrollDepthCm / 60;
  if (steps > 3) {
    candidates.push({ label: 'WALK (NOT TAKEN)', value: `${steps.toFixed(0)} steps` });
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
  const { scrollDepthCm, durationMs, scrollTouches } = input;
  if (typeof scrollDepthCm !== 'number' || !Number.isFinite(scrollDepthCm)) {
    throw new Error('scrollDepthCm must be a finite number');
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
  lines.push(receiptRow('YOUR SCROLL DISTANCE', depthStr));
  lines.push(receiptRow('TIME ELAPSED', `${timeElapsedSec} seconds`));
  lines.push(receiptRow('ACCUMULATED DISTANCE', depthStr));
  lines.push(SEP_DASH);

  const bodyPicks = pickN(bodyPool(minutes, scrollTouches), 2, rng);
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
  lines.push('');
  lines.push(centerLine('[ MILESTONE + ASCII ART ]'));
  lines.push(centerLine('(placeholder)'));
  lines.push('');
  lines.push(SEP_EQ);
  lines.push(centerLine('No refunds. No exchanges.'));
  lines.push(SEP_EQ);

  return lines;
}
