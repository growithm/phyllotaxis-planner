/**
 * EntityManager.test.ts - EntityManagerのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@/ecs/core/World';
import { EntityManager, type EntityQuery } from '../EntityManager';
import { 
  createThemeTextComponent, 
  createIdeaTextComponent,
  createPositionComponent,
  createThemeVisualComponent,
  createIdeaVisualComponent,
  createAnimationComponent
} from '@/ecs/components';
import { getPositionComponent } from '@/ecs/components/helpers';
import { EventBusImpl } from '@/events/core/EventBusImpl';

describe('EntityManager', () => {
  let world: World;
  let entityManager: EntityManager;

  beforeEach(() => {
    const eventBus = new EventBusImpl();
    world = new World(eventBus);
    entityManager = new EntityManager(world);
  });

  describe('getFactory and getTypeManager', () => {
    it('should return factory and type manager instances', () => {
      const factory = entityManager.getFactory();
      const typeManager = entityManager.getTypeManager();

      expect(factory).toBeDefined();
      expect(typeManager).toBeDefined();
      expect(typeof factory.createThemeEntity).toBe('function');
      expect(typeof typeManager.getEntityType).toBe('function');
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // テストデータを準備
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Main Theme'));
      world.addComponent(themeId, createPositionComponent(400, 300, { index: -1 }));
      world.addComponent(themeId, createThemeVisualComponent());

      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('User Research'));
      world.addComponent(idea1Id, createPositionComponent(100, 200, { index: 0 }));
      world.addComponent(idea1Id, createIdeaVisualComponent());
      world.addComponent(idea1Id, createAnimationComponent('fadeIn', 500, { isAnimating: true }));

      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('Prototype'));
      world.addComponent(idea2Id, createPositionComponent(200, 150, { index: 1 }));
      world.addComponent(idea2Id, createIdeaVisualComponent());
      world.addComponent(idea2Id, createAnimationComponent('fadeIn', 500, { isAnimating: false }));
    });

    it('should filter by entity type', () => {
      const themeEntities = entityManager.query({ type: 'theme' });
      const ideaEntities = entityManager.query({ type: 'idea' });

      expect(themeEntities).toHaveLength(1);
      expect(ideaEntities).toHaveLength(2);
    });

    it('should filter by required components', () => {
      const entitiesWithAnimation = entityManager.query({ 
        hasComponents: ['animation'] 
      });

      expect(entitiesWithAnimation).toHaveLength(2); // アイデアエンティティのみ
    });

    it('should filter by text content', () => {
      const researchEntities = entityManager.query({ 
        textContains: 'Research' 
      });
      const userEntities = entityManager.query({ 
        textContains: 'user' // 大文字小文字を区別しない
      });

      expect(researchEntities).toHaveLength(1);
      expect(userEntities).toHaveLength(1);
    });

    it('should filter by index range', () => {
      const entitiesInRange = entityManager.query({
        indexRange: { min: 0, max: 1 }
      });

      expect(entitiesInRange).toHaveLength(2); // index 0と1のアイデア
    });

    it('should filter by animation state', () => {
      const animatingEntities = entityManager.query({ 
        isAnimating: true 
      });
      const nonAnimatingEntities = entityManager.query({ 
        isAnimating: false 
      });

      expect(animatingEntities).toHaveLength(1);
      expect(nonAnimatingEntities).toHaveLength(1);
    });

    it('should combine multiple filters', () => {
      const complexQuery: EntityQuery = {
        type: 'idea',
        hasComponents: ['animation'],
        isAnimating: true
      };

      const results = entityManager.query(complexQuery);
      expect(results).toHaveLength(1);
    });
  });

  describe('getIdeaEntitiesSorted', () => {
    it('should return idea entities sorted by index', () => {
      // インデックスが逆順になるようにエンティティを作成
      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('Idea 2'));
      world.addComponent(idea2Id, createPositionComponent(200, 150, { index: 2 }));

      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('Idea 1'));
      world.addComponent(idea1Id, createPositionComponent(100, 200, { index: 1 }));

      const idea0Id = world.createEntity();
      world.addComponent(idea0Id, createIdeaTextComponent('Idea 0'));
      world.addComponent(idea0Id, createPositionComponent(50, 100, { index: 0 }));

      const sortedEntities = entityManager.getIdeaEntitiesSorted();

      expect(sortedEntities).toHaveLength(3);
      
      // インデックス順にソートされているかチェック
      const positions = sortedEntities.map(entityId => 
        getPositionComponent(world, entityId)?.index
      );
      expect(positions).toEqual([0, 1, 2]);
    });
  });

  describe('getThemeEntity', () => {
    it('should return the theme entity', () => {
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Main Theme'));

      const foundTheme = entityManager.getThemeEntity();
      expect(foundTheme).toBe(themeId);
    });

    it('should return undefined when no theme exists', () => {
      const foundTheme = entityManager.getThemeEntity();
      expect(foundTheme).toBeUndefined();
    });
  });

  describe('getIdeaByIndex', () => {
    it('should return idea entity with specific index', () => {
      const ideaId = world.createEntity();
      world.addComponent(ideaId, createIdeaTextComponent('Test Idea'));
      world.addComponent(ideaId, createPositionComponent(100, 200, { index: 5 }));

      const foundIdea = entityManager.getIdeaByIndex(5);
      expect(foundIdea).toBe(ideaId);
    });

    it('should return undefined for non-existent index', () => {
      const foundIdea = entityManager.getIdeaByIndex(999);
      expect(foundIdea).toBeUndefined();
    });
  });

  describe('searchByText', () => {
    beforeEach(() => {
      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('User Research'));

      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('User Interface'));

      const idea3Id = world.createEntity();
      world.addComponent(idea3Id, createIdeaTextComponent('Database Design'));
    });

    it('should find entities containing search text', () => {
      const userEntities = entityManager.searchByText('User');
      const designEntities = entityManager.searchByText('Design');

      expect(userEntities).toHaveLength(2);
      expect(designEntities).toHaveLength(1);
    });

    it('should be case insensitive', () => {
      const results = entityManager.searchByText('user');
      expect(results).toHaveLength(2);
    });
  });

  describe('getAnimatingEntities', () => {
    it('should return only animating entities', () => {
      const animatingId = world.createEntity();
      world.addComponent(animatingId, createAnimationComponent('fadeIn', 500, { isAnimating: true }));

      const nonAnimatingId = world.createEntity();
      world.addComponent(nonAnimatingId, createAnimationComponent('fadeIn', 500, { isAnimating: false }));

      const animatingEntities = entityManager.getAnimatingEntities();
      expect(animatingEntities).toHaveLength(1);
      expect(animatingEntities[0]).toBe(animatingId);
    });
  });

  describe('reorderIdeaEntities', () => {
    it('should reorder idea entities with sequential indices', () => {
      // 非連続なインデックスでアイデアエンティティを作成
      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('Idea 1'));
      world.addComponent(idea1Id, createPositionComponent(100, 200, { index: 5 }));

      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('Idea 2'));
      world.addComponent(idea2Id, createPositionComponent(200, 150, { index: 10 }));

      const idea3Id = world.createEntity();
      world.addComponent(idea3Id, createIdeaTextComponent('Idea 3'));
      world.addComponent(idea3Id, createPositionComponent(300, 100, { index: 2 }));

      entityManager.reorderIdeaEntities();

      // 再整理後のインデックスをチェック
      const sortedEntities = entityManager.getIdeaEntitiesSorted();
      const indices = sortedEntities.map(entityId => 
        getPositionComponent(world, entityId)?.index
      );

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('moveEntityToIndex', () => {
    let entities: string[];

    beforeEach(() => {
      entities = [];
      // 5個のアイデアエンティティを作成
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createIdeaTextComponent(`Idea ${i}`));
        world.addComponent(entityId, createPositionComponent(100 * i, 200, { index: i }));
        entities.push(entityId);
      }
    });

    it('should move entity to new index and adjust others', () => {
      // インデックス4のエンティティをインデックス1に移動
      const success = entityManager.moveEntityToIndex(entities[4], 1);
      expect(success).toBe(true);

      const sortedEntities = entityManager.getIdeaEntitiesSorted();
      const indices = sortedEntities.map(entityId => 
        getPositionComponent(world, entityId)?.index
      );

      // 期待される順序: [0, 4, 1, 2, 3] (元のインデックス順)
      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });

    it('should return true when entity is already at target index', () => {
      const success = entityManager.moveEntityToIndex(entities[2], 2);
      expect(success).toBe(true);
    });

    it('should return false for entity without position component', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createIdeaTextComponent('No Position'));

      const success = entityManager.moveEntityToIndex(entityId, 0);
      expect(success).toBe(false);
    });
  });

  describe('removeEntityAndReorder', () => {
    it('should remove entity and reorder remaining entities', () => {
      // 3個のアイデアエンティティを作成
      const entities = [];
      for (let i = 0; i < 3; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createIdeaTextComponent(`Idea ${i}`));
        world.addComponent(entityId, createPositionComponent(100 * i, 200, { index: i }));
        entities.push(entityId);
      }

      // 中間のエンティティを削除
      const success = entityManager.removeEntityAndReorder(entities[1]);
      expect(success).toBe(true);

      // エンティティが削除されていることを確認
      expect(world.hasEntity(entities[1])).toBe(false);

      // 残りのエンティティが再整理されていることを確認
      const remainingEntities = entityManager.getIdeaEntitiesSorted();
      expect(remainingEntities).toHaveLength(2);

      const indices = remainingEntities.map(entityId => 
        getPositionComponent(world, entityId)?.index
      );
      expect(indices).toEqual([0, 1]);
    });
  });

  describe('getStatistics', () => {
    it('should return comprehensive statistics', () => {
      // テストデータを作成
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));
      world.addComponent(themeId, createPositionComponent(400, 300));
      world.addComponent(themeId, createThemeVisualComponent());

      const ideaId = world.createEntity();
      world.addComponent(ideaId, createIdeaTextComponent('Idea'));
      world.addComponent(ideaId, createPositionComponent(100, 200));
      world.addComponent(ideaId, createIdeaVisualComponent());
      world.addComponent(ideaId, createAnimationComponent('fadeIn', 500, { isAnimating: true }));

      const statistics = entityManager.getStatistics();

      expect(statistics.total).toBe(2);
      expect(statistics.byType.theme.count).toBe(1);
      expect(statistics.byType.idea.count).toBe(1);
      expect(statistics.animating).toBe(1);
      expect(statistics.performance.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('validateAllEntities', () => {
    it('should validate entities with complete components', () => {
      const themeId = world.createEntity();
      world.addComponent(themeId, createThemeTextComponent('Theme'));
      world.addComponent(themeId, createPositionComponent(400, 300));
      world.addComponent(themeId, createThemeVisualComponent());

      const validation = entityManager.validateAllEntities();

      expect(validation.valid).toContain(themeId);
      expect(validation.invalid).toHaveLength(0);
    });

    it('should detect entities with missing components', () => {
      const incompleteId = world.createEntity();
      world.addComponent(incompleteId, createThemeTextComponent('Incomplete'));
      // position と visual コンポーネントが不足

      const validation = entityManager.validateAllEntities();

      expect(validation.valid).toHaveLength(0);
      expect(validation.invalid).toHaveLength(1);
      expect(validation.invalid[0].entityId).toBe(incompleteId);
      expect(validation.invalid[0].issues).toContain('Missing required components: position, visual');
    });

    it('should detect duplicate indices', () => {
      // 同じインデックスを持つ2つのアイデアエンティティを作成
      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('Idea 1'));
      world.addComponent(idea1Id, createPositionComponent(100, 200, { index: 0 }));
      world.addComponent(idea1Id, createIdeaVisualComponent());

      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('Idea 2'));
      world.addComponent(idea2Id, createPositionComponent(200, 150, { index: 0 })); // 重複インデックス
      world.addComponent(idea2Id, createIdeaVisualComponent());

      const validation = entityManager.validateAllEntities();

      expect(validation.invalid).toHaveLength(2);
      validation.invalid.forEach(invalid => {
        expect(invalid.issues).toContain('Duplicate index: 0');
      });
    });
  });

  describe('repairEntities', () => {
    it('should repair duplicate indices', () => {
      // 重複インデックスを持つエンティティを作成
      const idea1Id = world.createEntity();
      world.addComponent(idea1Id, createIdeaTextComponent('Idea 1'));
      world.addComponent(idea1Id, createPositionComponent(100, 200, { index: 0 }));
      world.addComponent(idea1Id, createIdeaVisualComponent());

      const idea2Id = world.createEntity();
      world.addComponent(idea2Id, createIdeaTextComponent('Idea 2'));
      world.addComponent(idea2Id, createPositionComponent(200, 150, { index: 0 }));
      world.addComponent(idea2Id, createIdeaVisualComponent());

      const repairedCount = entityManager.repairEntities();

      expect(repairedCount).toBeGreaterThan(0);

      // 修復後の検証
      const validation = entityManager.validateAllEntities();
      const duplicateIssues = validation.invalid.filter(invalid =>
        invalid.issues.some(issue => issue.includes('Duplicate index'))
      );
      expect(duplicateIssues).toHaveLength(0);
    });
  });
});