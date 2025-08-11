/**
 * ECSテストヘルパーのエクスポート
 */

// World関連
export * from './world-helpers';

// System関連
export * from './system-helpers';

// Entity関連
export * from './entity-helpers';

// SVG関連
export * from './svg-helpers';

// Event関連
export * from './event-helpers';

/**
 * 統合テスト用の完全なクリーンアップ
 */
import { World } from '@/ecs/core/World';
import { SystemManager } from '@/ecs/core/SystemManager';
import { cleanupWorld } from './world-helpers';
import { cleanupSystemManager } from './system-helpers';
import { cleanupSVGElement } from './svg-helpers';

export function cleanupIntegrationTest(
  world: World,
  systemManager: SystemManager,
  svgElement: SVGSVGElement
): void {
  cleanupWorld(world);
  cleanupSystemManager(systemManager);
  cleanupSVGElement(svgElement);
}