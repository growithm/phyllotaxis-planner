/**
 * Events モジュールのエクスポート
 * 
 * イベント関連のすべての型とクラスを一箇所からエクスポートします。
 */

// コアクラス
export type { EventBus, EventBusOptions } from './core/EventBus';
export { EventBusImpl } from './core/EventBusImpl';

// 統合管理クラス
export { EventBusManager } from './EventBusManager';
export type { EventBusManagerOptions } from './EventBusManager';

// イベントタイプ
export { IdeaEvents, SystemEvents, UIEvents } from './types/EventTypes';

// イベントデータ型
export type {
  Position,
  AnimationType,
  EasingType,
  IdeaAddedEvent,
  IdeaRemovedEvent,
  IdeaUpdatedEvent,
  ThemeChangedEvent,
  PositionCalculatedEvent,
  AnimationEvent,
  RenderRequestedEvent,
  ErrorEvent,
  SystemReadyEvent,
  FormSubmittedEvent,
  ButtonClickedEvent,
  InputChangedEvent,
  ModalEvent,
  EventMap
} from './types/EventData';

// エラーハンドリング
export { EventErrorHandler } from './handlers/ErrorHandler';

// パフォーマンス最適化
export { EventBatchProcessor } from './optimizations/BatchProcessor';
export { EventFilter, DuplicateEventFilter } from './filters/EventFilter';

// デバッグ・モニタリング
export { EventLogger } from './debug/EventLogger';
export type { EventLog } from './debug/EventLogger';
export { EventPerformanceMonitor } from './debug/PerformanceMonitor';
export type { EventMetrics } from './debug/PerformanceMonitor';