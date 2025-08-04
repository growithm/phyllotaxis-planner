/**
 * フィロタキシス計算のコア関数
 */

import type { Position, PhyllotaxisConfig, PhyllotaxisResult, PhyllotaxisCalculationOptions } from '@/types';
import { GOLDEN_ANGLE, DEG_TO_RAD, CALCULATION_EPSILON } from './constants';
import { validatePhyllotaxisConfig } from './config';

/**
 * フィロタキシスパターンに基づいて位置を計算
 * @param index - 配置インデックス（0から始まる）
 * @param config - フィロタキシス設定
 * @param options - 計算オプション
 * @returns 計算結果
 */
export function calculatePhyllotaxisPosition(
  index: number,
  config: PhyllotaxisConfig,
  options: PhyllotaxisCalculationOptions = {}
): PhyllotaxisResult {
  // 設定の検証
  const validation = validatePhyllotaxisConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid PhyllotaxisConfig: ${validation.errors.join(', ')}`);
  }

  // インデックスの検証
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Index must be a non-negative integer');
  }

  if (index >= config.maxIdeas) {
    throw new Error(`Index ${index} exceeds maxIdeas ${config.maxIdeas}`);
  }

  // オプションのデフォルト値
  const {
    angleOffset = 0,
    radiusOffset = 0,
    scale = 1,
  } = options;

  // 角度計算（黄金角 × インデックス + オフセット）
  const angle = (config.goldenAngle * index + angleOffset) % 360;

  // 半径計算（平方根による螺旋）
  const radius = Math.max(
    config.minRadius,
    config.minRadius + (Math.sqrt(index) * config.radiusScale + radiusOffset) * scale
  );

  // 極座標から直交座標への変換
  const position = polarToCartesian(angle, radius, config.centerX, config.centerY);

  return {
    position,
    angle,
    radius,
    index,
  };
}

/**
 * 極座標から直交座標への変換
 * @param angleDegrees - 角度（度）
 * @param radius - 半径
 * @param centerX - 中心X座標
 * @param centerY - 中心Y座標
 * @returns 直交座標
 */
export function polarToCartesian(
  angleDegrees: number,
  radius: number,
  centerX: number = 0,
  centerY: number = 0
): Position {
  const angleRadians = angleDegrees * DEG_TO_RAD;
  
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

/**
 * 直交座標から極座標への変換
 * @param position - 直交座標
 * @param centerX - 中心X座標
 * @param centerY - 中心Y座標
 * @returns 極座標 { angle: 度, radius: 半径 }
 */
export function cartesianToPolar(
  position: Position,
  centerX: number = 0,
  centerY: number = 0
): { angle: number; radius: number } {
  const dx = position.x - centerX;
  const dy = position.y - centerY;
  
  const radius = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // 角度を0-360度の範囲に正規化
  if (angle < 0) {
    angle += 360;
  }
  
  return { angle, radius };
}

/**
 * 指定された角度での半径を計算
 * @param angle - 角度（度）
 * @param config - フィロタキシス設定
 * @returns 計算された半径
 */
export function calculateRadiusAtAngle(angle: number, config: PhyllotaxisConfig): number {
  // 角度からインデックスを逆算
  const index = Math.round(angle / config.goldenAngle);
  
  return Math.max(
    config.minRadius,
    config.minRadius + Math.sqrt(Math.max(0, index)) * config.radiusScale
  );
}

/**
 * 複数のインデックスに対して一括で位置を計算
 * @param indices - インデックス配列
 * @param config - フィロタキシス設定
 * @param options - 計算オプション
 * @returns 計算結果配列
 */
export function calculateMultiplePositions(
  indices: number[],
  config: PhyllotaxisConfig,
  options: PhyllotaxisCalculationOptions = {}
): PhyllotaxisResult[] {
  return indices.map(index => calculatePhyllotaxisPosition(index, config, options));
}

/**
 * 指定された範囲のインデックスに対して位置を計算
 * @param startIndex - 開始インデックス
 * @param endIndex - 終了インデックス（含む）
 * @param config - フィロタキシス設定
 * @param options - 計算オプション
 * @returns 計算結果配列
 */
export function calculatePositionsInRange(
  startIndex: number,
  endIndex: number,
  config: PhyllotaxisConfig,
  options: PhyllotaxisCalculationOptions = {}
): PhyllotaxisResult[] {
  if (startIndex < 0 || endIndex < startIndex) {
    throw new Error('Invalid index range');
  }

  const indices = Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
  return calculateMultiplePositions(indices, config, options);
}

/**
 * 2つの位置間の距離を計算
 * @param pos1 - 位置1
 * @param pos2 - 位置2
 * @returns 距離
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 位置が指定された境界内にあるかチェック
 * @param position - チェックする位置
 * @param bounds - 境界 { minX, maxX, minY, maxY }
 * @returns 境界内にある場合true
 */
export function isPositionInBounds(
  position: Position,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.y >= bounds.minY &&
    position.y <= bounds.maxY
  );
}

/**
 * 黄金角の精度をチェック
 * @param angle - チェックする角度
 * @returns 黄金角との差が許容範囲内の場合true
 */
export function isGoldenAngle(angle: number): boolean {
  return Math.abs(angle - GOLDEN_ANGLE) < CALCULATION_EPSILON;
}