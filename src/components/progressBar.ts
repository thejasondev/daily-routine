import { state } from '../state/store';
import { nowMins, isActive, fmt12 } from '../utils/time';

export function updateProgress(): void {
  const isToday = state.selectedDay === new Date().getDay();
  const now = isToday ? nowMins() : 0;
  const total = 24 * 60;
  const pct = isToday ? Math.round((now / total) * 100) : 0;
  
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');
  
  if (progressFill) progressFill.style.width = pct + '%';
  if (progressPct) progressPct.textContent = pct + '%';

  const banner = document.getElementById('nowBanner');
  if (banner) {
    if (isToday) {
      const active = state.blocks.find(isActive);
      if (active) {
        const nowName = document.getElementById('nowName');
        const nowTime = document.getElementById('nowTime');
        if (nowName) nowName.textContent = active.name;
        if (nowTime) nowTime.textContent = fmt12(active.start) + ' — ' + fmt12(active.end);
        banner.classList.add('visible');
      } else {
        banner.classList.remove('visible');
      }
    } else {
      banner.classList.remove('visible');
    }
  }
}
