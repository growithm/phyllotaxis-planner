/**
 * useQuery フック - リアクティブなエンティティクエリ
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useECSContext } from './ECSProvider';
import { LifecycleEvents } from '@/events/types/EventTypes';
import type { EntityId } from '@/ecs/core/Entity';
import type { QueryFilter } from '@/ecs/query/types/QueryTypes';
import type { UseQueryOptions, UseQueryResult } from './types';

/**
 * リアクティブなエンティティクエリを提供するフック
 */
export const useQuery = (filter: QueryFilter, options: UseQueryOptions = {}): UseQueryResult => {
  const { world, stateSynchronizer } = useECSContext();
  
  const [entities, setEntities] = useState<EntityId[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [executionTime, setExecutionTime] = useState(0);
  const [fromCache, setFromCache] = useState(false);

  // クエリ実行
  const executeQuery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      
      // Worldのクエリ機能を使用
      const queryResult = world.query(filter);
      let result: EntityId[] = queryResult.entities;
      
      // ページネーション
      if (options.pagination) {
        const { page, pageSize } = options.pagination;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        result = result.slice(startIndex, endIndex);
      }
      
      const endTime = performance.now();
      
      setEntities(result);
      setTotalCount(result.length);
      setExecutionTime(endTime - startTime);
      setFromCache(false);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [world, filter, options.pagination]);

  // デバウンス/スロットル処理
  const debouncedExecuteQuery = useMemo(() => {
    if (options.debounceMs) {
      return debounce(executeQuery, options.debounceMs);
    }
    if (options.throttleMs) {
      return throttle(executeQuery, options.throttleMs);
    }
    return executeQuery;
  }, [executeQuery, options.debounceMs, options.throttleMs]);

  // 自動更新
  useEffect(() => {
    if (options.autoUpdate !== false) {
      const interval = options.updateInterval || 1000;
      
      const intervalId = setInterval(() => {
        debouncedExecuteQuery();
      }, interval);
      
      return () => clearInterval(intervalId);
    }
  }, [debouncedExecuteQuery, options.autoUpdate, options.updateInterval]);

  // イベントリスナー設定
  useEffect(() => {
    if (options.autoUpdate !== false) {
      const unsubscribe = stateSynchronizer.subscribe(`useQuery-${JSON.stringify(filter)}`, {
        eventTypes: [
          LifecycleEvents.AFTER_CREATE,
          LifecycleEvents.AFTER_DESTROY,
          LifecycleEvents.COMPONENT_ADDED,
          LifecycleEvents.COMPONENT_REMOVED
        ],
        callback: () => {
          debouncedExecuteQuery();
        }
      });

      return unsubscribe;
    }
  }, [stateSynchronizer, debouncedExecuteQuery, options.autoUpdate, filter]);

  // 初期実行
  useEffect(() => {
    debouncedExecuteQuery();
  }, [debouncedExecuteQuery]);

  return {
    entities,
    totalCount,
    isLoading,
    error,
    refetch: executeQuery,
    executionTime,
    fromCache
  };
};

// ユーティリティ関数
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function throttle<T extends (...args: unknown[]) => unknown>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}