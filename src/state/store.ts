import { AllBlocks, Block } from '../types';

export const state = {
  allBlocks: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } as AllBlocks,
  selectedDay: new Date().getDay(),
  
  get blocks(): Block[] {
    return this.allBlocks[this.selectedDay] || [];
  },
  set blocks(val: Block[]) {
    this.allBlocks[this.selectedDay] = val;
  },
  
  nextId: 100,
  openId: null as number | null,
  confirmId: null as number | null,
  draftBlock: null as Block | null,
  currentView: (localStorage.getItem('dailyroutine_view') || 'list') as 'list' | 'timeline',
  notifEnabled: localStorage.getItem('dailyroutine_notif') === '1',
  notifTimeouts: [] as any[] // timeouts for notifications
};

export const PALETTE = [
  '#F5A623', '#E05252', '#3EB87A', '#9B8EE8',
  '#5B9CF6', '#E8738A', '#4ECDC4', '#888780',
  '#F7C948', '#A78BFA',
];

export const DEFAULT_BLOCKS: Block[] = [
  { id: 1,  name: 'Despertar',                     start: '7:30',  end: '8:30',  color: '#3EB87A', completed: false },
  { id: 2,  name: 'Desayuno',                      start: '8:30',  end: '9:00',  color: '#F5A623', completed: false },
  { id: 3,  name: 'Estudio alemán',                start: '9:00',  end: '10:30', color: '#9B8EE8', completed: false },
  { id: 4,  name: 'Snack',                         start: '10:30', end: '11:30', color: '#F5A623', completed: false },
  { id: 5,  name: 'Gym',                           start: '11:30', end: '13:00', color: '#E05252', completed: false },
  { id: 6,  name: 'Almuerzo',                      start: '13:00', end: '13:30', color: '#F5A623', completed: false },
  { id: 7,  name: 'Estudio inglés',                start: '14:45', end: '16:30', color: '#9B8EE8', completed: false },
  { id: 8,  name: 'Redes sociales & programación', start: '16:30', end: '17:30', color: '#5B9CF6', completed: false },
  { id: 9,  name: 'Merienda',                      start: '17:30', end: '18:30', color: '#F5A623', completed: false },
  { id: 10, name: 'Caminata',                      start: '18:30', end: '20:30', color: '#3EB87A', completed: false },
  { id: 11, name: 'Comida',                        start: '20:30', end: '21:30', color: '#F5A623', completed: false },
  { id: 12, name: 'Descanso & sueño',              start: '23:00', end: '7:30',  color: '#888780', completed: false },
];

export const STORAGE_KEY_V3 = 'dailyroutine_v3';
export const HISTORY_KEY = 'dailyroutine_history';
