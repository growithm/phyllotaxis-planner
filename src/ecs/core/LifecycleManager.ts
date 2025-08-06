/**
 * エンティティとコンポーネントのライフサイクルイベント管理
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType } from '@/ecs/core/Component';
import { EventBus } from '@/events/core/EventBus';
import { LifecycleEvents, SystemEvents } from '@/events/types/EventTypes';
import {
  LifecycleEventData,
  ComponentChangeEventData,
  ValidationFailedEventData,
  StateChangeEventData,
} from '@/events/types/EventData';

/**
 * ライフサイクル管理の設定オプション
 */
export interface LifecycleManagerOptions {
  enableValidation?: boolean;
  enableStateTracking?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxEventHistory?: number;
}

/**
 * エンティティ状態の検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * エンティティとコンポーネントのライフサイクルイベント管理クラス
 */
export class LifecycleManager {
  private eventBus: EventBus;
  private options: Required<LifecycleManagerOptions>;
  private entityStates: Map<EntityId, any> = new Map();
  private componentStates: Map<string, any> = new Map(); // entityId:componentType -> state
  private eventHistory: LifecycleEventData[] = [];

  constructor(eventBus: EventBus, options: LifecycleManagerOptions = {}) {
    this.eventBus = eventBus;
    this.options = {
      enableValidation: true,
      enableStateTracking: true,
      enablePerformanceMonitoring: false,
      maxEventHistory: 1000,
      ...options,
    };

    this.setupEventListeners();
  }

  /**
   * イベントリスナーをセットアップ
   */
  private setupEventListeners(): void {
    // エンティティライフサイクルイベント
    this.eventBus.on(LifecycleEvents.BEFORE_CREATE, data =>
      this.handleBeforeCreate(data)
    );
    this.eventBus.on(LifecycleEvents.AFTER_CREATE, data =>
      this.handleAfterCreate(data)
    );
    this.eventBus.on(LifecycleEvents.BEFORE_DESTROY, data =>
      this.handleBeforeDestroy(data)
    );
    this.eventBus.on(LifecycleEvents.AFTER_DESTROY, data =>
      this.handleAfterDestroy(data)
    );

    // コンポーネント変更イベント
    this.eventBus.on(LifecycleEvents.COMPONENT_ADDED, data =>
      this.handleComponentAdded(data)
    );
    this.eventBus.on(LifecycleEvents.COMPONENT_REMOVED, data =>
      this.handleComponentRemoved(data)
    );

    // システム処理イベント
    this.eventBus.on(SystemEvents.SYSTEM_READY, data =>
      this.handleSystemProcessed(data)
    );
    this.eventBus.on(SystemEvents.ERROR_OCCURRED, data =>
      this.handleSystemError(data)
    );
  }

  // ===== エンティティライフサイクルイベント管理 =====

  /**
   * エンティティ作成前の処理
   */
  private handleBeforeCreate(data: LifecycleEventData): void {
    if (this.options.enableStateTracking) {
      this.entityStates.set(data.entityId, {
        createdAt: data.timestamp,
        state: 'creating',
        components: new Set<ComponentType>(),
      });
    }

    this.addToHistory(data);
    this.emitLifecycleEvent(LifecycleEvents.BEFORE_UPDATE, data);
  }

  /**
   * エンティティ作成後の処理
   */
  private handleAfterCreate(data: LifecycleEventData): void {
    if (this.options.enableStateTracking) {
      const state = this.entityStates.get(data.entityId);
      if (state) {
        state.state = 'active';
        state.completedAt = data.timestamp;
      }
    }

    if (this.options.enableValidation) {
      const validation = this.validateEntityState(data.entityId);
      if (!validation.isValid) {
        this.emitValidationFailed(data.entityId, validation);
      }
    }

    this.addToHistory(data);
    this.emitLifecycleEvent(LifecycleEvents.AFTER_UPDATE, data);
  }

  /**
   * エンティティ削除前の処理
   */
  private handleBeforeDestroy(data: LifecycleEventData): void {
    if (this.options.enableStateTracking) {
      const state = this.entityStates.get(data.entityId);
      if (state) {
        state.state = 'destroying';
        state.destroyingAt = data.timestamp;
      }
    }

    this.addToHistory(data);
  }

