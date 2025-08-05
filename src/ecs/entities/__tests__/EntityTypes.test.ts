/**
 * EntityTypes.test.ts - EntityTypeManagerのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@/ecs/core/World';
import { 
  EntityTypeManager, 
  ENTITY_TYPE_CONFIG
} from '../EntityTypes';
import { 
  createThemeTextComponent, 
  createIdeaTextComponent,
  createPositionComponent,
  createThemeVisualComponent 
} from '@/ecs/components';

describe('ENTITY_TYPE_CONFIG', () => {
  it('should have correct configuration for theme entities', () => {
    const themeConfig = ENTITY_TYPE_CONFIG.theme;
    
    expect(themeConfig.type).toBe('theme');
    expect(themeConfig.displayName).toBe('中心テーマ');
    expect(themeConfig.maxCount).toBe(1);
    expect(themeConfig.requiredComponents).toEqual(['position', 'text', 'visual']);
    expect(themeConfig.optionalComponents).toEqual(['animation']);
  });

  it('should have correct configuration for idea entities', () => {
    const ideaConfig = ENTITY_TYPE_CONFIG.idea;
    
    expect(ideaConfig.type).toBe('idea');
    expect(ideaConfig.displayName).toBe('アイデア');
    expect(ideaConfig.maxCount).toBe(50);
    expect(ideaConfig.requiredComponents).toEqual(['position', 'text', 'visual']);
    expect(ideaConfig.optionalComponents).toEqual(['animation']);
  });
});

describe('EntityTypeManager', () => {
  let world: World;
  let typeManager: EntityTypeManager;

  beforeEach(() => {
    world = new World();
    typeManager = new EntityTypeManager(world);
  });

  describe('getEntityType', () => {
    it('should return theme type for theme entities', () => {
      const entityId = world.createEntity();
      const textComponent = createThemeTextComponent('Test Theme');
      world.addComponent(entityId, textComponent);

      const entityType = typeManager.getEntityType(entityId);
      expect(entityType).toBe('theme');
    });

    it('should return idea type for idea entities', () => {
      const entityId = world.createEntity();
      const textComponent = createIdeaTextComponent('Test Idea');
      world.addComponent(entityId, textComponent);

      const entityType = typeManager.getEntityType(entityId);
      expect(entityType).toBe('idea');
    });

    it('should return undefined for entities without text component', () => {
      const entityId = world.createEntity();
      const positionComponent = createPositionComponent(100, 200);
      world.addComponent(entityId, positionComponent);

      const entityType = typeManager.getEntityType(entityId);
      expect(entityType).toBeUndefined();
    });

    it('should use cache for repeated calls', () => {
      const entityId = world.createEntity();
      const textComponent = createThemeTextComponent('Test Theme');
      world.addComponent(entityId, textComponent);

      // 最初の呼び出し
      const firstCall = typeManager.getEntityType(entityId);
      // 2回目の呼び出し（キャッシュから取得）
      const secondCall = typeManager.getEntityType(entityId);

      expect(firstCall).toBe('theme');
      expect(secondCall).toBe('theme');
    });
  });

  describe('isThemeEntity and isIdeaEntity', () => {
    it('should correctly identify theme entities', () => {
      const entityId = world.createEntity();
      const textComponent = createThemeTextComponent('Test Theme');
      world.addComponent(entityId, textComponent);

      expect(typeManager.isThemeEntity(entityId)).toBe(true);
      expect(typeManager.isIdeaEntity(entityId)).toBe(false);
    });

    it('should correctly identify idea entities', () => {
      const entityId = world.createEntity();
      const textComponent = createIdeaTextComponent('Test Idea');
      world.addComponent(entityId, textComponent);

      expect(typeManager.isThemeEntity(entityId)).toBe(false);
      expect(typeManager.isIdeaEntity(entityId)).toBe(true);
    });
  });

  describe('getEntitiesByType', () => {
    it('should return entities of specified type', () => {
      // テーマエンティティを作成
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));

      // アイデアエンティティを作成
      const ideaId1 = world.createEntity();
      world.addComponent(ideaId1, createIdeaTextComponent('Idea 1'));
      
      const ideaId2 = world.createEntity();
      world.addComponent(ideaId2, createIdeaTextComponent('Idea 2'));

      const themeEntities = typeManager.getEntitiesByType('theme');
      const ideaEntities = typeManager.getEntitiesByType('idea');

      expect(themeEntities).toHaveLength(1);
      expect(themeEntities[0]).toBe(themeId);
      
      expect(ideaEntities).toHaveLength(2);
      expect(ideaEntities).toContain(ideaId1);
      expect(ideaEntities).toContain(ideaId2);
    });
  });

  describe('getEntityCount', () => {
    it('should return correct count for each entity type', () => {
      // 初期状態
      expect(typeManager.getEntityCount('theme')).toBe(0);
      expect(typeManager.getEntityCount('idea')).toBe(0);

      // テーマエンティティを追加
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));

      expect(typeManager.getEntityCount('theme')).toBe(1);
      expect(typeManager.getEntityCount('idea')).toBe(0);

      // アイデアエンティティを追加
      const ideaId = world.createEntity();
      world.addComponent(ideaId, createIdeaTextComponent('Idea'));

      expect(typeManager.getEntityCount('theme')).toBe(1);
      expect(typeManager.getEntityCount('idea')).toBe(1);
    });
  });

  describe('canCreateEntity', () => {
    it('should allow creating theme entity when none exists', () => {
      expect(typeManager.canCreateEntity('theme')).toBe(true);
    });

    it('should not allow creating second theme entity', () => {
      // 最初のテーマエンティティを作成
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));

      expect(typeManager.canCreateEntity('theme')).toBe(false);
    });

    it('should allow creating idea entities up to limit', () => {
      expect(typeManager.canCreateEntity('idea')).toBe(true);

      // 50個のアイデアエンティティを作成
      for (let i = 0; i < 50; i++) {
        const ideaId = world.createEntity();
        world.addComponent(ideaId, createIdeaTextComponent(`Idea ${i}`));
      }

      expect(typeManager.canCreateEntity('idea')).toBe(false);
    });
  });

  describe('getTypeConstraints', () => {
    it('should return correct constraints for theme type', () => {
      const constraints = typeManager.getTypeConstraints('theme');

      expect(constraints.maxCount).toBe(1);
      expect(constraints.currentCount).toBe(0);
      expect(constraints.canCreate).toBe(true);
      expect(constraints.remaining).toBe(1);
    });

    it('should update constraints when entities are added', () => {
      // テーマエンティティを追加
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));

      const constraints = typeManager.getTypeConstraints('theme');

      expect(constraints.currentCount).toBe(1);
      expect(constraints.canCreate).toBe(false);
      expect(constraints.remaining).toBe(0);
    });
  });

  describe('validateEntityComponents', () => {
    it('should validate entity with all required components', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createThemeTextComponent('Theme'));
      world.addComponent(entityId, createPositionComponent(100, 200));
      world.addComponent(entityId, createThemeVisualComponent());

      const validation = typeManager.validateEntityComponents(entityId);

      expect(validation.isValid).toBe(true);
      expect(validation.missingRequired).toHaveLength(0);
    });

    it('should detect missing required components', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createThemeTextComponent('Theme'));
      // position と visual コンポーネントが不足

      const validation = typeManager.validateEntityComponents(entityId);

      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('position');
      expect(validation.missingRequired).toContain('visual');
    });

    it('should handle entities without text component', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(100, 200));

      const validation = typeManager.validateEntityComponents(entityId);

      expect(validation.isValid).toBe(false);
      expect(validation.missingRequired).toContain('text');
    });
  });

  describe('getTypeStatistics', () => {
    it('should return correct statistics', () => {
      // テーマエンティティを追加
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));

      // アイデアエンティティを2個追加
      for (let i = 0; i < 2; i++) {
        const ideaId = world.createEntity();
        world.addComponent(ideaId, createIdeaTextComponent(`Idea ${i}`));
      }

      const statistics = typeManager.getTypeStatistics();

      expect(statistics.theme.count).toBe(1);
      expect(statistics.theme.maxCount).toBe(1);
      expect(statistics.theme.percentage).toBe(100);
      expect(statistics.theme.canCreate).toBe(false);

      expect(statistics.idea.count).toBe(2);
      expect(statistics.idea.maxCount).toBe(50);
      expect(statistics.idea.percentage).toBe(4);
      expect(statistics.idea.canCreate).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache when world version changes', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createThemeTextComponent('Theme'));

      // 最初の呼び出し（キャッシュに保存）
      const firstCall = typeManager.getEntityType(entityId);
      expect(firstCall).toBe('theme');

      // Worldの状態を変更（バージョンが変わる）
      const newEntityId = world.createEntity();
      world.addComponent(newEntityId, createIdeaTextComponent('Idea'));

      // キャッシュが無効化されているかテスト
      const secondCall = typeManager.getEntityType(entityId);
      expect(secondCall).toBe('theme');
    });

    it('should manually invalidate cache', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createThemeTextComponent('Theme'));

      typeManager.getEntityType(entityId); // キャッシュに保存
      typeManager.invalidateCache(); // 手動でキャッシュを無効化

      const result = typeManager.getEntityType(entityId);
      expect(result).toBe('theme');
    });
  });
});