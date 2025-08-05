/**
 * ECSコンポーネント操作のヘルパー関数
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  type IPositionComponent,
  type ITextComponent,
  type IVisualComponent,
  type IAnimationComponent,
  isPositionComponent,
  isTextComponent,
  isVisualComponent,
  isAnimationComponent,
} from './index';

/**
 * World経由でPositionComponentを取得
 */
export const getPositionComponent = (
  world: IWorld,
  entityId: EntityId
): IPositionComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.POSITION);
  return component && isPositionComponent(component) ? component : undefined;
};

/**
 * World経由でTextComponentを取得
 */
export const getTextComponent = (
  world: IWorld,
  entityId: EntityId
): ITextComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.TEXT);
  return component && isTextComponent(component) ? component : undefined;
};

/**
 * World経由でVisualComponentを取得
 */
export const getVisualComponent = (
  world: IWorld,
  entityId: EntityId
): IVisualComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.VISUAL);
  return component && isVisualComponent(component) ? component : undefined;
};

/**
 * World経由でAnimationComponentを取得
 */
export const getAnimationComponent = (
  world: IWorld,
  entityId: EntityId
): IAnimationComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.ANIMATION);
  return component && isAnimationComponent(component) ? component : undefined;
};

/**
 * エンティティがテーマエンティティかどうかを判定
 */
export const isThemeEntity = (
  world: IWorld,
  entityId: EntityId
): boolean => {
  const textComponent = getTextComponent(world, entityId);
  return textComponent?.entityType === 'theme';
};

/**
 * エンティティがアイデアエンティティかどうかを判定
 */
export const isIdeaEntity = (
  world: IWorld,
  entityId: EntityId
): boolean => {
  const textComponent = getTextComponent(world, entityId);
  return textComponent?.entityType === 'idea';
};

/**
 * アイデアエンティティをインデックス順でソートして取得
 */
export const getIdeaEntitiesSortedByIndex = (
  world: IWorld
): EntityId[] => {
  return world.getAllEntities()
    .filter(entityId => isIdeaEntity(world, entityId))
    .sort((a, b) => {
      const posA = getPositionComponent(world, a);
      const posB = getPositionComponent(world, b);
      return (posA?.index || 0) - (posB?.index || 0);
    });
};

/**
 * テーマエンティティを取得（通常は1つのみ）
 */
export const getThemeEntity = (
  world: IWorld
): EntityId | undefined => {
  return world.getAllEntities()
    .find(entityId => isThemeEntity(world, entityId));
};

/**
 * 指定されたインデックスのアイデアエンティティを取得
 */
export const getIdeaEntityByIndex = (
  world: IWorld,
  index: number
): EntityId | undefined => {
  return world.getAllEntities()
    .find(entityId => {
      if (!isIdeaEntity(world, entityId)) return false;
      const posComponent = getPositionComponent(world, entityId);
      return posComponent?.index === index;
    });
};

/**
 * 次に使用可能なインデックスを取得
 */
export const getNextAvailableIndex = (
  world: IWorld
): number => {
  const ideaEntities = getIdeaEntitiesSortedByIndex(world);
  if (ideaEntities.length === 0) return 0;
  
  const lastEntity = ideaEntities[ideaEntities.length - 1];
  const lastPosition = getPositionComponent(world, lastEntity);
  return (lastPosition?.index || 0) + 1;
};

/**
 * エンティティが必要なコンポーネントを全て持っているかチェック
 */
export const hasRequiredComponents = (
  world: IWorld,
  entityId: EntityId,
  requiredTypes: string[]
): boolean => {
  return requiredTypes.every(type => 
    world.hasComponent(entityId, type as any)
  );
};

/**
 * アニメーション中のエンティティを取得
 */
export const getAnimatingEntities = (
  world: IWorld
): EntityId[] => {
  return world.getAllEntities()
    .filter(entityId => {
      const animComponent = getAnimationComponent(world, entityId);
      return animComponent?.isAnimating === true;
    });
};