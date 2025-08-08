/**
 * ECS状態とReact状態の同期管理
 */

import type { World } from '@/ecs/core/World';
import type { EventBus } from '@/events/core/EventBus';
import { LifecycleEvents } from '@/events/types/EventTypes';
import type { SyncSubscriber, SyncOperation, SyncStats } from './types';
import { SyncEventTypes } from '@/events/types/EventTypes';

/**
 * ECS状態とReact状態の同期を管理するクラス
 */
export class StateSynchronizer {
  private eventBus: EventBus;
  private subscribers: Map<string, SyncSubscriber>;
  private syncQueue: SyncOperation[];
  private isProcessing: boolean;

  constructor(world: World, eventBus: EventBus) {
    this.eventBus = eventBus;
    this.subscribers = new Map();
    this.syncQueue = [];
    this.isProcessing = false;

    this.setupEventListeners();
  }

  /**
   * 同期購読者を登録
   * @param key - 購読者の一意キー
   * @param subscriber - 購読者オブジェクト
   * @returns 購読解除関数
   */
  subscribe(key: string, subscriber: SyncSubscriber): () => void {
    this.subscribers.set(key, subscriber);

    return () => {
      this.subscribers.delete(key);
    };
  }

  /**
   * 同期操作をキューに追加
   * @param operation - 同期操作
   */
  enqueueSyncOperation(operation: SyncOperation): void {
    this.syncQueue.push(operation);
    this.processSyncQueue();
  }

  /**
   * 同期キューを処理
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift()!;
        await this.processSyncOperation(operation);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 個別同期操作を処理
   * @param operation - 同期操作
   */
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    try {
      switch (operation.type) {
        case SyncEventTypes.ENTITY_CREATED:
          this.notifySubscribers(SyncEventTypes.ENTITY_CREATED, operation.data);
          break;
        case SyncEventTypes.ENTITY_DESTROYED:
          this.notifySubscribers(
            SyncEventTypes.ENTITY_DESTROYED,
            operation.data
          );
          break;
        case SyncEventTypes.COMPONENT_ADDED:
          this.notifySubscribers(
            SyncEventTypes.COMPONENT_ADDED,
            operation.data
          );
          break;
        case SyncEventTypes.COMPONENT_REMOVED:
          this.notifySubscribers(
            SyncEventTypes.COMPONENT_REMOVED,
            operation.data
          );
          break;
        case SyncEventTypes.COMPONENT_UPDATED:
          this.notifySubscribers(
            SyncEventTypes.COMPONENT_UPDATED,
            operation.data
          );
          break;
      }
    } catch (error) {
      console.error('Sync operation failed:', error);
    }
  }

  /**
   * 購読者に通知
   * @param eventType - イベントタイプ
   * @param data - イベントデータ
   */
  private notifySubscribers(eventType: (typeof SyncEventTypes)[keyof typeof SyncEventTypes], data: unknown): void {
    this.subscribers.forEach((subscriber, key) => {
      try {
        if (subscriber.eventTypes.includes(eventType)) {
          subscriber.callback(eventType, data as Record<string, unknown>);
        }
      } catch (error) {
        console.error(
          `Subscriber ${key} failed to handle ${eventType}:`,
          error
        );
      }
    });
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // エンティティライフサイクルイベント
    this.eventBus.on(LifecycleEvents.AFTER_CREATE, data => {
      this.enqueueSyncOperation({
        type: SyncEventTypes.ENTITY_CREATED,
        data,
        timestamp: Date.now(),
      });
    });

    this.eventBus.on(LifecycleEvents.AFTER_DESTROY, data => {
      this.enqueueSyncOperation({
        type: SyncEventTypes.ENTITY_DESTROYED,
        data,
        timestamp: Date.now(),
      });
    });

    // コンポーネントライフサイクルイベント
    this.eventBus.on(LifecycleEvents.COMPONENT_ADDED, data => {
      this.enqueueSyncOperation({
        type: SyncEventTypes.COMPONENT_ADDED,
        data,
        timestamp: Date.now(),
      });
    });

    this.eventBus.on(LifecycleEvents.COMPONENT_REMOVED, data => {
      this.enqueueSyncOperation({
        type: SyncEventTypes.COMPONENT_REMOVED,
        data,
        timestamp: Date.now(),
      });
    });

    // コンポーネント更新イベント（必要に応じて追加）
    this.eventBus.on(LifecycleEvents.AFTER_UPDATE, data => {
      this.enqueueSyncOperation({
        type: SyncEventTypes.COMPONENT_UPDATED,
        data,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * 統計情報を取得
   * @returns 同期統計
   */
  getStats(): SyncStats {
    return {
      subscriberCount: this.subscribers.size,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * リソースをクリーンアップ
   */
  dispose(): void {
    this.subscribers.clear();
    this.syncQueue = [];
    this.isProcessing = false;
  }
}
