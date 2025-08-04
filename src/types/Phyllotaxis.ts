/**
 * フィロタキシス関連の型定義
 */

import type { Position } from './Position';

/**
 * フィロタキシス設定インターフェース
 */
export interface PhyllotaxisConfig {
  /** 黄金角（度） - 137.5077640500378度 */
  readonly goldenAngle: number;
  /** 半径スケール係数 - 螺旋の広がり具合を制御 */
  radiusScale: number;
  /** SVG中心X座標 */
  centerX: number;
  /** SVG中心Y座標 */
  centerY: number;
  /** 最小半径 - 中心からの最小距離 */
  minRadius: number;
  /** 最大アイデア数 - 配置可能な最大数 */
  maxIdeas: number;
}

/**
 * フィロタキシス計算結果
 */
export interface PhyllotaxisResult {
  /** 計算された位置 */
  position: Position;
  /** 角度（度） */
  angle: number;
  /** 中心からの半径 */
  radius: number;
  /** インデックス */
  index: number;
}

/**
 * フィロタキシス計算オプション
 */
export interface PhyllotaxisCalculationOptions {
  /** 角度のオフセット（度） */
  angleOffset?: number;
  /** 半径のオフセット */
  radiusOffset?: number;
  /** スケール係数 */
  scale?: number;
}

/**
 * フィロタキシス検証結果
 */
export interface PhyllotaxisValidationResult {
  /** 検証が成功したかどうか */
  isValid: boolean;
  /** エラーメッセージ（検証失敗時） */
  errors: string[];
  /** 警告メッセージ */
  warnings: string[];
}