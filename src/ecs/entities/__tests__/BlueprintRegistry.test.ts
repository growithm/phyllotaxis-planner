/**
 * BlueprintRegistry テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintRegistry } from '../BlueprintRegistry';
import { EntityBlueprint } from '../EntityBlueprint';
import { IdeaBlueprint } from '../IdeaBlueprint';
import { ThemeBlueprint } from '../ThemeBlueprint';
import { ComponentTypes } from '@/ecs/core/Component';

// テスト用のカスタムブループリント
class TestBlueprint extends EntityBlueprint {
  readonly name = 'test';
  readonly description = 'Test blueprint for unit testing';
  readonly requiredComponents = [ComponentTypes.TEXT];
  readonly optionalComponents = [ComponentTypes.POSITION];

  create(): string {
    return 'test-entity-id';
  }
}

describe('BlueprintRegistry', () => {
  let registry: BlueprintRegistry;
  let testBlueprint: TestBlueprint;
  let ideaBlueprint: IdeaBlueprint;
  let themeBlueprint: ThemeBlueprint;

  beforeEach(() => {
    registry = new BlueprintRegistry();
    testBlueprint = new TestBlueprint();
    ideaBlueprint = new IdeaBlueprint();
    themeBlueprint = new ThemeBlueprint();
  });

  describe('register', () => {
    it('should register a blueprint successfully', () => {
      registry.register(testBlueprint);

      expect(registry.has('test')).toBe(true);
      expect(registry.get('test')).toBe(testBlueprint);
    });

    it('should overwrite existing blueprint with warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      registry.register(testBlueprint);
      const newTestBlueprint = new TestBlueprint();
      registry.register(newTestBlueprint);

      expect(registry.get('test')).toBe(newTestBlueprint);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Blueprint 'test' is already registered. Overwriting."
      );

      consoleSpy.mockRestore();
    });

    it('should store blueprint info correctly', () => {
      const beforeRegister = new Date();
      registry.register(testBlueprint);
      const afterRegister = new Date();

      const info = registry.getInfo('test');
      expect(info).toBeDefined();
      expect(info!.name).toBe('test');
      expect(info!.description).toBe('Test blueprint for unit testing');
      expect(info!.requiredComponents).toEqual([ComponentTypes.TEXT]);
      expect(info!.optionalComponents).toEqual([ComponentTypes.POSITION]);
      expect(info!.registeredAt.getTime()).toBeGreaterThanOrEqual(beforeRegister.getTime());
      expect(info!.registeredAt.getTime()).toBeLessThanOrEqual(afterRegister.getTime());
    });
  });

  describe('unregister', () => {
    it('should unregister a blueprint successfully', () => {
      registry.register(testBlueprint);
      expect(registry.has('test')).toBe(true);

      const result = registry.unregister('test');

      expect(result).toBe(true);
      expect(registry.has('test')).toBe(false);
      expect(registry.get('test')).toBeUndefined();
      expect(registry.getInfo('test')).toBeUndefined();
    });

    it('should return false when unregistering non-existent blueprint', () => {
      const result = registry.unregister('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should return blueprint when it exists', () => {
      registry.register(testBlueprint);

      const result = registry.get('test');

      expect(result).toBe(testBlueprint);
    });

    it('should return undefined when blueprint does not exist', () => {
      const result = registry.get('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true when blueprint exists', () => {
      registry.register(testBlueprint);

      expect(registry.has('test')).toBe(true);
    });

    it('should return false when blueprint does not exist', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });

  describe('listBlueprints', () => {
    it('should return empty array when no blueprints registered', () => {
      const result = registry.listBlueprints();

      expect(result).toEqual([]);
    });

    it('should return all registered blueprint names', () => {
      registry.register(testBlueprint);
      registry.register(ideaBlueprint);
      registry.register(themeBlueprint);

      const result = registry.listBlueprints();

      expect(result).toHaveLength(3);
      expect(result).toContain('test');
      expect(result).toContain('idea');
      expect(result).toContain('theme');
    });
  });

  describe('getAllInfo', () => {
    it('should return empty array when no blueprints registered', () => {
      const result = registry.getAllInfo();

      expect(result).toEqual([]);
    });

    it('should return all blueprint info', () => {
      registry.register(testBlueprint);
      registry.register(ideaBlueprint);

      const result = registry.getAllInfo();

      expect(result).toHaveLength(2);
      expect(result.map(info => info.name)).toContain('test');
      expect(result.map(info => info.name)).toContain('idea');
    });
  });

  describe('clear', () => {
    it('should clear all blueprints', () => {
      registry.register(testBlueprint);
      registry.register(ideaBlueprint);
      expect(registry.listBlueprints()).toHaveLength(2);

      registry.clear();

      expect(registry.listBlueprints()).toHaveLength(0);
      expect(registry.getAllInfo()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty registry', () => {
      const stats = registry.getStats();

      expect(stats.totalBlueprints).toBe(0);
      expect(stats.blueprintNames).toEqual([]);
      expect(stats.oldestRegistration).toBeNull();
      expect(stats.newestRegistration).toBeNull();
    });

    it('should return correct stats for populated registry', () => {
      const firstTime = new Date();
      registry.register(testBlueprint);
      
      // 少し時間を空ける
      const secondTime = new Date(firstTime.getTime() + 100);
      vi.setSystemTime(secondTime);
      registry.register(ideaBlueprint);

      const stats = registry.getStats();

      expect(stats.totalBlueprints).toBe(2);
      expect(stats.blueprintNames).toHaveLength(2);
      expect(stats.blueprintNames).toContain('test');
      expect(stats.blueprintNames).toContain('idea');
      expect(stats.oldestRegistration).toBeDefined();
      expect(stats.newestRegistration).toBeDefined();
      expect(stats.oldestRegistration!.getTime()).toBeLessThanOrEqual(
        stats.newestRegistration!.getTime()
      );

      vi.useRealTimers();
    });
  });
});