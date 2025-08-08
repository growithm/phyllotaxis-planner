/**
 * RenderSystemの単体テスト
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RenderSystem } from '../RenderSystem';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createVisualComponent, createThemeVisualComponent, createIdeaVisualComponent } from '@/ecs/components/VisualComponent';
import { createAnimationComponent } from '@/ecs/components/AnimationComponent';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { SystemEvents } from '@/events/types/EventTypes';
import type { EventBus } from '@/events/core/EventBus';
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

// モックSVG要素の作成
const createMockSVGElement = (): SVGSVGElement => {
  const mockSVG = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    children: [],
    childNodes: [],
  } as unknown as SVGSVGElement;

  return mockSVG;
};

// モックSVGグループ要素の作成
const createMockSVGGroupElement = (): SVGGElement => {
  const mockGroup = {
    id: '',
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    parentNode: null,
    firstElementChild: null,
    style: {},
    children: [],
    childNodes: [],
  } as unknown as SVGGElement;

  return mockGroup;
};

// document.createElementNSをモック
const mockCreateElementNS = vi.fn();
Object.defineProperty(global, 'document', {
  value: {
    createElementNS: mockCreateElementNS,
  },
  writable: true,
});

describe('RenderSystem', () => {
  let renderSystem: RenderSystem;
  let eventBus: EventBus;
  let world: MockWorld;
  let svgElement: SVGSVGElement;
  let entityId: EntityId;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new MockWorld();
    svgElement = createMockSVGElement();
    entityId = world.createEntity();

    // createElementNSのモック設定
    mockCreateElementNS.mockImplementation((namespace: string, tagName: string) => {
      if (tagName === 'g') {
        return createMockSVGGroupElement();
      }
      // その他のSVG要素のモック
      return {
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        style: {},
      };
    });

    // デフォルト設定でRenderSystemを作成
    renderSystem = new RenderSystem(svgElement, 300, eventBus, {
      elementIdPrefix: 'test-entity',
      autoCleanup: true,
      debugMode: false,
      enableAnimationIntegration: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    it('デフォルト設定で正しく初期化される', () => {
      const mockSVG = createMockSVGElement();
      const system = new RenderSystem(mockSVG);

      expect(system.name).toBe('RenderSystem');
      expect(system.requiredComponents).toEqual([ComponentTypes.POSITION, ComponentTypes.VISUAL]);
      expect(system.priority).toBe(300);
      expect(system.getSvgElement()).toBe(mockSVG);
    });

    it('カスタム設定で正しく初期化される', () => {
      const mockSVG = createMockSVGElement();
      const customOptions = {
        elementIdPrefix: 'custom',
        autoCleanup: false,
        debugMode: true,
        enableAnimationIntegration: false,
      };

      const system = new RenderSystem(mockSVG, 100, eventBus, customOptions);

      expect(system.priority).toBe(100);
      expect(system.getOptions()).toMatchObject(customOptions);
    });

    it('アニメーションイベントリスナーが自動設定される', () => {
      const eventBusSpy = vi.spyOn(eventBus, 'on');

      new RenderSystem(svgElement, 300, eventBus, { enableAnimationIntegration: true });

      expect(eventBusSpy).toHaveBeenCalledWith(
        SystemEvents.ANIMATION_START,
        expect.any(Function)
      );
      expect(eventBusSpy).toHaveBeenCalledWith(
        SystemEvents.ANIMATION_END,
        expect.any(Function)
      );
    });
  });

  describe('基本機能', () => {
    it('描画済みエンティティ数を正しく追跡する', () => {
      expect(renderSystem.getRenderedEntityCount()).toBe(0);

      // エンティティにコンポーネントを追加
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      // システムを実行
      renderSystem.update([entityId], world, 16);

      expect(renderSystem.getRenderedEntityCount()).toBe(1);
    });

    it('システム統計情報を正しく返す', () => {
      const stats = renderSystem.getStats();

      expect(stats.name).toBe('RenderSystem');
      expect(stats.priority).toBe(300);
      expect(stats.requiredComponents).toEqual([ComponentTypes.POSITION, ComponentTypes.VISUAL]);
      expect(stats.processableEntities).toBe(0);
    });

    it('SVG要素を正しく取得する', () => {
      expect(renderSystem.getSvgElement()).toBe(svgElement);
    });
  });

  describe('エンティティ描画', () => {
    beforeEach(() => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);
    });

    it('必要なコンポーネントを持つエンティティが描画される', () => {
      renderSystem.update([entityId], world, 16);

      expect(mockCreateElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'g');
      expect(svgElement.appendChild).toHaveBeenCalled();
      expect(renderSystem.getRenderedEntityCount()).toBe(1);
    });

    it('非表示エンティティは描画されない', () => {
      const visualComponent = world.getComponent(entityId, ComponentTypes.VISUAL) as any;
      if (visualComponent) {
        visualComponent.visible = false;
      }

      renderSystem.update([entityId], world, 16);

      expect(renderSystem.getRenderedEntityCount()).toBe(0);
    });

    it('必要なコンポーネントが不足している場合は警告が出力される', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // 位置コンポーネントを削除
      world.removeComponent(entityId, ComponentTypes.POSITION);

      // processEntitiesを直接呼び出してフィルタリングをバイパス
      renderSystem['processEntities']([entityId], world, 16);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Entity ${entityId} missing required components`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('形状要素の作成', () => {
    it('円形状が正しく作成される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createThemeVisualComponent(); // 円形状
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);

      expect(mockCreateElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'circle');
    });

    it('葉形状が正しく作成される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createIdeaVisualComponent(); // 葉形状
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);

      expect(mockCreateElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'path');
    });

    it('矩形形状が正しく作成される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('rect');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);

      expect(mockCreateElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'rect');
    });

    it('楕円形状が正しく作成される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('ellipse');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);

      expect(mockCreateElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'ellipse');
    });
  });

  describe('アニメーション統合', () => {
    beforeEach(() => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      const animationComponent = createAnimationComponent('fadeIn', 500);
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);
      world.addComponent(entityId, animationComponent);
    });

    it('アニメーション開始イベント受信時に描画要求が発火される', () => {
      const eventSpy = vi.spyOn(eventBus, 'emit');

      // ANIMATION_STARTイベントを発火
      eventBus.emit(SystemEvents.ANIMATION_START, {
        entityId,
        animationType: 'fadeIn',
        duration: 500,
        easing: 'ease-out',
        timestamp: Date.now(),
      });

      expect(eventSpy).toHaveBeenCalledWith(
        SystemEvents.RENDER_REQUESTED,
        expect.objectContaining({
          entityId,
          priority: 'normal',
        })
      );
    });

    it('アニメーション終了イベント受信時に描画要求が発火される', () => {
      const eventSpy = vi.spyOn(eventBus, 'emit');

      // ANIMATION_ENDイベントを発火
      eventBus.emit(SystemEvents.ANIMATION_END, {
        entityId,
        animationType: 'fadeIn',
        duration: 500,
        easing: 'ease-out',
        timestamp: Date.now(),
      });

      expect(eventSpy).toHaveBeenCalledWith(
        SystemEvents.RENDER_REQUESTED,
        expect.objectContaining({
          entityId,
          priority: 'normal',
        })
      );
    });
  });

  describe('要素のクリーンアップ', () => {
    it('削除されたエンティティの要素が自動クリーンアップされる', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      // 最初の描画
      renderSystem.update([entityId], world, 16);
      expect(renderSystem.getRenderedEntityCount()).toBe(1);

      // エンティティを削除して再描画
      renderSystem.update([], world, 16);
      expect(renderSystem.getRenderedEntityCount()).toBe(0);
    });

    it('clearAllElementsで全要素がクリアされる', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);
      expect(renderSystem.getRenderedEntityCount()).toBe(1);

      renderSystem.clearAllElements();
      expect(renderSystem.getRenderedEntityCount()).toBe(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('描画エラー時にエラーイベントが発火される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      // createElementNSでエラーを発生させる
      mockCreateElementNS.mockImplementation(() => {
        throw new Error('SVG creation failed');
      });

      const eventSpy = vi.spyOn(eventBus, 'emit');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderSystem.update([entityId], world, 16);

      expect(consoleSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        SystemEvents.ERROR_OCCURRED,
        expect.objectContaining({
          systemName: 'RenderSystem',
          entityId,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('パブリックメソッド', () => {
    it('updateOptionsが正しく動作する', () => {
      const newOptions = {
        elementIdPrefix: 'updated',
        debugMode: true,
      };

      renderSystem.updateOptions(newOptions);

      const options = renderSystem.getOptions();
      expect(options.elementIdPrefix).toBe('updated');
      expect(options.debugMode).toBe(true);
    });

    it('getEntityElementが正しく動作する', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      renderSystem.update([entityId], world, 16);

      const element = renderSystem.getEntityElement(entityId);
      expect(element).toBeDefined();
    });

    it('存在しないエンティティのgetEntityElementはundefinedを返す', () => {
      const element = renderSystem.getEntityElement('non-existent');
      expect(element).toBeUndefined();
    });
  });

  describe('イベント統合', () => {
    it('システム処理完了イベントが正しく発火される', () => {
      const positionComponent = createPositionComponent(100, 100);
      const visualComponent = createVisualComponent('leaf');
      world.addComponent(entityId, positionComponent);
      world.addComponent(entityId, visualComponent);

      const eventSpy = vi.spyOn(eventBus, 'emit');

      renderSystem.update([entityId], world, 16);

      expect(eventSpy).toHaveBeenCalledWith(
        SystemEvents.SYSTEM_PROCESSED,
        expect.objectContaining({
          systemName: 'RenderSystem',
          processedEntities: 1,
        })
      );
    });
  });
});