/**
 * EventFilter - イベントフィルタリングクラス
 * 
 * 不要なイベントをフィルタリングして、
 * パフォーマンスを向上させます。
 */
export class EventFilter {
  private filters = new Map<string, (data: unknown) => boolean>();

  /**
   * イベントフィルターを追加する
   * @param event - イベント名
   * @param predicate - フィルター条件
   */
  addFilter<T>(event: string, predicate: (data: T) => boolean): void {
    this.filters.set(event, predicate as (data: unknown) => boolean);
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
   * イベントフィルターを削除する
   * @param event - イベント名
   */
  removeFilter(event: string): void {
    this.filters.delete(event);
  }

  /**
   * すべてのフィルターをクリアする
   */
  clearFilters(): void {
    this.filters.clear();
  }

  /**
   * 登録されているフィルター一覧を取得する
   * @returns フィルターが登録されているイベント名の配列
   */
  getFilteredEvents(): string[] {
    return Array.from(this.filters.keys());
  }
}

/**
 * 重複イベントフィルター
 * 
 * 同じIDのイベントの重複を防ぎます。
 */
export class DuplicateEventFilter {
  private processedIds = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 60000) { // 1分ごとにクリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * イベントが重複していないかチェックする
   * @param eventId - イベントID
   * @returns 重複していない場合はtrue
   */
  isUnique(eventId: string): boolean {
    if (this.processedIds.has(eventId)) {
      return false;
    }
    this.processedIds.add(eventId);
    return true;
  }

  /**
   * 処理済みIDをクリーンアップする
   */
  private cleanup(): void {
    // メモリ使用量を制限するため、定期的にクリーンアップ
    if (this.processedIds.size > 10000) {
      this.processedIds.clear();
    }
  }

  /**
   * フィルターを破棄する
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.processedIds.clear();
  }
}