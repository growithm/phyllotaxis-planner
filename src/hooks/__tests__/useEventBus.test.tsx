import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventBus } from '@/hooks/useEventBus';
import { IdeaEvents } from '@/events/types';

describe('useEventBus', () => {
  it('EventBusインスタンスが正しく作成されること', () => {
    const { result } = renderHook(() => useEventBus());

    expect(result.current.eventBus).toBeDefined();
    expect(typeof result.current.emit).toBe('function');
    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.subscribeOnce).toBe('function');
    expect(typeof result.current.getListenerCount).toBe('function');
  });

  it('emit関数でイベントを発行できること', async () => {
    const { result } = renderHook(() => useEventBus());
    const handler = vi.fn();
    const testData = { id: '1', text: 'test', timestamp: new Date() };

    act(() => {
      result.current.subscribe(IdeaEvents.IDEA_ADDED, handler);
    });

    act(() => {
      result.current.emit(IdeaEvents.IDEA_ADDED, testData);
    });

    // バッチング処理を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(handler).toHaveBeenCalledWith(testData);
  });

  it('subscribe関数でイベントリスナーを登録できること', async () => {
    const { result } = renderHook(() => useEventBus());
    const handler = vi.fn();
    const testData = { id: '1', text: 'test', timestamp: new Date() };

    let unsubscribe: (() => void) | undefined;

    act(() => {
      unsubscribe = result.current.subscribe(IdeaEvents.IDEA_ADDED, handler);
    });

    act(() => {
      result.current.emit(IdeaEvents.IDEA_ADDED, testData);
    });

    // バッチング処理を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(handler).toHaveBeenCalledWith(testData);

    // アンサブスクライブ
    act(() => {
      unsubscribe?.();
    });

    act(() => {
      result.current.emit(IdeaEvents.IDEA_ADDED, testData);
    });

    // バッチング処理を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // アンサブスクライブ後は呼び出されない
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('subscribeOnce関数で一回限りのリスナーを登録できること', async () => {
    const { result } = renderHook(() => useEventBus());
    const handler = vi.fn();
    const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
    const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

    act(() => {
      result.current.subscribeOnce(IdeaEvents.IDEA_ADDED, handler);
    });

    act(() => {
      result.current.emit(IdeaEvents.IDEA_ADDED, testData1);
    });

    act(() => {
      result.current.emit(IdeaEvents.IDEA_ADDED, testData2);
    });

    // バッチング処理を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(testData1);
  });

  it('getListenerCount関数でリスナー数を取得できること', () => {
    const { result } = renderHook(() => useEventBus());
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    expect(result.current.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(0);

    act(() => {
      result.current.subscribe(IdeaEvents.IDEA_ADDED, handler1);
    });

    expect(result.current.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(1);

    act(() => {
      result.current.subscribe(IdeaEvents.IDEA_ADDED, handler2);
    });

    expect(result.current.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(2);
  });

  it('コンポーネントのアンマウント時にEventBusがクリアされること', () => {
    const { result, unmount } = renderHook(() => useEventBus());
    const handler = vi.fn();
    const testData = { id: '1', text: 'test', timestamp: new Date() };

    act(() => {
      result.current.subscribe(IdeaEvents.IDEA_ADDED, handler);
    });

    expect(result.current.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(1);

    // アンマウント
    unmount();

    // 新しいフックインスタンスを作成
    const { result: newResult } = renderHook(() => useEventBus());

    act(() => {
      newResult.current.emit(IdeaEvents.IDEA_ADDED, testData);
    });

    // 前のハンドラーは呼び出されない（クリアされている）
    expect(handler).not.toHaveBeenCalled();
  });

  it('同じフックインスタンスでは同じEventBusが使用されること', () => {
    const { result, rerender } = renderHook(() => useEventBus());
    const firstEventBus = result.current.eventBus;

    rerender();

    const secondEventBus = result.current.eventBus;

    expect(firstEventBus).toBe(secondEventBus);
  });
});