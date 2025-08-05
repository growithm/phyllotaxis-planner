/**
 * エンティティファクトリ - エンティティ作成の責務
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import type { ITextComponent, IVisualComponent, IPositionComponent, IAnimationComponent } from '@/ecs/components';
import {
  createThemeTextComponent,
  createIdeaTextComponent,
  createThemeVisualComponent,
  createIdeaVisualComponent,
  createPositionComponent,
  createPhyllotaxisPositionComponent,
  createAnimationComponent,
} from '@/ecs/components';
import { getNextAvailableIndex } from '@/ecs/components/helpers';
import { EntityTypeManager, type EntityType, type EntityTypeStatistics } from './EntityTypes';

// エンティティ作成オプション
export interface CreateEntityOptions {
  // 位置設定
  x?: number;
  y?: number;
  
  // アニメーション設定
  withAnimation?: boolean;
  animationDuration?: number;
  
  // カスタムコンポーネント設定
  customTextOptions?: Partial<ITextComponent>;
  customVisualOptions?: Partial<IVisualComponent>;
  customPositionOptions?: Partial<IPositionComponent>;
}

/**
 * エンティティタイプに応じた適切なコンポーネント構成でエンティティを作成
 */
export class EntityFactory {
  private world: IWorld;
  private typeManager: EntityTypeManager;

  constructor(world: IWorld) {
    this.world = world;
    this.typeManager = new EntityTypeManager(world);
  }

  /**
   * TypeManagerを取得
   */
  getTypeManager(): EntityTypeManager {
    return this.typeManager;
  }

  /**
   * 中心テーマエンティティを作成
   */
  createThemeEntity(content: string, options: CreateEntityOptions = {}): EntityId | null {
    if (!this.typeManager.canCreateEntity('theme')) {
      console.warn('Cannot create theme entity: maximum count reached');
      return null;
    }

    const entityId = this.world.createEntity();
    
    try {
      // テキストコンポーネント
      const textComponent = createThemeTextComponent(content, options.customTextOptions);
      this.world.addComponent(entityId, textComponent);

      // 視覚コンポーネント
      const visualComponent = createThemeVisualComponent(options.customVisualOptions);
      this.world.addComponent(entityId, visualComponent);

      // 位置コンポーネント（中心位置）
      const positionComponent = createPositionComponent(
        options.x ?? 400, // デフォルト中心X
        options.y ?? 300, // デフォルト中心Y
        { index: -1, zIndex: 1000, ...options.customPositionOptions }
      );
      this.world.addComponent(entityId, positionComponent);

      // アニメーションコンポーネント（オプション）
      if (options.withAnimation) {
        const animationComponent = createAnimationComponent(
          'fadeIn',
          options.animationDuration ?? 500,
          { isAnimating: true }
        );
        this.world.addComponent(entityId, animationComponent);
      }

      return entityId;
    } catch (error) {
      // エラーが発生した場合はエンティティを削除
      this.world.destroyEntity(entityId);
      console.error('Failed to create theme entity:', error);
      return null;
    }
  }

  /**
   * アイデアエンティティを作成
   */
  createIdeaEntity(content: string, options: CreateEntityOptions = {}): EntityId | null {
    if (!this.typeManager.canCreateEntity('idea')) {
      console.warn('Cannot create idea entity: maximum count reached');
      return null;
    }

    const entityId = this.world.createEntity();
    
    try {
      const index = getNextAvailableIndex(this.world);

      // テキストコンポーネント
      const textComponent = createIdeaTextComponent(content, options.customTextOptions);
      this.world.addComponent(entityId, textComponent);

      // 視覚コンポーネント
      const visualComponent = createIdeaVisualComponent(options.customVisualOptions);
      this.world.addComponent(entityId, visualComponent);

      // 位置コンポーネント
      const positionComponent = (options.x !== undefined && options.y !== undefined)
        ? createPositionComponent(options.x, options.y, { index, zIndex: index, ...options.customPositionOptions })
        : createPhyllotaxisPositionComponent(index, 0, 0, 400, 300);
      this.world.addComponent(entityId, positionComponent);

      // アニメーションコンポーネント（デフォルト）
      const animationComponent = createAnimationComponent(
        'fadeIn',
        options.animationDuration ?? 500,
        { isAnimating: options.withAnimation ?? false }
      );
      this.world.addComponent(entityId, animationComponent);

      return entityId;
    } catch (error) {
      // エラーが発生した場合はエンティティを削除
      this.world.destroyEntity(entityId);
      console.error('Failed to create idea entity:', error);
      return null;
    }
  }

  /**
   * 汎用エンティティ作成メソッド
   */
  createEntity(type: EntityType, content: string, options: CreateEntityOptions = {}): EntityId | null {
    switch (type) {
      case 'theme':
        return this.createThemeEntity(content, options);
      case 'idea':
        return this.createIdeaEntity(content, options);
      default:
        console.error(`Unknown entity type: ${type}`);
        return null;
    }
  }

  /**
   * エンティティを削除
   */
  destroyEntity(entityId: EntityId): boolean {
    return this.world.destroyEntity(entityId);
  }

  /**
   * エンティティをクローン
   */
  cloneEntity(sourceEntityId: EntityId, newContent?: string): EntityId | null {
    const entityType = this.typeManager.getEntityType(sourceEntityId);
    if (!entityType) {
      console.error('Cannot clone entity: unknown entity type');
      return null;
    }

    // 元のエンティティからコンポーネントを取得
    const textComponent = this.world.getComponent<ITextComponent>(sourceEntityId, 'text');
    const positionComponent = this.world.getComponent<IPositionComponent>(sourceEntityId, 'position');
    const visualComponent = this.world.getComponent<IVisualComponent>(sourceEntityId, 'visual');
    const animationComponent = this.world.getComponent<IAnimationComponent>(sourceEntityId, 'animation');

    if (!textComponent) {
      console.error('Cannot clone entity: missing text component');
      return null;
    }

    // クローン用のオプションを構築
    const options: CreateEntityOptions = {
      x: positionComponent?.x,
      y: positionComponent?.y,
      withAnimation: animationComponent?.isAnimating ?? false,
      animationDuration: animationComponent?.duration,
      customTextOptions: {
        fontSize: textComponent.fontSize,
        color: textComponent.color,
        fontWeight: textComponent.fontWeight,
        textAlign: textComponent.textAlign,
      },
      customVisualOptions: visualComponent ? {
        fillColor: visualComponent.fillColor,
        strokeColor: visualComponent.strokeColor,
        strokeWidth: visualComponent.strokeWidth,
        opacity: visualComponent.opacity,
        width: visualComponent.width,
        height: visualComponent.height,
        shape: visualComponent.shape,
      } : undefined,
    };

    return this.createEntity(entityType, newContent ?? textComponent.content, options);
  }

  /**
   * 複数のアイデアエンティティを一括作成
   */
  createIdeaEntitiesBatch(contents: string[]): EntityId[] {
    const createdEntities: EntityId[] = [];
    
    for (const content of contents) {
      const entityId = this.createIdeaEntity(content);
      if (entityId) {
        createdEntities.push(entityId);
      } else {
        // 制限に達した場合は処理を停止
        console.warn(`Batch creation stopped at ${createdEntities.length}/${contents.length} entities due to limits`);
        break;
      }
    }

    return createdEntities;
  }

  /**
   * 作成統計情報を取得
   */
  getCreationStatistics(): EntityTypeStatistics {
    return this.typeManager.getTypeStatistics();
  }
}