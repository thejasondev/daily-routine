import { state } from '../state/store';

let renderCallback: (() => void) | null = null;
let progressCallback: (() => void) | null = null;

export function setDaySelectorCallbacks(renderCb: () => void, progressCb: () => void): void {
  renderCallback = renderCb;
  progressCallback = progressCb;
}

export function updateDaySelectorUI(): void {
  const btns = document.querySelectorAll('.day-btn');
  const today = new Date().getDay();
  btns.forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick');
    if (!onclickAttr) return;
    
    const match = onclickAttr.match(/\d/);
    if (!match) return;
    
    const dayVal = parseInt(match[0]);
    if (dayVal === state.selectedDay) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    
    if (dayVal === today) {
      btn.classList.add('today');
    } else {
      btn.classList.remove('today');
    }
  });
}

export function selectDay(d: number): void {
  state.selectedDay = d;
  state.blocks = state.allBlocks[d] || [];
  updateDaySelectorUI();
  state.openId = null;
  
  if (progressCallback) progressCallback();
  if (renderCallback) renderCallback();
}

// Attach to window so HTML inline onclick handlers still work perfectly
(window as any).selectDay = selectDay;
