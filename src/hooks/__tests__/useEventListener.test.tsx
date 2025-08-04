import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventListener, useEventListenerOnce } from '@/hooks/useEventListener';
import { useEventBus } from '@/hooks/useEventBus';
import { IdeaEvents } from '@/events/types';
import type { EventBus } from '@/events/core';

// useEventBusをモック
vi.mock('@/hooks/useEventBus');

describe('useEventListener', () => {
  const mockSubscribe = vi.fn();
  const mockSubscribeOnce = vi.fn();
  const mockEmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // useEventBusのモック実装
    (useEventBus as MockedFunction<typeof useEventBus>).mockReturnValue({
      subscribe: mockSubscribe,
      subscribeOnce: mockSubscribeOnce,
      emit: mockEmit,
      getListenerCount: vi.fn(),
      eventBus: {} as EventBus,
    });
  });

  describe('useEventListener', () => {
    it('イベントリスナーが正しく登録されること', () => {
      const handler = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      renderHook(() => 
        useEventListener(IdeaEvents.IDEA_ADDED, handler)
      );

      expect(mockSubscribe).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler);
    });

    it('コンポーネントのアンマウント時にリスナーが解除されること', () => {
      const handler = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => 
        useEventListener(IdeaEvents.IDEA_ADDED, handler)
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('依存配列が変更された時にリスナーが再登録されること', () => {
      const handler = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      let dependency = 'initial';
      const { rerender } = renderHook(() => 
        useEventListener(IdeaEvents.IDEA_ADDED, handler, [dependency])
      );

      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      // 依存配列を変更
      dependency = 'changed';
      rerender();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(mockSubscribe).toHaveBeenCalledTimes(2);
    });

    it('イベント名が変更された時にリスナーが再登録されること', () => {
      const handler = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      let eventType = IdeaEvents.IDEA_ADDED;
      const { rerender } = renderHook(() => 
        useEventListener(eventType, handler)
      );

      expect(mockSubscribe).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler);

      // イベント名を変更
      eventType = IdeaEvents.IDEA_REMOVED;
      rerender();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(mockSubscribe).toHaveBeenCalledWith(IdeaEvents.IDEA_REMOVED, handler);
    });

    it('ハンドラーが変更された時にリスナーが再登録されること', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const mockUnsubscribe = vi.fn();
      mockSubscribe.mockReturnValue(mockUnsubscribe);

      const { rerender } = renderHook(
        ({ handler }) => useEventListener(IdeaEvents.IDEA_ADDED, handler),
        { initialProps: { handler: handler1 } }
      );

      expect(mockSubscribe).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler1);

      // ハンドラーを変更
      rerender({ handler: handler2 });

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      expect(mockSubscribe).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler2);
    });
  });

  describe('useEventListenerOnce', () => {
    it('一回限りのイベントリスナーが正しく登録されること', () => {
      const handler = vi.fn();

      renderHook(() => 
        useEventListenerOnce(IdeaEvents.IDEA_ADDED, handler)
      );

      expect(mockSubscribeOnce).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler);
    });

    it('依存配列が変更された時にリスナーが再登録されること', () => {
      const handler = vi.fn();

      let dependency = 'initial';
      const { rerender } = renderHook(() => 
        useEventListenerOnce(IdeaEvents.IDEA_ADDED, handler, [dependency])
      );

      expect(mockSubscribeOnce).toHaveBeenCalledTimes(1);

      // 依存配列を変更
      dependency = 'changed';
      rerender();

      expect(mockSubscribeOnce).toHaveBeenCalledTimes(2);
    });

    it('イベント名が変更された時にリスナーが再登録されること', () => {
      const handler = vi.fn();

      let eventType = IdeaEvents.IDEA_ADDED;
      const { rerender } = renderHook(() => 
        useEventListenerOnce(eventType, handler)
      );

      expect(mockSubscribeOnce).toHaveBeenCalledWith(IdeaEvents.IDEA_ADDED, handler);

      // イベント名を変更
      eventType = IdeaEvents.IDEA_REMOVED;
      rerender();

      expect(mockSubscribeOnce).toHaveBeenCalledWith(IdeaEvents.IDEA_REMOVED, handler);
    });
  });
});