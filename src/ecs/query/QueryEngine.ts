/**
 * クエリ実行エンジン
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, ComponentTypes, IComponent } from '@/ecs/core/Component';
import { IWorld } from '@/ecs/core/System';
import { QueryFilter, AdvancedQueryFilter, QueryResult, RangeQuery, TextQuery, TimeRangeQuery } from './types/QueryTypes';
import { EntityIndex } from './EntityIndex';
import { QueryOptimizer } from './QueryOptimizer';

/**
 * クエリ実行エンジン
 */
export class QueryEngine {
  private world: IWorld;
  private entityIndex: EntityIndex;
  private queryOptimizer: QueryOptimizer;

  constructor(world: IWorld, entityIndex: EntityIndex, queryOptimizer: QueryOptimizer) {
    this.world = world;
    this.entityIndex = entityIndex;
    this.queryOptimizer = queryOptimizer;
  }

  /**
   * クエリを実行
   */
  execute(filter: QueryFilter): QueryResult {
    const startTime = performance.now();
    let stepsExecuted = 0;
    let entitiesScanned = 0;
    let indexHits = 0;
    const optimizationApplied: string[] = [];

    try {
      // インデックスをWorldと同期
      this.entityIndex.syncWithWorld();

      // クエリ最適化
      const optimizedQuery = this.queryOptimizer.optimize(filter, this.entityIndex);
      if (optimizedQuery.filter !== filter) {
        optimizationApplied.push('query-optimization');
      }

      // 基本フィルタリング
      let candidateEntities = this.getBaseCandidates(optimizedQuery.filter);
      stepsExecuted++;
      indexHits++;
      entitiesScanned = candidateEntities.length;

      // 追加フィルタリング
      candidateEntities = this.applyAdditionalFilters(candidateEntities, optimizedQuery.filter);
      stepsExecuted++;

      // カスタム条件適用
      if (optimizedQuery.filter.where) {
        candidateEntities = this.applyCustomFilter(candidateEntities, optimizedQuery.filter.where);
        stepsExecuted++;
      }

      // ソート
      if (optimizedQuery.filter.orderBy && optimizedQuery.filter.orderBy.length > 0) {
        candidateEntities = this.applySorting(candidateEntities, optimizedQuery.filter.orderBy);
        stepsExecuted++;
      }

      // ページネーション
      const totalCount = candidateEntities.length;
      candidateEntities = this.applyPagination(candidateEntities, optimizedQuery.filter);

      const executionTime = performance.now() - startTime;

      return {
        entities: candidateEntities,
        totalCount,
        executionTime,
        fromCache: false,
        queryStats: {
          stepsExecuted,
          entitiesScanned,
          indexHits,
          cacheHit: false,
          optimizationApplied
        }
      };

    } catch (error) {
      console.error('[QueryEngine] Query execution failed:', error);
      
      return {
        entities: [],
        totalCount: 0,
        executionTime: performance.now() - startTime,
        fromCache: false,
        queryStats: {
          stepsExecuted,
          entitiesScanned,
          indexHits,
          cacheHit: false,
          optimizationApplied
        }
      };
    }
  }

  /**
   * 基本候補エンティティを取得
   */
  private getBaseCandidates(filter: QueryFilter): EntityId[] {
    let candidates: Set<EntityId>;

    // 必須コンポーネント（AND条件）
    if (filter.all && filter.all.length > 0) {
      candidates = this.entityIndex.getEntitiesWithComponents(filter.all);
    } else {
      // 全エンティティから開始
      candidates = new Set(this.world.getAllEntities());
    }

    // いずれかのコンポーネント（OR条件）
    if (filter.any && filter.any.length > 0) {
      const anyEntities = new Set<EntityId>();
      filter.any.forEach(componentType => {
        const entities = this.entityIndex.getEntitiesWithComponent(componentType);
        entities.forEach(entityId => anyEntities.add(entityId));
      });
      
      // ANDとORの交集合
      if (filter.all && filter.all.length > 0) {
        candidates = new Set([...candidates].filter(entityId => anyEntities.has(entityId)));
      } else {
        candidates = anyEntities;
      }
    }

    // 除外コンポーネント（NOT条件）
    if (filter.none && filter.none.length > 0) {
      filter.none.forEach(componentType => {
        const excludeEntities = this.entityIndex.getEntitiesWithComponent(componentType);
        excludeEntities.forEach(entityId => candidates.delete(entityId));
      });
    }

    return Array.from(candidates);
  }

