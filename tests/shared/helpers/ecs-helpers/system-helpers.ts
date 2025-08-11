/**
 * ECSシステム関連のテストヘルパー
 */

import { SystemManager } from '@/ecs/core/SystemManager';
import { PhyllotaxisSystem } from '@/ecs/systems/PhyllotaxisSystem';
import { AnimationSystem } from '@/ecs/systems/AnimationSystem';
import { RenderSystem } from '@/ecs/systems/RenderSystem';
import type { EventBus } from '@/events/core/EventBus';

/**
 * 3つの主要システムを作成してSystemManagerに登録
 */
export function setupMainSystems(
  systemManager: SystemManager,
  eventBus: EventBus,
  svgElement: SVGSVGElement
): {
  phyllotaxisSystem: PhyllotaxisSystem;
  animationSystem: AnimationSystem;
  renderSystem: RenderSystem;
} {
  // システムを作成（優先度順）
  const phyllotaxisSystem = new PhyllotaxisSystem(100, eventBus);
  const animationSystem = new AnimationSystem(200, eventBus);
  const renderSystem = new RenderSystem(svgElement, 300, eventBus);

  // SystemManagerに登録
  systemManager.addSystem(phyllotaxisSystem);
  systemManager.addSystem(animationSystem);
  systemManager.addSystem(renderSystem);

  return {
    phyllotaxisSystem,
    animationSystem,
    renderSystem,
  };
}

/**
 * システムを1回実行
 */
export function runSystemsOnce(
  systemManager: SystemManager,
  world: any,
  deltaTime: number = 16
): void {
  const entities = world.getAllEntities();
  systemManager.update(entities, world, deltaTime);
}

/**
 * 指定した時間だけシステムを実行
 */
export async function runSystemsForDuration(
  systemManager: SystemManager,
  world: any,
  durationMs: number,
  deltaTime: number = 16
): Promise<void> {
  const iterations = Math.ceil(durationMs / deltaTime);
  
  for (let i = 0; i < iterations; i++) {
    const entities = world.getAllEntities();
    systemManager.update(entities, world, deltaTime);
    // 非同期処理を挟んでイベントループを回す
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * システムの統計情報を取得
 */
export function getSystemStats(systemManager: SystemManager, world: any) {
  const stats = systemManager.getSystemStats(world);
  return {
    systemCount: stats.length,
    systems: stats,
  };
}

/**
 * SystemManagerのクリーンアップ
 */
export function cleanupSystemManager(systemManager: SystemManager): void {
  // SystemManagerには removeAllSystems メソッドがないため、
  // 個別にシステムを削除する必要がある
  systemManager.stop();
}