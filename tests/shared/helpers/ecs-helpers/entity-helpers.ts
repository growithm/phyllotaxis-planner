/**
 * ECSエンティティ関連のテストヘルパー
 */

import { World } from '@/ecs/core/World';
import type { EntityId } from '@/ecs/core/Entity';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createTextComponent } from '@/ecs/components/TextComponent';
import { createAnimationComponent } from '@/ecs/components/AnimationComponent';
import { createVisualComponent } from '@/ecs/components/VisualComponent';

/**
 * テスト用のアイデアエンティティを作成
 */
export function createTestIdeaEntity(
  world: World,
  text: string,
  x: number = 0,
  y: number = 0
): EntityId {
  const entityId = world.createEntity();

  // 必要なコンポーネントを追加
  world.addComponent(entityId, createPositionComponent(x, y));
  world.addComponent(entityId, createTextComponent(text, 'idea'));
  world.addComponent(entityId, createAnimationComponent());
  world.addComponent(entityId, createVisualComponent('leaf', {
    width: 20,
    height: 30,
    fillColor: '#4ade80',
    strokeColor: '#16a34a',
  }));

  return entityId;
}

/**
 * テスト用の中心テーマエンティティを作成
 */
export function createTestThemeEntity(
  world: World,
  text: string
): EntityId {
  const entityId = world.createEntity();

  // 中心位置に配置
  world.addComponent(entityId, createPositionComponent(400, 300));
  world.addComponent(entityId, createTextComponent(text, 'theme'));
  world.addComponent(entityId, createVisualComponent('circle', {
    width: 40,
    height: 40,
    fillColor: '#8b5cf6',
    strokeColor: '#7c3aed',
  }));

  return entityId;
}

/**
 * 複数のテストエンティティを一括作成
 */
export function createMultipleTestEntities(
  world: World,
  count: number,
  prefix: string = 'アイデア'
): EntityId[] {
  const entities: EntityId[] = [];
  
  for (let i = 0; i < count; i++) {
    const entityId = createTestIdeaEntity(world, `${prefix}${i + 1}`);
    entities.push(entityId);
  }
  
  return entities;
}

/**
 * エンティティの位置を取得
 */
export function getEntityPosition(world: World, entityId: EntityId): { x: number; y: number } | null {
  const positionComponent = world.getComponent(entityId, ComponentTypes.POSITION) as any;
  if (!positionComponent) {
    return null;
  }
  return { x: positionComponent.x, y: positionComponent.y };
}

/**
 * エンティティがアニメーション中かどうかを確認
 */
export function isEntityAnimating(world: World, entityId: EntityId): boolean {
  const animationComponent = world.getComponent(entityId, ComponentTypes.ANIMATION) as any;
  return animationComponent?.isAnimating ?? false;
}

/**
 * エンティティのテキスト内容を取得
 */
export function getEntityText(world: World, entityId: EntityId): string | null {
  const textComponent = world.getComponent(entityId, ComponentTypes.TEXT) as any;
  return textComponent?.content ?? null;
}

/**
 * エンティティの視覚情報を取得
 */
export function getEntityVisual(world: World, entityId: EntityId) {
  const visualComponent = world.getComponent(entityId, ComponentTypes.VISUAL) as any;
  if (!visualComponent) {
    return null;
  }
  
  return {
    shape: visualComponent.shape,
    width: visualComponent.width,
    height: visualComponent.height,
    fillColor: visualComponent.fillColor,
    strokeColor: visualComponent.strokeColor,
    visible: visualComponent.visible,
  };
}