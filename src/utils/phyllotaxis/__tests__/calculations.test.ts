/**
 * フィロタキシス計算関数のテスト
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePhyllotaxisPosition,
  polarToCartesian,
  cartesianToPolar,
  calculateRadiusAtAngle,
  calculateMultiplePositions,
  calculatePositionsInRange,
  calculateDistance,
  isPositionInBounds,
  isGoldenAngle,
} from '../calculations';
import { GOLDEN_ANGLE, DEG_TO_RAD } from '../constants';
import { getDefaultPhyllotaxisConfig } from '../config';
import type { PhyllotaxisConfig, Position } from '@/types';

describe('フィロタキシス計算関数', () => {
  const testConfig: PhyllotaxisConfig = {
    ...getDefaultPhyllotaxisConfig(),
    radiusScale: 10,
    centerX: 100,
    centerY: 100,
    minRadius: 20,
    maxIdeas: 50,
  };

  describe('calculatePhyllotaxisPosition', () => {
    it('インデックス0で中心近くの位置を返すこと', () => {
      const result = calculatePhyllotaxisPosition(0, testConfig);
      expect(result.index).toBe(0);
      expect(result.angle).toBe(0);
      expect(result.radius).toBe(testConfig.minRadius);
      expect(result.position.x).toBeCloseTo(
        testConfig.centerX + testConfig.minRadius,
        5
      );
      expect(result.position.y).toBeCloseTo(testConfig.centerY, 5);
    });

    it('インデックス1で黄金角の位置を返すこと', () => {
      const result = calculatePhyllotaxisPosition(1, testConfig);
      expect(result.index).toBe(1);
      expect(result.angle).toBeCloseTo(GOLDEN_ANGLE, 5);
      expect(result.radius).toBeGreaterThan(testConfig.minRadius);
    });

    it('複数のインデックスで異なる位置を返すこと', () => {
      const positions = [0, 1, 2, 3, 4].map(i =>
        calculatePhyllotaxisPosition(i, testConfig)
      );

      // 全ての位置が異なることを確認
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const distance = calculateDistance(
            positions[i].position,
            positions[j].position
          );
          expect(distance).toBeGreaterThan(1);
        }
      }
    });

    it('無効なインデックスでエラーを投げること', () => {
      expect(() => calculatePhyllotaxisPosition(-1, testConfig)).toThrow(
        'Index must be a non-negative integer'
      );
      expect(() => calculatePhyllotaxisPosition(1.5, testConfig)).toThrow(
        'Index must be a non-negative integer'
      );
      expect(() =>
        calculatePhyllotaxisPosition(testConfig.maxIdeas, testConfig)
      ).toThrow('exceeds maxIdeas');
    });

    it('オプションが正しく適用されること', () => {
      const options = {
        angleOffset: 45,
        radiusOffset: 10,
        scale: 2,
      };

      const result = calculatePhyllotaxisPosition(1, testConfig, options);
      expect(result.angle).toBeCloseTo(GOLDEN_ANGLE + 45, 5);
    });
  });

  describe('polarToCartesian', () => {
    it('角度0で正のX軸上の点を返すこと', () => {
      const position = polarToCartesian(0, 10, 0, 0);
      expect(position.x).toBeCloseTo(10, 5);
      expect(position.y).toBeCloseTo(0, 5);
    });

    it('角度90で正のY軸上の点を返すこと', () => {
      const position = polarToCartesian(90, 10, 0, 0);
      expect(position.x).toBeCloseTo(0, 5);
      expect(position.y).toBeCloseTo(10, 5);
    });

    it('角度180で負のX軸上の点を返すこと', () => {
      const position = polarToCartesian(180, 10, 0, 0);
      expect(position.x).toBeCloseTo(-10, 5);
      expect(position.y).toBeCloseTo(0, 5);
    });

    it('中心座標のオフセットが正しく適用されること', () => {
      const position = polarToCartesian(0, 10, 50, 30);
      expect(position.x).toBeCloseTo(60, 5); // 50 + 10
      expect(position.y).toBeCloseTo(30, 5); // 30 + 0
    });
  });

  describe('cartesianToPolar', () => {
    it('正のX軸上の点で角度0を返すこと', () => {
      const result = cartesianToPolar({ x: 10, y: 0 }, 0, 0);
      expect(result.angle).toBeCloseTo(0, 5);
      expect(result.radius).toBeCloseTo(10, 5);
    });

    it('正のY軸上の点で角度90を返すこと', () => {
      const result = cartesianToPolar({ x: 0, y: 10 }, 0, 0);
      expect(result.angle).toBeCloseTo(90, 5);
      expect(result.radius).toBeCloseTo(10, 5);
    });

    it('負のX軸上の点で角度180を返すこと', () => {
      const result = cartesianToPolar({ x: -10, y: 0 }, 0, 0);
      expect(result.angle).toBeCloseTo(180, 5);
      expect(result.radius).toBeCloseTo(10, 5);
    });

    it('中心座標のオフセットが正しく適用されること', () => {
      const result = cartesianToPolar({ x: 60, y: 30 }, 50, 30);
      expect(result.angle).toBeCloseTo(0, 5);
      expect(result.radius).toBeCloseTo(10, 5);
    });
  });

  describe('calculateRadiusAtAngle', () => {
    it('角度0で適切な半径を返すこと', () => {
      const radius = calculateRadiusAtAngle(0, testConfig);
      expect(radius).toBeGreaterThanOrEqual(testConfig.minRadius);
    });

    it('黄金角で適切な半径を返すこと', () => {
      const radius = calculateRadiusAtAngle(GOLDEN_ANGLE, testConfig);
      expect(radius).toBeGreaterThan(testConfig.minRadius);
    });

    it('大きな角度でも正常に動作すること', () => {
      const radius = calculateRadiusAtAngle(1000, testConfig);
      expect(Number.isFinite(radius)).toBe(true);
      expect(radius).toBeGreaterThanOrEqual(testConfig.minRadius);
    });
  });

  describe('calculateMultiplePositions', () => {
    it('指定されたインデックス配列の位置を返すこと', () => {
      const indices = [0, 2, 4, 6, 8];
      const positions = calculateMultiplePositions(indices, testConfig);

      expect(positions).toHaveLength(5);
      expect(positions[0].index).toBe(0);
      expect(positions[1].index).toBe(2);
      expect(positions[4].index).toBe(8);
    });

    it('空配列で空配列を返すこと', () => {
      const positions = calculateMultiplePositions([], testConfig);
      expect(positions).toHaveLength(0);
    });

    it('オプションが全ての位置に適用されること', () => {
      const indices = [0, 1, 2];
      const options = { angleOffset: 45 };
      const positions = calculateMultiplePositions(
        indices,
        testConfig,
        options
      );

      positions.forEach((position, i) => {
        expect(position.angle).toBeCloseTo(GOLDEN_ANGLE * indices[i] + 45, 5);
      });
    });
  });

  describe('calculatePositionsInRange', () => {
    it('指定された範囲の位置を返すこと', () => {
      const positions = calculatePositionsInRange(2, 5, testConfig);

      expect(positions).toHaveLength(4); // 2, 3, 4, 5
      expect(positions[0].index).toBe(2);
      expect(positions[1].index).toBe(3);
      expect(positions[2].index).toBe(4);
      expect(positions[3].index).toBe(5);
    });

    it('単一インデックスの範囲で1つの位置を返すこと', () => {
      const positions = calculatePositionsInRange(3, 3, testConfig);
      expect(positions).toHaveLength(1);
      expect(positions[0].index).toBe(3);
    });

    it('無効な範囲でエラーを投げること', () => {
      expect(() => calculatePositionsInRange(-1, 5, testConfig)).toThrow(
        'Invalid index range'
      );
      expect(() => calculatePositionsInRange(5, 2, testConfig)).toThrow(
        'Invalid index range'
      );
    });
  });

  describe('calculateDistance', () => {
    it('同じ位置で距離0を返すこと', () => {
      const pos = { x: 10, y: 20 };
      const distance = calculateDistance(pos, pos);
      expect(distance).toBe(0);
    });

    it('X軸上の2点間の距離を正しく計算すること', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 10, y: 0 };
      const distance = calculateDistance(pos1, pos2);
      expect(distance).toBe(10);
    });

    it('Y軸上の2点間の距離を正しく計算すること', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 0, y: 10 };
      const distance = calculateDistance(pos1, pos2);
      expect(distance).toBe(10);
    });

    it('対角線上の2点間の距離を正しく計算すること', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      const distance = calculateDistance(pos1, pos2);
      expect(distance).toBe(5); // 3-4-5の直角三角形
    });
  });

  describe('isPositionInBounds', () => {
    const bounds = {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
    };

    it('境界内の位置で真を返すこと', () => {
      const position = { x: 50, y: 50 };
      expect(isPositionInBounds(position, bounds)).toBe(true);
    });

    it('境界上の位置で真を返すこと', () => {
      expect(isPositionInBounds({ x: 0, y: 0 }, bounds)).toBe(true);
      expect(isPositionInBounds({ x: 100, y: 100 }, bounds)).toBe(true);
    });

    it('境界外の位置で偽を返すこと', () => {
      expect(isPositionInBounds({ x: -1, y: 50 }, bounds)).toBe(false);
      expect(isPositionInBounds({ x: 101, y: 50 }, bounds)).toBe(false);
      expect(isPositionInBounds({ x: 50, y: -1 }, bounds)).toBe(false);
      expect(isPositionInBounds({ x: 50, y: 101 }, bounds)).toBe(false);
    });
  });

  describe('isGoldenAngle', () => {
    it('黄金角で真を返すこと', () => {
      expect(isGoldenAngle(GOLDEN_ANGLE)).toBe(true);
    });

    it('黄金角に近い値で真を返すこと', () => {
      expect(isGoldenAngle(GOLDEN_ANGLE + 1e-12)).toBe(true);
      expect(isGoldenAngle(GOLDEN_ANGLE - 1e-12)).toBe(true);
    });

    it('黄金角から離れた値で偽を返すこと', () => {
      expect(isGoldenAngle(GOLDEN_ANGLE + 1)).toBe(false);
      expect(isGoldenAngle(GOLDEN_ANGLE - 1)).toBe(false);
      expect(isGoldenAngle(0)).toBe(false);
      expect(isGoldenAngle(180)).toBe(false);
    });
  });

  describe('境界値テスト', () => {
    it('最大インデックス近くでも正常に動作すること', () => {
      const largeIndex = testConfig.maxIdeas - 1;
      const result = calculatePhyllotaxisPosition(largeIndex, testConfig);

      expect(result.index).toBe(largeIndex);
      expect(Number.isFinite(result.position.x)).toBe(true);
      expect(Number.isFinite(result.position.y)).toBe(true);
      expect(Number.isFinite(result.angle)).toBe(true);
      expect(Number.isFinite(result.radius)).toBe(true);
    });

    it('極端な設定値でも正常に動作すること', () => {
      const extremeConfig: PhyllotaxisConfig = {
        goldenAngle: GOLDEN_ANGLE,
        radiusScale: 0.1,
        centerX: -1000,
        centerY: 1000,
        minRadius: 1,
        maxIdeas: 10,
      };

      const result = calculatePhyllotaxisPosition(5, extremeConfig);
      expect(Number.isFinite(result.position.x)).toBe(true);
      expect(Number.isFinite(result.position.y)).toBe(true);
    });
  });
});
