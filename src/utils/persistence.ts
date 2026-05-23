import { state, STORAGE_KEY_V3, DEFAULT_BLOCKS, HISTORY_KEY } from '../state/store';
import { toMins, sortBlocks } from './time';
import { scheduleNotifications } from './notifs';
import { showToast } from './helpers';

export function load(): void {
  try {
    const rawV3 = localStorage.getItem(STORAGE_KEY_V3);
    if (rawV3) {
      state.allBlocks = JSON.parse(rawV3);
      let maxId = 0;
      Object.values(state.allBlocks).forEach(arr => {
        arr.forEach(b => {
          if (b.id > maxId) maxId = b.id;
        });
      });
      state.nextId = maxId + 1;
      state.selectedDay = new Date().getDay();
      
      // Sort blocks for all days
      Object.values(state.allBlocks).forEach(arr => {
        sortBlocks(arr);
      });
      return;
    }
    
    // Migration from v2
    const rawV2 = localStorage.getItem('dailyflow_blocks_v2');
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed) && parsed.length) {
        let idCounter = 1;
        for (let i = 0; i < 7; i++) {
          state.allBlocks[i] = JSON.parse(JSON.stringify(parsed));
          state.allBlocks[i].forEach(b => {
            b.id = idCounter++;
          });
        }
        state.nextId = idCounter;
        state.selectedDay = new Date().getDay();
        save();
        return;
      }
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  
  // Default blocks setup if no storage exists
  let nextIdCounter = 100;
  for (let i = 0; i < 7; i++) {
    state.allBlocks[i] = JSON.parse(JSON.stringify(DEFAULT_BLOCKS));
    state.allBlocks[i].forEach(b => {
      b.id = nextIdCounter++;
    });
  }
  state.nextId = nextIdCounter;
  state.selectedDay = new Date().getDay();
  save();
}

export function save(): void {
  // Sync state.blocks back to state.allBlocks just in case
  state.allBlocks[state.selectedDay] = state.blocks;
  try {
    localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(state.allBlocks));
  } catch (e) {
    console.error('Error saving data:', e);
  }
  scheduleNotifications();
}

export function exportData(): void {
  const today = new Date();
  const dStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const data = JSON.stringify(state.allBlocks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dailyroutine-backup-${dStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(e: Event, onImportComplete: () => void): void {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const parsed = JSON.parse(evt.target?.result as string);
      if (typeof parsed === 'object' && parsed['0'] && Array.isArray(parsed['0'])) {
        state.allBlocks = parsed;
        save();
        state.selectedDay = new Date().getDay();
        onImportComplete();
        showToast('Rutina importada con éxito');
      } else {
        showToast('Formato JSON inválido');
      }
    } catch (err) {
      showToast('Error al leer el archivo');
    }
    target.value = ''; // Reset input
  };
  reader.readAsText(file);
}

export function getHistory(): Record<string, { total: number; completed: number }> {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveHistory(hist: Record<string, { total: number; completed: number }>): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  } catch (e) {}
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

export function recordTodaySnapshot(): void {
  const today = getTodayStr();
  const hist = getHistory();
  const todayIdx = new Date().getDay();
  const todayBlocks = state.allBlocks[todayIdx] || [];
  const total = todayBlocks.length;
  const completed = todayBlocks.filter(b => b.completed).length;
  hist[today] = { total, completed };
  saveHistory(hist);
}

