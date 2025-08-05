/**
 * EntityFactory.test.ts - EntityFactoryのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@/ecs/core/World';
import { EntityFactory, type CreateEntityOptions } from '../EntityFactory';
import { ComponentTypes } from '@/ecs/core/Component';
import { 
  getTextComponent, 
  getPositionComponent, 
  getAnimationComponent 
} from '@/ecs/components/helpers';

describe('EntityFactory', () => {
  let world: World;
  let factory: EntityFactory;

  beforeEach(() => {
    world = new World();
    factory = new EntityFactory(world);
  });

  describe('createThemeEntity', () => {
    it('should create theme entity with required components', () => {
      const entityId = factory.createThemeEntity('Test Theme');

      expect(entityId).not.toBeNull();
      expect(world.hasEntity(entityId!)).toBe(true);

      // 必須コンポーネントの確認
      expect(world.hasComponent(entityId!, ComponentTypes.TEXT)).toBe(true);
      expect(world.hasComponent(entityId!, ComponentTypes.POSITION)).toBe(true);
      expect(world.hasComponent(entityId!, ComponentTypes.VISUAL)).toBe(true);

      // テキストコンポーネントの内容確認
      const textComponent = getTextComponent(world, entityId!);
      expect(textComponent?.content).toBe('Test Theme');
      expect(textComponent?.entityType).toBe('theme');
    });

    it('should create theme entity with custom position', () => {
      const options: CreateEntityOptions = {
        x: 500,
        y: 400
      };

      const entityId = factory.createThemeEntity('Test Theme', options);
      const positionComponent = getPositionComponent(world, entityId!);

      expect(positionComponent?.x).toBe(500);
      expect(positionComponent?.y).toBe(400);
      expect(positionComponent?.index).toBe(-1); // テーマは特別なインデックス
      expect(positionComponent?.zIndex).toBe(1000); // 高いz-index
    });

    it('should create theme entity with animation when requested', () => {
      const options: CreateEntityOptions = {
        withAnimation: true,
        animationDuration: 800
      };

      const entityId = factory.createThemeEntity('Test Theme', options);
      
      expect(world.hasComponent(entityId!, ComponentTypes.ANIMATION)).toBe(true);
      
      const animationComponent = getAnimationComponent(world, entityId!);
      expect(animationComponent?.isAnimating).toBe(true);
      expect(animationComponent?.duration).toBe(800);
    });

    it('should not create second theme entity due to limit', () => {
      // 最初のテーマエンティティを作成
      const firstTheme = factory.createThemeEntity('First Theme');
      expect(firstTheme).not.toBeNull();

      // 2番目のテーマエンティティは作成できない
      const secondTheme = factory.createThemeEntity('Second Theme');
      expect(secondTheme).toBeNull();
    });

    it('should use default position when not specified', () => {
      const entityId = factory.createThemeEntity('Test Theme');
      const positionComponent = getPositionComponent(world, entityId!);

      expect(positionComponent?.x).toBe(400); // デフォルト中心X
      expect(positionComponent?.y).toBe(300); // デフォルト中心Y
    });
  });

  describe('createIdeaEntity', () => {
    it('should create idea entity with required components', () => {
      const entityId = factory.createIdeaEntity('Test Idea');

      expect(entityId).not.toBeNull();
      expect(world.hasEntity(entityId!)).toBe(true);

      // 必須コンポーネントの確認
      expect(world.hasComponent(entityId!, ComponentTypes.TEXT)).toBe(true);
      expect(world.hasComponent(entityId!, ComponentTypes.POSITION)).toBe(true);
      expect(world.hasComponent(entityId!, ComponentTypes.VISUAL)).toBe(true);
      expect(world.hasComponent(entityId!, ComponentTypes.ANIMATION)).toBe(true);

      // テキストコンポーネントの内容確認
      const textComponent = getTextComponent(world, entityId!);
      expect(textComponent?.content).toBe('Test Idea');
      expect(textComponent?.entityType).toBe('idea');
    });

    it('should assign sequential indices to idea entities', () => {
      const idea1 = factory.createIdeaEntity('Idea 1');
      const idea2 = factory.createIdeaEntity('Idea 2');
      const idea3 = factory.createIdeaEntity('Idea 3');

      const pos1 = getPositionComponent(world, idea1!);
      const pos2 = getPositionComponent(world, idea2!);
      const pos3 = getPositionComponent(world, idea3!);

      expect(pos1?.index).toBe(0);
      expect(pos2?.index).toBe(1);
      expect(pos3?.index).toBe(2);
    });

    it('should use custom position when specified', () => {
      const options: CreateEntityOptions = {
        x: 200,
        y: 150
      };

      const entityId = factory.createIdeaEntity('Test Idea', options);
      const positionComponent = getPositionComponent(world, entityId!);

      expect(positionComponent?.x).toBe(200);
      expect(positionComponent?.y).toBe(150);
    });

    it('should create idea entity with animation disabled by default', () => {
      const entityId = factory.createIdeaEntity('Test Idea');
      const animationComponent = getAnimationComponent(world, entityId!);

      expect(animationComponent?.isAnimating).toBe(false);
    });

    it('should create idea entity with animation when requested', () => {
      const options: CreateEntityOptions = {
        withAnimation: true,
        animationDuration: 600
      };

      const entityId = factory.createIdeaEntity('Test Idea', options);
      const animationComponent = getAnimationComponent(world, entityId!);

      expect(animationComponent?.isAnimating).toBe(true);
      expect(animationComponent?.duration).toBe(600);
    });

    it('should not create idea entities beyond limit', () => {
      const createdEntities = [];

      // 50個のアイデアエンティティを作成
      for (let i = 0; i < 50; i++) {
        const entityId = factory.createIdeaEntity(`Idea ${i}`);
        expect(entityId).not.toBeNull();
        createdEntities.push(entityId);
      }

      // 51番目は作成できない
      const extraEntity = factory.createIdeaEntity('Extra Idea');
      expect(extraEntity).toBeNull();
    });
  });

  describe('createEntity', () => {
    it('should create theme entity when type is theme', () => {
      const entityId = factory.createEntity('theme', 'Test Theme');
      
      expect(entityId).not.toBeNull();
      const textComponent = getTextComponent(world, entityId!);
      expect(textComponent?.entityType).toBe('theme');
    });

    it('should create idea entity when type is idea', () => {
      const entityId = factory.createEntity('idea', 'Test Idea');
      
      expect(entityId).not.toBeNull();
      const textComponent = getTextComponent(world, entityId!);
      expect(textComponent?.entityType).toBe('idea');
    });

    it('should return null for unknown entity type', () => {
      const entityId = factory.createEntity('unknown' as 'theme' | 'idea', 'Test');
      expect(entityId).toBeNull();
    });
  });

  describe('destroyEntity', () => {
    it('should successfully destroy existing entity', () => {
      const entityId = factory.createIdeaEntity('Test Idea');
      expect(world.hasEntity(entityId!)).toBe(true);

      const success = factory.destroyEntity(entityId!);
      expect(success).toBe(true);
      expect(world.hasEntity(entityId!)).toBe(false);
    });

    it('should return false for non-existent entity', () => {
      const success = factory.destroyEntity('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('cloneEntity', () => {
    it('should clone idea entity with same properties', () => {
      const originalId = factory.createIdeaEntity('Original Idea', {
        x: 500,
        y: 400,
        withAnimation: true
      });

      const clonedId = factory.cloneEntity(originalId!);
      expect(clonedId).not.toBeNull();
      expect(clonedId).not.toBe(originalId);

      // 元のエンティティとクローンの比較
      const originalText = getTextComponent(world, originalId!);
      const clonedText = getTextComponent(world, clonedId!);
      
      expect(clonedText?.content).toBe(originalText?.content);
      expect(clonedText?.entityType).toBe(originalText?.entityType);

      const originalPos = getPositionComponent(world, originalId!);
      const clonedPos = getPositionComponent(world, clonedId!);
      
      expect(clonedPos?.x).toBe(originalPos?.x);
      expect(clonedPos?.y).toBe(originalPos?.y);
    });

    it('should clone entity with new content', () => {
      const originalId = factory.createIdeaEntity('Original Idea');
      const clonedId = factory.cloneEntity(originalId!, 'Cloned Idea');

      const clonedText = getTextComponent(world, clonedId!);
      expect(clonedText?.content).toBe('Cloned Idea');
    });

    it('should return null when cloning non-existent entity', () => {
      const clonedId = factory.cloneEntity('non-existent-id');
      expect(clonedId).toBeNull();
    });

    it('should return null when cloning entity without text component', () => {
      const entityId = world.createEntity();
      // テキストコンポーネントを追加しない

      const clonedId = factory.cloneEntity(entityId);
      expect(clonedId).toBeNull();
    });
  });

  describe('createIdeaEntitiesBatch', () => {
    it('should create multiple idea entities', () => {
      const contents = ['Idea 1', 'Idea 2', 'Idea 3'];
      const entityIds = factory.createIdeaEntitiesBatch(contents);

      expect(entityIds).toHaveLength(3);
      entityIds.forEach((entityId, index) => {
        expect(world.hasEntity(entityId)).toBe(true);
        const textComponent = getTextComponent(world, entityId);
        expect(textComponent?.content).toBe(contents[index]);
      });
    });

    it('should stop creation when limit is reached', () => {
      // 48個のアイデアを事前に作成（制限は50個）
      for (let i = 0; i < 48; i++) {
        factory.createIdeaEntity(`Pre-existing ${i}`);
      }

      // 5個のアイデアを一括作成しようとする（2個しか作成できない）
      const contents = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5'];
      const entityIds = factory.createIdeaEntitiesBatch(contents);

      expect(entityIds).toHaveLength(2); // 制限により2個のみ作成
    });

    it('should handle empty array', () => {
      const entityIds = factory.createIdeaEntitiesBatch([]);
      expect(entityIds).toHaveLength(0);
    });
  });

  describe('getCreationStatistics', () => {
    it('should return correct statistics', () => {
      // テーマエンティティを1個作成
      factory.createThemeEntity('Theme');
      
      // アイデアエンティティを3個作成
      factory.createIdeaEntity('Idea 1');
      factory.createIdeaEntity('Idea 2');
      factory.createIdeaEntity('Idea 3');

      const statistics = factory.getCreationStatistics();

      expect(statistics.theme.count).toBe(1);
      expect(statistics.theme.maxCount).toBe(1);
      expect(statistics.theme.canCreate).toBe(false);

      expect(statistics.idea.count).toBe(3);
      expect(statistics.idea.maxCount).toBe(50);
      expect(statistics.idea.canCreate).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle component creation errors gracefully', () => {
      // 無効なコンテンツでエンティティ作成を試行
      const entityId = factory.createThemeEntity('');
      
      // エラーが発生してもnullが返される（例外は発生しない）
      expect(entityId).not.toBeNull(); // 空文字列でも作成は成功する
    });
  });

  describe('getTypeManager', () => {
    it('should return the type manager instance', () => {
      const typeManager = factory.getTypeManager();
      expect(typeManager).toBeDefined();
      expect(typeof typeManager.getEntityType).toBe('function');
    });
  });
});