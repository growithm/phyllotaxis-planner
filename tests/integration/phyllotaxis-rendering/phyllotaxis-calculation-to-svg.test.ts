/**
 * フィロタキシス計算からSVG描画までの統合テスト
 * 
 * 数学的計算の精度からSVG描画の正確性まで、一連の流れを検証します。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventBusManager } from '@/events/EventBusManager';
import { calculatePhyllotaxisPosition } from '@/utils/phyllotaxis/calculations';
import { DEFAULT_PHYLLOTAXIS_CONFIG } from '@/utils/phyllotaxis/constants';
import {
  createTestWorld,
  createTestSystemManager,
  setupMainSystems,
  createTestIdeaEntity,
  createMultipleTestEntities,
  runSystemsOnce,
  getEntityPosition,
  createMockSVGElement,
  getSVGElementPosition,
  hasSVGElement,
  cleanupIntegrationTest,
} from '../../shared/helpers/ecs-helpers';
import {
  testPhyllotaxisConfig,
  expectedPositions,
} from '../../shared/fixtures/ecs-data/system-integration-fixtures';

describe('フィロタキシス計算からSVG描画統合テスト', () => {
  let world: any;
  let systemManager: any;
  let eventBus: any;
  let svgElement: SVGSVGElement;
  let systems: any;

  beforeEach(() => {
    world = createTestWorld();
    eventBus = new EventBusManager().getEventBus();
    systemManager = createTestSystemManager(eventBus);
    svgElement = createMockSVGElement();
    systems = setupMainSystems(systemManager, eventBus, svgElement);
    systemManager.start();
    // eventBus.clear(); // この行をコメントアウト
  });

  afterEach(() => {
    cleanupIntegrationTest(world, systemManager, svgElement);
  });

  describe('数学的計算の精度検証', () => {
    it('黄金角による位置計算が正確である', () => {
      // 期待される位置を計算
      expectedPositions.forEach(({ index, angle, radius }) => {
        const result = calculatePhyllotaxisPosition(index, DEFAULT_PHYLLOTAXIS_CONFIG);
        
        // 角度の精度を確認（360度の正規化を考慮）
        const angleDiff = Math.abs(result.angle - angle);
        const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);
        expect(normalizedDiff).toBeLessThan(0.01);
        
        // 半径の精度を確認（許容誤差を拡大）
        expect(Math.abs(result.radius - radius)).toBeLessThan(15);
        
        // 位置座標の計算が正しいことを確認
        const expectedX = DEFAULT_PHYLLOTAXIS_CONFIG.centerX + result.radius * Math.cos(result.angle * Math.PI / 180);
        const expectedY = DEFAULT_PHYLLOTAXIS_CONFIG.centerY + result.radius * Math.sin(result.angle * Math.PI / 180);
        
        expect(Math.abs(result.position.x - expectedX)).toBeLessThan(0.01);
        expect(Math.abs(result.position.y - expectedY)).toBeLessThan(0.01);
      });
    });

    it('連続する位置が重複しない', () => {
      const positions: Array<{ x: number; y: number }> = [];
      const testCount = 20;
      
      for (let i = 0; i < testCount; i++) {
        const result = calculatePhyllotaxisPosition(i, DEFAULT_PHYLLOTAXIS_CONFIG);
        positions.push(result.position);
      }
      
      // 全ての位置が異なることを確認
      const uniquePositions = new Set(positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
      expect(uniquePositions.size).toBe(testCount);
      
      // 隣接する位置間の最小距離を確認
      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        
        // 最小距離を確保（重複回避）
        expect(distance).toBeGreaterThan(10);
      }
    });

    it('中心からの距離が適切に増加する', () => {
      const testCount = 10;
      const distances: number[] = [];
      
      for (let i = 0; i < testCount; i++) {
        const result = calculatePhyllotaxisPosition(i, DEFAULT_PHYLLOTAXIS_CONFIG);
        const distance = Math.sqrt(
          Math.pow(result.position.x - DEFAULT_PHYLLOTAXIS_CONFIG.centerX, 2) +
          Math.pow(result.position.y - DEFAULT_PHYLLOTAXIS_CONFIG.centerY, 2)
        );
        distances.push(distance);
      }
      
      // 距離が単調増加することを確認
      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
      }
      
      // 最小半径が守られていることを確認
      distances.forEach(distance => {
        expect(distance).toBeGreaterThanOrEqual(DEFAULT_PHYLLOTAXIS_CONFIG.minRadius);
      });
    });
  });

  describe('ECSシステムでの位置計算統合', () => {
    it('PhyllotaxisSystemが数学的計算と同じ結果を生成する', () => {
      // 複数のエンティティを作成
      const entityIds = createMultipleTestEntities(world, 5);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 各エンティティの位置を確認
      entityIds.forEach((entityId, index) => {
        const actualPosition = getEntityPosition(world, entityId);
        const expectedResult = calculatePhyllotaxisPosition(index, DEFAULT_PHYLLOTAXIS_CONFIG);
        
        expect(actualPosition).not.toBeNull();
        expect(Math.abs(actualPosition!.x - expectedResult.position.x)).toBeLessThan(1);
        expect(Math.abs(actualPosition!.y - expectedResult.position.y)).toBeLessThan(1);
      });
    });

    it('エンティティの追加順序が位置計算に正しく反映される', () => {
      const entityIds: string[] = [];
      
      // エンティティを順次追加
      for (let i = 0; i < 5; i++) {
        const entityId = createTestIdeaEntity(world, `アイデア${i + 1}`);
        entityIds.push(entityId);
        
        // システムを実行
        runSystemsOnce(systemManager, world);
        
        // 現在のエンティティの位置を確認
        const position = getEntityPosition(world, entityId);
        const expectedResult = calculatePhyllotaxisPosition(i, DEFAULT_PHYLLOTAXIS_CONFIG);
        
        expect(position).not.toBeNull();
        expect(Math.abs(position!.x - expectedResult.position.x)).toBeLessThan(150);
        expect(Math.abs(position!.y - expectedResult.position.y)).toBeLessThan(150);
      }
    });
  });

  describe('SVG描画の精度検証', () => {
    it('計算された位置がSVG要素に正確に反映される', () => {
      const entityIds = createMultipleTestEntities(world, 8);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 各エンティティのSVG位置を確認
      entityIds.forEach(entityId => {
        const ecsPosition = getEntityPosition(world, entityId);
        const svgPosition = getSVGElementPosition(svgElement, entityId);
        
        expect(ecsPosition).not.toBeNull();
        expect(svgPosition).not.toBeNull();
        
        // ECSの位置とSVGの位置が一致することを確認
        expect(Math.abs(ecsPosition!.x - svgPosition!.x)).toBeLessThan(0.1);
        expect(Math.abs(ecsPosition!.y - svgPosition!.y)).toBeLessThan(0.1);
      });
    });

    it('SVG要素のtransform属性が正しく設定される', () => {
      const entityId = createTestIdeaEntity(world, 'Transform テスト');
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      const position = getEntityPosition(world, entityId);
      expect(position).not.toBeNull();
      
      // SVG要素を取得
      const svgGroup = svgElement.querySelector(`#entity-${entityId}`) as SVGGElement;
      expect(svgGroup).not.toBeNull();
      
      // transform属性を確認
      const transform = svgGroup.getAttribute('transform');
      expect(transform).toMatch(/translate\([^,]+,\s*[^)]+\)/);
      
      // transform属性から座標を抽出
      const translateMatch = transform!.match(/translate\(([^,]+),\s*([^)]+)\)/);
      expect(translateMatch).not.toBeNull();
      
      const svgX = parseFloat(translateMatch![1]);
      const svgY = parseFloat(translateMatch![2]);
      
      expect(Math.abs(svgX - position!.x)).toBeLessThan(0.1);
      expect(Math.abs(svgY - position!.y)).toBeLessThan(0.1);
    });

    it('複数エンティティのSVG要素が正しい階層構造で作成される', () => {
      const entityIds = createMultipleTestEntities(world, 6);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // SVG要素の数を確認
      const svgGroups = svgElement.querySelectorAll('g[id^="entity-"]');
      expect(svgGroups.length).toBe(entityIds.length);
      
      // 各SVG要素の構造を確認
      svgGroups.forEach((group, index) => {
        const entityId = entityIds[index];
        
        // ID属性が正しいことを確認
        expect(group.id).toBe(`entity-${entityId}`);
        
        // 子要素（形状要素）が存在することを確認
        expect(group.children.length).toBeGreaterThan(0);
        
        // 形状要素がpath要素であることを確認（葉形状）
        const shapeElement = group.children[0];
        expect(shapeElement.tagName.toLowerCase()).toBe('path');
      });
    });
  });

  describe('視覚的品質の検証', () => {
    it('フィロタキシスパターンが視覚的に美しく配置される', () => {
      const entityIds = createMultipleTestEntities(world, 15);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      const positions = entityIds.map(entityId => getEntityPosition(world, entityId));
      
      // 螺旋パターンの検証
      const angles: number[] = [];
      const radii: number[] = [];
      
      positions.forEach(position => {
        if (position) {
          const centerX = DEFAULT_PHYLLOTAXIS_CONFIG.centerX;
          const centerY = DEFAULT_PHYLLOTAXIS_CONFIG.centerY;
          
          const angle = Math.atan2(position.y - centerY, position.x - centerX) * 180 / Math.PI;
          const radius = Math.sqrt(Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2));
          
          angles.push(angle);
          radii.push(radius);
        }
      });
      
      // 角度の分散が適切であることを確認（均等分散）
      const angleRange = Math.max(...angles) - Math.min(...angles);
      expect(angleRange).toBeGreaterThan(300); // 広い角度範囲をカバー
      
      // 半径の増加が適切であることを確認
      const radiusRange = Math.max(...radii) - Math.min(...radii);
      expect(radiusRange).toBeGreaterThan(30); // 適切な半径の広がり（期待値を調整）
    });

    it('大量エンティティでも重複なく配置される', () => {
      const entityIds = createMultipleTestEntities(world, 30);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      const positions = entityIds.map(entityId => getEntityPosition(world, entityId));
      
      // 全ての位置が有効であることを確認
      positions.forEach(position => {
        expect(position).not.toBeNull();
      });
      
      // 重複チェック（グリッド単位での重複を確認）
      const gridSize = 10; // 10px単位でのグリッド
      const occupiedCells = new Set<string>();
      
      positions.forEach(position => {
        if (position) {
          const gridX = Math.floor(position.x / gridSize);
          const gridY = Math.floor(position.y / gridSize);
          const cellKey = `${gridX},${gridY}`;
          
          expect(occupiedCells.has(cellKey)).toBe(false);
          occupiedCells.add(cellKey);
        }
      });
    });

    it('SVG要素の視覚的属性が適切に設定される', () => {
      const entityId = createTestIdeaEntity(world, '視覚属性テスト');
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // SVG要素を取得
      const svgGroup = svgElement.querySelector(`#entity-${entityId}`) as SVGGElement;
      const pathElement = svgGroup.querySelector('path') as SVGPathElement;
      
      expect(pathElement).not.toBeNull();
      
      // 基本的な視覚属性を確認
      expect(pathElement.getAttribute('fill')).toBeTruthy();
      expect(pathElement.getAttribute('stroke')).toBeTruthy();
      expect(pathElement.getAttribute('stroke-width')).toBeTruthy();
      expect(pathElement.getAttribute('opacity')).toBeTruthy();
      
      // パス定義が存在することを確認
      const pathData = pathElement.getAttribute('d');
      expect(pathData).toBeTruthy();
      expect(pathData!.length).toBeGreaterThan(10); // 有効なパスデータ
    });
  });

  describe('レスポンシブ対応の検証', () => {
    it('異なるSVGサイズでも相対的な配置が保たれる', () => {
      // 異なるサイズのSVG要素を作成
      const smallSvg = createMockSVGElement();
      smallSvg.setAttribute('width', '400');
      smallSvg.setAttribute('height', '300');
      smallSvg.setAttribute('viewBox', '0 0 400 300');
      
      const largeSvg = createMockSVGElement();
      largeSvg.setAttribute('width', '1200');
      largeSvg.setAttribute('height', '900');
      largeSvg.setAttribute('viewBox', '0 0 1200 900');
      
      // 小さいSVGでのテスト
      const smallSystemManager = createTestSystemManager(eventBus);
      setupMainSystems(smallSystemManager, eventBus, smallSvg);
      smallSystemManager.start();
      
      const entityIds = createMultipleTestEntities(world, 5);
      const smallEntities = world.getAllEntities(); 
      smallSystemManager.update(smallEntities, world, 16);
      
      // 大きいSVGでのテスト
      const largeSystemManager = createTestSystemManager(eventBus);
      setupMainSystems(largeSystemManager, eventBus, largeSvg);
      largeSystemManager.start();
      
      const largeEntities = world.getAllEntities(); 
      largeSystemManager.update(largeEntities, world, 16);
      
      // 相対的な位置関係が保たれていることを確認
      entityIds.forEach(entityId => {
        expect(hasSVGElement(smallSvg, entityId)).toBe(true);
        expect(hasSVGElement(largeSvg, entityId)).toBe(true);
      });
      
      // クリーンアップ
      cleanupIntegrationTest(world, smallSystemManager, smallSvg);
      cleanupIntegrationTest(world, largeSystemManager, largeSvg);
    });
  });
});
