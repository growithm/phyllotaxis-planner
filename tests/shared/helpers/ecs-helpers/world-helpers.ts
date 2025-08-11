/**
 * ECS World関連のテストヘルパー
 */

import { World } from '@/ecs/core/World';
import { SystemManager } from '@/ecs/core/SystemManager';
import { EventBusManager } from '@/events/EventBusManager';
import type { EventBus } from '@/events/core/EventBus';

/**
 * テスト用のEventBusを作成
 */
export function createTestEventBus(): EventBus {
  const eventBusManager = new EventBusManager();
  return eventBusManager.getEventBus();
}

/**
 * テスト用のWorldインスタンスを作成
 */
export function createTestWorld(): World {
  const eventBus = createTestEventBus();
  return new World(eventBus);
}

/**
 * テスト用のSystemManagerを作成
 */
export function createTestSystemManager(eventBus: EventBus): SystemManager {
  return new SystemManager(eventBus);
}

/**
 * テスト実行後のWorldクリーンアップ
 */
export function cleanupWorld(world: World): void {
  // 全エンティティを削除
  const entities = world.getAllEntities();
  entities.forEach(entityId => {
    world.destroyEntity(entityId);
  });
}

/**
 * Worldの状態を取得（デバッグ用）
 */
export function getWorldState(world: World) {
  const entities = world.getAllEntities();
  return {
    entityCount: entities.length,
    entities: entities.map(entityId => ({
      id: entityId,
      // コンポーネント情報は簡略化
      hasComponents: true,
    })),
  };
}