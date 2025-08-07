/**
 * World ブループリント統合テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import type { EventBus } from '@/events/core/EventBus';
import { EntityBlueprint } from '../EntityBlueprint';
import { IdeaBlueprint } from '../IdeaBlueprint';
import { ThemeBlueprint } from '../ThemeBlueprint';
import { ComponentTypes } from '@/ecs/core/Component';
import type { EntityId } from '@/ecs/core/Entity';

// テスト用のカスタムブループリント
class TestBlueprint extends EntityBlueprint {
  readonly name = 'test';
  readonly description = 'Test blueprint for integration testing';
  readonly requiredComponents = [ComponentTypes.TEXT];
  readonly optionalComponents = [ComponentTypes.POSITION];

  create(world: any, text: string): EntityId {
    const entityId = world.createEntity();
    // 簡単なテキストコンポーネントを追加
    world.addComponent(entityId, { type: ComponentTypes.TEXT, content: text });
    return entityId;
  }
}

describe('World Blueprint Integration', () => {
  let world: World;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
  });

  describe('デフォルトブループリント', () => {
    it('should register default blueprints on initialization', () => {
      const blueprints = world.getAvailableBlueprints();

      expect(blueprints).toContain('idea');
      expect(blueprints).toContain('theme');
      expect(blueprints).toHaveLength(2);
    });

    it('should have correct blueprint info for idea', () => {
      const info = world.getBlueprintInfo('idea');

      expect(info).toBeDefined();
      expect(info!.name).toBe('idea');
      expect(info!.description).toBe('Creates an idea entity with text, position, visual, and animation components');
      expect(info!.requiredComponents).toEqual([
        ComponentTypes.TEXT,
        ComponentTypes.POSITION,
        ComponentTypes.VISUAL
      ]);
      expect(info!.optionalComponents).toEqual([ComponentTypes.ANIMATION]);
    });

    it('should have correct blueprint info for theme', () => {
      const info = world.getBlueprintInfo('theme');

      expect(info).toBeDefined();
      expect(info!.name).toBe('theme');
      expect(info!.description).toBe('Creates a theme entity with text, position, and visual components');
      expect(info!.requiredComponents).toEqual([
        ComponentTypes.TEXT,
        ComponentTypes.POSITION,
        ComponentTypes.VISUAL
      ]);
      expect(info!.optionalComponents).toEqual([ComponentTypes.ANIMATION]);
    });
  });

  describe('registerBlueprint', () => {
    it('should register custom blueprint', () => {
      const testBlueprint = new TestBlueprint();
      
      world.registerBlueprint(testBlueprint);

      expect(world.hasBlueprint('test')).toBe(true);
      expect(world.getAvailableBlueprints()).toContain('test');
    });

    it('should update blueprint info when registered', () => {
      const testBlueprint = new TestBlueprint();
      
      world.registerBlueprint(testBlueprint);
      const info = world.getBlueprintInfo('test');

      expect(info).toBeDefined();
      expect(info!.name).toBe('test');
      expect(info!.description).toBe('Test blueprint for integration testing');
    });
  });

  describe('createEntityFromBlueprint', () => {
    it('should create entity from idea blueprint', () => {
      const entityId = world.createEntityFromBlueprint('idea', 'Test idea');

      expect(entityId).toBeDefined();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.TEXT)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.POSITION)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.VISUAL)).toBe(true);
    });

    it('should create entity from theme blueprint', () => {
      const entityId = world.createEntityFromBlueprint('theme', 'Test theme');

      expect(entityId).toBeDefined();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.TEXT)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.POSITION)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.VISUAL)).toBe(true);
    });

    it('should create entity from custom blueprint', () => {
      const testBlueprint = new TestBlueprint();
      world.registerBlueprint(testBlueprint);

      const entityId = world.createEntityFromBlueprint('test', 'Test text');

      expect(entityId).toBeDefined();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.TEXT)).toBe(true);
    });

    it('should throw error for non-existent blueprint', () => {
      expect(() => {
        world.createEntityFromBlueprint('non-existent', 'test');
      }).toThrow('Blueprint not found: non-existent');
    });

    it('should handle blueprint creation errors', () => {
      const errorBlueprint = new (class extends EntityBlueprint {
        readonly name = 'error';
        readonly description = 'Error blueprint';
        readonly requiredComponents = [ComponentTypes.TEXT];
        readonly optionalComponents = [];

        create(): EntityId {
          throw new Error('Blueprint creation failed');
        }
      })();

      world.registerBlueprint(errorBlueprint);

      expect(() => {
        world.createEntityFromBlueprint('error');
      }).toThrow('Blueprint creation failed');
    });
  });

  describe('unregisterBlueprint', () => {
    it('should unregister custom blueprint', () => {
      const testBlueprint = new TestBlueprint();
      world.registerBlueprint(testBlueprint);
      expect(world.hasBlueprint('test')).toBe(true);

      const result = world.unregisterBlueprint('test');

      expect(result).toBe(true);
      expect(world.hasBlueprint('test')).toBe(false);
      expect(world.getAvailableBlueprints()).not.toContain('test');
    });

    it('should return false for non-existent blueprint', () => {
      const result = world.unregisterBlueprint('non-existent');

      expect(result).toBe(false);
    });

    it('should be able to unregister default blueprints', () => {
      expect(world.hasBlueprint('idea')).toBe(true);

      const result = world.unregisterBlueprint('idea');

      expect(result).toBe(true);
      expect(world.hasBlueprint('idea')).toBe(false);
    });
  });

  describe('hasBlueprint', () => {
    it('should return true for existing blueprint', () => {
      expect(world.hasBlueprint('idea')).toBe(true);
      expect(world.hasBlueprint('theme')).toBe(true);
    });

    it('should return false for non-existent blueprint', () => {
      expect(world.hasBlueprint('non-existent')).toBe(false);
    });
  });

  describe('getBlueprintInfo', () => {
    it('should return info for existing blueprint', () => {
      const info = world.getBlueprintInfo('idea');

      expect(info).toBeDefined();
      expect(info!.name).toBe('idea');
    });

    it('should return undefined for non-existent blueprint', () => {
      const info = world.getBlueprintInfo('non-existent');

      expect(info).toBeUndefined();
    });
  });

  describe('getAllBlueprintInfo', () => {
    it('should return all blueprint info', () => {
      const allInfo = world.getAllBlueprintInfo();

      expect(allInfo).toHaveLength(2);
      expect(allInfo.map(info => info.name)).toContain('idea');
      expect(allInfo.map(info => info.name)).toContain('theme');
    });

    it('should include custom blueprints', () => {
      const testBlueprint = new TestBlueprint();
      world.registerBlueprint(testBlueprint);

      const allInfo = world.getAllBlueprintInfo();

      expect(allInfo).toHaveLength(3);
      expect(allInfo.map(info => info.name)).toContain('test');
    });
  });

  describe('getBlueprintStats', () => {
    it('should return correct stats for default blueprints', () => {
      const stats = world.getBlueprintStats();

      expect(stats.totalBlueprints).toBe(2);
      expect(stats.blueprintNames).toHaveLength(2);
      expect(stats.blueprintNames).toContain('idea');
      expect(stats.blueprintNames).toContain('theme');
      expect(stats.oldestRegistration).toBeDefined();
      expect(stats.newestRegistration).toBeDefined();
    });

    it('should update stats when blueprints are added', () => {
      const testBlueprint = new TestBlueprint();
      world.registerBlueprint(testBlueprint);

      const stats = world.getBlueprintStats();

      expect(stats.totalBlueprints).toBe(3);
      expect(stats.blueprintNames).toContain('test');
    });
  });

  describe('エンティティ作成オプション', () => {
    it('should create idea entity with custom options', () => {
      const entityId = world.createEntityFromBlueprint('idea', 'Test idea', {
        x: 100,
        y: 200,
        withAnimation: true,
        animationDuration: 1000
      });

      expect(entityId).toBeDefined();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.ANIMATION)).toBe(true);
    });

    it('should create theme entity with custom options', () => {
      const entityId = world.createEntityFromBlueprint('theme', 'Test theme', {
        x: 300,
        y: 400,
        withAnimation: true
      });

      expect(entityId).toBeDefined();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.ANIMATION)).toBe(true);
    });
  });

  describe('バリデーション統合', () => {
    it('should prevent creating idea with invalid text', () => {
      expect(() => {
        world.createEntityFromBlueprint('idea', ''); // empty text
      }).toThrow('Idea blueprint validation failed');
    });

    it('should prevent creating theme with invalid content', () => {
      expect(() => {
        world.createEntityFromBlueprint('theme', ''); // empty content
      }).toThrow('Theme blueprint validation failed');
    });

    it('should prevent creating idea with too long text', () => {
      const longText = 'a'.repeat(101);
      
      expect(() => {
        world.createEntityFromBlueprint('idea', longText);
      }).toThrow('Idea blueprint validation failed');
    });
  });
});