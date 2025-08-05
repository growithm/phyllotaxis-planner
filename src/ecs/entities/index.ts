/**
 * ECSエンティティ管理システムのエクスポート
 */

// EntityTypes
export type { 
  EntityType, 
  EntityTypeInfo, 
  TypeConstraints, 
  ComponentValidation, 
  EntityTypeStatistics 
} from './EntityTypes';
export { 
  ENTITY_TYPE_CONFIG, 
  EntityTypeManager 
} from './EntityTypes';

// EntityFactory
export type { CreateEntityOptions } from './EntityFactory';
export { EntityFactory } from './EntityFactory';

// EntityManager
export type { 
  EntityQuery, 
  EntityStatistics, 
  EntityValidation 
} from './EntityManager';
export { EntityManager } from './EntityManager';