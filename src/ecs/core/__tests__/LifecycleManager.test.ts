/**
 * LifecycleManager のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LifecycleManager } from '@/ecs/core/LifecycleManager';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { LifecycleEvents, SystemEvents } from '@/events/types/EventTypes';
import { ComponentTypes } from '@/ecs/core/Component';
import type { EventBus } from '@/events/core/EventBus';
import type {
  LifecycleEventData,
  ComponentChangeEventData,
  ValidationFailedEventData
} from '@/events/types/EventData';

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    lifecycleManager = new LifecycleManager(eventBus, {
      enableValidation: true,
      enableStateTracking: true,
      enablePerformanceMonitoring: true,
      maxEventHistory: 100
    });
  });

  afterEach(() => {
    lifecycleManager.cleanup();
    eventBus.clear();
  });

  describe('エンティティライフサイクル管理', () => {
    it('エンティティ作成イベントを正しく処理する', () => {
      const entityId = 'test-entity-1';
      const createData: LifecycleEventData = {
        entityId,
        timestamp: Date.now()
      };

      // 作成前イベント発火
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, createData);

      // 状態が正しく記録されることを確認
      const entityState = lifecycleManager.getEntityState(entityId);
      expect(entityState).toBeDefined();
      expect(entityState.state).toBe('creating');
      expect(entityState.createdAt).toBe(createData.timestamp);

      // 作成後イベント発火
      eventBus.emit(LifecycleEvents.AFTER_CREATE, createData);

      // 状態が更新されることを確認
      const updatedState = lifecycleManager.getEntityState(entityId);
      expect(updatedState.state).toBe('active');
      expect(updatedState.completedAt).toBeDefined();
    });

    it('エンティティ削除イベントを正しく処理する', () => {
      const entityId = 'test-entity-2';
      const createData: LifecycleEventData = {
        entityId,
        timestamp: Date.now()
      };

      // エンティティを作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, createData);
      eventBus.emit(LifecycleEvents.AFTER_CREATE, createData);

      // 削除前の状態確認
      expect(lifecycleManager.getEntityState(entityId)).toBeDefined();

      const destroyData: LifecycleEventData = {
        entityId,
        timestamp: Date.now()
      };

      // 削除前イベント発火
      eventBus.emit(LifecycleEvents.BEFORE_DESTROY, destroyData);

      // 状態が削除中に変更されることを確認
      const destroyingState = lifecycleManager.getEntityState(entityId);
      expect(destroyingState.state).toBe('destroying');

      // 削除後イベント発火
      eventBus.emit(LifecycleEvents.AFTER_DESTROY, destroyData);

      // 状態が削除されることを確認
      expect(lifecycleManager.getEntityState(entityId)).toBeUndefined();
    });

    it('イベント履歴を正しく記録する', () => {
      const entityId = 'test-entity-3';
      const createData: LifecycleEventData = {
        entityId,
        timestamp: Date.now()
      };

      eventBus.emit(LifecycleEvents.BEFORE_CREATE, createData);
      eventBus.emit(LifecycleEvents.AFTER_CREATE, createData);

      const history = lifecycleManager.getEventHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.some(event => event.entityId === entityId)).toBe(true);
    });
  });

  describe('コンポーネント変更イベント管理', () => {
    it('コンポーネント追加イベントを正しく処理する', () => {
      const entityId = 'test-entity-4';
      const componentType = ComponentTypes.POSITION;
      const componentData: ComponentChangeEventData = {
        entityId,
        timestamp: Date.now(),
        componentType,
        newValue: { x: 100, y: 200 }
      };

      // エンティティを先に作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });

      // コンポーネント追加イベント発火
      eventBus.emit(LifecycleEvents.COMPONENT_ADDED, componentData);

      // エンティティ状態にコンポーネントが追加されることを確認
      const entityState = lifecycleManager.getEntityState(entityId);
      expect(entityState.components.has(componentType)).toBe(true);

      // コンポーネント状態が記録されることを確認
      const componentState = lifecycleManager.getComponentState(entityId, componentType);
      expect(componentState).toBeDefined();
      expect(componentState.state).toBe('active');
      expect(componentState.value).toEqual(componentData.newValue);
    });

    it('コンポーネント削除イベントを正しく処理する', () => {
      const entityId = 'test-entity-5';
      const componentType = ComponentTypes.TEXT;

      // エンティティとコンポーネントを作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.COMPONENT_ADDED, {
        entityId,
        timestamp: Date.now(),
        componentType,
        newValue: { content: 'test' }
      });

      // 削除前の状態確認
      expect(lifecycleManager.getComponentState(entityId, componentType)).toBeDefined();

      // コンポーネント削除イベント発火
      const removeData: ComponentChangeEventData = {
        entityId,
        timestamp: Date.now(),
        componentType,
        oldValue: { content: 'test' }
      };

      eventBus.emit(LifecycleEvents.COMPONENT_REMOVED, removeData);

      // エンティティ状態からコンポーネントが削除されることを確認
      const entityState = lifecycleManager.getEntityState(entityId);
      expect(entityState.components.has(componentType)).toBe(false);

      // コンポーネント状態が削除されることを確認
      expect(lifecycleManager.getComponentState(entityId, componentType)).toBeUndefined();
    });

    it('状態変更イベントを発火する', () => {
      return new Promise<void>((resolve) => {
        const entityId = 'test-entity-6';
        const componentType = ComponentTypes.VISUAL;

        // 状態変更イベントリスナーを設定
        eventBus.on(LifecycleEvents.STATE_CHANGED, (data) => {
          expect(data.entityId).toBe(entityId);
          expect(data.componentType).toBe(componentType);
          expect(data.property).toBe('component');
          resolve();
        });

        // エンティティを作成
        eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
        eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });

        // コンポーネント追加（状態変更イベントが発火される）
        eventBus.emit(LifecycleEvents.COMPONENT_ADDED, {
          entityId,
          timestamp: Date.now(),
          componentType,
          newValue: { visible: true }
        });
      });
    });
  });

  describe('システム処理イベント管理', () => {
    it('システム処理完了イベントを処理する', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      eventBus.emit(SystemEvents.SYSTEM_READY, {
        systemName: 'TestSystem',
        processedEntities: 5,
        timestamp: Date.now()
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LifecycleManager] System TestSystem processed 5 entities')
      );

      consoleSpy.mockRestore();
    });

    it('システムエラーイベントを処理する', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const errorData = {
        source: 'TestSystem',
        message: 'Test error',
        recoverable: true,
        recoveryEvent: 'test:recovery',
        recoveryData: { test: true }
      };

      // 回復イベントリスナーを設定
      const recoverySpy = vi.fn();
      eventBus.on('test:recovery', recoverySpy);

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LifecycleManager] System error from TestSystem:'),
        'Test error'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[LifecycleManager] Attempting recovery with test:recovery')
      );
      expect(recoverySpy).toHaveBeenCalledWith({ test: true });

      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('バリデーション機能', () => {
    it('エンティティ状態を正しく検証する', () => {
      const entityId = 'test-entity-7';

      // 存在しないエンティティの検証
      const invalidResult = lifecycleManager.validateEntityState(entityId);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain(`Entity ${entityId} state not found`);

      // エンティティを作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });

      // 有効なエンティティの検証
      const validResult = lifecycleManager.validateEntityState(entityId);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('コンポーネント状態を正しく検証する', () => {
      const entityId = 'test-entity-8';
      const componentType = ComponentTypes.ANIMATION;

      // 存在しないコンポーネントの検証
      const invalidResult = lifecycleManager.validateComponentState(entityId, componentType);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain(
        `Component ${componentType} state not found for entity ${entityId}`
      );

      // エンティティとコンポーネントを作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.COMPONENT_ADDED, {
        entityId,
        timestamp: Date.now(),
        componentType,
        newValue: { isAnimating: false }
      });

      // 有効なコンポーネントの検証
      const validResult = lifecycleManager.validateComponentState(entityId, componentType);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('バリデーション失敗イベントを発火する', () => {
      return new Promise<void>((resolve) => {
        const entityId = 'test-entity-9';

        // バリデーション失敗イベントリスナーを設定
        eventBus.on(LifecycleEvents.VALIDATION_FAILED, (data: ValidationFailedEventData) => {
          expect(data.entityId).toBe(entityId);
          expect(data.errors.length).toBeGreaterThan(0);
          resolve();
        });

        // 不正な状態でエンティティを作成（createdAtなし）
        eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
        
        // 手動で不正な状態を作成
        const entityState = lifecycleManager.getEntityState(entityId);
        if (entityState) {
          delete entityState.createdAt;
        }

        eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });
      });
    });
  });

  describe('統計情報とユーティリティ', () => {
    it('統計情報を正しく取得する', () => {
      const entityId1 = 'test-entity-10';
      const entityId2 = 'test-entity-11';

      // 複数のエンティティとコンポーネントを作成
      [entityId1, entityId2].forEach(entityId => {
        eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
        eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });
        eventBus.emit(LifecycleEvents.COMPONENT_ADDED, {
          entityId,
          timestamp: Date.now(),
          componentType: ComponentTypes.POSITION,
          newValue: { x: 0, y: 0 }
        });
      });

      const stats = lifecycleManager.getStats();
      expect(stats.activeEntities).toBe(2);
      expect(stats.activeComponents).toBe(2);
      expect(stats.eventHistorySize).toBeGreaterThan(0);
    });

    it('イベント履歴の上限を正しく管理する', () => {
      // 小さな履歴上限でLifecycleManagerを作成
      const smallHistoryManager = new LifecycleManager(eventBus, {
        maxEventHistory: 3
      });

      // 上限を超えるイベントを発火
      for (let i = 0; i < 5; i++) {
        eventBus.emit(LifecycleEvents.BEFORE_CREATE, {
          entityId: `entity-${i}`,
          timestamp: Date.now()
        });
      }

      const history = smallHistoryManager.getEventHistory();
      expect(history.length).toBeLessThanOrEqual(3);

      smallHistoryManager.cleanup();
    });

    it('クリーンアップが正しく動作する', () => {
      const entityId = 'test-entity-12';

      // データを作成
      eventBus.emit(LifecycleEvents.BEFORE_CREATE, { entityId, timestamp: Date.now() });
      eventBus.emit(LifecycleEvents.AFTER_CREATE, { entityId, timestamp: Date.now() });

      // クリーンアップ前の状態確認
      expect(lifecycleManager.getEntityState(entityId)).toBeDefined();
      expect(lifecycleManager.getEventHistory().length).toBeGreaterThan(0);

      // クリーンアップ実行
      lifecycleManager.cleanup();

      // クリーンアップ後の状態確認
      expect(lifecycleManager.getEntityState(entityId)).toBeUndefined();
      expect(lifecycleManager.getEventHistory().length).toBe(0);

      const stats = lifecycleManager.getStats();
      expect(stats.activeEntities).toBe(0);
      expect(stats.activeComponents).toBe(0);
      expect(stats.eventHistorySize).toBe(0);
    });
  });
});