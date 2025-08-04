/**
 * フィロタキシス設定管理のテスト
 */
import { describe, it, expect } from 'vitest';
import {
  getDefaultPhyllotaxisConfig,
  validatePhyllotaxisConfig,
  mergeWithDefaultConfig,
  normalizePhyllotaxisConfig,
} from '../config';
import { GOLDEN_ANGLE, LIMITS } from '../constants';
import type { PhyllotaxisConfig } from '@/types';

describe('フィロタキシス設定管理', () => {
  const validConfig: PhyllotaxisConfig = {
    goldenAngle: GOLDEN_ANGLE,
    radiusScale: 10,
    centerX: 100,
    centerY: 100,
    minRadius: 20,
    maxIdeas: 50,
  };

  describe('getDefaultPhyllotaxisConfig', () => {
    it('デフォルト設定を返すこと', () => {
      const config = getDefaultPhyllotaxisConfig();
      expect(config.goldenAngle).toBeCloseTo(GOLDEN_ANGLE, 10);
      expect(typeof config.radiusScale).toBe('number');
      expect(typeof config.centerX).toBe('number');
      expect(typeof config.centerY).toBe('number');
      expect(typeof config.minRadius).toBe('number');
      expect(typeof config.maxIdeas).toBe('number');
    });

    it('返された設定が独立したオブジェクトであること', () => {
      const config1 = getDefaultPhyllotaxisConfig();
      const config2 = getDefaultPhyllotaxisConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('validatePhyllotaxisConfig', () => {
    it('有効な設定で検証が通ること', () => {
      const result = validatePhyllotaxisConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('非数値のgoldenAngleでエラーになること', () => {
      const invalidConfig = { ...validConfig, goldenAngle: 'invalid' as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('goldenAngle must be a number');
    });

    it('非数値のradiusScaleでエラーになること', () => {
      const invalidConfig = { ...validConfig, radiusScale: null as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('radiusScale must be a number');
    });

    it('非数値のcenterXでエラーになること', () => {
      const invalidConfig = { ...validConfig, centerX: undefined as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('centerX must be a number');
    });

    it('非数値のcenterYでエラーになること', () => {
      const invalidConfig = { ...validConfig, centerY: 'test' as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('centerY must be a number');
    });

    it('非数値のminRadiusでエラーになること', () => {
      const invalidConfig = { ...validConfig, minRadius: {} as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('minRadius must be a number');
    });

    it('非数値のmaxIdeasでエラーになること', () => {
      const invalidConfig = { ...validConfig, maxIdeas: [] as any };
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxIdeas must be a number');
    });

    it('radiusScaleが範囲外でエラーになること', () => {
      const tooSmallConfig = { ...validConfig, radiusScale: LIMITS.MIN_RADIUS_SCALE - 1 };
      const tooLargeConfig = { ...validConfig, radiusScale: LIMITS.MAX_RADIUS_SCALE + 1 };
      
      const result1 = validatePhyllotaxisConfig(tooSmallConfig);
      const result2 = validatePhyllotaxisConfig(tooLargeConfig);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain(`radiusScale must be >= ${LIMITS.MIN_RADIUS_SCALE}`);
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain(`radiusScale must be <= ${LIMITS.MAX_RADIUS_SCALE}`);
    });

    it('minRadiusが範囲外でエラーになること', () => {
      const tooSmallConfig = { ...validConfig, minRadius: LIMITS.MIN_RADIUS - 1 };
      const tooLargeConfig = { ...validConfig, minRadius: LIMITS.MAX_RADIUS + 1 };
      
      const result1 = validatePhyllotaxisConfig(tooSmallConfig);
      const result2 = validatePhyllotaxisConfig(tooLargeConfig);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain(`minRadius must be >= ${LIMITS.MIN_RADIUS}`);
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain(`minRadius must be <= ${LIMITS.MAX_RADIUS}`);
    });

    it('maxIdeasが範囲外でエラーになること', () => {
      const tooSmallConfig = { ...validConfig, maxIdeas: LIMITS.MIN_IDEAS - 1 };
      const tooLargeConfig = { ...validConfig, maxIdeas: LIMITS.MAX_IDEAS + 1 };
      
      const result1 = validatePhyllotaxisConfig(tooSmallConfig);
      const result2 = validatePhyllotaxisConfig(tooLargeConfig);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain(`maxIdeas must be >= ${LIMITS.MIN_IDEAS}`);
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain(`maxIdeas must be <= ${LIMITS.MAX_IDEAS}`);
    });

    it('中心座標が推奨範囲外で警告が出ること', () => {
      const extremeConfig = {
        ...validConfig,
        centerX: LIMITS.MAX_CENTER_COORDINATE + 1,
        centerY: LIMITS.MIN_CENTER_COORDINATE - 1,
      };
      
      const result = validatePhyllotaxisConfig(extremeConfig);
      expect(result.isValid).toBe(true); // 警告のみでエラーではない
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('centerX'))).toBe(true);
      expect(result.warnings.some(w => w.includes('centerY'))).toBe(true);
    });

    it('黄金角が標準値から大きく外れた場合に警告が出ること', () => {
      const nonGoldenConfig = { ...validConfig, goldenAngle: 90 };
      const result = validatePhyllotaxisConfig(nonGoldenConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('goldenAngle differs significantly'))).toBe(true);
    });

    it('複数のエラーが同時に検出されること', () => {
      const invalidConfig = {
        ...validConfig,
        radiusScale: 'invalid' as any,
        centerX: null as any,
        maxIdeas: LIMITS.MAX_IDEAS + 1,
      };
      
      const result = validatePhyllotaxisConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('mergeWithDefaultConfig', () => {
    it('部分的な設定をデフォルトとマージすること', () => {
      const partial = { radiusScale: 20, centerX: 200 };
      const merged = mergeWithDefaultConfig(partial);
      const defaultConfig = getDefaultPhyllotaxisConfig();
      
      expect(merged.radiusScale).toBe(20);
      expect(merged.centerX).toBe(200);
      expect(merged.goldenAngle).toBe(defaultConfig.goldenAngle);
      expect(merged.centerY).toBe(defaultConfig.centerY);
      expect(merged.minRadius).toBe(defaultConfig.minRadius);
      expect(merged.maxIdeas).toBe(defaultConfig.maxIdeas);
    });

    it('空のオブジェクトでデフォルト設定を返すこと', () => {
      const merged = mergeWithDefaultConfig({});
      const defaultConfig = getDefaultPhyllotaxisConfig();
      expect(merged).toEqual(defaultConfig);
    });

    it('完全な設定でそのまま返すこと', () => {
      const complete = { ...validConfig };
      const merged = mergeWithDefaultConfig(complete);
      expect(merged).toEqual(complete);
    });

    it('返されたオブジェクトが独立していること', () => {
      const partial = { radiusScale: 20 };
      const merged = mergeWithDefaultConfig(partial);
      
      // 元のpartialオブジェクトを変更してもmergedに影響しない
      partial.radiusScale = 30;
      expect(merged.radiusScale).toBe(20);
    });
  });

  describe('normalizePhyllotaxisConfig', () => {
    it('有効な設定をそのまま返すこと', () => {
      const normalized = normalizePhyllotaxisConfig(validConfig);
      expect(normalized).toEqual(validConfig);
    });

    it('範囲外のradiusScaleを制限すること', () => {
      const config = { ...validConfig, radiusScale: LIMITS.MAX_RADIUS_SCALE + 10 };
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.radiusScale).toBe(LIMITS.MAX_RADIUS_SCALE);
    });

    it('範囲外のminRadiusを制限すること', () => {
      const config = { ...validConfig, minRadius: LIMITS.MIN_RADIUS - 10 };
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.minRadius).toBe(LIMITS.MIN_RADIUS);
    });

    it('範囲外のmaxIdeasを制限すること', () => {
      const config = { ...validConfig, maxIdeas: LIMITS.MAX_IDEAS + 100 };
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.maxIdeas).toBe(LIMITS.MAX_IDEAS);
    });

    it('範囲外の中心座標を制限すること', () => {
      const config = {
        ...validConfig,
        centerX: LIMITS.MAX_CENTER_COORDINATE + 1000,
        centerY: LIMITS.MIN_CENTER_COORDINATE - 1000,
      };
      
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.centerX).toBe(LIMITS.MAX_CENTER_COORDINATE);
      expect(normalized.centerY).toBe(LIMITS.MIN_CENTER_COORDINATE);
    });

    it('maxIdeasを整数に丸めること', () => {
      const config = { ...validConfig, maxIdeas: 25.7 };
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.maxIdeas).toBe(25);
    });

    it('goldenAngleは変更されないこと', () => {
      const config = { ...validConfig, goldenAngle: 90 };
      const normalized = normalizePhyllotaxisConfig(config);
      expect(normalized.goldenAngle).toBe(90); // 正規化されない
    });

    it('複数の値が同時に正規化されること', () => {
      const extremeConfig = {
        goldenAngle: GOLDEN_ANGLE,
        radiusScale: LIMITS.MAX_RADIUS_SCALE + 50,
        centerX: LIMITS.MIN_CENTER_COORDINATE - 100,
        centerY: LIMITS.MAX_CENTER_COORDINATE + 200,
        minRadius: LIMITS.MAX_RADIUS + 10,
        maxIdeas: LIMITS.MIN_IDEAS - 5,
      };
      
      const normalized = normalizePhyllotaxisConfig(extremeConfig);
      
      expect(normalized.radiusScale).toBe(LIMITS.MAX_RADIUS_SCALE);
      expect(normalized.centerX).toBe(LIMITS.MIN_CENTER_COORDINATE);
      expect(normalized.centerY).toBe(LIMITS.MAX_CENTER_COORDINATE);
      expect(normalized.minRadius).toBe(LIMITS.MAX_RADIUS);
      expect(normalized.maxIdeas).toBe(LIMITS.MIN_IDEAS);
    });
  });

  describe('境界値テスト', () => {
    it('境界値ちょうどの設定で正常に動作すること', () => {
      const boundaryConfig: PhyllotaxisConfig = {
        goldenAngle: GOLDEN_ANGLE,
        radiusScale: LIMITS.MIN_RADIUS_SCALE,
        centerX: LIMITS.MIN_CENTER_COORDINATE,
        centerY: LIMITS.MAX_CENTER_COORDINATE,
        minRadius: LIMITS.MAX_RADIUS,
        maxIdeas: LIMITS.MAX_IDEAS,
      };
      
      const result = validatePhyllotaxisConfig(boundaryConfig);
      expect(result.isValid).toBe(true);
      
      const normalized = normalizePhyllotaxisConfig(boundaryConfig);
      expect(normalized).toEqual(boundaryConfig);
    });

    it('極端な値でも正規化が正常に動作すること', () => {
      const extremeConfig = {
        goldenAngle: Number.MAX_SAFE_INTEGER,
        radiusScale: Number.MAX_SAFE_INTEGER,
        centerX: -Number.MAX_SAFE_INTEGER,
        centerY: Number.MAX_SAFE_INTEGER,
        minRadius: Number.MAX_SAFE_INTEGER,
        maxIdeas: Number.MAX_SAFE_INTEGER,
      };
      
      const normalized = normalizePhyllotaxisConfig(extremeConfig);
      
      expect(Number.isFinite(normalized.radiusScale)).toBe(true);
      expect(Number.isFinite(normalized.centerX)).toBe(true);
      expect(Number.isFinite(normalized.centerY)).toBe(true);
      expect(Number.isFinite(normalized.minRadius)).toBe(true);
      expect(Number.isFinite(normalized.maxIdeas)).toBe(true);
    });
  });
});