/**
 * QuerySystem統合テスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuerySystem } from '../QuerySystem';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createTextComponent } from '@/ecs/components/TextComponent';
import { createVisualComponent } from '@/ecs/components/VisualComponent';

describe('QuerySystem', () => {
  let world: World;
  let querySystem: QuerySystem;
  let eventBus: EventBusImpl;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    querySystem = new QuerySystem(world);
    
    // QuerySystemのインデックスを強制更新
    querySystem.invalidateCache();
  });

  describe('基本クエリ機能', () => {
    it('必須コンポーネント（all）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(10, 20));
      world.addComponent(entity1, createTextComponent('test1', 'idea'));

      world.addComponent(entity2, createPositionComponent(30, 40));
      world.addComponent(entity2, createVisualComponent());

      world.addComponent(entity3, createPositionComponent(50, 60));
      world.addComponent(entity3, createTextComponent('test3', 'idea'));

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.POSITION, ComponentTypes.TEXT]
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity3);
      expect(result.totalCount).toBe(2);
      expect(result.fromCache).toBe(false);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('いずれかのコンポーネント（any）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createTextComponent('test1', 'idea'));
      world.addComponent(entity2, createVisualComponent());
      world.addComponent(entity3, createPositionComponent(10, 20));

      // クエリ実行
      const result = querySystem.query({
        any: [ComponentTypes.TEXT, ComponentTypes.VISUAL]
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity2);
      expect(result.totalCount).toBe(2);
    });

    it('除外コンポーネント（none）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(10, 20));
      world.addComponent(entity2, createPositionComponent(30, 40));
      world.addComponent(entity2, createTextComponent('test2', 'idea'));
      world.addComponent(entity3, createPositionComponent(50, 60));

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.POSITION],
        none: [ComponentTypes.TEXT]
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity3);
      expect(result.totalCount).toBe(2);
    });

    it('カスタム条件（where）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createTextComponent('important', 'idea'));
      world.addComponent(entity2, createTextComponent('normal', 'idea'));
      world.addComponent(entity3, createTextComponent('important task', 'idea'));

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.TEXT],
        where: (entityId, components) => {
          const textComponent = components.get(ComponentTypes.TEXT) as { content: string } | undefined;
          return textComponent && textComponent.content.includes('important');
        }
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity3);
    });

    it('結果制限（limit）が正しく動作する', () => {
      // テストデータ作成
      for (let i = 0; i < 10; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, createPositionComponent(i * 10, i * 10));
      }

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.POSITION],
        limit: 5
      });

      // 検証
      expect(result.entities).toHaveLength(5);
      expect(result.totalCount).toBe(10);
    });

    it('オフセット（offset）が正しく動作する', () => {
      // テストデータ作成
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, createPositionComponent(i * 10, i * 10));
        entities.push(entity);
      }

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.POSITION],
        offset: 3,
        limit: 4
      });

      // 検証
      expect(result.entities).toHaveLength(4);
      expect(result.totalCount).toBe(10);
    });
  });

  describe('高度なクエリ機能', () => {
    it('空間クエリ（円形範囲）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(100, 100)); // 中心から距離0
      world.addComponent(entity2, createPositionComponent(130, 100)); // 中心から距離30
      world.addComponent(entity3, createPositionComponent(200, 100)); // 中心から距離100

      // クエリ実行
      const result = querySystem.queryAdvanced({
        all: [ComponentTypes.POSITION],
        spatial: {
          type: 'circle',
          center: { x: 100, y: 100 },
          radius: 50
        }
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity2);
    });

    it('空間クエリ（矩形範囲）でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(50, 50));   // 範囲内
      world.addComponent(entity2, createPositionComponent(150, 150)); // 範囲内
      world.addComponent(entity3, createPositionComponent(250, 250)); // 範囲外

      // クエリ実行
      const result = querySystem.queryAdvanced({
        all: [ComponentTypes.POSITION],
        spatial: {
          type: 'rectangle',
          bounds: { x1: 0, y1: 0, x2: 200, y2: 200 }
        }
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity2);
    });

    it('テキスト検索でエンティティを検索できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createTextComponent('important task', 'idea'));
      world.addComponent(entity2, createTextComponent('normal work', 'idea'));
      world.addComponent(entity3, createTextComponent('IMPORTANT meeting', 'idea'));

      // クエリ実行（大文字小文字を区別しない）
      const result = querySystem.queryAdvanced({
        all: [ComponentTypes.TEXT],
        text: [{
          component: ComponentTypes.TEXT,
          property: 'content',
          text: 'important',
          mode: 'contains',
          caseSensitive: false
        }]
      });

      // 検証
      expect(result.entities).toHaveLength(2);
      expect(result.entities).toContain(entity1);
      expect(result.entities).toContain(entity3);
    });
  });

  describe('QueryBuilder', () => {
    it('流暢なインターフェースでクエリを構築できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(100, 100));
      world.addComponent(entity1, createTextComponent('test1', 'idea'));

      world.addComponent(entity2, createPositionComponent(200, 200));
      world.addComponent(entity2, createTextComponent('test2', 'idea'));

      // QueryBuilderを使用
      const result = querySystem.createBuilder()
        .withComponents(ComponentTypes.POSITION, ComponentTypes.TEXT)
        .withinCircle({ x: 100, y: 100 }, 50)
        .limit(10)
        .execute(querySystem);

      // 検証
      expect(result.entities).toHaveLength(1);
      expect(result.entities).toContain(entity1);
    });

    it('複数の条件を組み合わせてクエリを構築できる', () => {
      // テストデータ作成
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createPositionComponent(50, 50));
      world.addComponent(entity1, createTextComponent('important', 'idea'));

      world.addComponent(entity2, createPositionComponent(60, 60));
      world.addComponent(entity2, createTextComponent('normal', 'idea'));

      world.addComponent(entity3, createPositionComponent(200, 200));
      world.addComponent(entity3, createTextComponent('important', 'idea'));

      // 複合クエリ
      const result = querySystem.createBuilder()
        .withComponents(ComponentTypes.POSITION, ComponentTypes.TEXT)
        .withinCircle({ x: 50, y: 50 }, 20)
        .withText(ComponentTypes.TEXT, 'content', 'important', 'contains')
        .execute(querySystem);

      // 検証
      expect(result.entities).toHaveLength(1);
      expect(result.entities).toContain(entity1);
    });
  });

  describe('キャッシュ機能', () => {
    it('同じクエリの結果がキャッシュされる', () => {
      // テストデータ作成
      const entity = world.createEntity();
      world.addComponent(entity, createPositionComponent(10, 20));

      const filter = { all: [ComponentTypes.POSITION] };

      // 1回目のクエリ
      const result1 = querySystem.query(filter);
      expect(result1.fromCache).toBe(false);

      // 2回目のクエリ（キャッシュから取得）
      const result2 = querySystem.query(filter);
      expect(result2.fromCache).toBe(true);
      expect(result2.entities).toEqual(result1.entities);
    });

    it('キャッシュ無効化が正しく動作する', () => {
      // テストデータ作成
      const entity = world.createEntity();
      world.addComponent(entity, createPositionComponent(10, 20));

      const filter = { all: [ComponentTypes.POSITION] };

      // 1回目のクエリ
      const result1 = querySystem.query(filter);
      expect(result1.fromCache).toBe(false);

      // キャッシュ無効化
      querySystem.invalidateCache();

      // 2回目のクエリ（キャッシュが無効化されているため再実行）
      const result2 = querySystem.query(filter);
      expect(result2.fromCache).toBe(false);
    });
  });

  describe('パフォーマンス', () => {
    it('大量エンティティでのクエリが1ms以内で完了する', () => {
      // 50個のエンティティを作成
      for (let i = 0; i < 50; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, createPositionComponent(i * 10, i * 10));
        if (i % 2 === 0) {
          world.addComponent(entity, createTextComponent(`text${i}`, 'idea'));
        }
      }

      // クエリ実行
      const result = querySystem.query({
        all: [ComponentTypes.POSITION, ComponentTypes.TEXT]
      });

      // パフォーマンス検証
      expect(result.executionTime).toBeLessThan(1); // 1ms以内
      expect(result.entities.length).toBe(25); // 偶数インデックスのエンティティ
    });

    it('統計情報が正しく収集される', () => {
      // テストデータ作成
      const entity = world.createEntity();
      world.addComponent(entity, createPositionComponent(10, 20));

      // 複数回クエリ実行
      querySystem.query({ all: [ComponentTypes.POSITION] });
      querySystem.query({ all: [ComponentTypes.POSITION] });
      querySystem.query({ all: [ComponentTypes.TEXT] });

      // 統計情報取得
      const stats = querySystem.getStats();

      // 検証
      expect(stats.totalQueries).toBe(3);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
      expect(stats.cacheHitRate).toBeGreaterThan(0); // 2回目のクエリがキャッシュヒット
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なクエリでもエラーを投げずに空の結果を返す', () => {
      // 無効なクエリ実行
      const result = querySystem.query({
        all: ['invalid-component' as ComponentTypes]
      });

      // 検証
      expect(result.entities).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('カスタム条件でエラーが発生しても適切に処理される', () => {
      // テストデータ作成
      const entity = world.createEntity();
      world.addComponent(entity, createPositionComponent(10, 20));

      // エラーを投げるカスタム条件
      const result = querySystem.query({
        all: [ComponentTypes.POSITION],
        where: () => {
          throw new Error('Test error');
        }
      });

      // 検証（エラーが適切に処理され、空の結果が返される）
      expect(result.entities).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});