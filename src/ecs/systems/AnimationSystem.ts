/**
 * アニメーション管理システム
 *
 * エンティティのアニメーション状態を管理し、CSS transitionとの連携を行うシステム。
 * 位置計算完了イベントを受信してアニメーションを開始し、進行状況を管理する。
 */

import { BaseSystem, type IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import type { IAnimationComponent } from '@/ecs/components/AnimationComponent';
import type { IPositionComponent } from '@/ecs/components/PositionComponent';
import type { EntityId } from '@/ecs/core/Entity';
import type { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';
import type { AnimationType, EasingType } from '@/types';

/**
 * AnimationSystemの設定オプション
 */
export interface AnimationSystemOptions {
  /** デフォルトアニメーション時間（ミリ秒） */
  defaultDuration?: number;
  /** デフォルトイージング */
  defaultEasing?: EasingType;
  /** アニメーション完了の許容誤差（0-1） */
  completionTolerance?: number;
  /** 自動的にPOSITION_CALCULATEDイベントを監視するか */
  autoListenPositionEvents?: boolean;
}

/**
 * アニメーション管理システム
 *
 * BaseSystemを継承し、3フェーズ実行モデル（フィルタリング→処理→イベント発火）を実装
 */
export class AnimationSystem extends BaseSystem {
  readonly name = 'AnimationSystem';
  readonly requiredComponents = [ComponentTypes.ANIMATION];

  private readonly options: Required<AnimationSystemOptions>;
  private readonly animatingEntities = new Set<EntityId>();
  private readonly pendingAnimations = new Set<EntityId>();

  /**
   * AnimationSystemのコンストラクタ
   *
   * @param priority - システムの実行優先度（デフォルト: 200）
   * @param eventBus - イベントバス（オプション）
   * @param options - システム設定オプション
   */
  constructor(
    priority: number = 200,
    eventBus?: EventBus,
    options: AnimationSystemOptions = {}
  ) {
    super(priority, eventBus);

    this.options = {
      defaultDuration: options.defaultDuration ?? 500,
      defaultEasing: options.defaultEasing ?? 'ease-out',
      completionTolerance: options.completionTolerance ?? 0.01,
      autoListenPositionEvents: options.autoListenPositionEvents ?? true,
    };

    // POSITION_CALCULATEDイベントの監視を設定
    if (this.options.autoListenPositionEvents && this.eventBus) {
      this.setupEventListeners();
    }
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    if (!this.eventBus) return;

    // 位置計算完了時にアニメーション開始
    this.eventBus.on(SystemEvents.POSITION_CALCULATED, (data: any) => {
      // worldインスタンスを保存しておく必要があるため、
      // 実際のアニメーション開始は update メソッド内で処理する
      this.pendingAnimations.add(data.entityId);
    });
  }

  /**
   * Phase 2: アニメーション状態の更新処理
   *
   * アニメーション中のエンティティの進行状況を更新し、
   * 完了したアニメーションの後処理を行う。
   *
   * @param entities - 処理対象のエンティティID配列
   * @param world - ECSワールドインスタンス
   * @param deltaTime - 前回の更新からの経過時間（ミリ秒）
   */
  protected processEntities(
    entities: EntityId[],
    world: IWorld,
    deltaTime: number
  ): void {
    // 保留中のアニメーションを開始
    this.processPendingAnimations(world);

    // アニメーション中のエンティティのみを処理
    const animatingEntities = entities.filter(entityId => {
      const animationComponent = world.getComponent<IAnimationComponent>(
        entityId,
        ComponentTypes.ANIMATION
      );
      return animationComponent?.isAnimating;
    });

    animatingEntities.forEach(entityId => {
      this.updateEntityAnimation(entityId, world, deltaTime);
    });
  }

  /**
   * 保留中のアニメーションを処理
   *
   * @param world - ECSワールドインスタンス
   */
  private processPendingAnimations(world: IWorld): void {
    // 保留中のアニメーションを開始
    for (const entityId of this.pendingAnimations) {
      this.startPositionAnimation(entityId, world);
    }
    
    // 保留中のアニメーションをクリア
    this.pendingAnimations.clear();
  }

  /**
   * 位置アニメーションを開始
   *
   * @param entityId - エンティティID
   * @param world - ECSワールドインスタンス
   */
  private startPositionAnimation(entityId: EntityId, world: IWorld): void {
    // エンティティが存在するかチェック
    if (!world.hasEntity(entityId)) {
      console.warn(`AnimationSystem: Entity ${entityId} does not exist`);
      return;
    }

    // AnimationComponentを取得または作成
    let animationComponent = world.getComponent<IAnimationComponent>(
      entityId,
      ComponentTypes.ANIMATION
    );

    if (!animationComponent) {
      // AnimationComponentが存在しない場合は作成
      animationComponent = {
        type: ComponentTypes.ANIMATION,
        animationType: 'slideIn' as AnimationType,
        duration: this.options.defaultDuration,
        easing: this.options.defaultEasing,
        delay: 0,
        isAnimating: true,
        progress: 0,
        startTime: Date.now(),
        endTime: undefined,
        loop: false,
        loopCount: 1,
        currentLoop: 0,
        cssClasses: [],
        cssTransition: '',
        onComplete: undefined,
        onLoop: undefined,
      };

      // コンポーネントを追加
      world.addComponent(entityId, animationComponent);
    } else {
      // 既存のAnimationComponentを更新
      animationComponent.isAnimating = true;
      animationComponent.progress = 0;
      animationComponent.startTime = Date.now();
      animationComponent.endTime = undefined;
      animationComponent.animationType = 'slideIn' as AnimationType;
      animationComponent.duration = this.options.defaultDuration;
      animationComponent.easing = this.options.defaultEasing;
    }

    // アニメーション開始イベントを発火
    this.emitSystemEvent(SystemEvents.ANIMATION_START, {
      entityId,
      animationType: animationComponent.animationType,
      duration: animationComponent.duration,
      easing: animationComponent.easing,
      timestamp: Date.now(),
    });

    // アニメーション中エンティティとして追跡
    this.animatingEntities.add(entityId);
  }

  /**
   * 個別エンティティのアニメーション状態を更新
   *
   * @param entityId - エンティティID
   * @param world - ECSワールドインスタンス
   * @param deltaTime - 経過時間（ミリ秒）
   */
  private updateEntityAnimation(
    entityId: EntityId,
    world: IWorld,
    deltaTime: number
  ): void {
    const animationComponent = world.getComponent<IAnimationComponent>(
      entityId,
      ComponentTypes.ANIMATION
    );

    if (!animationComponent || !animationComponent.isAnimating) {
      this.animatingEntities.delete(entityId);
      return;
    }

    try {
      // アニメーション進行度を計算
      const progress = this.calculateAnimationProgress(
        animationComponent,
        deltaTime
      );

      // 進行度を更新
      animationComponent.progress = progress;

      // アニメーション完了チェック
      if (progress >= 1.0 - this.options.completionTolerance) {
        this.completeAnimation(entityId, animationComponent, world);
      } else {
        // アニメーション効果を適用
        this.applyAnimationEffect(entityId, animationComponent, world);
      }
    } catch (error) {
      console.error(
        `AnimationSystem: Error updating animation for entity ${entityId}:`,
        error
      );

      // エラー時はアニメーションを強制完了
      this.forceCompleteAnimation(entityId, animationComponent);
    }
  }

  /**
   * アニメーション進行度を計算
   *
   * @param animationComponent - アニメーションコンポーネント
   * @param deltaTime - 経過時間（ミリ秒）
   * @returns 進行度（0-1）
   */
  private calculateAnimationProgress(
    animationComponent: IAnimationComponent,
    deltaTime: number
  ): number {
    const currentTime = Date.now();

    // 開始時刻が設定されていない場合は設定
    if (!animationComponent.startTime) {
      animationComponent.startTime = currentTime - deltaTime;
    }

    // 経過時間を計算
    const elapsed = currentTime - animationComponent.startTime;
    const adjustedElapsed = Math.max(0, elapsed - animationComponent.delay);

    // 進行度を計算（0-1の範囲）
    const rawProgress = adjustedElapsed / animationComponent.duration;

    // イージング関数を適用
    return this.applyEasing(
      Math.min(rawProgress, 1.0),
      animationComponent.easing
    );
  }

  /**
   * イージング関数を適用
   *
   * @param progress - 生の進行度（0-1）
   * @param easing - イージングタイプ
   * @returns イージング適用後の進行度
   */
  private applyEasing(progress: number, easing: EasingType): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'ease':
      default:
        // CSS ease equivalent: cubic-bezier(0.25, 0.1, 0.25, 1)
        return this.cubicBezier(progress, 0.25, 0.1, 0.25, 1);
    }
  }

  /**
   * 3次ベジェ曲線によるイージング計算
   *
   * @param t - 時間パラメータ（0-1）
   * @param x1 - 制御点1のX座標
   * @param y1 - 制御点1のY座標
   * @param x2 - 制御点2のX座標
   * @param y2 - 制御点2のY座標
   * @returns イージング値
   */
  private cubicBezier(
    t: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    // 簡略化された3次ベジェ曲線計算
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const _ay = 1 - cy - by;

    return ((ax * t + bx) * t + cx) * t;
  }

  /**
   * アニメーション効果を適用
   *
   * @param entityId - エンティティID
   * @param animationComponent - アニメーションコンポーネント
   * @param world - ECSワールドインスタンス
   */
  private applyAnimationEffect(
    entityId: EntityId,
    animationComponent: IAnimationComponent,
    world: IWorld
  ): void {
    const positionComponent = world.getComponent<IPositionComponent>(
      entityId,
      ComponentTypes.POSITION
    );

    if (!positionComponent) return;

    // アニメーションタイプに応じた効果を適用
    switch (animationComponent.animationType) {
      case 'fadeIn':
        this.applyFadeInEffect(animationComponent);
        break;
      case 'slideIn':
        this.applySlideInEffect(animationComponent, positionComponent);
        break;
      case 'scale':
        this.applyScaleEffect(animationComponent);
        break;
      case 'pulse':
        this.applyPulseEffect(animationComponent);
        break;
      default:
        // デフォルトはfadeIn
        this.applyFadeInEffect(animationComponent);
    }
  }

  /**
   * フェードインエフェクトを適用
   */
  private applyFadeInEffect(animationComponent: IAnimationComponent): void {
    const _opacity = animationComponent.progress;

    // CSSクラスを更新
    animationComponent.cssClasses = [
      'transition-opacity',
      'duration-500',
      'ease-out',
    ];

    // CSS transitionプロパティを設定
    animationComponent.cssTransition = `opacity ${animationComponent.duration}ms ${animationComponent.easing}`;
  }

  /**
   * スライドインエフェクトを適用
   */
  private applySlideInEffect(
    animationComponent: IAnimationComponent,
    _positionComponent: IPositionComponent
  ): void {
    // CSS transitionプロパティを設定
    animationComponent.cssTransition = `transform ${animationComponent.duration}ms ${animationComponent.easing}`;

    // CSSクラスを更新
    animationComponent.cssClasses = [
      'transition-transform',
      `duration-${animationComponent.duration}`,
      animationComponent.easing.replace('-', '-'),
    ];
  }

  /**
   * スケールエフェクトを適用
   */
  private applyScaleEffect(animationComponent: IAnimationComponent): void {
    const _scale = animationComponent.progress;

    animationComponent.cssTransition = `transform ${animationComponent.duration}ms ${animationComponent.easing}`;
    animationComponent.cssClasses = ['transition-transform', 'origin-center'];
  }

  /**
   * パルスエフェクトを適用
   */
  private applyPulseEffect(animationComponent: IAnimationComponent): void {
    animationComponent.cssClasses = ['animate-pulse'];
  }

  /**
   * アニメーションを完了
   *
   * @param entityId - エンティティID
   * @param animationComponent - アニメーションコンポーネント
   * @param world - ECSワールドインスタンス
   */
  private completeAnimation(
    entityId: EntityId,
    animationComponent: IAnimationComponent,
    _world: IWorld
  ): void {
    // アニメーション状態をリセット
    animationComponent.isAnimating = false;
    animationComponent.progress = 1.0;
    animationComponent.endTime = Date.now();
    animationComponent.currentLoop++;

    // ループ処理
    if (
      animationComponent.loop &&
      (animationComponent.loopCount === -1 ||
        animationComponent.currentLoop < animationComponent.loopCount)
    ) {
      this.restartAnimation(entityId, animationComponent);
      return;
    }

    // 完了コールバックを実行
    if (animationComponent.onComplete) {
      try {
        animationComponent.onComplete();
      } catch (error) {
        console.error(
          `AnimationSystem: Error in completion callback for entity ${entityId}:`,
          error
        );
      }
    }

    // アニメーション完了イベントを発火
    this.emitAnimationEndEvent(entityId, animationComponent);

    // 追跡から削除
    this.animatingEntities.delete(entityId);
  }

  /**
   * アニメーションを再開（ループ用）
   */
  private restartAnimation(
    entityId: EntityId,
    animationComponent: IAnimationComponent
  ): void {
    animationComponent.isAnimating = true;
    animationComponent.progress = 0;
    animationComponent.startTime = Date.now();
    animationComponent.endTime = undefined;

    // ループコールバックを実行
    if (animationComponent.onLoop) {
      try {
        animationComponent.onLoop();
      } catch (error) {
        console.error(
          `AnimationSystem: Error in loop callback for entity ${entityId}:`,
          error
        );
      }
    }
  }

  /**
   * アニメーションを強制完了（エラー時）
   */
  private forceCompleteAnimation(
    entityId: EntityId,
    animationComponent: IAnimationComponent
  ): void {
    animationComponent.isAnimating = false;
    animationComponent.progress = 1.0;
    animationComponent.endTime = Date.now();

    this.emitAnimationEndEvent(entityId, animationComponent);
    this.animatingEntities.delete(entityId);
  }

  /**
   * アニメーション完了イベントを発火
   */
  private emitAnimationEndEvent(
    entityId: EntityId,
    animationComponent: IAnimationComponent
  ): void {
    this.emitSystemEvent(SystemEvents.ANIMATION_END, {
      entityId,
      animationType: animationComponent.animationType,
      duration: animationComponent.duration,
      easing: animationComponent.easing,
      completedLoops: animationComponent.currentLoop,
      timestamp: Date.now(),
    });
  }

  /**
   * Phase 3: システム処理完了イベントの発火
   */
  protected emitEvents(
    entities: EntityId[],
    world: IWorld,
    deltaTime: number
  ): void {
    super.emitEvents(entities, world, deltaTime);

    // アニメーション中のエンティティ数を報告
    if (this.animatingEntities.size > 0) {
      this.emitSystemEvent(SystemEvents.SYSTEM_PROCESSED, {
        systemName: this.name,
        processedEntities: this.animatingEntities.size,
        animatingEntities: Array.from(this.animatingEntities),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 特定エンティティのアニメーションを手動開始
   *
   * @param entityId - エンティティID
   * @param animationType - アニメーションタイプ
   * @param duration - アニメーション時間（オプション）
   * @param easing - イージング（オプション）
   */
  public startAnimation(
    entityId: EntityId,
    animationType: AnimationType,
    duration?: number,
    easing?: EasingType
  ): void {
    this.emitSystemEvent(SystemEvents.ANIMATION_START, {
      entityId,
      animationType,
      duration: duration ?? this.options.defaultDuration,
      easing: easing ?? this.options.defaultEasing,
      timestamp: Date.now(),
    });

    this.animatingEntities.add(entityId);
  }

  /**
   * 特定エンティティのアニメーションを停止
   *
   * @param entityId - エンティティID
   * @param forceComplete - 強制完了するかどうか
   */
  public stopAnimation(
    entityId: EntityId,
    forceComplete: boolean = false
  ): void {
    this.animatingEntities.delete(entityId);

    if (forceComplete) {
      this.emitSystemEvent(SystemEvents.ANIMATION_END, {
        entityId,
        animationType: 'fadeIn', // デフォルト値
        duration: 0,
        easing: this.options.defaultEasing,
        completedLoops: 0,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 現在アニメーション中のエンティティ数を取得
   */
  public getAnimatingEntityCount(): number {
    return this.animatingEntities.size;
  }

  /**
   * システム統計情報を取得
   */
  public getStats(): import('@/ecs/core/System').SystemStats {
    return {
      name: this.name,
      priority: this.priority,
      requiredComponents: [...this.requiredComponents],
      processableEntities: this.animatingEntities.size,
    };
  }

  /**
   * システム設定を更新
   */
  public updateOptions(newOptions: Partial<AnimationSystemOptions>): void {
    Object.assign(this.options, newOptions);
  }

  /**
   * 現在の設定を取得
   */
  public getOptions(): Readonly<Required<AnimationSystemOptions>> {
    return { ...this.options };
  }
}
