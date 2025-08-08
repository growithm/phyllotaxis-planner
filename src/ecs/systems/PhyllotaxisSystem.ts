/**
 * フィロタキシス配置計算システム
 * 
 * 植物の葉序（フィロタキシス）の法則に基づいて、エンティティの位置を計算し更新するシステム。
 * 黄金角（137.5°）を使用した螺旋配置により、自然で美しい配置を実現する。
 */

import { BaseSystem, type IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import type { IPositionComponent } from '@/ecs/components/PositionComponent';
import type { ITextComponent } from '@/ecs/components/TextComponent';
import type { EntityId } from '@/ecs/core/Entity';
import type { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';
import { calculatePhyllotaxisPosition } from '@/utils/phyllotaxis/calculations';
import { DEFAULT_PHYLLOTAXIS_CONFIG } from '@/utils/phyllotaxis/constants';
import type { PhyllotaxisConfig } from '@/types/Phyllotaxis';

/**
 * PhyllotaxisSystemの設定オプション
 */
export interface PhyllotaxisSystemOptions {
  /** フィロタキシス計算設定 */
  config?: Partial<PhyllotaxisConfig>;
  /** 中心テーマエンティティを除外するかどうか */
  excludeCenterTheme?: boolean;
  /** 位置変更の最小閾値（ピクセル） */
  positionChangeThreshold?: number;
}

/**
 * フィロタキシス配置計算システム
 * 
 * BaseSystemを継承し、3フェーズ実行モデル（フィルタリング→処理→イベント発火）を実装
 */
export class PhyllotaxisSystem extends BaseSystem {
  readonly name = 'PhyllotaxisSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];
  
  private config: PhyllotaxisConfig;
  private readonly options: Required<PhyllotaxisSystemOptions>;

  /**
   * PhyllotaxisSystemのコンストラクタ
   * 
   * @param priority - システムの実行優先度（デフォルト: 100）
   * @param eventBus - イベントバス（オプション）
   * @param options - システム設定オプション
   */
  constructor(
    priority: number = 100,
    eventBus?: EventBus,
    options: PhyllotaxisSystemOptions = {}
  ) {
    super(priority, eventBus);
    
    // デフォルト設定とオプションをマージ
    this.config = {
      ...DEFAULT_PHYLLOTAXIS_CONFIG,
      ...options.config,
    };
    
    this.options = {
      excludeCenterTheme: options.excludeCenterTheme ?? true,
      positionChangeThreshold: options.positionChangeThreshold ?? 1.0,
      config: this.config,
    };
  }

  /**
   * Phase 2: フィロタキシス配置計算の実行
   * 
   * 各エンティティに対してフィロタキシスパターンに基づく位置を計算し、
   * 位置コンポーネントを更新する。
   * 
   * @param entities - 処理対象のエンティティID配列
   * @param world - ECSワールドインスタンス
   * @param deltaTime - 前回の更新からの経過時間（ミリ秒）
   */
  protected processEntities(entities: EntityId[], world: IWorld, _deltaTime: number): void {
    // 中心テーマエンティティを除外する場合の処理
    const processableEntities = this.options.excludeCenterTheme 
      ? this.filterOutCenterTheme(entities, world)
      : entities;

    // 各エンティティの位置を計算・更新
    processableEntities.forEach((entityId, index) => {
      this.updateEntityPosition(entityId, index, world);
    });
  }

  /**
   * 中心テーマエンティティを除外
   * 
   * テキストコンポーネントの内容を確認し、中心テーマと思われるエンティティを除外する。
   * 
   * @param entities - エンティティID配列
   * @param world - ECSワールドインスタンス
   * @returns 中心テーマを除外したエンティティID配列
   */
  private filterOutCenterTheme(entities: EntityId[], world: IWorld): EntityId[] {
    return entities.filter(entityId => {
      const textComponent = world.getComponent<ITextComponent>(entityId, ComponentTypes.TEXT);
      
      // テキストコンポーネントがない場合は除外しない
      if (!textComponent) {
        return true;
      }

      // 中心テーマの判定ロジック（例：特定の文字列パターンや位置で判定）
      // ここでは簡単な実装として、位置が中心付近にあるものを中心テーマとみなす
      const positionComponent = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
      if (!positionComponent) {
        return true;
      }

      const distanceFromCenter = Math.sqrt(
        Math.pow(positionComponent.x - this.config.centerX, 2) +
        Math.pow(positionComponent.y - this.config.centerY, 2)
      );

      // 中心から最小半径以内にあるものは中心テーマとして除外
      return distanceFromCenter > this.config.minRadius;
    });
  }

  /**
   * 個別エンティティの位置を更新
   * 
   * @param entityId - エンティティID
   * @param index - 配置インデックス
   * @param world - ECSワールドインスタンス
   */
  private updateEntityPosition(entityId: EntityId, index: number, world: IWorld): void {
    const positionComponent = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
    
    if (!positionComponent) {
      console.warn(`PhyllotaxisSystem: Entity ${entityId} missing position component`);
      return;
    }

    try {
      // フィロタキシス位置を計算
      const result = calculatePhyllotaxisPosition(index, this.config);
      
      // 位置変更の閾値チェック
      const positionChanged = this.hasPositionChanged(positionComponent, result.position);
      
      if (positionChanged) {
        // 位置コンポーネントを更新
        positionComponent.x = result.position.x;
        positionComponent.y = result.position.y;
        positionComponent.angle = result.angle;
        positionComponent.radius = result.radius;

        // 位置計算完了イベントを発火
        this.emitPositionCalculatedEvent(entityId, result);
      }
    } catch (error) {
      console.error(`PhyllotaxisSystem: Error calculating position for entity ${entityId}:`, error);
      
      // エラーイベントを発火
      this.emitSystemEvent(SystemEvents.ERROR_OCCURRED, {
        systemName: this.name,
        entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 位置が変更されたかどうかをチェック
   * 
   * @param currentPosition - 現在の位置コンポーネント
   * @param newPosition - 新しい位置
   * @returns 位置が変更された場合true
   */
  private hasPositionChanged(
    currentPosition: IPositionComponent,
    newPosition: { x: number; y: number }
  ): boolean {
    const deltaX = Math.abs(currentPosition.x - newPosition.x);
    const deltaY = Math.abs(currentPosition.y - newPosition.y);
    
    return deltaX > this.options.positionChangeThreshold || 
           deltaY > this.options.positionChangeThreshold;
  }

  /**
   * 位置計算完了イベントを発火
   * 
   * @param entityId - エンティティID
   * @param result - フィロタキシス計算結果
   */
  private emitPositionCalculatedEvent(
    entityId: EntityId,
    result: import('@/types/Phyllotaxis').PhyllotaxisResult
  ): void {
    this.emitSystemEvent(SystemEvents.POSITION_CALCULATED, {
      entityId,
      position: result.position,
      angle: result.angle,
      radius: result.radius,
      index: result.index,
      timestamp: Date.now(),
    });
  }

  /**
   * システム設定を更新
   * 
   * @param newConfig - 新しい設定（部分更新可能）
   */
  public updateConfig(newConfig: Partial<PhyllotaxisConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * 現在の設定を取得
   * 
   * @returns 現在のフィロタキシス設定
   */
  public getConfig(): Readonly<PhyllotaxisConfig> {
    return { ...this.config };
  }

  /**
   * システム統計情報を取得
   * 
   * @returns システム統計情報
   */
  public getStats(): import('@/ecs/core/System').SystemStats {
    return {
      name: this.name,
      priority: this.priority,
      requiredComponents: [...this.requiredComponents],
      processableEntities: 0, // 実行時に更新される
    };
  }
}