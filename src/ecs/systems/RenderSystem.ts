/**
 * SVG描画システム
 * 
 * エンティティの視覚的表現をSVG要素として描画・更新するシステム。
 * 位置コンポーネントと視覚コンポーネントに基づいてDOM要素を動的に生成・管理する。
 */

import { BaseSystem, type IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import type { IPositionComponent } from '@/ecs/components/PositionComponent';
import type { IVisualComponent } from '@/ecs/components/VisualComponent';
import type { IAnimationComponent } from '@/ecs/components/AnimationComponent';
import type { EntityId } from '@/ecs/core/Entity';
import type { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';

/**
 * RenderSystemの設定オプション
 */
export interface RenderSystemOptions {
  /** SVG要素のID属性プレフィックス */
  elementIdPrefix?: string;
  /** 削除されたエンティティの要素を自動クリーンアップするか */
  autoCleanup?: boolean;
  /** デバッグモード（要素にデバッグ情報を追加） */
  debugMode?: boolean;
  /** アニメーション統合を有効にするか */
  enableAnimationIntegration?: boolean;
}

/**
 * SVG描画システム
 * 
 * BaseSystemを継承し、3フェーズ実行モデル（フィルタリング→処理→イベント発火）を実装
 */
export class RenderSystem extends BaseSystem {
  readonly name = 'RenderSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.VISUAL];
  
  private readonly svgElement: SVGSVGElement;
  private readonly entityElements = new Map<EntityId, SVGGElement>();
  private readonly options: Required<RenderSystemOptions>;
  private readonly renderedEntities = new Set<EntityId>();

  /**
   * RenderSystemのコンストラクタ
   * 
   * @param svgElement - 描画対象のSVG要素
   * @param priority - システムの実行優先度（デフォルト: 300）
   * @param eventBus - イベントバス（オプション）
   * @param options - システム設定オプション
   */
  constructor(
    svgElement: SVGSVGElement,
    priority: number = 300,
    eventBus?: EventBus,
    options: RenderSystemOptions = {}
  ) {
    super(priority, eventBus);
    
    this.svgElement = svgElement;
    this.options = {
      elementIdPrefix: options.elementIdPrefix ?? 'entity',
      autoCleanup: options.autoCleanup ?? true,
      debugMode: options.debugMode ?? false,
      enableAnimationIntegration: options.enableAnimationIntegration ?? true,
    };

    // アニメーションイベントの監視を設定
    if (this.options.enableAnimationIntegration && this.eventBus) {
      this.setupAnimationEventListeners();
    }
  }

  /**
   * アニメーションイベントリスナーの設定
   */
  private setupAnimationEventListeners(): void {
    if (!this.eventBus) return;

    // アニメーション開始時に描画更新
    this.eventBus.on(SystemEvents.ANIMATION_START, (data: any) => {
      this.requestEntityRender(data.entityId);
    });

    // アニメーション終了時に描画更新
    this.eventBus.on(SystemEvents.ANIMATION_END, (data: any) => {
      this.requestEntityRender(data.entityId);
    });
  }

  /**
   * システム更新メソッド（オーバーライド）
   * クリーンアップのために空の配列でも処理を実行する
   */
  update(entities: EntityId[], world: IWorld, deltaTime: number): void {
    // Phase 1: エンティティフィルタリング
    const processableEntities = this.filterEntities(entities, world);
    
    // Phase 2: ロジック実行（空の配列でもクリーンアップのために実行）
    this.processEntities(processableEntities, world, deltaTime);
    
    // Phase 3: イベント発火（処理対象がある場合のみ）
    if (processableEntities.length > 0) {
      this.emitEvents(processableEntities, world, deltaTime);
    }
  }

  /**
   * Phase 2: エンティティの描画処理
   * 
   * 描画可能なエンティティのSVG要素を作成・更新し、
   * 削除されたエンティティの要素をクリーンアップする。
   * 
   * @param entities - 処理対象のエンティティID配列
   * @param world - ECSワールドインスタンス
   * @param deltaTime - 前回の更新からの経過時間（ミリ秒）
   */
  protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
    // 描画可能なエンティティを処理
    entities.forEach(entityId => {
      this.renderEntity(entityId, world);
    });

    // 自動クリーンアップが有効な場合、削除されたエンティティの要素を削除
    if (this.options.autoCleanup) {
      this.cleanupRemovedEntities(entities);
    }
  }

  /**
   * 個別エンティティの描画処理
   * 
   * @param entityId - エンティティID
   * @param world - ECSワールドインスタンス
   */
  private renderEntity(entityId: EntityId, world: IWorld): void {
    const positionComponent = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
    const visualComponent = world.getComponent<IVisualComponent>(entityId, ComponentTypes.VISUAL);
    
    if (!positionComponent || !visualComponent) {
      console.warn(`RenderSystem: Entity ${entityId} missing required components`);
      return;
    }

    // 非表示の場合は要素を隠すか削除
    if (!visualComponent.visible) {
      this.hideEntity(entityId);
      return;
    }

    try {
      // SVGグループ要素を取得または作成
      let groupElement = this.entityElements.get(entityId);
      
      if (!groupElement) {
        groupElement = this.createEntityElement(entityId, world);
        this.entityElements.set(entityId, groupElement);
        this.svgElement.appendChild(groupElement);
      }

      // 要素を更新
      this.updateEntityElement(groupElement, entityId, world);
      this.renderedEntities.add(entityId);
    } catch (error) {
      console.error(`RenderSystem: Error rendering entity ${entityId}:`, error);
      
      // エラーイベントを発火
      this.emitSystemEvent(SystemEvents.ERROR_OCCURRED, {
        systemName: this.name,
        entityId,
        error: error instanceof Error ? error.message : 'Unknown rendering error',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * エンティティのSVGグループ要素を作成
   * 
   * @param entityId - エンティティID
   * @param world - ECSワールドインスタンス
   * @returns 作成されたSVGグループ要素
   */
  private createEntityElement(entityId: EntityId, world: IWorld): SVGGElement {
    const groupElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // 要素IDを設定
    groupElement.id = `${this.options.elementIdPrefix}-${entityId}`;
    
    // デバッグモードの場合、データ属性を追加
    if (this.options.debugMode) {
      groupElement.setAttribute('data-entity-id', entityId);
      groupElement.setAttribute('data-system', this.name);
    }

    // 視覚コンポーネントに基づいて形状要素を作成
    const visualComponent = world.getComponent<IVisualComponent>(entityId, ComponentTypes.VISUAL);
    if (visualComponent) {
      const shapeElement = this.createShapeElement(visualComponent);
      groupElement.appendChild(shapeElement);
    }

    return groupElement;
  }

  /**
   * 視覚コンポーネントに基づいて形状要素を作成
   * 
   * @param visualComponent - 視覚コンポーネント
   * @returns 作成されたSVG形状要素
   */
  private createShapeElement(visualComponent: IVisualComponent): SVGElement {
    let shapeElement: SVGElement;

    switch (visualComponent.shape) {
      case 'circle':
        shapeElement = this.createCircleElement(visualComponent);
        break;
      case 'ellipse':
        shapeElement = this.createEllipseElement(visualComponent);
        break;
      case 'rect':
        shapeElement = this.createRectElement(visualComponent);
        break;
      case 'leaf':
        shapeElement = this.createLeafElement(visualComponent);
        break;
      case 'custom':
        shapeElement = this.createCustomElement(visualComponent);
        break;
      default:
        shapeElement = this.createLeafElement(visualComponent); // デフォルトは葉形状
    }

    // 共通スタイルを適用
    this.applyCommonStyles(shapeElement, visualComponent);
    
    return shapeElement;
  }

  /**
   * 円形要素を作成
   */
  private createCircleElement(visualComponent: IVisualComponent): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const radius = Math.min(visualComponent.width, visualComponent.height) / 2;
    
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    
    return circle;
  }

  /**
   * 楕円形要素を作成
   */
  private createEllipseElement(visualComponent: IVisualComponent): SVGEllipseElement {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    
    ellipse.setAttribute('rx', (visualComponent.width / 2).toString());
    ellipse.setAttribute('ry', (visualComponent.height / 2).toString());
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '0');
    
    return ellipse;
  }

  /**
   * 矩形要素を作成
   */
  private createRectElement(visualComponent: IVisualComponent): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    
    rect.setAttribute('width', visualComponent.width.toString());
    rect.setAttribute('height', visualComponent.height.toString());
    rect.setAttribute('x', (-visualComponent.width / 2).toString());
    rect.setAttribute('y', (-visualComponent.height / 2).toString());
    
    return rect;
  }

  /**
   * 葉形状要素を作成
   */
  private createLeafElement(visualComponent: IVisualComponent): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // 葉の形状を表現するSVGパス
    const width = visualComponent.width;
    const height = visualComponent.height;
    const leafPath = `M 0,${-height/2} Q ${width/2},${-height/4} ${width/2},0 Q ${width/2},${height/4} 0,${height/2} Q ${-width/2},${height/4} ${-width/2},0 Q ${-width/2},${-height/4} 0,${-height/2} Z`;
    
    path.setAttribute('d', leafPath);
    
    return path;
  }

  /**
   * カスタム形状要素を作成
   */
  private createCustomElement(visualComponent: IVisualComponent): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    if (visualComponent.svgPath) {
      path.setAttribute('d', visualComponent.svgPath);
    } else {
      // フォールバック: 葉形状を使用
      return this.createLeafElement(visualComponent);
    }
    
    return path;
  }

  /**
   * 共通スタイルを要素に適用
   * 
   * @param element - SVG要素
   * @param visualComponent - 視覚コンポーネント
   */
  private applyCommonStyles(element: SVGElement, visualComponent: IVisualComponent): void {
    // 基本スタイル
    element.setAttribute('fill', visualComponent.fillColor);
    element.setAttribute('stroke', visualComponent.strokeColor);
    element.setAttribute('stroke-width', visualComponent.strokeWidth.toString());
    element.setAttribute('opacity', visualComponent.opacity.toString());

    // グラデーション設定
    if (visualComponent.gradient) {
      this.applyGradient(element, visualComponent.gradient);
    }

    // 影設定
    if (visualComponent.shadow) {
      this.applyShadow(element, visualComponent.shadow);
    }

    // カスタムSVG属性
    if (visualComponent.svgAttributes) {
      Object.entries(visualComponent.svgAttributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    // CSSクラス
    if (visualComponent.cssClasses.length > 0) {
      element.setAttribute('class', visualComponent.cssClasses.join(' '));
    }

    // カスタムスタイル
    if (Object.keys(visualComponent.customStyles).length > 0) {
      const styleString = Object.entries(visualComponent.customStyles)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      element.setAttribute('style', styleString);
    }
  }

  /**
   * グラデーションを適用
   */
  private applyGradient(element: SVGElement, _gradient: NonNullable<IVisualComponent['gradient']>): void {
    // グラデーション定義の作成（実装簡略化のため基本的な処理のみ）
    const gradientId = `gradient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 実際の実装では、SVG defsセクションにグラデーション定義を追加する必要がある
    element.setAttribute('fill', `url(#${gradientId})`);
  }

  /**
   * 影を適用
   */
  private applyShadow(element: SVGElement, _shadow: NonNullable<IVisualComponent['shadow']>): void {
    // SVGフィルターを使用した影の実装（実装簡略化のため基本的な処理のみ）
    const filterId = `shadow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('filter', `url(#${filterId})`);
  }

  /**
   * エンティティ要素を更新
   * 
   * @param groupElement - SVGグループ要素
   * @param entityId - エンティティID
   * @param world - ECSワールドインスタンス
   */
  private updateEntityElement(groupElement: SVGGElement, entityId: EntityId, world: IWorld): void {
    const positionComponent = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
    const visualComponent = world.getComponent<IVisualComponent>(entityId, ComponentTypes.VISUAL);
    const animationComponent = world.getComponent<IAnimationComponent>(entityId, ComponentTypes.ANIMATION);
    
    if (!positionComponent || !visualComponent) return;

    // 位置を更新
    this.updateElementPosition(groupElement, positionComponent);
    
    // 視覚スタイルを更新
    this.updateElementVisualStyle(groupElement, visualComponent);
    
    // アニメーション統合
    if (animationComponent && this.options.enableAnimationIntegration) {
      this.updateElementAnimation(groupElement, animationComponent);
    }
  }

  /**
   * 要素の位置を更新
   */
  private updateElementPosition(element: SVGGElement, positionComponent: IPositionComponent): void {
    const transform = `translate(${positionComponent.x}, ${positionComponent.y}) rotate(${positionComponent.angle})`;
    element.setAttribute('transform', transform);
  }

  /**
   * 要素の視覚スタイルを更新
   */
  private updateElementVisualStyle(groupElement: SVGGElement, visualComponent: IVisualComponent): void {
    // 透明度を更新
    groupElement.setAttribute('opacity', visualComponent.opacity.toString());
    
    // 子要素（形状要素）のスタイルを更新
    const shapeElement = groupElement.firstElementChild as SVGElement;
    if (shapeElement) {
      this.applyCommonStyles(shapeElement, visualComponent);
    }
  }

  /**
   * 要素のアニメーションを更新
   */
  private updateElementAnimation(element: SVGGElement, animationComponent: IAnimationComponent): void {
    // CSS transitionプロパティを適用
    if (animationComponent.cssTransition) {
      element.style.transition = animationComponent.cssTransition;
    }

    // CSSクラスを適用
    if (animationComponent.cssClasses.length > 0) {
      const existingClasses = element.getAttribute('class') || '';
      const newClasses = animationComponent.cssClasses.join(' ');
      element.setAttribute('class', `${existingClasses} ${newClasses}`.trim());
    }
  }

  /**
   * エンティティを非表示にする
   * 
   * @param entityId - エンティティID
   */
  private hideEntity(entityId: EntityId): void {
    const element = this.entityElements.get(entityId);
    if (element) {
      element.style.display = 'none';
    }
    this.renderedEntities.delete(entityId);
  }

  /**
   * 削除されたエンティティの要素をクリーンアップ
   * 
   * @param currentEntities - 現在のエンティティ配列
   */
  private cleanupRemovedEntities(currentEntities: EntityId[]): void {
    const currentEntitySet = new Set(currentEntities);
    
    // 削除されたエンティティを特定
    const removedEntities: EntityId[] = [];
    this.renderedEntities.forEach(entityId => {
      if (!currentEntitySet.has(entityId)) {
        removedEntities.push(entityId);
      }
    });

    // 削除されたエンティティの要素を削除
    removedEntities.forEach(entityId => {
      this.removeEntityElement(entityId);
    });
  }

  /**
   * エンティティ要素を削除
   * 
   * @param entityId - エンティティID
   */
  private removeEntityElement(entityId: EntityId): void {
    const element = this.entityElements.get(entityId);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    
    this.entityElements.delete(entityId);
    this.renderedEntities.delete(entityId);
  }

  /**
   * 特定エンティティの描画を要求
   * 
   * @param entityId - エンティティID
   */
  private requestEntityRender(entityId: EntityId): void {
    // 描画要求イベントを発火
    this.emitSystemEvent(SystemEvents.RENDER_REQUESTED, {
      entityId,
      priority: 'normal' as const,
      timestamp: new Date(),
    });
  }

  /**
   * Phase 3: 描画完了イベントの発火
   */
  protected emitEvents(entities: EntityId[], world: IWorld, deltaTime: number): void {
    super.emitEvents(entities, world, deltaTime);

    // 描画完了イベントを発火
    this.emitSystemEvent(SystemEvents.SYSTEM_PROCESSED, {
      systemName: this.name,
      processedEntities: this.renderedEntities.size,
      timestamp: Date.now(),
    });
  }

  /**
   * SVG要素を取得
   */
  public getSvgElement(): SVGSVGElement {
    return this.svgElement;
  }

  /**
   * 描画済みエンティティ数を取得
   */
  public getRenderedEntityCount(): number {
    return this.renderedEntities.size;
  }

  /**
   * 特定エンティティの要素を取得
   * 
   * @param entityId - エンティティID
   * @returns SVGグループ要素（存在しない場合はundefined）
   */
  public getEntityElement(entityId: EntityId): SVGGElement | undefined {
    return this.entityElements.get(entityId);
  }

  /**
   * 全エンティティ要素をクリア
   */
  public clearAllElements(): void {
    this.entityElements.forEach((element, entityId) => {
      this.removeEntityElement(entityId);
    });
  }

  /**
   * システム統計情報を取得
   */
  public getStats(): import('@/ecs/core/System').SystemStats {
    return {
      name: this.name,
      priority: this.priority,
      requiredComponents: [...this.requiredComponents],
      processableEntities: this.renderedEntities.size,
    };
  }

  /**
   * システム設定を更新
   */
  public updateOptions(newOptions: Partial<RenderSystemOptions>): void {
    Object.assign(this.options, newOptions);
  }

  /**
   * 現在の設定を取得
   */
  public getOptions(): Readonly<Required<RenderSystemOptions>> {
    return { ...this.options };
  }
}