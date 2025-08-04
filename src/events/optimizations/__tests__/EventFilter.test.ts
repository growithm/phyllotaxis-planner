import { describe, it, expect, beforeEach } from 'vitest';
import { EventFilter } from '@/events/optimizations';
import { IdeaEvents } from '@/events/types';

describe('EventFilter', () => {
  let eventFilter: EventFilter;

  beforeEach(() => {
    eventFilter = new EventFilter();
  });

  describe('基本的なフィルタリング', () => {
    it('フィルター条件を追加できること', () => {
      const predicate = (data: { id: string }) => data.id !== 'filtered';
      eventFilter.addFilter(IdeaEvents.IDEA_ADDED, predicate);

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'valid' })).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'filtered' })).toBe(false);
    });

    it('フィルターがない場合は常にtrueを返すこと', () => {
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'any' })).toBe(true);
    });

    it('フィルターを削除できること', () => {
      const predicate = () => false;
      eventFilter.addFilter(IdeaEvents.IDEA_ADDED, predicate);
      
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'test' })).toBe(false);
      
      eventFilter.removeFilter(IdeaEvents.IDEA_ADDED);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'test' })).toBe(true);
    });
  });

  describe('重複フィルター', () => {
    it('重複イベントを除外できること', () => {
      eventFilter.addDuplicateFilter(
        IdeaEvents.IDEA_ADDED,
        (data: { id: string }) => data.id
      );

      const testData1 = { id: '1', text: 'test' };
      const testData2 = { id: '1', text: 'updated' }; // 同じID
      const testData3 = { id: '2', text: 'different' }; // 異なるID

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData1)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData2)).toBe(false); // 重複
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData3)).toBe(true);
    });
  });

  describe('変更検知フィルター', () => {
    it('変更がない場合はイベントを除外すること', () => {
      eventFilter.addChangeFilter(IdeaEvents.IDEA_ADDED);

      const testData1 = { id: '1', text: 'test' };
      const testData2 = { id: '1', text: 'test' }; // 同じデータ
      const testData3 = { id: '1', text: 'updated' }; // 変更されたデータ

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData1)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData2)).toBe(false); // 変更なし
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData3)).toBe(true); // 変更あり
    });

    it('カスタム比較関数を使用できること', () => {
      // IDのみを比較する関数
      const compareById = (oldData: { id: string }, newData: { id: string }) => oldData.id === newData.id;
      eventFilter.addChangeFilter(IdeaEvents.IDEA_ADDED, compareById);

      const testData1 = { id: '1', text: 'test' };
      const testData2 = { id: '1', text: 'updated' }; // IDは同じ、テキストは異なる
      const testData3 = { id: '2', text: 'test' }; // IDが異なる

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData1)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData2)).toBe(false); // IDが同じ
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData3)).toBe(true); // IDが異なる
    });
  });

  describe('レート制限フィルター', () => {
    it('レート制限を適用できること', () => {
      // 1秒間に2回まで
      eventFilter.addRateLimitFilter(IdeaEvents.IDEA_ADDED, 2);

      const testData = { id: '1', text: 'test' };

      // 最初の2回は通る
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(true);
      
      // 3回目は制限される
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(false);
    });

    it('時間経過後にレート制限がリセットされること', async () => {
      // テスト用に短い間隔を使用
      eventFilter.addRateLimitFilter(IdeaEvents.IDEA_ADDED, 1);

      const testData = { id: '1', text: 'test' };

      // 最初は通る
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(true);
      // 2回目は制限される
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(false);

      // 1秒以上待機してレート制限をリセット
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // 時間経過後は再び通る
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, testData)).toBe(true);
    });
  });

  describe('フィルター管理', () => {
    it('すべてのフィルターをクリアできること', () => {
      eventFilter.addFilter(IdeaEvents.IDEA_ADDED, () => false);
      eventFilter.addDuplicateFilter(IdeaEvents.IDEA_REMOVED, (data: { id: string }) => data.id);

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'test' })).toBe(false);

      eventFilter.clearAllFilters();

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, { id: 'test' })).toBe(true);
    });

    it('フィルター統計を取得できること', () => {
      eventFilter.addFilter(IdeaEvents.IDEA_ADDED, () => true);
      eventFilter.addDuplicateFilter(IdeaEvents.IDEA_REMOVED, (data: { id: string }) => data.id);
      eventFilter.addChangeFilter(IdeaEvents.IDEA_UPDATED);

      // 重複フィルターとして1つのアイデアを処理
      eventFilter.shouldProcess(IdeaEvents.IDEA_REMOVED, { id: '1' });

      const stats = eventFilter.getFilterStats();
      expect(stats.filterCount).toBe(3);
      expect(stats.processedIdCount).toBe(1);
    });
  });

  describe('浅い比較', () => {
    it('プリミティブ値を正しく比較すること', () => {
      eventFilter.addChangeFilter(IdeaEvents.IDEA_ADDED);

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, 'test')).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, 'test')).toBe(false); // 同じ
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, 'different')).toBe(true); // 異なる
    });

    it('オブジェクトを正しく比較すること', () => {
      eventFilter.addChangeFilter(IdeaEvents.IDEA_ADDED);

      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 }; // 同じ内容
      const obj3 = { a: 1, b: 3 }; // 異なる内容

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, obj1)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, obj2)).toBe(false); // 同じ内容
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, obj3)).toBe(true); // 異なる内容
    });

    it('nullとundefinedを正しく処理すること', () => {
      eventFilter.addChangeFilter(IdeaEvents.IDEA_ADDED);

      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, null)).toBe(true);
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, null)).toBe(false); // 同じ
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, undefined)).toBe(true); // 異なる
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, undefined)).toBe(false); // 同じ
      expect(eventFilter.shouldProcess(IdeaEvents.IDEA_ADDED, null)).toBe(true); // 再び異なる
    });
  });
});