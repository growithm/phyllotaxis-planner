/**
 * ブループリントレジストリ - エンティティブループリントの管理
 */

import type { EntityBlueprint, BlueprintInfo } from './EntityBlueprint';

/**
 * エンティティブループリントの登録・管理を行うレジストリ
 */
export class BlueprintRegistry {
  private blueprints: Map<string, EntityBlueprint>;
  private blueprintInfo: Map<string, BlueprintInfo>;

  constructor() {
    this.blueprints = new Map();
    this.blueprintInfo = new Map();
  }

  /**
   * ブループリントを登録
   */
  register(blueprint: EntityBlueprint): void {
    if (this.blueprints.has(blueprint.name)) {
      console.warn(`Blueprint '${blueprint.name}' is already registered. Overwriting.`);
    }

    this.blueprints.set(blueprint.name, blueprint);
    this.blueprintInfo.set(blueprint.name, {
      name: blueprint.name,
      description: blueprint.description,
      requiredComponents: blueprint.requiredComponents,
      optionalComponents: blueprint.optionalComponents,
      registeredAt: new Date()
    });

    console.log(`[BlueprintRegistry] Registered blueprint: ${blueprint.name}`);
  }

  /**
   * ブループリントの登録を解除
   */
  unregister(blueprintName: string): boolean {
    const removed = this.blueprints.delete(blueprintName);
    this.blueprintInfo.delete(blueprintName);

    if (removed) {
      console.log(`[BlueprintRegistry] Unregistered blueprint: ${blueprintName}`);
    }

    return removed;
  }

  /**
   * ブループリントを取得
   */
  get(blueprintName: string): EntityBlueprint | undefined {
    return this.blueprints.get(blueprintName);
  }

  /**
   * ブループリントが登録されているかチェック
   */
  has(blueprintName: string): boolean {
    return this.blueprints.has(blueprintName);
  }

  /**
   * 登録されているブループリント名の一覧を取得
   */
  listBlueprints(): string[] {
    return Array.from(this.blueprints.keys());
  }

  /**
   * ブループリントの詳細情報を取得
   */
  getInfo(blueprintName: string): BlueprintInfo | undefined {
    return this.blueprintInfo.get(blueprintName);
  }

  /**
   * 全ブループリントの詳細情報を取得
   */
  getAllInfo(): BlueprintInfo[] {
    return Array.from(this.blueprintInfo.values());
  }

  /**
   * レジストリをクリア（主にテスト用）
   */
  clear(): void {
    this.blueprints.clear();
    this.blueprintInfo.clear();
    console.log('[BlueprintRegistry] Registry cleared');
  }

  /**
   * レジストリの統計情報を取得
   */
  getStats(): {
    totalBlueprints: number;
    blueprintNames: string[];
    oldestRegistration: Date | null;
    newestRegistration: Date | null;
  } {
    const infos = this.getAllInfo();
    const registrationDates = infos.map(info => info.registeredAt);

    return {
      totalBlueprints: this.blueprints.size,
      blueprintNames: this.listBlueprints(),
      oldestRegistration: registrationDates.length > 0 
        ? new Date(Math.min(...registrationDates.map(d => d.getTime())))
        : null,
      newestRegistration: registrationDates.length > 0
        ? new Date(Math.max(...registrationDates.map(d => d.getTime())))
        : null
    };
  }
}