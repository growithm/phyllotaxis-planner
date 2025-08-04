import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { ThemeChangeFlow } from '@/systems/flows';
import { IdeaEvents, SystemEvents } from '@/events/types';
import type { ThemeChangedEvent } from '@/events/types';

describe('ThemeChangeFlow', () => {
  let eventBus: EventBus;
  let themeChangeFlow: ThemeChangeFlow;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    themeChangeFlow = new ThemeChangeFlow(eventBus);
  });

  afterEach(() => {
    themeChangeFlow.destroy();
    eventBus.clear();
  });

  describe('テーマ変更フロー', () => {
    it('テーマ変更イベントを処理すること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const themeData: ThemeChangedEvent = {
        oldTheme: 'Old Theme',
        newTheme: 'New Theme',
        timestamp: new Date(),
      };

      eventBus.emit(IdeaEvents.THEME_CHANGED, themeData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Theme changed from "Old Theme" to "New Theme"'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Updating center theme to: New Theme'
      );

      consoleSpy.mockRestore();
    });

    it('テーマ変更時に描画要求イベントを発火すること', () => {
      const renderHandler = vi.fn();
      const themeData: ThemeChangedEvent = {
        oldTheme: 'Old Theme',
        newTheme: 'New Theme',
        timestamp: new Date(),
      };

      eventBus.on(SystemEvents.RENDER_REQUESTED, renderHandler);
      eventBus.emit(IdeaEvents.THEME_CHANGED, themeData);

      expect(renderHandler).toHaveBeenCalledWith({
        priority: 'normal',
        timestamp: expect.any(Date),
      });
    });

    it('テーマ変更時にアニメーション開始イベントを発火すること', () => {
      const animationHandler = vi.fn();
      const themeData: ThemeChangedEvent = {
        oldTheme: 'Old Theme',
        newTheme: 'New Theme',
        timestamp: new Date(),
      };

      eventBus.on(SystemEvents.ANIMATION_START, animationHandler);
      eventBus.emit(IdeaEvents.THEME_CHANGED, themeData);

      expect(animationHandler).toHaveBeenCalledWith({
        entityId: 'center-theme',
        animationType: 'pulse',
        duration: 300,
        easing: 'ease-in-out',
      });
    });

    it('完全なテーマ変更フローが正常に動作すること', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const renderHandler = vi.fn();
      const animationHandler = vi.fn();

      eventBus.on(SystemEvents.RENDER_REQUESTED, renderHandler);
      eventBus.on(SystemEvents.ANIMATION_START, animationHandler);

      const themeData: ThemeChangedEvent = {
        oldTheme: 'My Project',
        newTheme: 'Phyllotaxis Planner',
        timestamp: new Date(),
      };

      eventBus.emit(IdeaEvents.THEME_CHANGED, themeData);

      // 非同期処理を待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      // ログ出力の確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Theme changed from "My Project" to "Phyllotaxis Planner"'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Updating center theme to: Phyllotaxis Planner'
      );

      // イベント発火の確認
      expect(renderHandler).toHaveBeenCalledWith({
        priority: 'normal',
        timestamp: expect.any(Date),
      });

      expect(animationHandler).toHaveBeenCalledWith({
        entityId: 'center-theme',
        animationType: 'pulse',
        duration: 300,
        easing: 'ease-in-out',
      });

      consoleSpy.mockRestore();
    });

    it('空のテーマでも正常に処理されること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const themeData: ThemeChangedEvent = {
        oldTheme: '',
        newTheme: '',
        timestamp: new Date(),
      };

      eventBus.emit(IdeaEvents.THEME_CHANGED, themeData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Theme changed from "" to ""'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThemeChangeFlow] Updating center theme to: '
      );

      consoleSpy.mockRestore();
    });
  });

  describe('破棄処理', () => {
    it('destroy メソッドでリスナーが削除されること', () => {
      // ログを有効にしたEventBusとFlowを作成してテスト
      const testEventBus = new EventBusImpl({ enableLogging: true });
      const testFlow = new ThemeChangeFlow(testEventBus);

      expect(testEventBus.getListenerCount(IdeaEvents.THEME_CHANGED)).toBe(1);

      testFlow.destroy();

      expect(testEventBus.getListenerCount(IdeaEvents.THEME_CHANGED)).toBe(0);

      testEventBus.clear();
    });
  });
});