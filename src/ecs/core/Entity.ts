/**
 * エンティティ基底クラスとEntityPool実装
 */

// エンティティ識別子型
export type EntityId = string;

// エンティティプール統計
export interface EntityPoolStats {
  active: number;
  available: number;
  total: number;
}

/**
 * エンティティIDの効率的な生成と再利用を管理するプール
 */
export class EntityPool {
  private availableIds: EntityId[] = [];
  private nextId: number = 1;
  private activeEntities: Set<EntityId> = new Set();

  /**
   * 新しいエンティティIDを取得
   */
  acquire(): EntityId {
    let id: EntityId;

    if (this.availableIds.length > 0) {
      id = this.availableIds.pop()!;
    } else {
      id = `entity_${this.nextId++}`;
    }

    this.activeEntities.add(id);
    return id;
  }

  /**
   * エンティティIDを解放してプールに戻す
   */
  release(id: EntityId): void {
    if (this.activeEntities.has(id)) {
      this.activeEntities.delete(id);
      this.availableIds.push(id);
    }
  }

  /**
   * エンティティがアクティブかどうかを確認
   */
  isActive(id: EntityId): boolean {
    return this.activeEntities.has(id);
  }

  /**
   * アクティブなエンティティIDの配列を取得
   */
  getActiveEntities(): EntityId[] {
    return Array.from(this.activeEntities);
  }

  /**
   * プールの統計情報を取得
   */
  getStats(): EntityPoolStats {
    return {
      active: this.activeEntities.size,
      available: this.availableIds.length,
      total: this.nextId - 1
    };
  }

  /**
   * プールをクリア（テスト用）
   */
  clear(): void {
    this.availableIds = [];
    this.activeEntities.clear();
    this.nextId = 1;
  }
}