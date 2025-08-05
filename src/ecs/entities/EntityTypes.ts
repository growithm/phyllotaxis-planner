/**
 * エンティティタイプ管理システム
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import type { ComponentType } from '@/ecs/core/Component';
import { getTextComponent } from '@/ecs/components/helpers';

// エンティティタイプの定義
export type EntityType = 'idea' | 'theme';

// エンティティタイプ情報
export interface EntityTypeInfo {
  type: EntityType;
  displayName: string;
  description: string;
  maxCount: number; // -1 = 無制限
  requiredComponents: string[];
  optionalComponents: string[];
}

// タイプ制約情報
export interface TypeConstraints {
  maxCount: number;
  currentCount: number;
  canCreate: boolean;
  remaining: number;
}

// コンポーネント検証結果
export interface ComponentValidation {
  isValid: boolean;
  missingRequired: string[];
  hasOptional: string[];
}

// エンティティタイプ統計
export interface EntityTypeStatistics {
  [key: string]: {
    count: number;
    maxCount: number;
    percentage: number;
    canCreate: boolean;
  };
}

// エンティティタイプ設定
export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeInfo> = {
  theme: {
    type: 'theme',
    displayName: '中心テーマ',
    description: 'マップの中心となる主要テーマ',
    maxCount: 1, // テーマは1つのみ
    requiredComponents: ['position', 'text', 'visual'],
    optionalComponents: ['animation'],
  },
  idea: {
    type: 'idea',
    displayName: 'アイデア',
    description: 'テーマから派生するアイデア要素',
    maxCount: 50, // MVP制限
    requiredComponents: ['position', 'text', 'visual'],
    optionalComponents: ['animation'],
  },
};

/**
 * エンティティタイプの識別と制限管理
 */
export class EntityTypeManager {
  private world: IWorld;
  private typeCache: Map<EntityId, EntityType | undefined> = new Map();
  private cacheVersion: number = 0;

  constructor(world: IWorld) {
    this.world = world;
  }

  /**
   * エンティティのタイプを取得（キャッシュ付き）
   */
  getEntityType(entityId: EntityId): EntityType | undefined {
    // キャッシュの有効性をチェック
    if (this.world.getVersion && this.world.getVersion() !== this.cacheVersion) {
      this.invalidateCache();
    }

    // キャッシュから取得を試行
    if (this.typeCache.has(entityId)) {
      return this.typeCache.get(entityId);
    }

    // TextComponentから判定
    const textComponent = getTextComponent(this.world, entityId);
    const entityType = textComponent?.entityType;

    // キャッシュに保存
    this.typeCache.set(entityId, entityType);

    return entityType;
  }

  /**
   * エンティティがテーマエンティティかどうかを判定
   */
  isThemeEntity(entityId: EntityId): boolean {
    return this.getEntityType(entityId) === 'theme';
  }

  /**
   * エンティティがアイデアエンティティかどうかを判定
   */
  isIdeaEntity(entityId: EntityId): boolean {
    return this.getEntityType(entityId) === 'idea';
  }

  /**
   * 指定されたタイプのエンティティを取得
   */
  getEntitiesByType(type: EntityType): EntityId[] {
    return this.world.getAllEntities().filter(entityId => 
      this.getEntityType(entityId) === type
    );
  }

  /**
   * テーマエンティティを取得（通常は1つのみ）
   */
  getThemeEntity(): EntityId | undefined {
    const themeEntities = this.getEntitiesByType('theme');
    return themeEntities[0];
  }

  /**
   * アイデアエンティティを取得
   */
  getIdeaEntities(): EntityId[] {
    return this.getEntitiesByType('idea');
  }

  /**
   * 指定されたタイプのエンティティ数を取得
   */
  getEntityCount(type: EntityType): number {
    return this.getEntitiesByType(type).length;
  }

  /**
   * 指定されたタイプのエンティティを新規作成可能かチェック
   */
  canCreateEntity(type: EntityType): boolean {
    const config = ENTITY_TYPE_CONFIG[type];
    if (config.maxCount === -1) {
      return true; // 無制限
    }

    const currentCount = this.getEntityCount(type);
    return currentCount < config.maxCount;
  }

  /**
   * エンティティタイプの制限情報を取得
   */
  getTypeConstraints(type: EntityType): TypeConstraints {
    const config = ENTITY_TYPE_CONFIG[type];
    const currentCount = this.getEntityCount(type);

    return {
      maxCount: config.maxCount,
      currentCount,
      canCreate: this.canCreateEntity(type),
      remaining: config.maxCount === -1 ? -1 : Math.max(0, config.maxCount - currentCount)
    };
  }

  /**
   * エンティティのコンポーネント構成を検証
   */
  validateEntityComponents(entityId: EntityId): ComponentValidation {
    const entityType = this.getEntityType(entityId);
    
    if (!entityType) {
      return {
        isValid: false,
        missingRequired: ['text'], // entityTypeが不明な場合はTextComponentが不足
        hasOptional: []
      };
    }

    const config = ENTITY_TYPE_CONFIG[entityType];
    const missingRequired: string[] = [];
    const hasOptional: string[] = [];

    // 必須コンポーネントのチェック
    config.requiredComponents.forEach(componentType => {
      if (!this.world.hasComponent(entityId, componentType as ComponentType)) {
        missingRequired.push(componentType);
      }
    });

    // オプショナルコンポーネントのチェック
    config.optionalComponents.forEach(componentType => {
      if (this.world.hasComponent(entityId, componentType as ComponentType)) {
        hasOptional.push(componentType);
      }
    });

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      hasOptional
    };
  }

  /**
   * エンティティタイプの統計情報を取得
   */
  getTypeStatistics(): EntityTypeStatistics {
    const statistics: EntityTypeStatistics = {};

    Object.values(ENTITY_TYPE_CONFIG).forEach(config => {
      const currentCount = this.getEntityCount(config.type);
      const percentage = config.maxCount === -1 
        ? 0 
        : (currentCount / config.maxCount) * 100;

      statistics[config.type] = {
        count: currentCount,
        maxCount: config.maxCount,
        percentage,
        canCreate: this.canCreateEntity(config.type)
      };
    });

    return statistics;
  }

  /**
   * キャッシュを無効化
   */
  invalidateCache(): void {
    this.typeCache.clear();
    this.cacheVersion = this.world.getVersion ? this.world.getVersion() : 0;
  }
}