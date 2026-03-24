export type ShapeType = 'sphere' | 'text' | 'ring' | 'star' | 'heart';

export interface InteractionData {
  velocity: { x: number; y: number; z: number };
  area: number;
}

export interface GestureCallback {
  (gesture: ShapeType): void;
}

export interface InteractionCallback {
  (interaction: InteractionData): void;
}

export interface ToastType {
  (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number): void;
}

export interface UIAlertType {
  (message: string, title?: string): Promise<void>;
}

export interface UIConfirmType {
  (message: string, title?: string): Promise<boolean>;
}
