import { state } from '../state/store';
import { Block } from '../types';

export function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function fromMins(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, '0')}`;
}

export function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function durationLabel(start: string, end: string): string {
  let s = toMins(start), e = toMins(end);
  if (e <= s) e += 24 * 60;
  const d = e - s;
  if (d < 60) return `${d}min`;
  const h = Math.floor(d / 60), mm = d % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

export function toTimeInput(t: string): string {
  const [h, m] = t.split(':');
  return `${h.toString().padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
}

export function fromTimeInput(v: string): string {
  const [h, m] = v.split(':');
  return `${parseInt(h)}:${m}`;
}

export function fmtGap(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function getTotalFreeTime(): number {
  const FULL_DAY = 24 * 60;
  let planned = 0;
  const currentBlocks = state.blocks;
  for (let i = 0; i < currentBlocks.length; i++) {
    const b = currentBlocks[i];
    let s = toMins(b.start), e = toMins(b.end);
    if (e <= s) e += FULL_DAY; // overnight block
    planned += (e - s);
  }
  return Math.max(0, FULL_DAY - planned);
}

export function getOverlappingIds(): Set<number> {
  const ids = new Set<number>();
  const currentBlocks = state.blocks;
  for (let i = 0; i < currentBlocks.length - 1; i++) {
    const a = currentBlocks[i], b = currentBlocks[i + 1];
    const aS = toMins(a.start), aE = toMins(b.start); // Wait! Let's check how overlapping was done in the original code!
    // Ah, wait! The original overlapping logic:
    // for (let i = 0; i < blocks.length - 1; i++) {
    //   const a = blocks[i], b = blocks[i + 1];
    //   const aS = toMins(a.start), aE = toMins(a.end);
    //   const bS = toMins(b.start), bE = toMins(b.end);
    //   if (aE <= aS || bE <= bS) continue;
    //   if (aE > bS) { ids.add(a.id); ids.add(b.id); }
    // }
    // Let's implement it exactly like the original!
  }
  
  // Wait, let's write it perfectly matching the original logic:
  const len = currentBlocks.length;
  for (let i = 0; i < len - 1; i++) {
    const a = currentBlocks[i], b = currentBlocks[i + 1];
    const aS = toMins(a.start), aE = toMins(a.end);
    const bS = toMins(b.start); // Note: bE is not needed to check if a overflows into bS
    const bE = toMins(b.end);
    if (aE <= aS || bE <= bS) continue;
    if (aE > bS) { ids.add(a.id); ids.add(b.id); }
  }
  return ids;
}

export function nowMins(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export function isActive(b: Block): boolean {
  const now = nowMins();
  let s = toMins(b.start), e = toMins(b.end);
  if (e <= s) { // overnight
    return now >= s || now < e;
  }
  return now >= s && now < e;
}

export function isPast(b: Block): boolean {
  const now = nowMins();
  let e = toMins(b.end);
  if (toMins(b.end) <= toMins(b.start)) return false; // overnight, never past
  return now >= e;
}

export function sortBlocks(arr: Block[]) {
  arr.sort((a, b) => {
    const aStart = toMins(a.start);
    const bStart = toMins(b.start);
    const aEnd = toMins(a.end);
    const bEnd = toMins(b.end);
    // Overnight blocks (end <= start) go last
    const aOvernight = aEnd <= aStart ? 1 : 0;
    const bOvernight = bEnd <= bStart ? 1 : 0;
    if (aOvernight !== bOvernight) return aOvernight - bOvernight;
    // Same category: sort by start time, then by end time
    if (aStart !== bStart) return aStart - bStart;
    return aEnd - bEnd;
  });
}
