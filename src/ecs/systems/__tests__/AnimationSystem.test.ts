/**
 * AnimationSystemの単体テスト
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnimationSystem } from '../AnimationSystem';
import { ComponentTypes } from '@/ecs/core/Component';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import type { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';
import type { IWorld } from '@/ecs/core/System';
import type { EntityId } from '@/ecs/core/Entity';

// モックWorld実装
class MockWorld implements IWorld {
  private entities = new Map<EntityId, Map<string, any>>();
  private nextEntityId = 1;

  createEntity(): EntityId {
    const id = `entity-${this.nextEntityId++}`;
    this.entities.set(id, new Map());
    return id;
  }

  destroyEntity(entityId: EntityId): boolean {
    return this.entities.delete(entityId);
  }

  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  getAllEntities(): EntityId[] {
    return Array.from(this.entities.keys());
  }

  hasComponent(entityId: EntityId, type: string): boolean {
    const entity = this.entities.get(entityId);
    return entity ? entity.has(type) : false;
  }

  getComponent<T>(entityId: EntityId, type: string): T | undefined {
    const entity = this.entities.get(entityId);
    return entity ? entity.get(type) : undefined;
  }

  addComponent<T>(entityId: EntityId, component: T & { type: string }): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.set(component.type, component);
    }
  }

  removeComponent(entityId: EntityId, type: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.delete(type);
    }
  }

  getVersion(): number {
    return 1;
  }
}

describe('AnimationSystem', () => {
  let animationSystem: AnimationSystem;
  let eventBus: EventBus;
  let world: MockWorld;
  let entityId: EntityId;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new MockWorld();
    entityId = world.createEntity();

    // デフォルト設定でAnimationSystemを作成
    animationSystem = new AnimationSystem(200, eventBus, {
      defaultDuration: 500,
      defaultEasing: 'ease-out',
      autoListenPositionEvents: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('デフォルト設定で正しく初期化される', () => {
      const system = new AnimationSystem();

      expect(system.name).toBe('AnimationSystem');
      expect(system.requiredComponents).toEqual([ComponentTypes.ANIMATION]);
      expect(system.priority).toBe(200);
    });

    it('カスタム設定で正しく初期化される', () => {
      const customOptions = {
        defaultDuration: 1000,
        defaultEasing: 'ease-in' as const,
        completionTolerance: 0.05,
        autoListenPositionEvents: false,
      };

      const system = new AnimationSystem(100, eventBus, customOptions);

      expect(system.priority).toBe(100);
      expect(system.getOptions()).toMatchObject(customOptions);
    });
  });

  describe('基本機能', () => {
    it('アニメーション中のエンティティ数を正しく追跡する', () => {
      expect(animationSystem.getAnimatingEntityCount()).toBe(0);

      animationSystem.startAnimation(entityId, 'fadeIn');
      expect(animationSystem.getAnimatingEntityCount()).toBe(1);

      animationSystem.stopAnimation(entityId);
      expect(animationSystem.getAnimatingEntityCount()).toBe(0);
    });

    it('システム統計情報を正しく返す', () => {
      const stats = animationSystem.getStats();

      expect(stats.name).toBe('AnimationSystem');
      expect(stats.priority).toBe(200);
      expect(stats.requiredComponents).toEqual([ComponentTypes.ANIMATION]);
      expect(stats.processableEntities).toBe(0);
    });
  });

  describe('イージング関数', () => {
    it('linearイージングが正しく動作する', () => {
      const result = animationSystem['applyEasing'](0.5, 'linear');
      expect(result).toBe(0.5);
    });

    it('ease-inイージングが正しく動作する', () => {
      const result = animationSystem['applyEasing'](0.5, 'ease-in');
      expect(result).toBe(0.25); // 0.5^2
    });

    it('ease-outイージングが正しく動作する', () => {
      const result = animationSystem['applyEasing'](0.5, 'ease-out');
      expect(result).toBe(0.75); // 1 - (1-0.5)^2
    });
  });

  describe('パブリックメソッド', () => {
    it('startAnimationが正しく動作する', () => {
      const eventSpy = vi.spyOn(eventBus, 'emit');

      animationSystem.startAnimation(entityId, 'fadeIn', 1000, 'ease-in');

      expect(eventSpy).toHaveBeenCalledWith(
        SystemEvents.ANIMATION_START,
        expect.objectContaining({
          entityId,
          animationType: 'fadeIn',
          duration: 1000,
          easing: 'ease-in',
        })
      );
      expect(animationSystem.getAnimatingEntityCount()).toBe(1);
    });

    it('stopAnimationが正しく動作する', () => {
      animationSystem.startAnimation(entityId, 'fadeIn');
      expect(animationSystem.getAnimatingEntityCount()).toBe(1);

      animationSystem.stopAnimation(entityId);
      expect(animationSystem.getAnimatingEntityCount()).toBe(0);
    });

    it('設定更新が正しく動作する', () => {
      const newOptions = {
        defaultDuration: 1000,
        defaultEasing: 'ease-in' as const,
      };

      animationSystem.updateOptions(newOptions);

      const options = animationSystem.getOptions();
      expect(options.defaultDuration).toBe(1000);
      expect(options.defaultEasing).toBe('ease-in');
    });
  });
});
