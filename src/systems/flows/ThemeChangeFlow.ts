import type { EventBus } from '@/events/core';
import { IdeaEvents, SystemEvents } from '@/events/types';
import type { ThemeChangedEvent } from '@/events/types';

/**
 * テーマ変更フローを管理するクラス
 * 中心テーマの変更から描画更新までの一連の処理を調整する
 */
export class ThemeChangeFlow {
  private unsubscribeFunctions: (() => void)[] = [];

  constructor(private eventBus: EventBus) {
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    const unsubscribe = this.eventBus.on(IdeaEvents.THEME_CHANGED, this.handleThemeChange);
    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * テーマ変更イベントを処理する
   * @param data - テーマ変更イベントデータ
   */
  private handleThemeChange = (data: ThemeChangedEvent): void => {
    console.log(`[ThemeChangeFlow] Theme changed from "${data.oldTheme}" to "${data.newTheme}"`);

    // 中心テーマの更新
    this.updateCenterTheme(data.newTheme);

    // 全体の再描画要求
    this.eventBus.emit(SystemEvents.RENDER_REQUESTED, {
      priority: 'normal',
      timestamp: new Date(),
    });

    // アニメーション効果（オプション）
    this.eventBus.emit(SystemEvents.ANIMATION_START, {
      entityId: 'center-theme',
      animationType: 'pulse',
      duration: 300,
      easing: 'ease-in-out',
    });
  };

  /**
   * 中心テーマを更新する
   * @param newTheme - 新しいテーマテキスト
   */
  private updateCenterTheme(newTheme: string): void {
    // ECSシステムを通じて中心テーマエンティティを更新
    // 実際の実装では、EntityManagerを通じてテーマエンティティを更新する
    console.log(`[ThemeChangeFlow] Updating center theme to: ${newTheme}`);

    // 将来的には以下のような処理を行う：
    // const themeEntity = entityManager.getEntity('center-theme');
    // const textComponent = themeEntity.getComponent('text');
    // textComponent.content = newTheme;
  }

  /**
   * フローを破棄する
   */
  public destroy(): void {
    // 保存されたアンサブスクライブ関数を実行
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}