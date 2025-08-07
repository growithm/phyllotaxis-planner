/**
 * テーマブループリント - テーマエンティティ作成のテンプレート
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import type { ITextComponent, IVisualComponent, IPositionComponent, IAnimationComponent } from '@/ecs/components';
import {
  createThemeTextComponent,
  createThemeVisualComponent,
  createPositionComponent,
  createAnimationComponent,
} from '@/ecs/components';
import { EntityBlueprint, type CreateEntityOptions } from './EntityBlueprint';

/**
 * テーマエンティティ作成用のブループリント
 */
export class ThemeBlueprint extends EntityBlueprint {
  readonly name = 'theme';
  readonly description = 'Creates a theme entity with text, position, and visual components';
  readonly requiredComponents = [ComponentTypes.TEXT, ComponentTypes.POSITION, ComponentTypes.VISUAL];
  readonly optionalComponents = [ComponentTypes.ANIMATION];

  /**
   * テーマエンティティを作成
   * 
   * @param world - Worldインスタンス
   * @param content - テーマのテキスト内容
   * @param options - 作成オプション
   * @returns 作成されたエンティティID
   */
  create(world: IWorld, content: string, options: CreateEntityOptions = {}): EntityId {
    this.beforeCreate(world, content, options);

    if (!this.validate(world, content, options)) {
      throw new Error('Theme blueprint validation failed');
    }

    const entityId = world.createEntity();

    try {
      // テキストコンポーネント
      const textComponent = createThemeTextComponent(content, options.customTextOptions);
      world.addComponent(entityId, textComponent);

      // 位置コンポーネント（中心位置）
      const positionComponent = createPositionComponent(
        options.x ?? 400, // デフォルト中心X
        options.y ?? 300, // デフォルト中心Y
        { index: -1, zIndex: 1000, ...options.customPositionOptions }
      );
      world.addComponent(entityId, positionComponent);

      // 視覚コンポーネント
      const visualComponent = createThemeVisualComponent(options.customVisualOptions);
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

      this.afterCreate(world, entityId, content, options);
      return entityId;

    } catch (error) {
      world.destroyEntity(entityId);
      throw error;
    }
  }

  /**
   * テーマ作成前のバリデーション
   * 
   * @param world - Worldインスタンス
   * @param content - テーマのテキスト内容
   * @param options - 作成オプション
   * @returns バリデーション結果
   */
  validate(world: IWorld, content: string, options: CreateEntityOptions = {}): boolean {
    // 空のテキストチェック
    if (!content || content.trim().length === 0) {
      console.warn('[ThemeBlueprint] Validation failed: empty content');
      return false;
    }

    // 文字数制限チェック（テーマは短めに）
    if (content.length > 50) {
      console.warn('[ThemeBlueprint] Validation failed: content too long (max 50 characters)');
      return false;
    }

    // 座標の妥当性チェック
    if (options.x !== undefined && (options.x < 0 || options.x > 2000)) {
      console.warn('[ThemeBlueprint] Validation failed: invalid x coordinate');
      return false;
    }

    if (options.y !== undefined && (options.y < 0 || options.y > 2000)) {
      console.warn('[ThemeBlueprint] Validation failed: invalid y coordinate');
      return false;
    }

    // アニメーション時間の妥当性チェック
    if (options.animationDuration !== undefined && options.animationDuration < 0) {
      console.warn('[ThemeBlueprint] Validation failed: invalid animation duration');
      return false;
    }

    // 既存のテーマエンティティチェック（1つまで）
    // 注意: getEntitiesWithComponentsメソッドはWorldインターフェースに存在しないため、
    // 実際の実装では別の方法でチェックする必要がある
    // 現在はバリデーションをスキップ
    // TODO: 適切なクエリメソッドが利用可能になったら実装する

    return true;
  }

  /**
   * テーマ作成前の処理
   */
  beforeCreate(world: IWorld, content: string, options: CreateEntityOptions = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ThemeBlueprint] Creating theme entity with content: "${content}"`);
    }
  }

  /**
   * テーマ作成後の処理
   */
  afterCreate(world: IWorld, entityId: EntityId, content: string, options: CreateEntityOptions = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ThemeBlueprint] Created theme entity with ID: ${entityId}`);
    }

    // 作成統計の更新（将来的に実装）
    // this.updateCreationStats();
  }
}