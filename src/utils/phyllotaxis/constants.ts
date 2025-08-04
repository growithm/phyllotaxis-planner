/**
 * フィロタキシス計算に使用する数学定数
 */

/**
 * 黄金角（度）
 * 黄金比から導出される角度: (3 - √5) / 2 * 360°
 * この角度を使用することで、最も効率的な螺旋配置が実現される
 */
export const GOLDEN_ANGLE = 137.5077640500378;

/**
 * 黄金角（ラジアン）
 */
export const GOLDEN_ANGLE_RADIANS = GOLDEN_ANGLE * (Math.PI / 180);

/**
 * 黄金比
 * φ = (1 + √5) / 2 ≈ 1.618033988749895
 */
export const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

/**
 * 黄金比の逆数
 * 1/φ = (√5 - 1) / 2 ≈ 0.618033988749895
 */
export const GOLDEN_RATIO_INVERSE = 1 / GOLDEN_RATIO;

/**
 * 度からラジアンへの変換係数
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * ラジアンから度への変換係数
 */
export const RAD_TO_DEG = 180 / Math.PI;

/**
 * 2π（完全な円）
 */
export const TWO_PI = 2 * Math.PI;

/**
 * デフォルトのフィロタキシス設定
 */
export const DEFAULT_PHYLLOTAXIS_CONFIG = {
  goldenAngle: GOLDEN_ANGLE,
  radiusScale: 10,
  centerX: 400,
  centerY: 300,
  minRadius: 50,
  maxIdeas: 50,
} as const;

/**
 * 計算精度の許容誤差
 */
export const CALCULATION_EPSILON = 1e-10;

/**
 * 最小・最大値の制限
 */
export const LIMITS = {
  MIN_RADIUS_SCALE: 0.1,
  MAX_RADIUS_SCALE: 100,
  MIN_RADIUS: 0,
  MAX_RADIUS: 10000,
  MIN_IDEAS: 0,
  MAX_IDEAS: 1000,
  MIN_CENTER_COORDINATE: -10000,
  MAX_CENTER_COORDINATE: 10000,
} as const;