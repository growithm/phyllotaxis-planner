/**
 * イベントフィルタークラス
 * 重複イベントの除外や条件に基づくイベントフィルタリング機能を提供
 */
export class EventFilter {
  private filters = new Map<string, (data: unknown) => boolean>();
  private lastProcessedData = new Map<string, unknown>();
  private processedIds = new Set<string>();

  /**
   * イベントにフィルター条件を追加する
   * @param event - イベント名
   * @param predicate - フィルター条件関数
   */
  addFilter<T>(event: string, predicate: (data: T) => boolean): void {
    this.filters.set(event, predicate);
  }

  /**
   * イベントを処理すべきかどうかを判定する
   * @param event - イベント名
   * @param data - イベントデータ
   * @returns 処理すべき場合はtrue
   */
  shouldProcess<T>(event: string, data: T): boolean {
    const filter = this.filters.get(event);
    return filter ? filter(data) : true;
  }

  /**
   * フィルターを削除する
   * @param event - イベント名
   */
  removeFilter(event: string): void {
    this.filters.delete(event);
  }

  /**
   * 重複イベントフィルターを追加する
   * @param event - イベント名
   * @param keyExtractor - データからキーを抽出する関数
   */
  addDuplicateFilter<T>(
    event: string,
    keyExtractor: (data: T) => string
  ): void {
    this.addFilter(event, (data: T) => {
      const key = `${event}:${keyExtractor(data)}`;
      if (this.processedIds.has(key)) {
        return false; // 重複を除外
      }
      this.processedIds.add(key);
      return true;
    });
  }

  /**
   * 変更検知フィルターを追加する
   * @param event - イベント名
   * @param compareFn - データ比較関数（省略時は浅い比較）
   */
  addChangeFilter<T>(
    event: string,
    compareFn?: (oldData: T, newData: T) => boolean
  ): void {
    this.addFilter(event, (data: T) => {
      if (!this.lastProcessedData.has(event)) {
        this.lastProcessedData.set(event, data);
        return true;
      }
      
      const lastData = this.lastProcessedData.get(event);

      const isEqual = compareFn 
        ? compareFn(lastData, data)
        : this.shallowEqual(lastData, data);

      if (!isEqual) {
        this.lastProcessedData.set(event, data);
        return true;
      }

      return false; // 変更がない場合は除外
    });
  }

  /**
   * レート制限フィルターを追加する
   * @param event - イベント名
   * @param maxPerSecond - 1秒あたりの最大イベント数
   */
  addRateLimitFilter(event: string, maxPerSecond: number): void {
    const timestamps: number[] = [];
    const interval = 1000; // 1秒

    this.addFilter(event, () => {
      const now = Date.now();
      
      // 古いタイムスタンプを削除
      while (timestamps.length > 0 && now - timestamps[0] > interval) {
        timestamps.shift();
      }

      if (timestamps.length < maxPerSecond) {
        timestamps.push(now);
        return true;
      }

      return false; // レート制限に達した場合は除外
    });
  }

  /**
   * 浅い比較を行う
   * @param obj1 - 比較対象1
   * @param obj2 - 比較対象2
   * @returns 等しい場合はtrue
   */
  private shallowEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;
    
    // null と undefined の処理
    if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
      return obj1 === obj2;
    }
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * すべてのフィルターをクリアする
   */
  clearAllFilters(): void {
    this.filters.clear();
    this.lastProcessedData.clear();
    this.processedIds.clear();
  }

  /**
   * フィルター統計を取得する
   */
  getFilterStats(): {
    filterCount: number;
    processedIdCount: number;
    lastDataCount: number;
  } {
    return {
      filterCount: this.filters.size,
      processedIdCount: this.processedIds.size,
      lastDataCount: this.lastProcessedData.size,
    };
  }
}