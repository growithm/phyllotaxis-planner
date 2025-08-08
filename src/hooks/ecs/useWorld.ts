/**
 * useWorld フック - ECSのWorldとReactの状態を統合
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useECSContext } from './ECSProvider';
import { LifecycleEvents } from '@/events/types/EventTypes';
import type { EntityId } from '@/ecs/core/Entity';
import type { IComponent, ComponentType } from '@/ecs/core/Component';
import type { QueryFilter } from '@/ecs/query/types/QueryTypes';
import type { UseWorldOptions, UseWorldResult, WorldStats } from './types';

/**
 * Worldインスタンスと基本的なECS操作を提供するフック
 */
export const useWorld = (options: UseWorldOptions = {}): UseWorldResult => {
  const { world, stateSynchronizer, batchUpdater } = useECSContext();
  
  // 状態管理
  const [entities, setEntities] = useState<EntityId[]>([]);
  const [version, setVersion] = useState(0);
  const [stats, setStats] = useState<WorldStats>(() => ({
    entityCount: 0,
    componentCount: 0,
    systemCount: 0,
    version: 0,
    memoryUsage: 0
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 自動同期設定
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // World同期
  const syncWithWorld = useCallback(() => {
    try {
      const currentVersion = world.getVersion();
      if (currentVersion !== version) {
        setEntities(world.getAllEntities());
        setVersion(currentVersion);
        
        const performanceStats = world.getPerformanceStats();
        setStats({
          entityCount: performanceStats.entityCount,
          componentCount: performanceStats.componentCount,
          systemCount: performanceStats.systemCount,
          version: performanceStats.version,
          memoryUsage: performanceStats.memoryUsage
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [world, version]);

  // 自動同期設定
  useEffect(() => {
    if (options.autoSync !== false) {
      const interval = options.syncInterval || 100;
      
      syncIntervalRef.current = setInterval(() => {
        syncWithWorld();
      }, interval);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [options.autoSync, options.syncInterval, syncWithWorld]);

  // イベントリスナー設定
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // StateSynchronizerを使用してイベントを購読
    const unsubscribe = stateSynchronizer.subscribe('useWorld', {
      eventTypes: [
        LifecycleEvents.AFTER_CREATE,
        LifecycleEvents.AFTER_DESTROY,
        LifecycleEvents.COMPONENT_ADDED,
        LifecycleEvents.COMPONENT_REMOVED
      ],
      callback: () => {
        if (options.autoSync !== false) {
          syncWithWorld();
        }
      }
    });

    unsubscribers.push(unsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [stateSynchronizer, syncWithWorld, options.autoSync]);

  // エンティティ操作
  const createEntity = useCallback(() => {
    setIsLoading(true);
    try {
      const entityId = world.createEntity();
      if (options.autoSync === false) {
        syncWithWorld();
      }
      return entityId;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [world, syncWithWorld, options.autoSync]);

  const destroyEntity = useCallback((entityId: EntityId) => {
    setIsLoading(true);
    try {
      const result = world.destroyEntity(entityId);
      if (options.autoSync === false) {
        syncWithWorld();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [world, syncWithWorld, options.autoSync]);

  // コンポーネント操作
  const addComponent = useCallback(<T extends IComponent>(entityId: EntityId, component: T) => {
    setIsLoading(true);
    try {
      world.addComponent(entityId, component);
      if (options.autoSync === false) {
        syncWithWorld();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [world, syncWithWorld, options.autoSync]);

  const removeComponent = useCallback((entityId: EntityId, componentType: ComponentType) => {
    setIsLoading(true);
    try {
      const result = world.removeComponent(entityId, componentType);
      if (options.autoSync === false) {
        syncWithWorld();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [world, syncWithWorld, options.autoSync]);

  const getComponent = useCallback(<T extends IComponent>(entityId: EntityId, componentType: ComponentType): T | undefined => {
    try {
      return world.getComponent<T>(entityId, componentType);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return undefined;
    }
  }, [world]);

  // クエリ操作
  const query = useCallback((filter: QueryFilter) => {
    try {
      const queryResult = world.query(filter);
      return queryResult.entities;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [world]);

  // バッチ操作
  const batchUpdate = useCallback((operations: () => void) => {
    if (options.enableBatching !== false) {
      batchUpdater.batch(operations);
    } else {
      operations();
    }
    
    if (options.autoSync === false) {
      syncWithWorld();
    }
  }, [batchUpdater, syncWithWorld, options.enableBatching, options.autoSync]);

  // 初期同期
  useEffect(() => {
    syncWithWorld();
  }, [syncWithWorld]);

  return {
    world,
    stats,
    version,
    entities,
    createEntity,
    destroyEntity,
    addComponent,
    removeComponent,
    getComponent,
    query,
    batchUpdate,
    isLoading,
    error,
    performanceStats: stats
  };
};