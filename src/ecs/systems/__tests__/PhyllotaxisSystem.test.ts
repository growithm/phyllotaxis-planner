/**
 * PhyllotaxisSystemの単体テスト
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { PhyllotaxisSystem } from '../PhyllotaxisSystem';
import type { IWorld } from '@/ecs/core/System';
import type { EventBus } from '@/events/core/EventBus';
import { ComponentTypes } from '@/ecs/core/Component';
import type { IPositionComponent } from '@/ecs/components/PositionComponent';
import type { ITextComponent } from '@/ecs/components/TextComponent';
import { SystemEvents } from '@/events/types/EventTypes';
import { DEFAULT_PHYLLOTAXIS_CONFIG } from '@/utils/phyllotaxis/constants';

// モックの作成
const createMockWorld = (): IWorld => ({
  createEntity: vi.fn(),
  destroyEntity: vi.fn(),
  hasEntity: vi.fn(),
  getAllEntities: vi.fn(),
  hasComponent: vi.fn(),
  getComponent: vi.fn(),
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
  getVersion: vi.fn(),
  getEntity: vi.fn(),
  getComponentStats: vi.fn(),
});

const createMockEventBus = (): EventBus => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  clear: vi.fn(),
  getListenerCount: vi.fn(),
});

const createMockPositionComponent = (
  x: number = 0,
  y: number = 0,
  angle: number = 0,
  radius: number = 0
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  x,
  y,
  angle,
  radius,
  index: 0,
  scale: 1.0,
  zIndex: 0,
  isAnimating: false,
});

const createMockTextComponent = (content: string): ITextComponent => ({
  type: ComponentTypes.TEXT,
  content,
  maxLength: 100,
  isEditable: true,
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  color: '#000000',
  textAlign: 'center',
  entityType: 'idea',
});

describe('PhyllotaxisSystem', () => {
  let system: PhyllotaxisSystem;
  let mockWorld: IWorld;
  let mockEventBus: EventBus;

  beforeEach(() => {
    mockWorld = createMockWorld();
    mockEventBus = createMockEventBus();
    system = new PhyllotaxisSystem(100, mockEventBus);
  });

  describe('constructor', () => {
    it('should create system with default configuration', () => {
      const defaultSystem = new PhyllotaxisSystem();
      
      expect(defaultSystem.name).toBe('PhyllotaxisSystem');
      expect(defaultSystem.priority).toBe(100);
      expect(defaultSystem.requiredComponents).toEqual([
        ComponentTypes.POSITION,
        ComponentTypes.TEXT,
      ]);
    });

    it('should create system with custom priority and options', () => {
      const customSystem = new PhyllotaxisSystem(200, mockEventBus, {
        excludeCenterTheme: false,
        positionChangeThreshold: 2.0,
        config: { radiusScale: 15 },
      });

      expect(customSystem.priority).toBe(200);
      expect(customSystem.getConfig().radiusScale).toBe(15);
    });
  });

  describe('update', () => {
    it('should process entities with required components', () => {
      const entityIds = ['entity1', 'entity2'];
      const mockPositionComponent = createMockPositionComponent(100, 100);
      const mockTextComponent = createMockTextComponent('Test Idea');

      // モックの設定
      (mockWorld.hasComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          return componentType === ComponentTypes.POSITION || 
                 componentType === ComponentTypes.TEXT;
        });

      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) {
            return mockPositionComponent;
          }
          if (componentType === ComponentTypes.TEXT) {
            return mockTextComponent;
          }
          return undefined;
        });

      // システム更新を実行
      system.update(entityIds, mockWorld, 16);

      // 位置コンポーネントが更新されることを確認
      expect(mockPositionComponent.x).not.toBe(100);
      expect(mockPositionComponent.y).not.toBe(100);
    });

    it('should skip entities without required components', () => {
      const entityIds = ['entity1', 'entity2'];

      // 必要なコンポーネントがない場合
      (mockWorld.hasComponent as Mock).mockReturnValue(false);

      system.update(entityIds, mockWorld, 16);

      // getComponentが呼ばれないことを確認
      expect(mockWorld.getComponent).not.toHaveBeenCalled();
    });

    it('should exclude center theme entities when configured', () => {
      const entityIds = ['centerEntity', 'ideaEntity'];
      const centerPosition = createMockPositionComponent(
        DEFAULT_PHYLLOTAXIS_CONFIG.centerX,
        DEFAULT_PHYLLOTAXIS_CONFIG.centerY
      );
      const ideaPosition = createMockPositionComponent(200, 200);
      const textComponent = createMockTextComponent('Test');

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) {
            return entityId === 'centerEntity' ? centerPosition : ideaPosition;
          }
          if (componentType === ComponentTypes.TEXT) {
            return textComponent;
          }
          return undefined;
        });

      system.update(entityIds, mockWorld, 16);

      // 中心エンティティは除外され、アイデアエンティティのみ処理される
      expect(ideaPosition.x).not.toBe(200);
      expect(centerPosition.x).toBe(DEFAULT_PHYLLOTAXIS_CONFIG.centerX);
    });
  });

  describe('position calculation', () => {
    it('should calculate correct phyllotaxis positions', () => {
      const entityIds = ['entity1', 'entity2', 'entity3'];
      const positions = entityIds.map(() => createMockPositionComponent());
      const textComponent = createMockTextComponent('Test');

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) {
            const index = entityIds.indexOf(entityId);
            return positions[index];
          }
          if (componentType === ComponentTypes.TEXT) {
            return textComponent;
          }
          return undefined;
        });

      system.update(entityIds, mockWorld, 16);

      // 各エンティティが異なる位置に配置されることを確認
      const uniquePositions = new Set(
        positions.map(pos => `${pos.x},${pos.y}`)
      );
      expect(uniquePositions.size).toBe(entityIds.length);

      // 角度と半径が設定されることを確認
      positions.forEach(pos => {
        expect(pos.angle).toBeGreaterThanOrEqual(0);
        expect(pos.radius).toBeGreaterThanOrEqual(DEFAULT_PHYLLOTAXIS_CONFIG.minRadius);
      });
    });

    it('should only update positions when change threshold is exceeded', () => {
      const entityId = 'entity1';
      const position = createMockPositionComponent(100, 100);
      const textComponent = createMockTextComponent('Test');

      // 閾値を大きく設定
      const systemWithHighThreshold = new PhyllotaxisSystem(100, mockEventBus, {
        positionChangeThreshold: 1000,
      });

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) return position;
          if (componentType === ComponentTypes.TEXT) return textComponent;
          return undefined;
        });

      const originalX = position.x;
      const originalY = position.y;

      systemWithHighThreshold.update([entityId], mockWorld, 16);

      // 閾値が大きいため位置が更新されない
      expect(position.x).toBe(originalX);
      expect(position.y).toBe(originalY);
    });
  });

  describe('event emission', () => {
    it('should emit POSITION_CALCULATED event when position changes', () => {
      const entityId = 'entity1';
      const position = createMockPositionComponent();
      const textComponent = createMockTextComponent('Test');

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) return position;
          if (componentType === ComponentTypes.TEXT) return textComponent;
          return undefined;
        });

      system.update([entityId], mockWorld, 16);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        SystemEvents.POSITION_CALCULATED,
        expect.objectContaining({
          entityId,
          position: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
          }),
          angle: expect.any(Number),
          radius: expect.any(Number),
          index: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit ERROR_OCCURRED event when calculation fails', () => {
      const entityId = 'entity1';
      const position = createMockPositionComponent();
      const textComponent = createMockTextComponent('Test');

      // 計算エラーを発生させるため、不正な設定を使用
      const systemWithInvalidConfig = new PhyllotaxisSystem(100, mockEventBus, {
        config: { maxIdeas: -1 }, // 不正な値
      });

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.POSITION) return position;
          if (componentType === ComponentTypes.TEXT) return textComponent;
          return undefined;
        });

      systemWithInvalidConfig.update([entityId], mockWorld, 16);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        SystemEvents.ERROR_OCCURRED,
        expect.objectContaining({
          systemName: 'PhyllotaxisSystem',
          entityId,
          error: expect.any(String),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('configuration management', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        radiusScale: 20,
        centerX: 500,
      };

      system.updateConfig(newConfig);
      const updatedConfig = system.getConfig();

      expect(updatedConfig.radiusScale).toBe(20);
      expect(updatedConfig.centerX).toBe(500);
      // 他の設定は変更されない
      expect(updatedConfig.centerY).toBe(DEFAULT_PHYLLOTAXIS_CONFIG.centerY);
    });

    it('should return readonly configuration', () => {
      const config = system.getConfig();
      
      // 設定オブジェクトが変更できないことを確認
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (config as any).radiusScale = 999;
      }).not.toThrow(); // TypeScriptの型チェックによる保護のため、実行時エラーは発生しない

      // 元の設定が変更されていないことを確認
      const originalConfig = system.getConfig();
      expect(originalConfig.radiusScale).toBe(DEFAULT_PHYLLOTAXIS_CONFIG.radiusScale);
    });
  });

  describe('system statistics', () => {
    it('should return correct system statistics', () => {
      const stats = system.getStats();

      expect(stats).toEqual({
        name: 'PhyllotaxisSystem',
        priority: 100,
        requiredComponents: [ComponentTypes.POSITION, ComponentTypes.TEXT],
        processableEntities: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing position component gracefully', () => {
      const entityId = 'entity1';
      const textComponent = createMockTextComponent('Test');

      (mockWorld.hasComponent as Mock).mockReturnValue(true);
      (mockWorld.getComponent as Mock)
        .mockImplementation((entityId: string, componentType: string) => {
          if (componentType === ComponentTypes.TEXT) return textComponent;
          return undefined; // 位置コンポーネントがない
        });

      // エラーが発生せずに処理が完了することを確認
      expect(() => {
        system.update([entityId], mockWorld, 16);
      }).not.toThrow();

      // 警告ログが出力されることを確認（console.warnのモック化が必要）
      // この部分は実際のプロジェクトではloggerライブラリを使用することを推奨
    });
  });
});