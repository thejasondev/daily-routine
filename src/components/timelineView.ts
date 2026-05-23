import { state } from '../state/store';
import { toMins, fmt12, isActive, isPast, nowMins } from '../utils/time';
import { escHtml } from '../utils/helpers';
import { updateProgress } from './progressBar';

let renderCallback: (() => void) | null = null;

export function setTimelineRenderCallback(cb: () => void): void {
  renderCallback = cb;
}

export function toggleView(): void {
  state.currentView = state.currentView === 'list' ? 'timeline' : 'list';
  localStorage.setItem('dailyroutine_view', state.currentView);
  updateViewUI();
  state.openId = null;
  state.draftBlock = null;
  if (renderCallback) renderCallback();
}

export function updateViewUI(): void {
  const icon = document.getElementById('viewIcon');
  if (!icon) return;
  if (state.currentView === 'timeline') {
    // Show grid/calendar icon when in timeline (click to go back to list)
    icon.innerHTML = '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>';
  } else {
    // Show list icon when in list (click to go to timeline)
    icon.innerHTML = '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>';
  }
}

export function editFromTimeline(id: number): void {
  state.currentView = 'list';
  localStorage.setItem('dailyroutine_view', state.currentView);
  updateViewUI();
  state.openId = id;
  if (renderCallback) renderCallback();
  
  setTimeout(() => {
    const el = document.getElementById(`ed-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

export function renderTimeline(): void {
  const list = document.getElementById('blocksList');
  const empty = document.getElementById('emptyState');
  if (!list || !empty) return;
  
  empty.classList.remove('visible');
  
  const PX_PER_MIN = 1.5;
  let html = `<div class="timeline-container">`;
  
  // Hour lines
  for (let h = 0; h < 24; h++) {
    html += `<div class="timeline-hour" style="top: ${h * 60 * PX_PER_MIN}px"><span>${h.toString().padStart(2, '0')}:00</span></div>`;
  }
  
  // Blocks
  state.blocks.forEach(b => {
    const startMins = toMins(b.start);
    let endMins = toMins(b.end);
    if (endMins <= startMins) endMins += 24 * 60;
    const durMins = endMins - startMins;
    
    const active = state.selectedDay === new Date().getDay() && isActive(b);
    const past = state.selectedDay === new Date().getDay() ? isPast(b) : (state.selectedDay < new Date().getDay());
    const classes = ['timeline-block'];
    if (active) classes.push('is-active');
    if (past && !active) classes.push('is-past');
    if (b.completed) classes.push('is-completed');
    
    // For blocks that overflow past midnight
    let h1 = durMins * PX_PER_MIN;
    let t1 = startMins * PX_PER_MIN;
    html += `<div class="${classes.join(' ')}" style="top: ${t1}px; height: ${h1}px; border-left-color: ${b.color}" onclick="editFromTimeline(${b.id})">
      <div class="tl-name">${escHtml(b.name)}</div>
      <div class="tl-time">${fmt12(b.start)} — ${fmt12(b.end)}</div>
    </div>`;
    
    // If it's overnight, also draw the overflowing part at the top of the timeline
    if (toMins(b.end) < startMins) {
      const durOvernight = toMins(b.end);
      html += `<div class="${classes.join(' ')}" style="top: 0px; height: ${durOvernight * PX_PER_MIN}px; border-left-color: ${b.color}" onclick="editFromTimeline(${b.id})">
        <div class="tl-name">${escHtml(b.name)}</div>
        <div class="tl-time">(cont)</div>
      </div>`;
    }
  });
  
  // Now line
  if (state.selectedDay === new Date().getDay()) {
    const currentMins = nowMins();
    html += `<div class="timeline-now" id="timelineNow" style="top: ${currentMins * PX_PER_MIN}px"></div>`;
    
    // Scroll to current time
    setTimeout(() => {
      const targetScroll = (currentMins * PX_PER_MIN) - (window.innerHeight / 2) + 100;
      window.scrollTo({ top: targetScroll > 0 ? targetScroll : 0, behavior: 'smooth' });
    }, 100);
  }
  
  html += `</div>`;
  list.innerHTML = html;
  
  updateProgress();
}

export function updateTimelineNow(): void {
  const line = document.getElementById('timelineNow');
  if (line) {
    line.style.top = `${nowMins() * 1.5}px`;
  }
}

// Bind to window for inline onclick handlers in HTML template strings
(window as any).toggleView = toggleView;
(window as any).editFromTimeline = editFromTimeline;
