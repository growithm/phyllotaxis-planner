/**
 * ECS React統合フック
 * 
 * ECSアーキテクチャとReactの統合を提供するカスタムフックとコンポーネント
 */

// Context
export { ECSProvider, useECSContext } from './ECSProvider';

// Core hooks
export { useWorld } from './useWorld';
export { useEntity } from './useEntity';
export { useComponent } from './useComponent';
export { useQuery } from './useQuery';

// High-level components
export { EntityRenderer } from '@/components/ecs/EntityRenderer';
export { QueryRenderer } from '@/components/ecs/QueryRenderer';
export { VirtualizedEntityList } from '@/components/ecs/VirtualizedEntityList';

// Types
export type {
  UseWorldOptions,
  UseWorldResult,
  UseEntityOptions,
  UseEntityResult,
  UseComponentOptions,
  UseComponentResult,
  UseQueryOptions,
  UseQueryResult,
  ECSContext,
  WorldStats
} from './types';

// Utilities
export { StateSynchronizer } from './StateSynchronizer';
export { BatchUpdater } from './BatchUpdater';