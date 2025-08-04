'use client';

import { useEffect } from 'react';
import type { EventMap } from '@/events/types';
import { useEventBus } from './useEventBus';

/**
 * イベントリスナーを管理するカスタムフック
 * コンポーネントのライフサイクルに合わせて自動的にリスナーの登録・解除を行う
 *
 * @param event - 購読するイベント名
 * @param handler - イベントハンドラー関数
 * @param deps - 依存配列（useEffectと同様）
 */
export const useEventListener = <K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
  deps: React.DependencyList = []
) => {
  const { subscribe } = useEventBus();

  useEffect(() => {
    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, subscribe, handler, ...deps]);
};

/**
 * 一回限りのイベントリスナーを管理するカスタムフック
 *
 * @param event - 購読するイベント名
 * @param handler - イベントハンドラー関数
 * @param deps - 依存配列
 */
export const useEventListenerOnce = <K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
  deps: React.DependencyList = []
) => {
  const { subscribeOnce } = useEventBus();

  useEffect(() => {
    subscribeOnce(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, subscribeOnce, handler, ...deps]);
};
