/**
 * IdeaBlueprint テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdeaBlueprint } from '../IdeaBlueprint';
import { ComponentTypes } from '@/ecs/core/Component';
import type { IWorld } from '@/ecs/core/System';
import type { EntityId } from '@/ecs/core/Entity';
import type { ITextComponent, IPositionComponent, IVisualComponent, IAnimationComponent } from '@/ecs/components';

// モックWorld
const createMockWorld = (): IWorld => {
  const entities = new Map<EntityId, Map<string, any>>();
  let nextEntityId = 1;

  return {
    createEntity: vi.fn(() => {
      const id = `entity-${nextEntityId++}` as EntityId;
      entities.set(id, new Map());
      return id;
    }),
    destroyEntity: vi.fn((entityId: EntityId) => {
      return entities.delete(entityId);
    }),
    addComponent: vi.fn((entityId: EntityId, component: any) => {
      const entityComponents = entities.get(entityId);
      if (entityComponents) {
        entityComponents.set(component.type, component);
      }
    }),
    getComponent: vi.fn((entityId: EntityId, type: string) => {
      const entityComponents = entities.get(entityId);
      return entityComponents?.get(type);
    }),
    hasComponent: vi.fn((entityId: EntityId, type: string) => {
      const entityComponents = entities.get(entityId);
      return entityComponents?.has(type) || false;
    }),
    removeComponent: vi.fn(),
    hasComponents: vi.fn(),
    getAllEntities: vi.fn(() => Array.from(entities.keys())),
    getEntitiesWithComponents: vi.fn(() => []),
    getEntitiesWithAnyComponent: vi.fn(() => []),
    getEntitiesWithoutComponents: vi.fn(() => [])
  } as any;
};

describe('IdeaBlueprint', () => {
  let blueprint: IdeaBlueprint;
  let mockWorld: IWorld;

  beforeEach(() => {
    blueprint = new IdeaBlueprint();
    mockWorld = createMockWorld();
  });

  describe('基本プロパティ', () => {
    it('should have correct name', () => {
      expect(blueprint.name).toBe('idea');
    });

    it('should have correct description', () => {
      expect(blueprint.description).toBe('Creates an idea entity with text, position, visual, and animation components');
    });

    it('should have correct required components', () => {
      expect(blueprint.requiredComponents).toEqual([
        ComponentTypes.TEXT,
        ComponentTypes.POSITION,
        ComponentTypes.VISUAL
      ]);
    });

    it('should have correct optional components', () => {
      expect(blueprint.optionalComponents).toEqual([ComponentTypes.ANIMATION]);
    });
  });

  describe('validate', () => {
    it('should return true for valid text', () => {
      const result = blueprint.validate(mockWorld, 'Valid idea text');

      expect(result).toBe(true);
    });

    it('should return false for empty text', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = blueprint.validate(mockWorld, '');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: empty text');
      
      consoleSpy.mockRestore();
    });

    it('should return false for whitespace-only text', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = blueprint.validate(mockWorld, '   ');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: empty text');
      
      consoleSpy.mockRestore();
    });

    it('should return false for text longer than 100 characters', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const longText = 'a'.repeat(101);
      
      const result = blueprint.validate(mockWorld, longText);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: text too long (max 100 characters)');
      
      consoleSpy.mockRestore();
    });

    it('should return false for invalid x coordinate', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = blueprint.validate(mockWorld, 'Valid text', { x: -1 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: invalid x coordinate');
      
      consoleSpy.mockRestore();
    });

    it('should return false for invalid y coordinate', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = blueprint.validate(mockWorld, 'Valid text', { y: 2001 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: invalid y coordinate');
      
      consoleSpy.mockRestore();
    });

    it('should return false for negative animation duration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = blueprint.validate(mockWorld, 'Valid text', { animationDuration: -1 });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Validation failed: invalid animation duration');
      
      consoleSpy.mockRestore();
    });

    it('should return true for valid coordinates', () => {
      const result = blueprint.validate(mockWorld, 'Valid text', { x: 100, y: 200 });

      expect(result).toBe(true);
    });
  });

  describe('create', () => {
    it('should create entity with required components', () => {
      const entityId = blueprint.create(mockWorld, 'Test idea');

      expect(mockWorld.createEntity).toHaveBeenCalled();
      expect(mockWorld.addComponent).toHaveBeenCalledTimes(3); // text, position, visual
      expect(entityId).toBeDefined();
    });

    it('should create entity with animation when requested', () => {
      const entityId = blueprint.create(mockWorld, 'Test idea', { withAnimation: true });

      expect(mockWorld.createEntity).toHaveBeenCalled();
      expect(mockWorld.addComponent).toHaveBeenCalledTimes(4); // text, position, visual, animation
      expect(entityId).toBeDefined();
    });

    it('should use custom coordinates when provided', () => {
      const entityId = blueprint.create(mockWorld, 'Test idea', { x: 150, y: 250 });

      expect(mockWorld.createEntity).toHaveBeenCalled();
      expect(mockWorld.addComponent).toHaveBeenCalledTimes(3);
      expect(entityId).toBeDefined();
    });

    it('should throw error when validation fails', () => {
      expect(() => {
        blueprint.create(mockWorld, ''); // empty text
      }).toThrow('Idea blueprint validation failed');
    });

    it('should destroy entity and rethrow error when component addition fails', () => {
      const mockWorldWithError = createMockWorld();
      mockWorldWithError.addComponent = vi.fn(() => {
        throw new Error('Component addition failed');
      });

      expect(() => {
        blueprint.create(mockWorldWithError, 'Test idea');
      }).toThrow('Component addition failed');

      expect(mockWorldWithError.destroyEntity).toHaveBeenCalled();
    });
  });

  describe('beforeCreate', () => {
    it('should log in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      blueprint.beforeCreate(mockWorld, 'Test idea');

      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Creating idea entity with text: "Test idea"');

      consoleSpy.mockRestore();
      vi.stubEnv('NODE_ENV', originalEnv);
    });

    it('should not log in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'production');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      blueprint.beforeCreate(mockWorld, 'Test idea');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      vi.stubEnv('NODE_ENV', originalEnv);
    });
  });

  describe('afterCreate', () => {
    it('should log in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      blueprint.afterCreate(mockWorld, 'entity-1' as EntityId, 'Test idea');

      expect(consoleSpy).toHaveBeenCalledWith('[IdeaBlueprint] Created idea entity with ID: entity-1');

      consoleSpy.mockRestore();
      vi.stubEnv('NODE_ENV', originalEnv);
    });
  });

  describe('getInfo', () => {
    it('should return blueprint info', () => {
      const info = blueprint.getInfo();

      expect(info).toEqual({
        name: 'idea',
        description: 'Creates an idea entity with text, position, visual, and animation components',
        requiredComponents: [ComponentTypes.TEXT, ComponentTypes.POSITION, ComponentTypes.VISUAL],
        optionalComponents: [ComponentTypes.ANIMATION]
      });
    });
  });
});