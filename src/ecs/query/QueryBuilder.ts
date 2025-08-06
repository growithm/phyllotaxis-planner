/**
 * 流暢なインターフェースによるクエリ構築
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, IComponent } from '@/ecs/core/Component';
import { AdvancedQueryFilter, QueryResult, TextQuery } from './types/QueryTypes';
import { QuerySystem } from './QuerySystem';

/**
 * 流暢なインターフェースでクエリを構築するビルダークラス
 */
export class QueryBuilder {
  private filter: AdvancedQueryFilter = {};

  /**
   * 必須コンポーネント指定
   */
  withComponents(...components: ComponentType[]): QueryBuilder {
    this.filter.all = [...(this.filter.all || []), ...components];
    return this;
  }

  /**
   * いずれかのコンポーネント指定
   */
  withAnyComponent(...components: ComponentType[]): QueryBuilder {
    this.filter.any = [...(this.filter.any || []), ...components];
    return this;
  }

  /**
   * 除外コンポーネント指定
   */
  withoutComponents(...components: ComponentType[]): QueryBuilder {
    this.filter.none = [...(this.filter.none || []), ...components];
    return this;
  }

  /**
   * カスタム条件追加
   */
  where(predicate: (entityId: EntityId, components: Map<ComponentType, IComponent>) => boolean): QueryBuilder {
    const existingWhere = this.filter.where;
    this.filter.where = existingWhere 
      ? (entityId, components) => existingWhere(entityId, components) && predicate(entityId, components)
      : predicate;
    return this;
  }

  /**
   * 円形範囲内のエンティティを検索
   */
  withinCircle(center: { x: number; y: number }, radius: number): QueryBuilder {
    this.filter.spatial = { type: 'circle', center, radius };
    return this;
  }

  /**
   * 矩形範囲内のエンティティを検索
   */
  withinRectangle(bounds: { x1: number; y1: number; x2: number; y2: number }): QueryBuilder {
    this.filter.spatial = { type: 'rectangle', bounds };
    return this;
  }

  /**
   * 多角形範囲内のエンティティを検索
   */
  withinPolygon(points: { x: number; y: number }[]): QueryBuilder {
    this.filter.spatial = { type: 'polygon', points };
    return this;
  }

  /**
   * 範囲クエリ追加
   */
  withRange(component: ComponentType, property: string, min?: number, max?: number): QueryBuilder {
    this.filter.range = [...(this.filter.range || []), { component, property, min, max }];
    return this;
  }

  /**
   * テキスト検索追加
   */
  withText(
    component: ComponentType, 
    property: string, 
    text: string, 
    mode: TextQuery['mode'] = 'contains',
    caseSensitive: boolean = false
  ): QueryBuilder {
    this.filter.text = [...(this.filter.text || []), { 
      component, 
      property, 
      text, 
      mode, 
      caseSensitive 
    }];
    return this;
  }

  /**
   * 時間範囲クエリ追加
   */
  withTimeRange(component: ComponentType, property: string, from?: Date, to?: Date): QueryBuilder {
    this.filter.timeRange = { component, property, from, to };
    return this;
  }

  /**
   * ソート指定
   */
  orderBy(component: ComponentType, property: string, direction: 'asc' | 'desc' = 'asc'): QueryBuilder {
    this.filter.orderBy = [...(this.filter.orderBy || []), { component, property, direction }];
    return this;
  }

  /**
   * 結果制限
   */
  limit(count: number): QueryBuilder {
    this.filter.limit = count;
    return this;
  }

  /**
   * オフセット指定
   */
  offset(count: number): QueryBuilder {
    this.filter.offset = count;
    return this;
  }

  /**
   * クエリ実行
   */
  execute(querySystem: QuerySystem): QueryResult {
    return querySystem.queryAdvanced(this.filter);
  }

  /**
   * フィルターを構築して取得
   */
  build(): AdvancedQueryFilter {
    return { ...this.filter };
  }

  /**
   * ビルダーをリセット
   */
  reset(): QueryBuilder {
    this.filter = {};
    return this;
  }

  /**
   * 現在のフィルター状態をクローン
   */
  clone(): QueryBuilder {
    const newBuilder = new QueryBuilder();
    newBuilder.filter = JSON.parse(JSON.stringify(this.filter));
    return newBuilder;
  }

  /**
   * デバッグ用：現在のフィルター状態を表示
   */
  debug(): QueryBuilder {
    console.log('[QueryBuilder] Current filter:', JSON.stringify(this.filter, null, 2));
    return this;
  }
}