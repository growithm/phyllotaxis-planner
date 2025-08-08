/**
 * useComponent フック - 特定のコンポーネントを管理
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useECSContext } from './ECSProvider';
import { LifecycleEvents } from '@/events/types/EventTypes';
import type { EntityId } from '@/ecs/core/Entity';
import type { IComponent, ComponentType } from '@/ecs/core/Component';
import type { UseComponentOptions, UseComponentResult } from './types';

/**
 * 特定のコンポーネントを管理するフック
 */
export const useComponent = <T extends IComponent>(
  entityId: EntityId,
  componentType: ComponentType,
  options: UseComponentOptions<T> = {}
): UseComponentResult<T> => {
  const { world, stateSynchronizer } = useECSContext();
  
  const [component, setComponent] = useState<T | undefined>(undefined);
  const [exists, setExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // optionsを安定化
  const stableOptions = useMemo(() => options, [options]);

  // コンポーネント同期
  const syncComponent = useCallback(() => {
    try {
      const currentComponent = world.getComponent<T>(entityId, componentType);
      setComponent(currentComponent);
      setExists(!!currentComponent);
      
      // 自動作成
      if (!currentComponent && stableOptions.autoCreate && stableOptions.defaultValue) {
        const newComponent = { type: componentType, ...stableOptions.defaultValue } as T;
        world.addComponent(entityId, newComponent);
        setComponent(newComponent);
        setExists(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [world, entityId, componentType, stableOptions]);

  // イベントリスナー設定
  useEffect(() => {
    const unsubscribe = stateSynchronizer.subscribe(`useComponent-${entityId}-${componentType}`, {
      eventTypes: [LifecycleEvents.COMPONENT_ADDED, LifecycleEvents.COMPONENT_REMOVED],
      callback: (eventType, data) => {
        if (data.entityId === entityId && data.componentType === componentType) {
          syncComponent();
        }
      }
    });

    return unsubscribe;
  }, [stateSynchronizer, entityId, componentType, syncComponent]);

  // コンポーネント操作
  const update = useCallback((updates: Partial<T>) => {
    if (!component) return;
    
    setIsLoading(true);
    try {
      const updatedComponent = { ...component, ...updates };
      
      // バリデーション
      if (stableOptions.validator && !stableOptions.validator(updatedComponent)) {
        throw new Error('Component validation failed');
      }
      
      world.removeComponent(entityId, componentType);
      world.addComponent(entityId, updatedComponent);
      
      setComponent(updatedComponent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [component, world, entityId, componentType, stableOptions]);

  const replace = useCallback((newComponent: T) => {
    setIsLoading(true);
    try {
      // バリデーション
      if (stableOptions.validator && !stableOptions.validator(newComponent)) {
        throw new Error('Component validation failed');
      }
      
      if (exists) {
        world.removeComponent(entityId, componentType);
      }
      world.addComponent(entityId, newComponent);
      
      setComponent(newComponent);
      setExists(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [world, entityId, componentType, exists, stableOptions]);

  const remove = useCallback(() => {
    setIsLoading(true);
    try {
      const result = world.removeComponent(entityId, componentType);
      if (result) {
        setComponent(undefined);
        setExists(false);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [world, entityId, componentType]);

  // 初期同期
  useEffect(() => {
    syncComponent();
  }, [syncComponent]);

  return {
    component,
    exists,
    update,
    replace,
    remove,
    isLoading,
    error
  };
};