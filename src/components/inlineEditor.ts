import { state } from '../state/store';
import { showToast } from '../utils/helpers';
import { toTimeInput, fromTimeInput, sortBlocks, getOverlappingIds } from '../utils/time';
import { save, recordTodaySnapshot } from '../utils/persistence';

let renderCallback: (() => void) | null = null;

export function setEditorRenderCallback(cb: () => void): void {
  renderCallback = cb;
}

export function toggleEdit(id: number): void {
  state.confirmId = null;
  state.openId = state.openId === id ? null : id;
  if (renderCallback) renderCallback();
  
  if (state.openId) {
    setTimeout(() => {
      const el = document.getElementById(`ed-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  }
}

export function pickColor(id: number, color: string): void {
  const b = state.blocks.find(x => x.id === id);
  if (b) {
    b.color = color;
    state.openId = id;
    if (renderCallback) renderCallback();
  }
}

export function saveBlock(id: number): void {
  const b = state.blocks.find(x => x.id === id);
  if (!b) return;
  
  const nameEl = document.getElementById(`n-${id}`) as HTMLInputElement;
  const startEl = document.getElementById(`s-${id}`) as HTMLInputElement;
  const endEl = document.getElementById(`e-${id}`) as HTMLInputElement;
  
  if (!nameEl || !startEl || !endEl) return;
  
  const name = nameEl.value.trim();
  const s = startEl.value;
  const e = endEl.value;
  
  if (!name) {
    showToast('El nombre no puede estar vacío');
    return;
  }
  
  b.name = name;
  b.start = fromTimeInput(s);
  b.end = fromTimeInput(e);
  
  state.openId = null;
  state.confirmId = null;
  
  sortBlocks(state.blocks);
  save();
  if (renderCallback) renderCallback();
  
  const overlaps = getOverlappingIds();
  if (overlaps.has(id)) {
    showToast('Guardado (⚠️ Hay solapamiento)');
  } else {
    showToast('Guardado ✓');
  }
}

export function askDelete(id: number): void {
  state.confirmId = id;
  state.openId = id;
  if (renderCallback) renderCallback();
}

export function cancelDelete(id: number): void {
  state.confirmId = null;
  if (renderCallback) renderCallback();
}

export function doDelete(id: number): void {
  const idx = state.blocks.findIndex(x => x.id === id);
  if (idx !== -1) {
    state.blocks.splice(idx, 1);
  }
  state.openId = null;
  state.confirmId = null;
  save();
  if (renderCallback) renderCallback();
  showToast('Bloque eliminado');
}

export function toggleComplete(e: Event, id: number): void {
  e.stopPropagation();
  const b = state.blocks.find(x => x.id === id);
  if (b) {
    b.completed = !b.completed;
    recordTodaySnapshot();
    save();
    if (renderCallback) renderCallback();
    if (b.completed && 'vibrate' in navigator) navigator.vibrate(10);
  }
}

export function addBlock(): void {
  if (state.draftBlock) return; // already creating one
  state.openId = null;
  state.draftBlock = { id: 0, name: '', start: '12:00', end: '13:00', color: '#9B8EE8', completed: false };
  if (renderCallback) renderCallback();
  
  setTimeout(() => {
    const el = document.getElementById('ed-draft');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

export function saveDraft(): void {
  if (!state.draftBlock) return;
  
  const nameEl = document.getElementById('n-draft') as HTMLInputElement;
  const startEl = document.getElementById('s-draft') as HTMLInputElement;
  const endEl = document.getElementById('e-draft') as HTMLInputElement;
  
  if (!nameEl || !startEl || !endEl) return;
  
  const name = nameEl.value.trim();
  const s = startEl.value;
  const e = endEl.value;
  
  if (!name) {
    showToast('El nombre no puede estar vacío');
    return;
  }
  
  const b = {
    id: state.nextId++,
    name: name,
    start: fromTimeInput(s),
    end: fromTimeInput(e),
    color: state.draftBlock.color,
    completed: false
  };
  
  state.blocks.push(b);
  state.draftBlock = null;
  
  sortBlocks(state.blocks);
  save();
  if (renderCallback) renderCallback();
  showToast(name + ' creado ✓');
}

export function cancelDraft(): void {
  state.draftBlock = null;
  if (renderCallback) renderCallback();
}

export function pickDraftColor(color: string): void {
  if (state.draftBlock) {
    state.draftBlock.color = color;
    if (renderCallback) renderCallback();
  }
}

export function addTemplate(name: string, start: string, end: string, color: string): void {
  const b = {
    id: state.nextId++,
    name,
    start,
    end,
    color,
    completed: false
  };
  state.blocks.push(b);
  sortBlocks(state.blocks);
  save();
  if (renderCallback) renderCallback();
  showToast(name + ' añadido');
}

// Bind to window for inline onclick handlers in HTML template strings
(window as any).toggleEdit = toggleEdit;
(window as any).pickColor = pickColor;
(window as any).saveBlock = saveBlock;
(window as any).askDelete = askDelete;
(window as any).cancelDelete = cancelDelete;
(window as any).doDelete = doDelete;
(window as any).toggleComplete = toggleComplete;
(window as any).saveDraft = saveDraft;
(window as any).cancelDraft = cancelDraft;
(window as any).pickDraftColor = pickDraftColor;
(window as any).addTemplate = addTemplate;
