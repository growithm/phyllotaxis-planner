/**
 * useEntity フック - 個別のエンティティを管理
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useECSContext } from './ECSProvider';
import { ComponentTypes } from '@/ecs/core/Component';
import { LifecycleEvents } from '@/events/types/EventTypes';
import type { EntityId } from '@/ecs/core/Entity';
import type { IComponent, ComponentType } from '@/ecs/core/Component';
import type { UseEntityOptions, UseEntityResult } from './types';

/**
 * 個別のエンティティを管理するフック
 */
export const useEntity = (entityId: EntityId, options: UseEntityOptions = {}): UseEntityResult => {
  const { world, stateSynchronizer } = useECSContext();
  
  const [components, setComponents] = useState<Map<ComponentType, IComponent>>(new Map());
  const [exists, setExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // エンティティ同期
  const syncEntity = useCallback(() => {
    try {
      const entityExists = world.hasEntity(entityId);
      setExists(entityExists);
      
      if (entityExists) {
        const entityComponents = new Map<ComponentType, IComponent>();
        
        Object.values(ComponentTypes).forEach(componentType => {
          if (world.hasComponent(entityId, componentType)) {
            const component = world.getComponent(entityId, componentType);
            if (component) {
              entityComponents.set(componentType, component);
            }
          }
        });
        
        setComponents(entityComponents);
      } else {
        setComponents(new Map());
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [world, entityId]);

  // イベントリスナー設定
  useEffect(() => {
    if (options.autoSync !== false) {
      const unsubscribe = stateSynchronizer.subscribe(`useEntity-${entityId}`, {
        eventTypes: [
          LifecycleEvents.AFTER_DESTROY,
          LifecycleEvents.COMPONENT_ADDED,
          LifecycleEvents.COMPONENT_REMOVED
        ],
        callback: (eventType, data) => {
          // エンティティ固有のイベントをフィルタリング
          if (data.entityId === entityId) {
            if (eventType === LifecycleEvents.COMPONENT_ADDED || eventType === LifecycleEvents.COMPONENT_REMOVED) {
              const componentType = data.componentType as ComponentType;
              if (!options.watchComponents || options.watchComponents.includes(componentType)) {
                syncEntity();
              }
            } else {
              syncEntity();
            }
          }
        }
      });

      return unsubscribe;
    }
  }, [stateSynchronizer, entityId, syncEntity, options.autoSync, options.watchComponents]);

  // コンポーネント操作
  const hasComponent = useCallback((componentType: ComponentType) => {
    return components.has(componentType);
  }, [components]);

  const getComponent = useCallback(<T extends IComponent>(componentType: ComponentType): T | undefined => {
    return components.get(componentType) as T | undefined;
  }, [components]);

  const addComponent = useCallback(<T extends IComponent>(component: T) => {
    setIsLoading(true);
    try {
      world.addComponent(entityId, component);
      if (options.autoSync === false) {
        syncEntity();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [world, entityId, syncEntity, options.autoSync]);

  const removeComponent = useCallback((componentType: ComponentType) => {
    setIsLoading(true);
    try {
      const result = world.removeComponent(entityId, componentType);
      if (options.autoSync === false) {
        syncEntity();
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [world, entityId, syncEntity, options.autoSync]);

  // 初期同期
  useEffect(() => {
    syncEntity();
  }, [syncEntity]);

  return {
    entityId,
    exists,
    components,
    hasComponent,
    getComponent,
    addComponent,
    removeComponent,
    isLoading,
    error
  };
};