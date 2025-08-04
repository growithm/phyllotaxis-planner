import type { Position, AnimationType, EasingType } from '@/types';
import { IdeaEvents, SystemEvents, UIEvents } from './EventTypes';

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
  
  // UI関連イベント
  [UIEvents.FORM_SUBMITTED]: FormSubmittedEvent;
  [UIEvents.BUTTON_CLICKED]: ButtonClickedEvent;
  [UIEvents.INPUT_CHANGED]: InputChangedEvent;
  [UIEvents.MODAL_OPENED]: ModalEvent;
  [UIEvents.MODAL_CLOSED]: ModalEvent;
}