/**
 * アイデアブループリント - アイデアエンティティ作成のテンプレート
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import type { ITextComponent, IVisualComponent, IPositionComponent, IAnimationComponent } from '@/ecs/components';
import {
  createIdeaTextComponent,
  createIdeaVisualComponent,
  createPositionComponent,
  createPhyllotaxisPositionComponent,
  createAnimationComponent,
} from '@/ecs/components';
import { getNextAvailableIndex } from '@/ecs/components/helpers';
import { EntityBlueprint, type CreateEntityOptions } from './EntityBlueprint';

/**
 * アイデアエンティティ作成用のブループリント
 */
export class IdeaBlueprint extends EntityBlueprint {
  readonly name = 'idea';
  readonly description = 'Creates an idea entity with text, position, visual, and animation components';
  readonly requiredComponents = [ComponentTypes.TEXT, ComponentTypes.POSITION, ComponentTypes.VISUAL];
  readonly optionalComponents = [ComponentTypes.ANIMATION];

  /**
   * アイデアエンティティを作成
   * 
   * @param world - Worldインスタンス
   * @param text - アイデアのテキスト内容
   * @param options - 作成オプション
   * @returns 作成されたエンティティID
   */
  create(world: IWorld, text: string, options: CreateEntityOptions = {}): EntityId {
    this.beforeCreate(world, text, options);

    if (!this.validate(world, text, options)) {
      throw new Error('Idea blueprint validation failed');
    }

    const entityId = world.createEntity();

    try {
      // テキストコンポーネント
      const textComponent = createIdeaTextComponent(text, options.customTextOptions);
      world.addComponent(entityId, textComponent);

      // 位置コンポーネント
      const index = getNextAvailableIndex(world);
      const positionComponent = (options.x !== undefined && options.y !== undefined)
        ? createPositionComponent(options.x, options.y, { index, zIndex: index, ...options.customPositionOptions })
        : createPhyllotaxisPositionComponent(index, 0, 0, 400, 300);
      world.addComponent(entityId, positionComponent);

      // 視覚コンポーネント
      const visualComponent = createIdeaVisualComponent(options.customVisualOptions);
      world.addComponent(entityId, visualComponent);

      // アニメーションコンポーネント（オプション）
      if (options.withAnimation) {
        const animationComponent = createAnimationComponent(
          'fadeIn',
          options.animationDuration ?? 500,
          { isAnimating: true }
        );
        world.addComponent(entityId, animationComponent);
      }

      this.afterCreate(world, entityId, text, options);
      return entityId;

    } catch (error) {
      world.destroyEntity(entityId);
      throw error;
    }
  }

  /**
   * アイデア作成前のバリデーション
   * 
   * @param world - Worldインスタンス
   * @param text - アイデアのテキスト内容
   * @param options - 作成オプション
   * @returns バリデーション結果
   */
  validate(world: IWorld, text: string, options: CreateEntityOptions = {}): boolean {
    // 空のテキストチェック
    if (!text || text.trim().length === 0) {
      console.warn('[IdeaBlueprint] Validation failed: empty text');
      return false;
    }

    // 文字数制限チェック
    if (text.length > 100) {
      console.warn('[IdeaBlueprint] Validation failed: text too long (max 100 characters)');
      return false;
    }

    // 座標の妥当性チェック
    if (options.x !== undefined && (options.x < 0 || options.x > 2000)) {
      console.warn('[IdeaBlueprint] Validation failed: invalid x coordinate');
      return false;
    }

    if (options.y !== undefined && (options.y < 0 || options.y > 2000)) {
      console.warn('[IdeaBlueprint] Validation failed: invalid y coordinate');
      return false;
    }

    // アニメーション時間の妥当性チェック
    if (options.animationDuration !== undefined && options.animationDuration < 0) {
      console.warn('[IdeaBlueprint] Validation failed: invalid animation duration');
      return false;
    }

    return true;
  }

  /**
   * アイデア作成前の処理
   */
  beforeCreate(world: IWorld, text: string, options: CreateEntityOptions = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[IdeaBlueprint] Creating idea entity with text: "${text}"`);
    }
  }

  /**
   * アイデア作成後の処理
   */
  afterCreate(world: IWorld, entityId: EntityId, text: string, options: CreateEntityOptions = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[IdeaBlueprint] Created idea entity with ID: ${entityId}`);
    }

    // 作成統計の更新（将来的に実装）
    // this.updateCreationStats();
  }
}