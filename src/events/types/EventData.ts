import type { Position, AnimationType, EasingType } from '@/types';
import type { EntityId } from '@/ecs/core/Entity';
import type { EntityType } from '@/ecs/entities/EntityTypes';
import { IdeaEvents, SystemEvents, UIEvents, LifecycleEvents } from './EventTypes';

/**
 * アイデア追加イベントのデータ
 */
export interface IdeaAddedEvent {
  id: string;
  text: string;
  timestamp: Date;
  position?: Position;
}

/**
 * アイデア削除イベントのデータ
 */
export interface IdeaRemovedEvent {
  id: string;
  timestamp: Date;
}

/**
 * アイデア更新イベントのデータ
 */
export interface IdeaUpdatedEvent {
  id: string;
  oldText: string;
  newText: string;
  timestamp: Date;
}

/**
 * テーマ変更イベントのデータ
 */
export interface ThemeChangedEvent {
  oldTheme: string;
  newTheme: string;
  timestamp: Date;
}

/**
 * 位置計算完了イベントのデータ
 */
export interface PositionCalculatedEvent {
  entityId: string;
  position: Position;
  angle: number;
  radius: number;
  index: number;
}

/**
 * アニメーションイベントのデータ
 */
export interface AnimationEvent {
  entityId: string;
  animationType: AnimationType;
  duration: number;
  easing: EasingType;
}

/**
 * 描画要求イベントのデータ
 */
export interface RenderRequestedEvent {
  /** エンティティID（undefined = 全体再描画） */
  entityId?: string;
  /** 描画優先度 */
  priority: 'high' | 'normal' | 'low';
  timestamp: Date;
}

/**
 * エラーイベントのデータ
 */
export interface ErrorEvent {
  source: string;
  message: string;
  error?: Error;
  recoverable: boolean;
  recoveryEvent?: string;
  recoveryData?: unknown;
  timestamp: Date;
}

/**
 * システム処理完了イベントのデータ
 */
export interface SystemProcessedEvent {
  systemName: string;
  processedEntities: number;
  executionTime: number;
  timestamp: Date;
}

/**
 * バッチ更新完了イベントのデータ
 */
export interface BatchUpdateCompletedEvent {
  oldVersion: number;
  newVersion: number;
  affectedEntities: number;
  timestamp: Date;
}

/**
 * フォーム送信イベントのデータ
 */
export interface FormSubmittedEvent {
  formId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * ボタンクリックイベントのデータ
 */
export interface ButtonClickedEvent {
  buttonId: string;
  action: string;
  timestamp: Date;
}

/**
 * 入力変更イベントのデータ
 */
export interface InputChangedEvent {
  inputId: string;
  value: string;
  timestamp: Date;
}

/**
 * モーダル開閉イベントのデータ
 */
export interface ModalEvent {
  modalId: string;
  timestamp: Date;
}

/**
 * ライフサイクルイベントデータ
 */
export interface LifecycleEventData {
  entityId: EntityId;
  entityType?: EntityType;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * コンポーネント変更イベントデータ
 */
export interface ComponentChangeEventData extends LifecycleEventData {
  componentType: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * 検証失敗イベントデータ
 */
export interface ValidationFailedEventData extends LifecycleEventData {
  errors: string[];
  warnings: string[];
}

/**
 * 状態変更イベントデータ
 */
export interface StateChangeEventData extends LifecycleEventData {
  property: string;
  oldValue: any;
  newValue: any;
  componentType: string;
}

/**
 * 型安全なイベントマップ
 * 各イベントタイプに対応するデータ型を定義
 */
export interface EventMap {
  // アイデア関連イベント
  [IdeaEvents.IDEA_ADDED]: IdeaAddedEvent;
  [IdeaEvents.IDEA_REMOVED]: IdeaRemovedEvent;
  [IdeaEvents.IDEA_UPDATED]: IdeaUpdatedEvent;
  [IdeaEvents.THEME_CHANGED]: ThemeChangedEvent;
  
  // システム関連イベント
  [SystemEvents.POSITION_CALCULATED]: PositionCalculatedEvent;
  [SystemEvents.ANIMATION_START]: AnimationEvent;
  [SystemEvents.ANIMATION_END]: AnimationEvent;
  [SystemEvents.RENDER_REQUESTED]: RenderRequestedEvent;
  [SystemEvents.ERROR_OCCURRED]: ErrorEvent;
  [SystemEvents.SYSTEM_READY]: Record<string, never>; // 空のオブジェクト
  [SystemEvents.SYSTEM_PROCESSED]: SystemProcessedEvent;
  [SystemEvents.BATCH_UPDATE_COMPLETED]: BatchUpdateCompletedEvent;
  
  // UI関連イベント
  [UIEvents.FORM_SUBMITTED]: FormSubmittedEvent;
  [UIEvents.BUTTON_CLICKED]: ButtonClickedEvent;
  [UIEvents.INPUT_CHANGED]: InputChangedEvent;
  [UIEvents.MODAL_OPENED]: ModalEvent;
  [UIEvents.MODAL_CLOSED]: ModalEvent;
  
  // ライフサイクル関連イベント
  [LifecycleEvents.BEFORE_CREATE]: LifecycleEventData;
  [LifecycleEvents.AFTER_CREATE]: LifecycleEventData;
  [LifecycleEvents.BEFORE_UPDATE]: LifecycleEventData;
  [LifecycleEvents.AFTER_UPDATE]: LifecycleEventData;
  [LifecycleEvents.BEFORE_DESTROY]: LifecycleEventData;
  [LifecycleEvents.AFTER_DESTROY]: LifecycleEventData;
  [LifecycleEvents.COMPONENT_ADDED]: ComponentChangeEventData;
  [LifecycleEvents.COMPONENT_REMOVED]: ComponentChangeEventData;
  [LifecycleEvents.VALIDATION_FAILED]: ValidationFailedEventData;
  [LifecycleEvents.STATE_CHANGED]: StateChangeEventData;
}

