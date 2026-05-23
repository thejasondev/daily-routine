import { state } from '../state/store';
import { toMins, fmt12 } from './time';
import { showToast } from './helpers';

export function updateNotifUI(): void {
  const btn = document.getElementById('btnNotif');
  const slash = document.getElementById('notifSlash');
  if (!btn) return;
  
  const isOn = state.notifEnabled && ('Notification' in window) && Notification.permission === 'granted';
  if (isOn) {
    btn.classList.add('active');
    if (slash) slash.style.display = 'none';
  } else {
    btn.classList.remove('active');
    if (slash) slash.style.display = '';
  }
}

export async function toggleNotif(): Promise<void> {
  if (!('Notification' in window)) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      showToast('En iOS, instala la app desde Safari (Añadir a inicio) para notificaciones');
    } else {
      showToast('Tu navegador no soporta notificaciones');
    }
    return;
  }
  
  if (!state.notifEnabled || Notification.permission !== 'granted') {
    let p = Notification.permission;
    if (p === 'denied') {
      showToast('Permiso bloqueado. Revisa los ajustes del navegador');
      return;
    }
    if (p !== 'granted') {
      p = await Notification.requestPermission();
    }
    if (p !== 'granted') {
      showToast('Permiso denegado');
      return;
    }
    state.notifEnabled = true;
    localStorage.setItem('dailyroutine_notif', '1');
    showToast('Notificaciones activadas');
    scheduleNotifications();
  } else {
    state.notifEnabled = false;
    localStorage.setItem('dailyroutine_notif', '0');
    showToast('Notificaciones desactivadas');
    clearNotifications();
  }
  updateNotifUI();
}

export function clearNotifications(): void {
  state.notifTimeouts.forEach(clearTimeout);
  state.notifTimeouts = [];
}

export function scheduleNotifications(): void {
  clearNotifications();
  if (!state.notifEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
  
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const currentSecs = now.getSeconds();
  
  const today = new Date().getDay();
  
  // Only schedule notifications for today's routine
  const blocksToSchedule = state.allBlocks[today] || [];
  blocksToSchedule.forEach((b, i) => {
    let s = toMins(b.start);
    let e = toMins(b.end);
    
    let startDiff = s - currentMins;
    if (startDiff > 0 && startDiff <= 24 * 60) {
      const ms = (startDiff * 60 - currentSecs) * 1000;
      state.notifTimeouts.push(setTimeout(() => {
        sendNotification('▶ ' + b.name, { body: `${fmt12(b.start)} a ${fmt12(b.end)}` });
      }, ms));
    }
    
    let endWarnDiff = e - 2 - currentMins;
    if (e <= s && currentMins > e) {
      endWarnDiff += 24 * 60; 
    }
    
    if (endWarnDiff > 0 && endWarnDiff <= 24 * 60) {
      const ms = (endWarnDiff * 60 - currentSecs) * 1000;
      const nextBlock = blocksToSchedule[i + 1];
      const nextTxt = nextBlock ? `Siguiente: ${nextBlock.name}` : 'Fin del día';
      state.notifTimeouts.push(setTimeout(() => {
        sendNotification('⏰ ' + b.name + ' termina en 2min', { body: nextTxt });
      }, ms));
    }
  });
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  const notifOpts: NotificationOptions = {
    icon: '/icons/icon-192x192.svg',
    badge: '/favicon.svg',
    ...options
  };
  
  // vibrate is not supported on iOS Safari
  if ('vibrate' in navigator) {
    (notifOpts as any).vibrate = [200, 100, 200];
  }
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, notifOpts);
    }).catch(() => {
      // Fallback to basic Notification
      try { new Notification(title, notifOpts); } catch (e) {}
    });
  } else {
    try { new Notification(title, notifOpts); } catch (e) {}
  }
}
