import { state } from './state/store';
import { load, exportData, importData } from './utils/persistence';
import { updateProgress } from './components/progressBar';
import { updateDaySelectorUI, setDaySelectorCallbacks } from './components/daySelector';
import { toggleNotif, updateNotifUI, scheduleNotifications } from './utils/notifs';
import { updateViewUI, updateTimelineNow, setTimelineRenderCallback } from './components/timelineView';
import { setEditorRenderCallback, addBlock } from './components/inlineEditor';
import { setDragRenderCallback, startDrag } from './components/dragAndDrop';
import { render } from './components/blocksList';

// Vincular llamadas de retorno para evitar importaciones circulares en tiempo de inicialización
setDaySelectorCallbacks(render, updateProgress);
setEditorRenderCallback(render);
setDragRenderCallback(render);
setTimelineRenderCallback(render);

// Cálculo y render de la fecha en la cabecera
function updateDate(): void {
  const d = new Date();
  const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const el = document.getElementById('headerDate');
  if (el) {
    el.textContent = `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  }
}

// Vincular funciones globales al objeto Window para soportar los eventos en los templates HTML
(window as any).toggleNotif = toggleNotif;
(window as any).addBlock = addBlock;
(window as any).startDrag = startDrag;
(window as any).exportData = exportData;
(window as any).importData = (e: Event) => importData(e, render);

// Control de teclas rápidas (Escape para cerrar editor abierto)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.openId) {
    state.openId = null;
    state.confirmId = null;
    render();
  }
});

// Capturar evento de instalación PWA (Prompt de descarga)
let deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e: any) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('install_dismissed')) {
    const banner = document.getElementById('installBanner');
    if (banner) banner.classList.add('visible');
  }
});

document.getElementById('btnInstall')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('User prompt outcome:', outcome);
  deferredPrompt = null;
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('visible');
});

document.getElementById('btnDismiss')?.addEventListener('click', () => {
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('visible');
  localStorage.setItem('install_dismissed', '1');
});

// Listener del botón flotante FAB
document.getElementById('fabAdd')?.addEventListener('click', addBlock);

// Registro de Service Worker estático para soporte Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registrado con éxito:', reg.scope))
      .catch(err => console.warn('SW falló al registrar:', err));
  });
}

// Inicialización de la aplicación
load();
updateDate();
updateDaySelectorUI();
updateNotifUI();
updateViewUI();
if (state.notifEnabled) scheduleNotifications();
render();

// Intervalos periódicos para aguja de tiempo y barra de progreso
setInterval(() => {
  updateProgress();
  if (state.currentView === 'timeline') updateTimelineNow();
  
  // Reprogramar notificaciones de forma diaria a medianoche
  const d = new Date();
  if (d.getHours() === 0 && d.getMinutes() === 0) {
    scheduleNotifications();
  }
}, 60000);

// Reprogramar alarmas cuando la PWA vuelve al primer plano (crítico en Safari iOS)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.notifEnabled) {
    scheduleNotifications();
  }
});
