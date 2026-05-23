export interface Block {
  id: number;
  name: string;
  start: string;
  end: string;
  color: string;
  completed?: boolean;
}

export interface AllBlocks {
  [day: number]: Block[];
}

export interface HistoryState {
  [dateStr: string]: {
    total: number;
    completed: number;
  };
}

export interface DragState {
  id: number;
  el: HTMLElement;
  offsetY: number;
  placeholder: HTMLDivElement;
}
