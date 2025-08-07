/**
 * エンティティブループリント - エンティティ作成のテンプレート
 */

import type { EntityId } from '@/ecs/core/Entity';
import type { IWorld } from '@/ecs/core/System';
import type { ComponentType } from '@/ecs/core/Component';

/**
 * ブループリント情報
 */
export interface BlueprintInfo {
  name: string;
  description: string;
  requiredComponents: ComponentType[];
  optionalComponents: ComponentType[];
  registeredAt: Date;
}

/**
 * エンティティ作成オプション
 */
export interface CreateEntityOptions {
  // 位置設定
  x?: number;
  y?: number;
  
  // アニメーション設定
  withAnimation?: boolean;
  animationDuration?: number;
  
  // カスタムコンポーネント設定
  customTextOptions?: any;
  customVisualOptions?: any;
  customPositionOptions?: any;
}

/**
 * エンティティブループリント基底クラス
 * 
 * 各エンティティタイプに対応したブループリントを作成するための基底クラス。
 * 継承して具体的なエンティティ作成ロジックを実装する。
 */
export abstract class EntityBlueprint {
  /**
   * ブループリントの一意な名前
   */
  abstract readonly name: string;

  /**
   * ブループリントの説明
   */
  abstract readonly description: string;

  /**
   * このブループリントで作成されるエンティティが必ず持つコンポーネントタイプ
   */
  abstract readonly requiredComponents: ComponentType[];

  /**
   * このブループリントで作成されるエンティティが持つ可能性があるコンポーネントタイプ
   */
  abstract readonly optionalComponents: ComponentType[];

  /**
   * エンティティを作成
   * 
   * @param world - Worldインスタンス
   * @param args - ブループリント固有の引数
   * @returns 作成されたエンティティID
   */
  abstract create(world: IWorld, ...args: any[]): EntityId;

  /**
   * 作成前のバリデーション
   * 
   * @param world - Worldインスタンス
   * @param args - ブループリント固有の引数
   * @returns バリデーション結果
   */
  validate(world: IWorld, ...args: any[]): boolean {
    return true;
  }

  /**
   * エンティティ作成前の処理
   * 
   * @param world - Worldインスタンス
   * @param args - ブループリント固有の引数
   */
  beforeCreate(world: IWorld, ...args: any[]): void {
    // オーバーライド可能
  }

  /**
   * エンティティ作成後の処理
   * 
   * @param world - Worldインスタンス
   * @param entityId - 作成されたエンティティID
   * @param args - ブループリント固有の引数
   */
  afterCreate(world: IWorld, entityId: EntityId, ...args: any[]): void {
    // オーバーライド可能
  }

  /**
   * ブループリント情報を取得
   */
  getInfo(): Omit<BlueprintInfo, 'registeredAt'> {
    return {
      name: this.name,
      description: this.description,
      requiredComponents: this.requiredComponents,
      optionalComponents: this.optionalComponents
    };
  }
}