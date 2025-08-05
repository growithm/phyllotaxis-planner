/**
 * エンティティマネージャー - 高レベルエンティティ管理機能
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import type { ComponentType } from '@/ecs/core/Component';
import {
  getPositionComponent,
  getTextComponent,
  getAnimationComponent,
  getVisualComponent,
} from '@/ecs/components/helpers';
import { EntityFactory } from './EntityFactory';
import { EntityTypeManager, type EntityType, type EntityTypeStatistics } from './EntityTypes';

// エンティティクエリ条件
export interface EntityQuery {
  type?: EntityType;
  hasComponents?: string[];
  textContains?: string;
  indexRange?: { min: number; max: number };
  isAnimating?: boolean;
  isVisible?: boolean;
}

// エンティティ統計情報
export interface EntityStatistics {
  total: number;
  byType: EntityTypeStatistics;
  animating: number;
  visible: number;
  performance: {
    memoryUsage: number;
  };
}

// エンティティ検証結果
export interface EntityValidation {
  valid: EntityId[];
  invalid: Array<{
    entityId: EntityId;
    issues: string[];
  }>;
}

/**
 * エンティティのライフサイクル管理とクエリ機能を提供
 */
export class EntityManager {
  private world: IWorld;
  private typeManager: EntityTypeManager;
  private factory: EntityFactory;

  constructor(world: IWorld) {
    this.world = world;
    this.typeManager = new EntityTypeManager(world);
    this.factory = new EntityFactory(world);
  }

  // ===== アクセサ =====

  /**
   * EntityFactoryを取得
   */
  getFactory(): EntityFactory {
    return this.factory;
  }

  /**
   * EntityTypeManagerを取得
   */
  getTypeManager(): EntityTypeManager {
    return this.typeManager;
  }

  // ===== クエリメソッド =====

  /**
   * 指定された条件でエンティティを検索
   */
  query(conditions: EntityQuery): EntityId[] {
    let entities = this.world.getAllEntities();

    // タイプフィルタ
    if (conditions.type) {
      entities = entities.filter(entityId => 
        this.typeManager.getEntityType(entityId) === conditions.type
      );
    }

    // 必要コンポーネントフィルタ
    if (conditions.hasComponents) {
      entities = entities.filter(entityId =>
        conditions.hasComponents!.every(componentType =>
          this.world.hasComponent(entityId, componentType as ComponentType)
        )
      );
    }

    // テキスト内容フィルタ
    if (conditions.textContains) {
      entities = entities.filter(entityId => {
        const textComponent = getTextComponent(this.world, entityId);
        return textComponent?.content.toLowerCase().includes(conditions.textContains!.toLowerCase()) || false;
      });
    }

    // インデックス範囲フィルタ
    if (conditions.indexRange) {
      entities = entities.filter(entityId => {
        const positionComponent = getPositionComponent(this.world, entityId);
        if (!positionComponent || positionComponent.index === undefined) return false;
        
        const { min, max } = conditions.indexRange!;
        return positionComponent.index >= min && positionComponent.index <= max;
      });
    }

    // アニメーション状態フィルタ
    if (conditions.isAnimating !== undefined) {
      entities = entities.filter(entityId => {
        const animationComponent = getAnimationComponent(this.world, entityId);
        return animationComponent?.isAnimating === conditions.isAnimating;
      });
    }

    // 可視性フィルタ
    if (conditions.isVisible !== undefined) {
      entities = entities.filter(entityId => {
        const visualComponent = getVisualComponent(this.world, entityId);
        const isVisible = visualComponent?.opacity !== undefined ? visualComponent.opacity > 0 : true;
        return isVisible === conditions.isVisible;
      });
    }

    return entities;
  }

  /**
   * アイデアエンティティをインデックス順でソートして取得
   */
  getIdeaEntitiesSorted(): EntityId[] {
    return this.query({ type: 'idea' }).sort((a, b) => {
      const posA = getPositionComponent(this.world, a);
      const posB = getPositionComponent(this.world, b);
      return (posA?.index ?? 0) - (posB?.index ?? 0);
    });
  }

  /**
   * テーマエンティティを取得
   */
  getThemeEntity(): EntityId | undefined {
    const themeEntities = this.query({ type: 'theme' });
    return themeEntities[0];
  }

  /**
   * 指定されたインデックスのアイデアエンティティを取得
   */
  getIdeaByIndex(index: number): EntityId | undefined {
    return this.query({ 
      type: 'idea',
      indexRange: { min: index, max: index }
    })[0];
  }

  /**
   * テキスト内容で検索
   */
  searchByText(searchText: string): EntityId[] {
    return this.query({ textContains: searchText });
  }

  /**
   * アニメーション中のエンティティを取得
   */
  getAnimatingEntities(): EntityId[] {
    return this.query({ isAnimating: true });
  }

  /**
   * 可視状態のエンティティを取得
   */
  getVisibleEntities(): EntityId[] {
    return this.query({ isVisible: true });
  }

  // ===== 管理メソッド =====