  /**
   * 追加フィルターを適用
   */
  private applyAdditionalFilters(entities: EntityId[], filter: QueryFilter): EntityId[] {
    let filteredEntities = entities;

    // 高度なフィルターの場合
    const advancedFilter = filter as AdvancedQueryFilter;

    // 空間フィルター
    if (advancedFilter.spatial) {
      const spatialEntities = this.entityIndex.getEntitiesInArea(advancedFilter.spatial);
      filteredEntities = filteredEntities.filter(entityId => spatialEntities.has(entityId));
    }

    // 範囲フィルター
    if (advancedFilter.range && advancedFilter.range.length > 0) {
      filteredEntities = this.applyRangeFilters(filteredEntities, advancedFilter.range);
    }

    // テキストフィルター
    if (advancedFilter.text && advancedFilter.text.length > 0) {
      filteredEntities = this.applyTextFilters(filteredEntities, advancedFilter.text);
    }

    // 時間範囲フィルター
    if (advancedFilter.timeRange) {
      filteredEntities = this.applyTimeRangeFilter(filteredEntities, advancedFilter.timeRange);
    }

    return filteredEntities;
  }

  /**
   * 範囲フィルターを適用
   */
  private applyRangeFilters(entities: EntityId[], rangeQueries: RangeQuery[]): EntityId[] {
    return entities.filter(entityId => {
      return rangeQueries.every(rangeQuery => {
        const component = this.world.getComponent(entityId, rangeQuery.component);
        if (!component) return false;

        const value = (component as Record<string, unknown>)[rangeQuery.property];
        if (typeof value !== 'number') return false;

        if (rangeQuery.min !== undefined && value < rangeQuery.min) return false;
        if (rangeQuery.max !== undefined && value > rangeQuery.max) return false;

        return true;
      });
    });
  }

  /**
   * テキストフィルターを適用
   */
  private applyTextFilters(entities: EntityId[], textQueries: TextQuery[]): EntityId[] {
    return entities.filter(entityId => {
      return textQueries.every(textQuery => {
        const component = this.world.getComponent(entityId, textQuery.component);
        if (!component) return false;

        const value = (component as Record<string, unknown>)[textQuery.property];
        if (typeof value !== 'string') return false;

        const searchText = textQuery.caseSensitive ? textQuery.text : textQuery.text.toLowerCase();
        const targetText = textQuery.caseSensitive ? value : value.toLowerCase();

        switch (textQuery.mode) {
          case 'exact':
            return targetText === searchText;
          case 'contains':
            return targetText.includes(searchText);
          case 'startsWith':
            return targetText.startsWith(searchText);
          case 'endsWith':
            return targetText.endsWith(searchText);
          case 'regex':
            try {
              const regex = new RegExp(searchText, textQuery.caseSensitive ? 'g' : 'gi');
              return regex.test(targetText);
            } catch {
              return false;
            }
          default:
            return false;
        }
      });
    });
  }

  /**
   * 時間範囲フィルターを適用
   */
  private applyTimeRangeFilter(entities: EntityId[], timeRangeQuery: TimeRangeQuery): EntityId[] {
    return entities.filter(entityId => {
      const component = this.world.getComponent(entityId, timeRangeQuery.component);
      if (!component) return false;

      const value = (component as Record<string, unknown>)[timeRangeQuery.property];
      if (!(value instanceof Date)) return false;

      if (timeRangeQuery.from && value < timeRangeQuery.from) return false;
      if (timeRangeQuery.to && value > timeRangeQuery.to) return false;

      return true;
    });
  }

  /**
   * カスタムフィルターを適用
   */
  private applyCustomFilter(
    entities: EntityId[], 
    predicate: (entityId: EntityId, components: Map<ComponentType, IComponent>) => boolean
  ): EntityId[] {
    return entities.filter(entityId => {
      // エンティティの全コンポーネントを取得
      const components = new Map<ComponentType, IComponent>();
      
      // 利用可能な全コンポーネントタイプをチェック
      Object.values(ComponentTypes).forEach(componentType => {
        const component = this.world.getComponent(entityId, componentType);
        if (component) {
          components.set(componentType, component);
        }
      });

      return predicate(entityId, components);
    });
  }

  /**
   * ソートを適用
   */
  private applySorting(entities: EntityId[], orderBy: import('./types/QueryTypes').QueryOrderBy[]): EntityId[] {
    return entities.sort((a, b) => {
      for (const sort of orderBy) {
        const componentA = this.world.getComponent(a, sort.component);
        const componentB = this.world.getComponent(b, sort.component);

        if (!componentA && !componentB) continue;
        if (!componentA) return 1;
        if (!componentB) return -1;

        const valueA = (componentA as Record<string, unknown>)[sort.property];
        const valueB = (componentB as Record<string, unknown>)[sort.property];

        if (valueA === valueB) continue;

        let comparison = 0;
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          comparison = valueA.localeCompare(valueB);
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else {
          comparison = String(valueA).localeCompare(String(valueB));
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      }
      return 0;
    });
  }

  /**
   * ページネーションを適用
   */
  private applyPagination(entities: EntityId[], filter: QueryFilter): EntityId[] {
    const offset = filter.offset || 0;
    const limit = filter.limit;

    if (offset > 0) {
      entities = entities.slice(offset);
    }

    if (limit !== undefined && limit > 0) {
      entities = entities.slice(0, limit);
    }

    return entities;
  }
}