/**
 * 空間インデックス（QuadTree実装）
 */

import { EntityId } from '@/ecs/core/Entity';
import { SpatialQuery } from './types/QueryTypes';

/**
 * 空間インデックス（簡易版QuadTree）
 */
export class SpatialIndex {
  private root: QuadTreeNode;
  private entityPositions: Map<EntityId, { x: number; y: number }>;

  constructor(bounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 1000, height: 1000 }) {
    this.root = new QuadTreeNode(bounds, 0);
    this.entityPositions = new Map();
  }

  /**
   * エンティティ位置更新
   */
  update(entityId: EntityId, x: number, y: number): void {
    // 既存位置から削除
    if (this.entityPositions.has(entityId)) {
      this.remove(entityId);
    }

    // 新しい位置に追加
    this.entityPositions.set(entityId, { x, y });
    this.root.insert(entityId, x, y);
  }

  /**
   * エンティティ削除
   */
  remove(entityId: EntityId): void {
    const position = this.entityPositions.get(entityId);
    if (position) {
      this.root.remove(entityId, position.x, position.y);
      this.entityPositions.delete(entityId);
    }
  }

  /**
   * 空間クエリ実行
   */
  query(spatialQuery: SpatialQuery): Set<EntityId> {
    switch (spatialQuery.type) {
      case 'circle':
        return this.queryCircle(spatialQuery.center!, spatialQuery.radius!);
      case 'rectangle':
        return this.queryRectangle(spatialQuery.bounds!);
      case 'polygon':
        return this.queryPolygon(spatialQuery.points!);
      default:
        return new Set();
    }
  }

  /**
   * 円形範囲クエリ
   */
  private queryCircle(center: { x: number; y: number }, radius: number): Set<EntityId> {
    const bounds = {
      x1: center.x - radius,
      y1: center.y - radius,
      x2: center.x + radius,
      y2: center.y + radius
    };

    const candidates = this.queryRectangle(bounds);
    const result = new Set<EntityId>();

    candidates.forEach(entityId => {
      const position = this.entityPositions.get(entityId);
      if (position) {
        const distance = Math.sqrt(
          Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2)
        );
        if (distance <= radius) {
          result.add(entityId);
        }
      }
    });

    return result;
  }

  /**
   * 矩形範囲クエリ
   */
  private queryRectangle(bounds: { x1: number; y1: number; x2: number; y2: number }): Set<EntityId> {
    const result = new Set<EntityId>();
    this.root.queryRange(bounds, result);
    return result;
  }

  /**
   * 多角形範囲クエリ（簡易実装）
   */
  private queryPolygon(points: { x: number; y: number }[]): Set<EntityId> {
    if (points.length < 3) {
      return new Set();
    }

    // 多角形の境界矩形を計算
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const bounds = { x1: minX, y1: minY, x2: maxX, y2: maxY };
    const candidates = this.queryRectangle(bounds);
    const result = new Set<EntityId>();

    candidates.forEach(entityId => {
      const position = this.entityPositions.get(entityId);
      if (position && this.isPointInPolygon(position, points)) {
        result.add(entityId);
      }
    });

    return result;
  }

  /**
   * 点が多角形内にあるかチェック（Ray Casting Algorithm）
   */
  private isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
    let inside = false;
    const { x, y } = point;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * インデックスサイズ
   */
  size(): number {
    return this.entityPositions.size;
  }

  /**
   * インデックスクリア
   */
  clear(): void {
    this.entityPositions.clear();
    this.root.clear();
  }
}

/**
 * QuadTreeノード（簡易実装）
 */
class QuadTreeNode {
  private bounds: { x: number; y: number; width: number; height: number };
  private level: number;
  private entities: Map<EntityId, { x: number; y: number }>;
  private children: QuadTreeNode[] | null;
  private readonly MAX_ENTITIES = 10;
  private readonly MAX_LEVELS = 5;

  constructor(bounds: { x: number; y: number; width: number; height: number }, level: number) {
    this.bounds = bounds;
    this.level = level;
    this.entities = new Map();
    this.children = null;
  }

  /**
   * エンティティ挿入
   */
  insert(entityId: EntityId, x: number, y: number): void {
    if (!this.contains(x, y)) {
      return;
    }

    if (this.entities.size < this.MAX_ENTITIES || this.level >= this.MAX_LEVELS) {
      this.entities.set(entityId, { x, y });
      return;
    }

    if (this.children === null) {
      this.split();
    }

    this.children!.forEach(child => {
      child.insert(entityId, x, y);
    });
  }

  /**
   * エンティティ削除
   */
  remove(entityId: EntityId, x: number, y: number): void {
    if (this.entities.has(entityId)) {
      this.entities.delete(entityId);
      return;
    }

    if (this.children !== null) {
      this.children.forEach(child => {
        child.remove(entityId, x, y);
      });
    }
  }

  /**
   * 範囲クエリ
   */
  queryRange(queryBounds: { x1: number; y1: number; x2: number; y2: number }, result: Set<EntityId>): void {
    if (!this.intersects(queryBounds)) {
      return;
    }

    this.entities.forEach((position, entityId) => {
      if (position.x >= queryBounds.x1 && position.x <= queryBounds.x2 &&
          position.y >= queryBounds.y1 && position.y <= queryBounds.y2) {
        result.add(entityId);
      }
    });

    if (this.children !== null) {
      this.children.forEach(child => {
        child.queryRange(queryBounds, result);
      });
    }
  }

  /**
   * 点が範囲内かチェック
   */
  private contains(x: number, y: number): boolean {
    return x >= this.bounds.x && x < this.bounds.x + this.bounds.width &&
           y >= this.bounds.y && y < this.bounds.y + this.bounds.height;
  }

  /**
   * 範囲が交差するかチェック
   */
  private intersects(queryBounds: { x1: number; y1: number; x2: number; y2: number }): boolean {
    return !(queryBounds.x2 < this.bounds.x || 
             queryBounds.x1 > this.bounds.x + this.bounds.width ||
             queryBounds.y2 < this.bounds.y || 
             queryBounds.y1 > this.bounds.y + this.bounds.height);
  }

  /**
   * ノード分割
   */
  private split(): void {
    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.children = [
      new QuadTreeNode({ x, y, width: halfWidth, height: halfHeight }, this.level + 1),
      new QuadTreeNode({ x: x + halfWidth, y, width: halfWidth, height: halfHeight }, this.level + 1),
      new QuadTreeNode({ x, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.level + 1),
      new QuadTreeNode({ x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight }, this.level + 1)
    ];
  }

  /**
   * ノードクリア
   */
  clear(): void {
    this.entities.clear();
    if (this.children !== null) {
      this.children.forEach(child => child.clear());
      this.children = null;
    }
  }
}