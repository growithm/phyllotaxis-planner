import type { EventBus } from '@/events/core';
import { SystemEvents, UIEvents } from '@/events/types';
import type { ErrorEvent, ModalEvent } from '@/events/types';

/**
 * 統一エラー処理クラス
 * アプリケーション全体のエラーを一元的に処理し、適切な回復処理を行う
 */
export class EventErrorHandler {
  private errorStats = new Map<string, number>();
  private boundHandleError: (error: ErrorEvent) => void;

  constructor(private eventBus: EventBus) {
    this.boundHandleError = this.handleError.bind(this);
    this.setupErrorHandling();
  }

  /**
   * エラーハンドリングの初期化
   */
  private setupErrorHandling(): void {
    this.eventBus.on(SystemEvents.ERROR_OCCURRED, this.boundHandleError);
  }

  /**
   * エラーを処理する
   * @param error - エラーイベントデータ
   */
  private handleError(error: ErrorEvent): void {
    console.error(`[${error.source}] ${error.message}`, error.error);

    // エラー統計を更新
    this.updateErrorStats(error);

    // エラーレベルに応じた処理
    if (error.recoverable && error.recoveryEvent) {
      console.log(`[ErrorHandler] Attempting recovery with ${error.recoveryEvent}`);
      this.attemptRecovery(error);
    } else {
      // 回復不可能なエラーの場合
      this.handleCriticalError(error);
    }
  }

  /**
   * エラー回復を試行する
   * @param error - エラーイベントデータ
   */
  private attemptRecovery(error: ErrorEvent): void {
    try {
      if (error.recoveryEvent && error.recoveryData) {
        this.eventBus.emit(error.recoveryEvent, error.recoveryData);
        console.log(`[ErrorHandler] Recovery attempted for ${error.source}`);
      }
    } catch (recoveryError) {
      console.error(`[ErrorHandler] Recovery failed for ${error.source}:`, recoveryError);
      this.handleCriticalError(error);
    }
  }

  /**
   * 回復不可能なエラーを処理する
   * @param error - エラーイベントデータ
   */
  private handleCriticalError(error: ErrorEvent): void {
    // ユーザーへの通知
    const modalData: ModalEvent = {
      modalId: `error-${Date.now()}`,
      timestamp: new Date(),
    };

    this.eventBus.emit(UIEvents.MODAL_OPENED, modalData);

    // 開発環境では詳細なエラー情報を表示
    if (process.env.NODE_ENV === 'development') {
      console.group(`[ErrorHandler] Critical Error in ${error.source}`);
      console.error('Message:', error.message);
      console.error('Error:', error.error);
      console.error('Timestamp:', error.timestamp);
      console.groupEnd();
    }
  }

  /**
   * エラー統計を更新する
   * @param error - エラーイベントデータ
   */
  private updateErrorStats(error: ErrorEvent): void {
    const key = `${error.source}:${error.message}`;
    const count = this.errorStats.get(key) || 0;
    this.errorStats.set(key, count + 1);

    // 同じエラーが頻発している場合の警告
    if (count >= 5) {
      console.warn(
        `[ErrorHandler] Frequent error detected: ${key} (${count + 1} times)`
      );
    }
  }

  /**
   * エラー統計を取得する
   * @returns エラー統計のマップ
   */
  public getErrorStats(): Map<string, number> {
    return new Map(this.errorStats);
  }

  /**
   * エラー統計をクリアする
   */
  public clearErrorStats(): void {
    this.errorStats.clear();
  }

  /**
   * エラーハンドラーを破棄する
   */
  public destroy(): void {
    this.eventBus.off(SystemEvents.ERROR_OCCURRED, this.boundHandleError);
    this.clearErrorStats();
  }
}