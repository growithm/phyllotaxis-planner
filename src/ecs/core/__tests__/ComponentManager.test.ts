import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentManager } from '@/ecs/core/ComponentManager';
import { ComponentTypes, IComponent } from '@/ecs/core/Component';

// テスト用コンポーネント
interface TestPositionComponent extends IComponent {
  readonly type: 'position';
  x: number;
  y: number;
}

interface TestTextComponent extends IComponent {
  readonly type: 'text';
  content: string;
}

const createTestPositionComponent = (x: number = 0, y: number = 0): TestPositionComponent => ({
  type: 'position',
  x,
  y
});

const createTestTextComponent = (content: string = ''): TestTextComponent => ({
  type: 'text',
  content
});

describe('ComponentManager', () => {
  let manager: ComponentManager;
  const entityId1 = 'entity_1';
  const entityId2 = 'entity_2';

  beforeEach(() => {
    manager = new ComponentManager();
    manager.initializeStorage(Object.values(ComponentTypes));
  });

  describe('addComponent', () => {
    it('should add component to entity', () => {
      const position = createTestPositionComponent(100, 200);
      manager.addComponent(entityId1, position);

      expect(manager.hasComponent(entityId1, ComponentTypes.POSITION)).toBe(true);
    });

    it('should handle multiple components for same entity', () => {
      const position = createTestPositionComponent(100, 200);
      const text = createTestTextComponent('test');

      manager.addComponent(entityId1, position);
      manager.addComponent(entityId1, text);

      expect(manager.hasComponent(entityId1, ComponentTypes.POSITION)).toBe(true);
      expect(manager.hasComponent(entityId1, ComponentTypes.TEXT)).toBe(true);
    });
  });

  describe('getComponent', () => {
    it('should retrieve component from entity', () => {
      const position = createTestPositionComponent(100, 200);
      manager.addComponent(entityId1, position);

      const retrieved = manager.getComponent<TestPositionComponent>(entityId1, ComponentTypes.POSITION);
      expect(retrieved?.x).toBe(100);
      expect(retrieved?.y).toBe(200);
    });

    it('should return undefined for non-existent component', () => {
      const retrieved = manager.getComponent(entityId1, ComponentTypes.POSITION);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('removeComponent', () => {
    it('should remove component from entity', () => {
      const position = createTestPositionComponent(100, 200);
      manager.addComponent(entityId1, position);

      expect(manager.hasComponent(entityId1, ComponentTypes.POSITION)).toBe(true);

      const removed = manager.removeComponent(entityId1, ComponentTypes.POSITION);
      expect(removed).toBe(true);
      expect(manager.hasComponent(entityId1, ComponentTypes.POSITION)).toBe(false);
    });

    it('should return false when removing non-existent component', () => {
      const removed = manager.removeComponent(entityId1, ComponentTypes.POSITION);
      expect(removed).toBe(false);
    });
  });

  describe('getEntitiesWithComponent', () => {
    it('should return entities that have specific component', () => {
      manager.addComponent(entityId1, createTestPositionComponent());
      manager.addComponent(entityId2, createTestPositionComponent());
      manager.addComponent(entityId2, createTestTextComponent());

      const entitiesWithPosition = manager.getEntitiesWithComponent(ComponentTypes.POSITION);
      expect(entitiesWithPosition).toHaveLength(2);
      expect(entitiesWithPosition).toContain(entityId1);
      expect(entitiesWithPosition).toContain(entityId2);

      const entitiesWithText = manager.getEntitiesWithComponent(ComponentTypes.TEXT);
      expect(entitiesWithText).toHaveLength(1);
      expect(entitiesWithText).toContain(entityId2);
    });
  });

  describe('getComponentTypes', () => {
    it('should return all component types for entity', () => {
      manager.addComponent(entityId1, createTestPositionComponent());
      manager.addComponent(entityId1, createTestTextComponent());

      const types = manager.getComponentTypes(entityId1);
      expect(types).toHaveLength(2);
      expect(types).toContain(ComponentTypes.POSITION);
      expect(types).toContain(ComponentTypes.TEXT);
    });
  });

  describe('getStats', () => {
    it('should return component statistics', () => {
      manager.addComponent(entityId1, createTestPositionComponent());
      manager.addComponent(entityId2, createTestPositionComponent());
      manager.addComponent(entityId1, createTestTextComponent());

      const stats = manager.getStats();
      expect(stats[ComponentTypes.POSITION]).toBe(2);
      expect(stats[ComponentTypes.TEXT]).toBe(1);
      expect(stats[ComponentTypes.VISUAL]).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all components', () => {
      manager.addComponent(entityId1, createTestPositionComponent());
      manager.addComponent(entityId2, createTestTextComponent());

      manager.clear();

      expect(manager.hasComponent(entityId1, ComponentTypes.POSITION)).toBe(false);
      expect(manager.hasComponent(entityId2, ComponentTypes.TEXT)).toBe(false);
    });
  });
});