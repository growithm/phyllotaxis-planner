import type { EventBus } from '@/events/core';

/**
 * イベントバッチ処理クラス
 * 大量のイベントを効率的に処理するためのバッチング機能を提供
 */
export class EventBatchProcessor {
  private batchQueue = new Map<string, unknown[]>();
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(
    private eventBus: EventBus,
    private batchInterval: number = 16 // 60fps
  ) {}

  /**
   * イベントをバッチキューに追加する
   * @param event - イベント名
   * @param data - イベントデータ
   */
  batchEmit<T>(event: string, data: T): void {
    if (!this.batchQueue.has(event)) {
      this.batchQueue.set(event, []);
    }

    this.batchQueue.get(event)!.push(data);

    if (!this.processingTimeout) {
      this.processingTimeout = setTimeout(() => {
        this.processBatch();
      }, this.batchInterval);
    }
  }

  /**
   * バッチキューを処理する
   */
  private processBatch(): void {
    const batch = new Map(this.batchQueue);
    this.batchQueue.clear();
    this.processingTimeout = null;

    batch.forEach((dataArray, event) => {
      // バッチ処理用の特別なイベントを発火
      this.eventBus.emit(`${event}:batch`, dataArray);
    });
  }

  /**
   * 即座にバッチを処理する
   */
  public flushBatch(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    this.processBatch();
  }

  /**
   * バッチキューをクリアする
   */
  public clearBatch(): void {
    this.batchQueue.clear();
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
  }

  /**
   * 現在のバッチキューの状態を取得する
   */
  public getBatchStatus(): Map<string, number> {
    const status = new Map<string, number>();
    this.batchQueue.forEach((dataArray, event) => {
      status.set(event, dataArray.length);
    });
    return status;
  }

  /**
   * バッチ間隔を変更する
   * @param interval - 新しいバッチ間隔（ミリ秒）
   */
  public setBatchInterval(interval: number): void {
    this.batchInterval = interval;
  }

  /**
   * バッチプロセッサーを破棄する
   */
  public destroy(): void {
    this.clearBatch();
  }
}