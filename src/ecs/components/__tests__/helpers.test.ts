/**
 * ECSコンポーネントヘルパー関数のテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  getPositionComponent,
  getTextComponent,
  getVisualComponent,
  getAnimationComponent,
  isThemeEntity,
  isIdeaEntity,
  getIdeaEntitiesSortedByIndex,
  getThemeEntity,
  getIdeaEntityByIndex,
  getNextAvailableIndex,
  hasRequiredComponents,
  getAnimatingEntities,
} from '../helpers';
import {
  createPositionComponent,
  createTextComponent,
  createVisualComponent,
  createAnimationComponent,
} from '../index';

// モックのWorld実装
const createMockWorld = () => {
  const entities = new Map();
  const components = new Map();

  return {
    getComponent: vi.fn((entityId: string, componentType: string) => {
      return components.get(`${entityId}:${componentType}`);
    }),
    hasComponent: vi.fn((entityId: string, componentType: string) => {
      return components.has(`${entityId}:${componentType}`);
    }),
    getAllEntities: vi.fn(() => Array.from(entities.keys())),
    // テスト用のヘルパーメソッド
    _addEntity: (entityId: string) => entities.set(entityId, true),
    _addComponent: (entityId: string, component: any) => {
      components.set(`${entityId}:${component.type}`, component);
    },
  };
};

describe('ECSコンポーネントヘルパー関数', () => {
  describe('コンポーネント取得関数', () => {
    it('getPositionComponent - 位置コンポーネントを取得できる', () => {
      const world = createMockWorld();
      const entityId = 'entity_1';
      const positionComponent = createPositionComponent(100, 200);

      world._addEntity(entityId);
      world._addComponent(entityId, positionComponent);

      const result = getPositionComponent(world as any, entityId);

      expect(result).toEqual(positionComponent);
      expect(world.getComponent).toHaveBeenCalledWith(entityId, ComponentTypes.POSITION);
    });

    it('getTextComponent - テキストコンポーネントを取得できる', () => {
      const world = createMockWorld();
      const entityId = 'entity_2';
      const textComponent = createTextComponent('テストテキスト', 'idea');

      world._addEntity(entityId);
      world._addComponent(entityId, textComponent);

      const result = getTextComponent(world as any, entityId);

      expect(result).toEqual(textComponent);
      expect(world.getComponent).toHaveBeenCalledWith(entityId, ComponentTypes.TEXT);
    });

    it('getVisualComponent - 視覚コンポーネントを取得できる', () => {
      const world = createMockWorld();
      const entityId = 'entity_3';
      const visualComponent = createVisualComponent('circle');

      world._addEntity(entityId);
      world._addComponent(entityId, visualComponent);

      const result = getVisualComponent(world as any, entityId);

      expect(result).toEqual(visualComponent);
      expect(world.getComponent).toHaveBeenCalledWith(entityId, ComponentTypes.VISUAL);
    });

    it('getAnimationComponent - アニメーションコンポーネントを取得できる', () => {
      const world = createMockWorld();
      const entityId = 'entity_4';
      const animationComponent = createAnimationComponent('fadeIn');

      world._addEntity(entityId);
      world._addComponent(entityId, animationComponent);

      const result = getAnimationComponent(world as any, entityId);

      expect(result).toEqual(animationComponent);
      expect(world.getComponent).toHaveBeenCalledWith(entityId, ComponentTypes.ANIMATION);
    });

    it('存在しないコンポーネントの場合はundefinedを返す', () => {
      const world = createMockWorld();
      const entityId = 'entity_5';

      world._addEntity(entityId);

      const result = getPositionComponent(world as any, entityId);

      expect(result).toBeUndefined();
    });

    it('間違った型のコンポーネントの場合はundefinedを返す', () => {
      const world = createMockWorld();
      const entityId = 'entity_6';
      const wrongComponent = { type: ComponentTypes.TEXT };

      world._addEntity(entityId);
      world._addComponent(entityId, wrongComponent);

      const result = getPositionComponent(world as any, entityId);

      expect(result).toBeUndefined();
    });
  });

  describe('エンティティタイプ判定', () => {
    it('isThemeEntity - テーマエンティティを正しく識別できる', () => {
      const world = createMockWorld();
      const entityId = 'theme_entity';
      const textComponent = createTextComponent('メインテーマ', 'theme');

      world._addEntity(entityId);
      world._addComponent(entityId, textComponent);

      const result = isThemeEntity(world as any, entityId);

      expect(result).toBe(true);
    });

    it('isIdeaEntity - アイデアエンティティを正しく識別できる', () => {
      const world = createMockWorld();
      const entityId = 'idea_entity';
      const textComponent = createTextComponent('アイデア内容', 'idea');

      world._addEntity(entityId);
      world._addComponent(entityId, textComponent);

      const result = isIdeaEntity(world as any, entityId);

      expect(result).toBe(true);
    });

    it('テキストコンポーネントがない場合はfalseを返す', () => {
      const world = createMockWorld();
      const entityId = 'no_text_entity';

      world._addEntity(entityId);

      const isTheme = isThemeEntity(world as any, entityId);
      const isIdea = isIdeaEntity(world as any, entityId);

      expect(isTheme).toBe(false);
      expect(isIdea).toBe(false);
    });
  });

  describe('エンティティ検索・管理', () => {
    it('getIdeaEntitiesSortedByIndex - アイデアエンティティをインデックス順で取得できる', () => {
      const world = createMockWorld();
      
      // 複数のアイデアエンティティを作成（順序をバラバラにする）
      const entities = [
        { id: 'idea_3', index: 2 },
        { id: 'idea_1', index: 0 },
        { id: 'idea_2', index: 1 },
      ];

      entities.forEach(({ id, index }) => {
        world._addEntity(id);
        world._addComponent(id, createTextComponent(`アイデア${index}`, 'idea'));
        world._addComponent(id, createPositionComponent(0, 0, { index }));
      });

      // テーマエンティティも追加（これは結果に含まれない）
      world._addEntity('theme_1');
      world._addComponent('theme_1', createTextComponent('テーマ', 'theme'));

      const result = getIdeaEntitiesSortedByIndex(world as any);

      expect(result).toEqual(['idea_1', 'idea_2', 'idea_3']);
    });

    it('getThemeEntity - テーマエンティティを取得できる', () => {
      const world = createMockWorld();
      const themeId = 'main_theme';
      const ideaId = 'some_idea';

      world._addEntity(themeId);
      world._addComponent(themeId, createTextComponent('メインテーマ', 'theme'));

      world._addEntity(ideaId);
      world._addComponent(ideaId, createTextComponent('アイデア', 'idea'));

      const result = getThemeEntity(world as any);

      expect(result).toBe(themeId);
    });

    it('getIdeaEntityByIndex - 指定インデックスのアイデアエンティティを取得できる', () => {
      const world = createMockWorld();
      const targetIndex = 5;
      const entityId = 'idea_target';

      world._addEntity(entityId);
      world._addComponent(entityId, createTextComponent('ターゲットアイデア', 'idea'));
      world._addComponent(entityId, createPositionComponent(0, 0, { index: targetIndex }));

      // 他のアイデアエンティティも追加
      world._addEntity('idea_other');
      world._addComponent('idea_other', createTextComponent('他のアイデア', 'idea'));
      world._addComponent('idea_other', createPositionComponent(0, 0, { index: 3 }));

      const result = getIdeaEntityByIndex(world as any, targetIndex);

      expect(result).toBe(entityId);
    });

    it('getNextAvailableIndex - 次に使用可能なインデックスを取得できる', () => {
      const world = createMockWorld();

      // インデックス0, 1, 2のアイデアエンティティを作成
      [0, 1, 2].forEach(index => {
        const entityId = `idea_${index}`;
        world._addEntity(entityId);
        world._addComponent(entityId, createTextComponent(`アイデア${index}`, 'idea'));
        world._addComponent(entityId, createPositionComponent(0, 0, { index }));
      });

      const result = getNextAvailableIndex(world as any);

      expect(result).toBe(3);
    });

    it('getNextAvailableIndex - アイデアエンティティがない場合は0を返す', () => {
      const world = createMockWorld();

      const result = getNextAvailableIndex(world as any);

      expect(result).toBe(0);
    });
  });

  describe('コンポーネント要件チェック', () => {
    it('hasRequiredComponents - 必要なコンポーネントを全て持っている場合はtrueを返す', () => {
      const world = createMockWorld();
      const entityId = 'complete_entity';

      world._addEntity(entityId);
      world._addComponent(entityId, createPositionComponent());
      world._addComponent(entityId, createTextComponent('テスト', 'idea'));

      const result = hasRequiredComponents(world as any, entityId, ['position', 'text']);

      expect(result).toBe(true);
    });

    it('hasRequiredComponents - 必要なコンポーネントが不足している場合はfalseを返す', () => {
      const world = createMockWorld();
      const entityId = 'incomplete_entity';

      world._addEntity(entityId);
      world._addComponent(entityId, createPositionComponent());
      // textコンポーネントは追加しない

      const result = hasRequiredComponents(world as any, entityId, ['position', 'text']);

      expect(result).toBe(false);
    });
  });

  describe('アニメーション管理', () => {
    it('getAnimatingEntities - アニメーション中のエンティティを取得できる', () => {
      const world = createMockWorld();

      // アニメーション中のエンティティ
      const animatingId = 'animating_entity';
      world._addEntity(animatingId);
      world._addComponent(animatingId, createAnimationComponent('fadeIn', 500, { isAnimating: true }));

      // アニメーション中でないエンティティ
      const staticId = 'static_entity';
      world._addEntity(staticId);
      world._addComponent(staticId, createAnimationComponent('fadeIn', 500, { isAnimating: false }));

      // アニメーションコンポーネントがないエンティティ
      const noAnimId = 'no_anim_entity';
      world._addEntity(noAnimId);

      const result = getAnimatingEntities(world as any);

      expect(result).toEqual([animatingId]);
    });

    it('getAnimatingEntities - アニメーション中のエンティティがない場合は空配列を返す', () => {
      const world = createMockWorld();

      const entityId = 'static_entity';
      world._addEntity(entityId);
      world._addComponent(entityId, createAnimationComponent('fadeIn', 500, { isAnimating: false }));

      const result = getAnimatingEntities(world as any);

      expect(result).toEqual([]);
    });
  });
});