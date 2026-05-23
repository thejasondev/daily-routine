import { state } from '../state/store';
import { DragState } from '../types';
import { toMins, fromMins, sortBlocks } from '../utils/time';
import { save } from '../utils/persistence';
import { showToast } from '../utils/helpers';

let dragState: DragState | null = null;
let renderCallback: (() => void) | null = null;

export function setDragRenderCallback(cb: () => void): void {
  renderCallback = cb;
}

export function startDrag(e: PointerEvent, id: number): void {
  if (state.openId !== null) return; // Don't drag while editing
  e.preventDefault();
  e.stopPropagation();
  
  const target = (e.currentTarget as HTMLElement).closest('.block-item') as HTMLElement;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  
  dragState = {
    id: id,
    el: target,
    offsetY: e.clientY - rect.top,
    placeholder: document.createElement('div')
  };
  
  dragState.placeholder.className = 'block-placeholder';
  dragState.placeholder.style.height = rect.height + 'px';
  
  target.classList.add('is-dragging');
  target.style.width = rect.width + 'px';
  target.parentNode?.insertBefore(dragState.placeholder, target);
  
  document.body.appendChild(target);
  
  updateDragPos(e);
  
  document.addEventListener('pointermove', onDragMove, { passive: false });
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  
  if ('vibrate' in navigator) navigator.vibrate(15);
}

function updateDragPos(e: PointerEvent): void {
  if (!dragState) return;
  dragState.el.style.top = (e.clientY - dragState.offsetY) + 'px';
  dragState.el.style.left = '20px'; // align with list
}

function onDragMove(e: PointerEvent): void {
  if (!dragState) return;
  e.preventDefault();
  updateDragPos(e);
  
  const elUnder = document.elementFromPoint(e.clientX, e.clientY);
  if (!elUnder) return;
  
  const hoverBlock = elUnder.closest('.block-item:not(.is-dragging)');
  if (hoverBlock && hoverBlock !== dragState.placeholder) {
    const list = document.getElementById('blocksList');
    if (list) {
      const rect = hoverBlock.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        list.insertBefore(dragState.placeholder, hoverBlock);
      } else {
        list.insertBefore(dragState.placeholder, hoverBlock.nextSibling);
      }
    }
  }
}

function endDrag(e: PointerEvent): void {
  if (!dragState) return;
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', endDrag);
  document.removeEventListener('pointercancel', endDrag);
  
  dragState.el.classList.remove('is-dragging');
  dragState.el.style.width = '';
  dragState.el.style.top = '';
  dragState.el.style.left = '';
  
  dragState.placeholder.parentNode?.insertBefore(dragState.el, dragState.placeholder);
  dragState.placeholder.remove();
  
  const list = document.getElementById('blocksList');
  if (list) {
    const domIds = Array.from(list.querySelectorAll('.block-item')).map(node => 
      parseInt(node.id.replace('blk-', ''))
    );
    
    const movedId = dragState.id;
    const oldIdx = state.blocks.findIndex(x => x.id === movedId);
    const newIdx = domIds.indexOf(movedId);
    
    if (oldIdx !== newIdx && newIdx !== -1) {
      const b = state.blocks.splice(oldIdx, 1)[0];
      state.blocks.splice(newIdx, 0, b);
      
      const oldS = toMins(b.start);
      let oldE = toMins(b.end);
      if (oldE < oldS) oldE += 24 * 60;
      const dur = oldE - oldS;

      if (newIdx > 0) {
        const prevE = state.blocks[newIdx - 1].end;
        b.start = prevE;
        b.end = fromMins(toMins(prevE) + dur);
      } else if (state.blocks.length > 1) {
        const nextS = state.blocks[1].start;
        let nsMins = toMins(nextS);
        // Avoid negative times
        if (nsMins - dur < 0) nsMins += 24 * 60;
        b.start = fromMins(nsMins - dur);
        b.end = nextS;
      }
      
      // Cascade to prevent out-of-order swapping by sortBlocks
      let currentMinStart = toMins(b.start);
      for (let i = newIdx + 1; i < state.blocks.length; i++) {
        let s = toMins(state.blocks[i].start);
        if (s < currentMinStart) {
          let e = toMins(state.blocks[i].end);
          let d = (e < s ? e + 24 * 60 : e) - s;
          state.blocks[i].start = fromMins(currentMinStart);
          state.blocks[i].end = fromMins(currentMinStart + d);
        }
        currentMinStart = toMins(state.blocks[i].start);
      }
      
      sortBlocks(state.blocks);
      save();
      showToast('Rutina reordenada');
    }
  }
  
  dragState = null;
  if (renderCallback) renderCallback();
  if ('vibrate' in navigator) navigator.vibrate(20);
}
