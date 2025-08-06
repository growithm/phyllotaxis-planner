import type { EventMap } from '@/events/types/EventData';

/**
 * EventBus インターフェース
 * イベント駆動アーキテクチャの中核となるイベントバスの定義
 */
export interface EventBus {
  /**
   * 型安全なイベント発行
   * @param event - イベントキー
   * @param data - イベントデータ
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void;

  /**
   * 従来の型なしイベント発行（後方互換性のため）
   * @param event - イベント名
   * @param data - イベントデータ
   */
  emit<T>(event: string, data: T): void;

  /**
   * 型安全なイベントリスナー登録
   * @param event - イベントキー
   * @param handler - イベントハンドラー
   * @returns アンサブスクライブ関数
   */
  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ): () => void;

  /**
   * 従来の型なしイベントリスナー登録（後方互換性のため）
   * @param event - イベント名
   * @param handler - イベントハンドラー
   * @returns アンサブスクライブ関数
   */
  on<T>(event: string, handler: (data: T) => void): () => void;

  /**
   * イベントリスナーを削除する
   * @param event - イベント名
   * @param handler - 削除するハンドラー
   */
  off(event: string, handler: Function): void;

  /**
   * 型安全な一度だけ実行されるイベントリスナー登録
   * @param event - イベントキー
   * @param handler - イベントハンドラー
   */
  once<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ): void;

  /**
   * 従来の型なし一度だけ実行されるイベントリスナー登録（後方互換性のため）
   * @param event - イベント名
   * @param handler - イベントハンドラー
   */
  once<T>(event: string, handler: (data: T) => void): void;

  /**
   * すべてのイベントリスナーをクリアする
   */
  clear(): void;

  /**
   * 指定されたイベントのリスナー数を取得する
   * @param event - イベント名
   * @returns リスナー数
   */
  getListenerCount(event: string): number;
}

/**
 * EventBus設定オプション
 */
export interface EventBusOptions {
  /** 最大リスナー数（デフォルト: 100） */
  maxListeners?: number;
  /** バッチング機能を有効にするか（デフォルト: false） */
  enableBatching?: boolean;
  /** バッチ処理間隔（ミリ秒、デフォルト: 16） */
  batchInterval?: number;
  /** ログ機能を有効にするか（デフォルト: false） */
  enableLogging?: boolean;
}
