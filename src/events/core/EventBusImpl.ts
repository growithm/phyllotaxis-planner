import type { EventBus, EventBusOptions } from './EventBus';
import { SystemEvents } from '../types/EventTypes';

/**
 * EventBus実装クラス
 * イベント駆動アーキテクチャの中核となるイベントバスの実装
 */
export class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Function>>();
  private onceListeners = new Map<string, Set<Function>>();
  private options: Required<EventBusOptions>;
  private batchQueue: Array<{ event: string; data: unknown }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      maxListeners: 100,
      enableBatching: false,
      batchInterval: 16, // 60fps
      enableLogging: false,
      ...options,
    };
  }

  emit<T>(event: string, data: T): void {
    if (this.options.enableLogging) {
      console.log(`[EventBus] Emitting: ${event}`, data);
    }

    if (this.options.enableBatching) {
      this.batchEmit(event, data);
    } else {
      this.immediateEmit(event, data);
    }
  }

  private immediateEmit<T>(event: string, data: T): void {
    // 通常のリスナー実行
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${event}:`, error);
          this.emit(SystemEvents.ERROR, { event, error, data });
        }
      });
    }

    // onceリスナー実行と削除
    const onceHandlers = this.onceListeners.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in once handler for ${event}:`, error);
        }
      });
      this.onceListeners.delete(event);
    }
  }

  private batchEmit<T>(event: string, data: T): void {
    this.batchQueue.push({ event, data });

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch();
      }, this.options.batchInterval);
    }
  }

  private flushBatch(): void {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    batch.forEach(({ event, data }) => {
      this.immediateEmit(event, data);
    });
  }

  on<T>(event: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;

    if (handlers.size >= this.options.maxListeners) {
      console.warn(
        `[EventBus] Max listeners (${this.options.maxListeners}) exceeded for event: ${event}`
      );
    }

    handlers.add(handler);

    // アンサブスクライブ関数を返す
    return () => this.off(event, handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const deleted = handlers.delete(handler);
      if (this.options.enableLogging) {
        console.log(`[EventBus] Removing handler for ${event}: ${deleted ? 'success' : 'failed'}`);
      }
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    } else if (this.options.enableLogging) {
      console.log(`[EventBus] No handlers found for event: ${event}`);
    }
  }

  once<T>(event: string, handler: (data: T) => void): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(handler);
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.batchQueue = [];
  }

  getListenerCount(event: string): number {
    const regular = this.listeners.get(event)?.size || 0;
    const once = this.onceListeners.get(event)?.size || 0;
    return regular + once;
  }
}