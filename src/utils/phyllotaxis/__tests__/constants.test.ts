/**
 * フィロタキシス定数のテスト
 */
import { describe, it, expect } from 'vitest';
import {
  GOLDEN_ANGLE,
  GOLDEN_ANGLE_RADIANS,
  GOLDEN_RATIO,
  GOLDEN_RATIO_INVERSE,
  DEG_TO_RAD,
  RAD_TO_DEG,
  TWO_PI,
  CALCULATION_EPSILON,
} from '../constants';

describe('フィロタキシス定数', () => {
  describe('黄金角', () => {
    it('黄金角（度）が正確な値であること', () => {
      expect(GOLDEN_ANGLE).toBeCloseTo(137.5077640500378, 10);
    });

    it('黄金角（ラジアン）が度数から正しく変換されていること', () => {
      const expectedRadians = (GOLDEN_ANGLE * Math.PI) / 180;
      expect(GOLDEN_ANGLE_RADIANS).toBeCloseTo(expectedRadians, 10);
    });

    it('黄金角（ラジアン）が約2.399ラジアンであること', () => {
      expect(GOLDEN_ANGLE_RADIANS).toBeCloseTo(2.39996322972865, 10);
    });
  });

  describe('黄金比', () => {
    it('黄金比が正確な値であること', () => {
      const expectedGoldenRatio = (1 + Math.sqrt(5)) / 2;
      expect(GOLDEN_RATIO).toBeCloseTo(expectedGoldenRatio, 10);
      expect(GOLDEN_RATIO).toBeCloseTo(1.618033988749895, 10);
    });

    it('黄金比の逆数が正確な値であること', () => {
      expect(GOLDEN_RATIO_INVERSE).toBeCloseTo(1 / GOLDEN_RATIO, 10);
      expect(GOLDEN_RATIO_INVERSE).toBeCloseTo(0.618033988749895, 10);
    });

    it('黄金比と逆数の関係が正しいこと', () => {
      expect(GOLDEN_RATIO * GOLDEN_RATIO_INVERSE).toBeCloseTo(1, 10);
    });
  });

  describe('角度変換定数', () => {
    it('度数からラジアンへの変換係数が正しいこと', () => {
      expect(DEG_TO_RAD).toBeCloseTo(Math.PI / 180, 10);
    });

    it('ラジアンから度数への変換係数が正しいこと', () => {
      expect(RAD_TO_DEG).toBeCloseTo(180 / Math.PI, 10);
    });

    it('変換係数が互いに逆数であること', () => {
      expect(DEG_TO_RAD * RAD_TO_DEG).toBeCloseTo(1, 10);
    });
  });

  describe('円周率関連定数', () => {
    it('2πが正確な値であること', () => {
      expect(TWO_PI).toBeCloseTo(2 * Math.PI, 10);
    });
  });

  describe('精度定数', () => {
    it('計算精度が適切な値であること', () => {
      expect(CALCULATION_EPSILON).toBe(1e-10);
      expect(CALCULATION_EPSILON).toBeGreaterThan(0);
      expect(CALCULATION_EPSILON).toBeLessThan(1e-5);
    });
  });
});