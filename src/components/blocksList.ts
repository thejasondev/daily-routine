import { state, PALETTE } from '../state/store';
import { 
  toMins, 
  isActive, 
  isPast, 
  fmt12, 
  durationLabel, 
  toTimeInput, 
  getOverlappingIds, 
  getTotalFreeTime,
  fmtGap 
} from '../utils/time';
import { escHtml, escAttr } from '../utils/helpers';
import { renderTimeline } from './timelineView';
import { updateProgress } from './progressBar';

export function updateFreeTime(): void {
  const el = document.getElementById('freeTimeSummary');
  if (!el) return;
  if (!state.blocks.length) {
    el.textContent = '';
    return;
  }
  const free = getTotalFreeTime();
  if (free > 0) {
    el.innerHTML = `<span class="ft-accent">${fmtGap(free)}</span> sin planificar`;
  } else {
    el.innerHTML = 'Día completamente planificado ✓';
  }
}

export function render(): void {
  const list = document.getElementById('blocksList');
  const empty = document.getElementById('emptyState');
  if (!list || !empty) return;

  if (!state.blocks.length) {
    list.innerHTML = '';
    empty.classList.add('visible');
    updateFreeTime();
    return;
  }
  
  if (state.currentView === 'timeline') {
    renderTimeline();
    return;
  }

  empty.classList.remove('visible');

  const overlaps = getOverlappingIds();
  let html = '';

  for (let i = 0; i < state.blocks.length; i++) {
    const b = state.blocks[i];

    if (i > 0) {
      const prev = state.blocks[i - 1];
      let pE = toMins(prev.end);
      const pS = toMins(prev.start);
      
      if (pE <= pS) {
        // overnight block — gap from pE (early morning end) to next block start
        const bS = toMins(b.start);
        const gap = bS - pE;
        if (gap > 0) {
          html += `<div class="gap-indicator"><span class="gap-pill">${fmtGap(gap)} libre</span></div>`;
        }
      } else {
        const bS = toMins(b.start);
        const gap = bS - pE;
        if (gap > 0) {
          html += `<div class="gap-indicator"><span class="gap-pill">${fmtGap(gap)} libre</span></div>`;
        }
      }
    }

    const active = state.selectedDay === new Date().getDay() && isActive(b);
    const past = state.selectedDay === new Date().getDay() ? isPast(b) : (state.selectedDay < new Date().getDay());
    const edOpen = state.openId === b.id;
    const confOpen = state.confirmId === b.id;
    const hasOverlap = overlaps.has(b.id);

    const classes = ['block-item'];
    if (active) classes.push('is-active');
    if (past && !active) classes.push('is-past');
    if (hasOverlap) classes.push('has-overlap');

    html += `
<div class="${classes.join(' ')}" id="blk-${b.id}" role="listitem" style="animation-delay:${i * 0.04}s">
  <div class="block-main" onclick="toggleEdit(${b.id})" role="button" tabindex="0"
       aria-expanded="${edOpen}" aria-label="Editar ${b.name}">
    <div class="block-accent" style="background:${b.color}"></div>
    <div class="block-body">
      <div class="block-name">
        ${escHtml(b.name)}
        ${hasOverlap ? '<span class="overlap-badge">⚠️ Solapado</span>' : ''}
      </div>
      <div class="block-time-row">
        <span class="block-time">${fmt12(b.start)} — ${fmt12(b.end)}</span>
        <span class="block-duration">${durationLabel(b.start, b.end)}</span>
      </div>
    </div>
    <div class="block-actions">
      <span class="block-check-icon ${b.completed ? 'checked' : ''}" onclick="toggleComplete(event, ${b.id})" aria-label="Marcar completado">✓</span>
      <span class="block-edit-icon" aria-hidden="true">${edOpen ? '↑' : '↓'}</span>
      <span class="block-drag-handle" onpointerdown="startDrag(event, ${b.id})" aria-label="Reordenar">≡</span>
    </div>
  </div>
  <div class="block-editor ${edOpen ? 'open' : ''}" id="ed-${b.id}">
    <div class="field">
      <div class="field-label">Actividad</div>
      <input type="text" id="n-${b.id}" value="${escAttr(b.name)}" placeholder="Nombre" maxlength="40">
    </div>
    <div class="field">
      <div class="field-label">Horario</div>
      <div class="time-row">
        <input type="time" id="s-${b.id}" value="${toTimeInput(b.start)}" aria-label="Hora inicio">
        <input type="time" id="e-${b.id}" value="${toTimeInput(b.end)}" aria-label="Hora fin">
      </div>
    </div>
    <div class="field">
      <div class="field-label">Color</div>
      <div class="color-row">
        ${PALETTE.map(c => `<span class="color-swatch${b.color === c ? ' sel' : ''}" style="background:${c}"
          onclick="pickColor(${b.id},'${c}')" role="radio" aria-checked="${b.color === c}" aria-label="Color ${c}"></span>`).join('')}
      </div>
    </div>
    <div class="btn-row">
      <button class="btn-save" onclick="saveBlock(${b.id})">GUARDAR</button>
      <button class="btn-del" onclick="askDelete(${b.id})" aria-label="Eliminar bloque">✕</button>
    </div>
    <div class="confirm-del ${confOpen ? 'visible' : ''}" id="conf-${b.id}" role="alertdialog">
      <div class="confirm-text">¿Eliminar «${escHtml(b.name)}»?</div>
      <div class="confirm-btns">
        <button class="btn-confirm-no" onclick="cancelDelete(${b.id})">Cancelar</button>
        <button class="btn-confirm-yes" onclick="doDelete(${b.id})">Sí, eliminar</button>
      </div>
    </div>
  </div>
</div>`;
  }

  // Draft block editor (not yet committed)
  if (state.draftBlock) {
    const db = state.draftBlock;
    html += `
<div class="block-item" style="border-color: var(--accent); border-style: dashed; animation-delay:0s">
  <div class="block-main" style="pointer-events:none;">
    <div class="block-accent" style="background:${db.color}"></div>
    <div class="block-body">
      <div class="block-name" style="color:var(--accent)">Nueva actividad</div>
      <div class="block-time-row">
        <span class="block-time" style="opacity:0.5">Configura los detalles abajo</span>
      </div>
    </div>
  </div>
  <div class="block-editor open" id="ed-draft">
    <div class="field">
      <div class="field-label">Actividad</div>
      <input type="text" id="n-draft" value="${escAttr(db.name)}" placeholder="Nombre de la actividad" maxlength="40">
    </div>
    <div class="field">
      <div class="field-label">Horario</div>
      <div class="time-row">
        <input type="time" id="s-draft" value="${toTimeInput(db.start)}" aria-label="Hora inicio">
        <input type="time" id="e-draft" value="${toTimeInput(db.end)}" aria-label="Hora fin">
      </div>
    </div>
    <div class="field">
      <div class="field-label">Color</div>
      <div class="color-row">
        ${PALETTE.map(c => `<span class="color-swatch${db.color === c ? ' sel' : ''}" style="background:${c}"
          onclick="pickDraftColor('${c}')" role="radio" aria-checked="${db.color === c}" aria-label="Color ${c}"></span>`).join('')}
      </div>
    </div>
    <div class="btn-row">
      <button class="btn-save" onclick="saveDraft()">CREAR ACTIVIDAD</button>
      <button class="btn-del" onclick="cancelDraft()" aria-label="Cancelar">✕</button>
    </div>
  </div>
</div>`;
  }
  
  list.innerHTML = html;

  // Auto-focus draft name input
  if (state.draftBlock) {
    setTimeout(() => {
      const ni = document.getElementById('n-draft') as HTMLInputElement;
      if (ni) {
        ni.focus();
        ni.select();
      }
    }, 60);
  }

  updateProgress();
  updateFreeTime();
}

// Bind to window for inline onclick handlers in HTML template strings
(window as any).render = render;
export { render as default };
