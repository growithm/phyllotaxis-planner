import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { IdeaAdditionFlow } from '@/systems/flows';
import { IdeaEvents, SystemEvents } from '@/events/types';
import type {
  IdeaAddedEvent,
  PositionCalculatedEvent,
  AnimationEvent,
} from '@/events/types';

describe('IdeaAdditionFlow', () => {
  let eventBus: EventBus;
  let ideaAdditionFlow: IdeaAdditionFlow;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    ideaAdditionFlow = new IdeaAdditionFlow(eventBus);
  });

  afterEach(() => {
    ideaAdditionFlow.destroy();
    eventBus.clear();
  });

  describe('アイデア追加フロー', () => {
    it('アイデア追加イベントを処理すること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const ideaData: IdeaAddedEvent = {
        id: 'test-idea-1',
        text: 'Test Idea',
        timestamp: new Date(),
      };

      eventBus.emit(IdeaEvents.IDEA_ADDED, ideaData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[IdeaAdditionFlow] Processing idea addition: Test Idea'
      );

      consoleSpy.mockRestore();
    });

    it('位置計算完了時にアニメーション開始イベントを発火すること', () => {
      const animationHandler = vi.fn();
      const positionData: PositionCalculatedEvent = {
        entityId: 'test-entity',
        position: { x: 100, y: 200 },
        angle: 45,
        radius: 150,
        index: 1,
      };

      eventBus.on(SystemEvents.ANIMATION_START, animationHandler);
      eventBus.emit(SystemEvents.POSITION_CALCULATED, positionData);

      expect(animationHandler).toHaveBeenCalledWith({
        entityId: 'test-entity',
        animationType: 'fadeIn',
        duration: 600,
        easing: 'ease-out',
      });
    });

    it('アニメーション開始時に描画要求イベントを発火すること', () => {
      const renderHandler = vi.fn();
      const animationData: AnimationEvent = {
        entityId: 'test-entity',
        animationType: 'fadeIn',
        duration: 600,
        easing: 'ease-out',
      };

      eventBus.on(SystemEvents.RENDER_REQUESTED, renderHandler);
      eventBus.emit(SystemEvents.ANIMATION_START, animationData);

      expect(renderHandler).toHaveBeenCalledWith({
        entityId: 'test-entity',
        priority: 'high',
        timestamp: expect.any(Date),
      });
    });

    it('完全なフローが正常に動作すること', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const renderHandler = vi.fn();

      eventBus.on(SystemEvents.RENDER_REQUESTED, renderHandler);

      // 1. アイデア追加
      const ideaData: IdeaAddedEvent = {
        id: 'test-idea-1',
        text: 'Test Idea',
        timestamp: new Date(),
      };
      eventBus.emit(IdeaEvents.IDEA_ADDED, ideaData);

      // 2. 位置計算完了（通常はPhyllotaxisSystemが発火）
      const positionData: PositionCalculatedEvent = {
        entityId: 'test-idea-1',
        position: { x: 100, y: 200 },
        angle: 45,
        radius: 150,
        index: 1,
      };
      eventBus.emit(SystemEvents.POSITION_CALCULATED, positionData);

      // 非同期処理を待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      // 最終的に描画要求が発火されることを確認
      expect(renderHandler).toHaveBeenCalledWith({
        entityId: 'test-idea-1',
        priority: 'high',
        timestamp: expect.any(Date),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[IdeaAdditionFlow] Processing idea addition: Test Idea'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[IdeaAdditionFlow] Position calculated for entity: test-idea-1'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[IdeaAdditionFlow] Animation started for entity: test-idea-1'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('破棄処理', () => {
    it('destroy メソッドでリスナーが削除されること', () => {
      // ログを有効にしたEventBusとFlowを作成してテスト
      const testEventBus = new EventBusImpl({ enableLogging: true });
      const testFlow = new IdeaAdditionFlow(testEventBus);

      // 初期状態の確認
      expect(testEventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(1);
      expect(
        testEventBus.getListenerCount(SystemEvents.POSITION_CALCULATED)
      ).toBe(1);
      expect(testEventBus.getListenerCount(SystemEvents.ANIMATION_START)).toBe(
        1
      );

      // destroyメソッドを使用してテスト
      testFlow.destroy();

      expect(testEventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(0);
      expect(
        testEventBus.getListenerCount(SystemEvents.POSITION_CALCULATED)
      ).toBe(0);
      expect(testEventBus.getListenerCount(SystemEvents.ANIMATION_START)).toBe(
        0
      );

      testEventBus.clear();
    });
  });
});
