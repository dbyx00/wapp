export type AppEventStatus = 'start' | 'success' | 'error' | 'warning';

export interface AppEvent {
  step: string;
  status: AppEventStatus;
  data?: unknown;
  error?: string;
}

export type OnEvent = (event: AppEvent) => void;