  /**
   * エンティティ削除後の処理
   */
  private handleAfterDestroy(data: LifecycleEventData): void {
    // 状態をクリーンアップ
    this.entityStates.delete(data.entityId);

    // コンポーネント状態もクリーンアップ
    const keysToDelete: string[] = [];
    this.componentStates.forEach((_, key) => {
      if (key.startsWith(`${data.entityId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.componentStates.delete(key));

    this.addToHistory(data);
  }

  // ===== コンポーネント変更イベント管理 =====

  /**
   * コンポーネント追加の処理
   */
  private handleComponentAdded(data: ComponentChangeEventData): void {
    if (this.options.enableStateTracking) {
      const entityState = this.entityStates.get(data.entityId);
      if (entityState) {
        entityState.components.add(data.componentType);
      }

      const componentKey = `${data.entityId}:${data.componentType}`;
      this.componentStates.set(componentKey, {
        addedAt: data.timestamp,
        state: 'active',
        value: data.newValue,
      });
    }

    if (this.options.enableValidation) {
      const validation = this.validateComponentState(
        data.entityId,
        data.componentType as ComponentType
      );
      if (!validation.isValid) {
        this.emitValidationFailed(data.entityId, validation);
      }
    }

    this.addToHistory(data);
    this.emitStateChanged(
      data.entityId,
      data.componentType as ComponentType,
      undefined,
      data.newValue
    );
  }

  /**
   * コンポーネント削除の処理
   */
  private handleComponentRemoved(data: ComponentChangeEventData): void {
    if (this.options.enableStateTracking) {
      const entityState = this.entityStates.get(data.entityId);
      if (entityState) {
        entityState.components.delete(data.componentType);
      }

      const componentKey = `${data.entityId}:${data.componentType}`;
      this.componentStates.delete(componentKey);
    }

    this.addToHistory(data);
    this.emitStateChanged(
      data.entityId,
      data.componentType as ComponentType,
      data.oldValue,
      undefined
    );
  }

  // ===== システム処理イベント管理 =====

  /**
   * システム処理完了の処理
   */
  private handleSystemProcessed(data: any): void {
    if (this.options.enablePerformanceMonitoring) {
      // パフォーマンス統計の記録
      console.log(
        `[LifecycleManager] System ${data.systemName} processed ${data.processedEntities} entities`
      );
    }
  }

  /**
   * システムエラーの処理
   */
  private handleSystemError(data: any): void {
    console.error(
      `[LifecycleManager] System error from ${data.source}:`,
      data.message
    );

    // エラー回復の試行
    if (data.recoverable && data.recoveryEvent && data.recoveryData) {
      console.log(
        `[LifecycleManager] Attempting recovery with ${data.recoveryEvent}`
      );
      // 動的なイベント名のため、従来の型なし版を使用
      (this.eventBus as any).emit(data.recoveryEvent, data.recoveryData);
    }
  }

  // ===== バリデーション機能 =====

  /**
   * エンティティ状態の検証
   */
  public validateEntityState(entityId: EntityId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const entityState = this.entityStates.get(entityId);
    if (!entityState) {
      errors.push(`Entity ${entityId} state not found`);
      return { isValid: false, errors, warnings };
    }

    // 基本的な状態検証
    if (!entityState.createdAt) {
      errors.push(`Entity ${entityId} missing creation timestamp`);
    }

    if (
      entityState.state === 'creating' &&
      Date.now() - entityState.createdAt > 5000
    ) {
      warnings.push(
        `Entity ${entityId} has been in creating state for too long`
      );
    }

    // コンポーネント整合性検証
    if (entityState.components.size === 0) {
      warnings.push(`Entity ${entityId} has no components`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * コンポーネント状態の検証
   */
  public validateComponentState(
    entityId: EntityId,
    componentType: ComponentType
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const componentKey = `${entityId}:${componentType}`;
    const componentState = this.componentStates.get(componentKey);

    if (!componentState) {
      errors.push(
        `Component ${componentType} state not found for entity ${entityId}`
      );
      return { isValid: false, errors, warnings };
    }

    // 基本的な状態検証
    if (!componentState.addedAt) {
      errors.push(`Component ${componentType} missing addition timestamp`);
    }

    if (componentState.state !== 'active') {
      warnings.push(`Component ${componentType} is not in active state`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ===== イベント発火ヘルパー =====

  /**
   * ライフサイクルイベントを発火
   */
  private emitLifecycleEvent(
    event: LifecycleEvents,
    data: LifecycleEventData
  ): void {
    this.eventBus.emit(event, data);
  }

  /**
   * バリデーション失敗イベントを発火
   */
  private emitValidationFailed(
    entityId: EntityId,
    validation: ValidationResult
  ): void {
    const data: ValidationFailedEventData = {
      entityId,
      timestamp: Date.now(),
      errors: validation.errors,
      warnings: validation.warnings,
    };

    this.eventBus.emit(LifecycleEvents.VALIDATION_FAILED, data);
  }

  /**
   * 状態変更イベントを発火
   */
  private emitStateChanged(
    entityId: EntityId,
    componentType: ComponentType,
    oldValue: any,
    newValue: any
  ): void {
    const data: StateChangeEventData = {
      entityId,
      timestamp: Date.now(),
      property: 'component',
      oldValue,
      newValue,
      componentType,
    };

    this.eventBus.emit(LifecycleEvents.STATE_CHANGED, data);
  }

  // ===== ユーティリティメソッド =====

  /**
   * イベント履歴に追加
   */
  private addToHistory(data: LifecycleEventData): void {
    this.eventHistory.push(data);

    // 履歴サイズ制限
    if (this.eventHistory.length > this.options.maxEventHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * エンティティの状態を取得
   */
  public getEntityState(entityId: EntityId): any {
    return this.entityStates.get(entityId);
  }

  /**
   * コンポーネントの状態を取得
   */
  public getComponentState(
    entityId: EntityId,
    componentType: ComponentType
  ): any {
    const componentKey = `${entityId}:${componentType}`;
    return this.componentStates.get(componentKey);
  }

  /**
   * イベント履歴を取得
   */
  public getEventHistory(): LifecycleEventData[] {
    return [...this.eventHistory];
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    activeEntities: number;
    activeComponents: number;
    eventHistorySize: number;
  } {
    return {
      activeEntities: this.entityStates.size,
      activeComponents: this.componentStates.size,
      eventHistorySize: this.eventHistory.length,
    };
  }

  /**
   * クリーンアップ
   */
  public cleanup(): void {
    this.entityStates.clear();
    this.componentStates.clear();
    this.eventHistory = [];
  }
}
