import { state } from '../state/store';
import { getHistory, getTodayStr, recordTodaySnapshot } from '../utils/persistence';

export function openStats(): void {
  recordTodaySnapshot();
  const hist = getHistory();
  const today = getTodayStr();
  
  const todayData = hist[today] || { total: state.blocks.length, completed: 0 };
  const todayPct = todayData.total ? Math.round((todayData.completed / todayData.total) * 100) : 0;
  
  let weekTotal = 0;
  let weekComp = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    if (hist[dStr]) {
      weekTotal += hist[dStr].total;
      weekComp += hist[dStr].completed;
    }
  }
  const weekPct = weekTotal ? Math.round((weekComp / weekTotal) * 100) : 0;

  const statsBody = document.getElementById('statsBody');
  if (statsBody) {
    statsBody.innerHTML = `
      <div class="stat-card">
        <div class="stat-val">${todayData.completed} / ${todayData.total} <span style="font-size:14px;color:var(--text-dim)">(${todayPct}%)</span></div>
        <div class="stat-label">Completados Hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${weekPct}%</div>
        <div class="stat-label">Promedio Esta Semana</div>
      </div>
    `;
  }
  
  const statsModal = document.getElementById('statsModal');
  if (statsModal) statsModal.style.display = 'flex';
}

export function closeStats(e?: MouseEvent): void {
  if (e) {
    const target = e.target as HTMLElement;
    if (target.id !== 'statsModal' && !target.closest('.btn-icon')) return;
  }
  const statsModal = document.getElementById('statsModal');
  if (statsModal) statsModal.style.display = 'none';
}

export function openSettings(): void {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) settingsModal.style.display = 'flex';
}

export function closeSettings(e?: MouseEvent): void {
  if (e) {
    const target = e.target as HTMLElement;
    if (target.id !== 'settingsModal' && !target.closest('.btn-icon')) return;
  }
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) settingsModal.style.display = 'none';
}

// Bind to window for inline onclick handlers in HTML template strings
(window as any).openStats = openStats;
(window as any).closeStats = closeStats;
(window as any).openSettings = openSettings;
(window as any).closeSettings = closeSettings;
