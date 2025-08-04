'use client';

import { useRef, useCallback, useEffect } from 'react';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import type { EventMap } from '@/events/types';

/**
 * EventBusを管理するカスタムフック
 * アプリケーション全体でイベント駆動通信を可能にする
 */
export const useEventBus = () => {
  // EventBusインスタンスをuseRefで管理（再レンダリング時に再作成されない）
  const eventBus = useRef<EventBus>(
    new EventBusImpl({
      enableBatching: true,
      enableLogging: process.env.NODE_ENV === 'development',
    })
  ).current;

  /**
   * 型安全なイベント発行関数
   */
  const emit = useCallback(
    <K extends keyof EventMap>(event: K, data: EventMap[K]) => {
      eventBus.emit(event, data);
    },
    [eventBus]
  );

  /**
   * 型安全なイベント購読関数
   */
  const subscribe = useCallback(
    <K extends keyof EventMap>(
      event: K,
      handler: (data: EventMap[K]) => void
    ) => {
      return eventBus.on(event, handler);
    },
    [eventBus]
  );

  /**
   * 型安全な一回限りのイベント購読関数
   */
  const subscribeOnce = useCallback(
    <K extends keyof EventMap>(
      event: K,
      handler: (data: EventMap[K]) => void
    ) => {
      eventBus.once(event, handler);
    },
    [eventBus]
  );

  /**
   * イベントリスナー数を取得する関数
   */
  const getListenerCount = useCallback(
    (event: keyof EventMap) => {
      return eventBus.getListenerCount(event);
    },
    [eventBus]
  );

  // コンポーネントのアンマウント時にEventBusをクリーンアップ
  useEffect(() => {
    return () => {
      eventBus.clear();
    };
  }, [eventBus]);

  return {
    emit,
    subscribe,
    subscribeOnce,
    getListenerCount,
    eventBus,
  };
};