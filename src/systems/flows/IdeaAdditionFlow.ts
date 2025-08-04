import type { EventBus } from '@/events/core';
import { IdeaEvents, SystemEvents } from '@/events/types';
import type {
  IdeaAddedEvent,
  PositionCalculatedEvent,
  AnimationEvent,
} from '@/events/types';

/**
 * アイデア追加フローを管理するクラス
 * アイデア追加から描画までの一連の処理を調整する
 */
export class IdeaAdditionFlow {
  private unsubscribeFunctions: (() => void)[] = [];

  constructor(private eventBus: EventBus) {
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    // 1. アイデア追加 → 位置計算
    const unsubscribe1 = this.eventBus.on(IdeaEvents.IDEA_ADDED, this.handleIdeaAdded);
    this.unsubscribeFunctions.push(unsubscribe1);

    // 2. 位置計算完了 → アニメーション開始
    const unsubscribe2 = this.eventBus.on(SystemEvents.POSITION_CALCULATED, this.handlePositionCalculated);
    this.unsubscribeFunctions.push(unsubscribe2);

    // 3. アニメーション開始 → 描画要求
    const unsubscribe3 = this.eventBus.on(SystemEvents.ANIMATION_START, this.handleAnimationStart);
    this.unsubscribeFunctions.push(unsubscribe3);
  }

  /**
   * アイデア追加イベントを処理する
   * @param data - アイデア追加イベントデータ
   */
  private handleIdeaAdded = (data: IdeaAddedEvent): void => {
    console.log(`[IdeaAdditionFlow] Processing idea addition: ${data.text}`);

    // PhyllotaxisSystemに位置計算を依頼
    // 実際の計算はPhyllotaxisSystemが行うため、ここでは特別な処理は不要
    // ログ出力のみ行う
  };

  /**
   * 位置計算完了イベントを処理する
   * @param data - 位置計算完了イベントデータ
   */
  private handlePositionCalculated = (data: PositionCalculatedEvent): void => {
    console.log(`[IdeaAdditionFlow] Position calculated for entity: ${data.entityId}`);

    // アニメーション開始イベントを発火
    this.eventBus.emit(SystemEvents.ANIMATION_START, {
      entityId: data.entityId,
      animationType: 'fadeIn',
      duration: 600,
      easing: 'ease-out',
    });
  };

  /**
   * アニメーション開始イベントを処理する
   * @param data - アニメーションイベントデータ
   */
  private handleAnimationStart = (data: AnimationEvent): void => {
    console.log(`[IdeaAdditionFlow] Animation started for entity: ${data.entityId}`);

    // 描画要求イベントを発火
    this.eventBus.emit(SystemEvents.RENDER_REQUESTED, {
      entityId: data.entityId,
      priority: 'high',
      timestamp: new Date(),
    });
  };

  /**
   * フローを破棄する
   */
  public destroy(): void {
    // 保存されたアンサブスクライブ関数を実行
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }
}