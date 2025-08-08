/**
 * バッチ更新によるパフォーマンス最適化
 */

import type { World } from '@/ecs/core/World';
import type { BatchOperation, BatchUpdaterOptions } from './types';

/**
 * バッチ更新を管理するクラス
 */
export class BatchUpdater {
  private world: World;
  private batchQueue: BatchOperation[];
  private batchTimeout: NodeJS.Timeout | null;
  private batchDelay: number;
  private maxBatchSize: number;

  constructor(world: World, options: BatchUpdaterOptions = {}) {
    this.world = world;
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchDelay = options.batchDelay || 16; // ~60fps
    this.maxBatchSize = options.maxBatchSize || 100;
  }

  /**
   * バッチ操作を追加
   * @param operation - 実行する操作
   */
  batch(operation: () => void): void {
    this.batchQueue.push({
      operation,
      timestamp: Date.now()
    });

    this.scheduleBatchExecution();
  }

  /**
   * バッチ実行をスケジュール
   */
  private scheduleBatchExecution(): void {
    // 既存のタイマーをクリア
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // 最大バッチサイズに達した場合は即座に実行
    if (this.batchQueue.length >= this.maxBatchSize) {
      this.executeBatch();
      return;
    }

    // 遅延実行をスケジュール
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.batchDelay);
  }

  /**
   * バッチを実行
   */
  private executeBatch(): void {
    if (this.batchQueue.length === 0) {
      return;
    }

    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // World のバッチ更新機能を使用
    this.world.batchUpdate(() => {
      operations.forEach(({ operation }) => {
        try {
          operation();
        } catch (error) {
          console.error('Batch operation failed:', error);
        }
      });
    });
  }

  /**
   * 強制的にバッチを実行
   */
  flush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.executeBatch();
  }

  /**
   * バッチ統計を取得
   */
  getStats(): {
    queueLength: number;
    isScheduled: boolean;
    batchDelay: number;
    maxBatchSize: number;
  } {
    return {
      queueLength: this.batchQueue.length,
      isScheduled: this.batchTimeout !== null,
      batchDelay: this.batchDelay,
      maxBatchSize: this.maxBatchSize
    };
  }

  /**
   * リソースをクリーンアップ
   */
  dispose(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.batchQueue = [];
  }
}