/**
 * フィロタキシス設定関連のユーティリティ
 */

import type { PhyllotaxisConfig, PhyllotaxisValidationResult } from '@/types';
import { DEFAULT_PHYLLOTAXIS_CONFIG, LIMITS } from './constants';

/**
 * デフォルトのフィロタキシス設定を取得
 * @returns デフォルト設定
 */
export function getDefaultPhyllotaxisConfig(): PhyllotaxisConfig {
  return { ...DEFAULT_PHYLLOTAXIS_CONFIG };
}

/**
 * フィロタキシス設定を検証
 * @param config - 検証する設定
 * @returns 検証結果
 */
export function validatePhyllotaxisConfig(config: PhyllotaxisConfig): PhyllotaxisValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須プロパティの存在確認
  if (typeof config.goldenAngle !== 'number') {
    errors.push('goldenAngle must be a number');
  }
  if (typeof config.radiusScale !== 'number') {
    errors.push('radiusScale must be a number');
  }
  if (typeof config.centerX !== 'number') {
    errors.push('centerX must be a number');
  }
  if (typeof config.centerY !== 'number') {
    errors.push('centerY must be a number');
  }
  if (typeof config.minRadius !== 'number') {
    errors.push('minRadius must be a number');
  }
  if (typeof config.maxIdeas !== 'number') {
    errors.push('maxIdeas must be a number');
  }

  // 値の範囲チェック
  if (typeof config.radiusScale === 'number') {
    if (config.radiusScale < LIMITS.MIN_RADIUS_SCALE) {
      errors.push(`radiusScale must be >= ${LIMITS.MIN_RADIUS_SCALE}`);
    }
    if (config.radiusScale > LIMITS.MAX_RADIUS_SCALE) {
      errors.push(`radiusScale must be <= ${LIMITS.MAX_RADIUS_SCALE}`);
    }
  }

  if (typeof config.minRadius === 'number') {
    if (config.minRadius < LIMITS.MIN_RADIUS) {
      errors.push(`minRadius must be >= ${LIMITS.MIN_RADIUS}`);
    }
    if (config.minRadius > LIMITS.MAX_RADIUS) {
      errors.push(`minRadius must be <= ${LIMITS.MAX_RADIUS}`);
    }
  }

  if (typeof config.maxIdeas === 'number') {
    if (config.maxIdeas < LIMITS.MIN_IDEAS) {
      errors.push(`maxIdeas must be >= ${LIMITS.MIN_IDEAS}`);
    }
    if (config.maxIdeas > LIMITS.MAX_IDEAS) {
      errors.push(`maxIdeas must be <= ${LIMITS.MAX_IDEAS}`);
    }
  }

  if (typeof config.centerX === 'number') {
    if (config.centerX < LIMITS.MIN_CENTER_COORDINATE || config.centerX > LIMITS.MAX_CENTER_COORDINATE) {
      warnings.push(`centerX (${config.centerX}) is outside recommended range [${LIMITS.MIN_CENTER_COORDINATE}, ${LIMITS.MAX_CENTER_COORDINATE}]`);
    }
  }

  if (typeof config.centerY === 'number') {
    if (config.centerY < LIMITS.MIN_CENTER_COORDINATE || config.centerY > LIMITS.MAX_CENTER_COORDINATE) {
      warnings.push(`centerY (${config.centerY}) is outside recommended range [${LIMITS.MIN_CENTER_COORDINATE}, ${LIMITS.MAX_CENTER_COORDINATE}]`);
    }
  }

  // 論理的整合性チェック
  if (typeof config.goldenAngle === 'number' && Math.abs(config.goldenAngle - DEFAULT_PHYLLOTAXIS_CONFIG.goldenAngle) > 1) {
    warnings.push('goldenAngle differs significantly from the mathematical golden angle (137.5077640500378°)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 部分的な設定をデフォルト設定とマージ
 * @param partialConfig - 部分的な設定
 * @returns 完全な設定
 */
export function mergeWithDefaultConfig(partialConfig: Partial<PhyllotaxisConfig>): PhyllotaxisConfig {
  return {
    ...getDefaultPhyllotaxisConfig(),
    ...partialConfig,
  };
}

/**
 * 設定を安全な値に正規化
 * @param config - 正規化する設定
 * @returns 正規化された設定
 */
export function normalizePhyllotaxisConfig(config: PhyllotaxisConfig): PhyllotaxisConfig {
  return {
    goldenAngle: config.goldenAngle,
    radiusScale: Math.max(LIMITS.MIN_RADIUS_SCALE, Math.min(LIMITS.MAX_RADIUS_SCALE, config.radiusScale)),
    centerX: Math.max(LIMITS.MIN_CENTER_COORDINATE, Math.min(LIMITS.MAX_CENTER_COORDINATE, config.centerX)),
    centerY: Math.max(LIMITS.MIN_CENTER_COORDINATE, Math.min(LIMITS.MAX_CENTER_COORDINATE, config.centerY)),
    minRadius: Math.max(LIMITS.MIN_RADIUS, Math.min(LIMITS.MAX_RADIUS, config.minRadius)),
    maxIdeas: Math.max(LIMITS.MIN_IDEAS, Math.min(LIMITS.MAX_IDEAS, Math.floor(config.maxIdeas))),
  };
}