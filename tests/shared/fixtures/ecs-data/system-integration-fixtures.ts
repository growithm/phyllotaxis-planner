/**
 * ECSシステム統合テスト用のフィクスチャデータ
 */

import type { PhyllotaxisConfig } from '@/types/Phyllotaxis';

/**
 * テスト用のフィロタキシス設定
 */
export const testPhyllotaxisConfig: PhyllotaxisConfig = {
  goldenAngle: 137.5077640500378,
  radiusScale: 15,
  centerX: 400,
  centerY: 300,
  minRadius: 50,
  maxIdeas: 100,
};

/**
 * テスト用のアイデアデータ
 */
export const testIdeaTexts = [
  'アイデア1: 新しい機能',
  'アイデア2: UI改善',
  'アイデア3: パフォーマンス最適化',
  'アイデア4: テスト追加',
  'アイデア5: ドキュメント更新',
  'アイデア6: バグ修正',
  'アイデア7: セキュリティ強化',
  'アイデア8: アクセシビリティ向上',
  'アイデア9: 国際化対応',
  'アイデア10: モバイル対応',
];

/**
 * 大量エンティティテスト用のデータ生成
 */
export function generateTestIdeas(count: number, prefix: string = 'テストアイデア'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

/**
 * パフォーマンステスト用の設定
 */
export const performanceTestConfig = {
  smallDataset: 10,
  mediumDataset: 50,
  largeDataset: 100,
  maxProcessingTime: 16, // 60FPS維持のための最大処理時間（ミリ秒）
  animationDuration: 500,
  testTimeout: 5000,
};

/**
 * 期待される位置計算結果（最初の5つのアイデア）
 */
export const expectedPositions = [
  { index: 0, angle: 0, radius: 50 },
  { index: 1, angle: 137.5077640500378, radius: 65 },
  { index: 2, angle: 275.0155281000756, radius: 71.21 },
  { index: 3, angle: 412.5232921501134, radius: 80 },
  { index: 4, angle: 550.0310562001512, radius: 83.54 },
];

/**
 * テスト用のSVG設定
 */
export const testSVGConfig = {
  width: 800,
  height: 600,
  viewBox: '0 0 800 600',
  backgroundColor: '#ffffff',
};

/**
 * アニメーション設定
 */
export const testAnimationConfig = {
  defaultDuration: 500,
  defaultEasing: 'ease-out' as const,
  completionTolerance: 0.01,
  maxAnimationTime: 1000,
};

/**
 * イベント名の定数
 */
export const testEventNames = {
  POSITION_CALCULATED: 'system:position-calculated',
  ANIMATION_START: 'system:animation-start',
  ANIMATION_END: 'system:animation-end',
  RENDER_REQUESTED: 'system:render-requested',
  SYSTEM_PROCESSED: 'system:processed',
  ERROR_OCCURRED: 'system:error-occurred',
} as const;