  /**
   * アイデアエンティティのインデックスを再整理
   */
  reorderIdeaEntities(): void {
    const ideaEntities = this.getIdeaEntitiesSorted();
    
    ideaEntities.forEach((entityId, newIndex) => {
      const positionComponent = getPositionComponent(this.world, entityId);
      if (positionComponent && positionComponent.index !== newIndex) {
        // 新しいPositionComponentを作成して置き換え
        const updatedComponent = {
          ...positionComponent,
          index: newIndex,
          zIndex: newIndex
        };
        
        this.world.removeComponent(entityId, 'position');
        this.world.addComponent(entityId, updatedComponent);
      }
    });
  }

  /**
   * エンティティを指定されたインデックスに移動
   */
  moveEntityToIndex(entityId: EntityId, newIndex: number): boolean {
    const positionComponent = getPositionComponent(this.world, entityId);
    if (!positionComponent) {
      return false;
    }

    const currentIndex = positionComponent.index ?? 0;
    if (currentIndex === newIndex) {
      return true; // 既に正しい位置にある
    }

    // 影響を受ける他のエンティティを調整
    const ideaEntities = this.getIdeaEntitiesSorted();
    
    ideaEntities.forEach(otherEntityId => {
      if (otherEntityId === entityId) return;
      
      const otherPosition = getPositionComponent(this.world, otherEntityId);
      if (!otherPosition || otherPosition.index === undefined) return;
      
      let adjustedIndex = otherPosition.index;
      
      if (currentIndex < newIndex) {
        // 後方に移動する場合
        if (otherPosition.index > currentIndex && otherPosition.index <= newIndex) {
          adjustedIndex = otherPosition.index - 1;
        }
      } else {
        // 前方に移動する場合
        if (otherPosition.index >= newIndex && otherPosition.index < currentIndex) {
          adjustedIndex = otherPosition.index + 1;
        }
      }
      
      if (adjustedIndex !== otherPosition.index) {
        const updatedComponent = {
          ...otherPosition,
          index: adjustedIndex,
          zIndex: adjustedIndex
        };
        
        this.world.removeComponent(otherEntityId, 'position');
        this.world.addComponent(otherEntityId, updatedComponent);
      }
    });

    // 対象エンティティのインデックスを更新
    const updatedComponent = {
      ...positionComponent,
      index: newIndex,
      zIndex: newIndex
    };
    
    this.world.removeComponent(entityId, 'position');
    this.world.addComponent(entityId, updatedComponent);

    return true;
  }

  /**
   * エンティティを削除してインデックスを再整理
   */
  removeEntityAndReorder(entityId: EntityId): boolean {
    const success = this.world.destroyEntity(entityId);
    if (success) {
      this.reorderIdeaEntities();
    }
    return success;
  }

  // ===== 統計・検証メソッド =====

  /**
   * エンティティシステムの統計情報を取得
   */
  getStatistics(): EntityStatistics {
    const typeStatistics = this.typeManager.getTypeStatistics();
    const animatingCount = this.getAnimatingEntities().length;
    const visibleCount = this.getVisibleEntities().length;

    // 概算メモリ使用量を計算
    const entityCount = this.world.getAllEntities().length;
    const estimatedMemoryUsage = entityCount * 250; // bytes per entity (概算)

    return {
      total: entityCount,
      byType: typeStatistics,
      animating: animatingCount,
      visible: visibleCount,
      performance: {
        memoryUsage: estimatedMemoryUsage
      }
    };
  }

  /**
   * 全エンティティの整合性をチェック
   */
  validateAllEntities(): EntityValidation {
    const allEntities = this.world.getAllEntities();
    const valid: EntityId[] = [];
    const invalid: Array<{ entityId: EntityId; issues: string[] }> = [];

    allEntities.forEach(entityId => {
      const issues: string[] = [];

      // エンティティタイプの検証
      const entityType = this.typeManager.getEntityType(entityId);
      if (!entityType) {
        issues.push('Unknown entity type');
      } else {
        // コンポーネント構成の検証
        const componentValidation = this.typeManager.validateEntityComponents(entityId);
        if (!componentValidation.isValid) {
          issues.push(`Missing required components: ${componentValidation.missingRequired.join(', ')}`);
        }
      }

      // インデックスの重複チェック（アイデアエンティティのみ）
      if (entityType === 'idea') {
        const positionComponent = getPositionComponent(this.world, entityId);
        if (positionComponent?.index !== undefined) {
          const duplicates = this.query({
            type: 'idea',
            indexRange: { min: positionComponent.index, max: positionComponent.index }
          });
          
          if (duplicates.length > 1) {
            issues.push(`Duplicate index: ${positionComponent.index}`);
          }
        }
      }

      if (issues.length === 0) {
        valid.push(entityId);
      } else {
        invalid.push({ entityId, issues });
      }
    });

    return { valid, invalid };
  }

  /**
   * エンティティの自動修復
   */
  repairEntities(): number {
    const validation = this.validateAllEntities();
    let repairedCount = 0;

    validation.invalid.forEach(({ entityId, issues }) => {
      let repaired = false;

      // インデックス重複の修復
      if (issues.some(issue => issue.includes('Duplicate index'))) {
        this.reorderIdeaEntities();
        repaired = true;
      }

      // 不完全なコンポーネント構成の修復は複雑なため、ログ出力のみ
      if (issues.some(issue => issue.includes('Missing required components'))) {
        console.warn(`Entity ${entityId} has missing components and requires manual repair`);
      }

      if (repaired) {
        repairedCount++;
      }
    });

    return repairedCount;
  }
}