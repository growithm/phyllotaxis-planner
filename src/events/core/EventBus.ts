/**
 * EventBus インターフェース
 * イベント駆動アーキテクチャの中核となるイベントバスの定義
 */
export interface EventBus {
  /**
   * イベントを発行する
   * @param event - イベント名
   * @param data - イベントデータ
   */
  emit<T>(event: string, data: T): void;

  /**
   * イベントリスナーを登録する
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
   * 一度だけ実行されるイベントリスナーを登録する
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