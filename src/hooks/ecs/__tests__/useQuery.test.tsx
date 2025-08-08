/**
 * useQuery フックのテスト
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { ECSProvider } from '../ECSProvider';
import { useQuery } from '../useQuery';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { createTextComponent } from '@/ecs/components/TextComponent';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { ComponentTypes } from '@/ecs/core/Component';
import type { QueryFilter } from '@/ecs/query/types/QueryTypes';

// テスト用のWrapper
const createWrapper = (world?: World, eventBus?: EventBusImpl) => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ECSProvider world={world} eventBus={eventBus}>
      {children}
    </ECSProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useQuery', () => {
  let mockWorld: World;
  let mockEventBus: EventBusImpl;

  beforeEach(() => {
    mockEventBus = new EventBusImpl();
    mockWorld = new World(mockEventBus);
  });

  it('should execute basic query', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    // テストデータを作成
    const entity1 = mockWorld.createEntity();
    const entity2 = mockWorld.createEntity();
    const entity3 = mockWorld.createEntity();
    
    mockWorld.addComponent(entity1, createTextComponent('Text 1', 'idea'));
    mockWorld.addComponent(entity2, createTextComponent('Text 2', 'idea'));
    mockWorld.addComponent(entity3, createPositionComponent(10, 20));

    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => useQuery(filter), { wrapper });

    expect(result.current.entities).toHaveLength(2);
    expect(result.current.entities).toContain(entity1);
    expect(result.current.entities).toContain(entity2);
    expect(result.current.totalCount).toBe(2);
  });

  it('should handle empty query results', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => useQuery(filter), { wrapper });

    expect(result.current.entities).toHaveLength(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should support pagination', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    // 5つのエンティティを作成
    const entities = [];
    for (let i = 0; i < 5; i++) {
      const entity = mockWorld.createEntity();
      mockWorld.addComponent(entity, createTextComponent(`Text ${i}`, 'idea'));
      entities.push(entity);
    }

    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => 
      useQuery(filter, {
        pagination: { page: 0, pageSize: 2 }
      }), 
      { wrapper }
    );

    expect(result.current.entities).toHaveLength(2);
    expect(result.current.totalCount).toBe(2); // ページネーション後の数
  });

  it('should refetch query', async () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => 
      useQuery(filter, { autoUpdate: false }), 
      { wrapper }
    );

    expect(result.current.entities).toHaveLength(0);

    // 新しいエンティティを追加
    const entity = mockWorld.createEntity();
    mockWorld.addComponent(entity, createTextComponent('New Text', 'idea'));

    // 手動でrefetch
    await act(async () => {
      result.current.refetch();
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities).toContain(entity);
  });

  it('should auto-update when enabled', async () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => 
      useQuery(filter, { 
        autoUpdate: true, 
        updateInterval: 50 
      }), 
      { wrapper }
    );

    expect(result.current.entities).toHaveLength(0);

    // 新しいエンティティを追加
    act(() => {
      const entity = mockWorld.createEntity();
      mockWorld.addComponent(entity, createTextComponent('New Text', 'idea'));
    });

    // 少し待ってから自動更新を確認
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.entities).toHaveLength(1);
  });

  it('should handle query errors gracefully', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    // 無効なフィルターを使用してエラーを発生させる
    const invalidFilter: QueryFilter = {
      all: ['invalid-component-type' as ComponentType]
    };

    const { result } = renderHook(() => useQuery(invalidFilter), { wrapper });

    // エラーが発生した場合、空の結果を返すはず
    expect(result.current.entities).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
  });

  it('should measure execution time', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    // テストデータを作成
    const entity = mockWorld.createEntity();
    mockWorld.addComponent(entity, createTextComponent('Text', 'idea'));

    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => useQuery(filter), { wrapper });

    expect(result.current.executionTime).toBeGreaterThanOrEqual(0);
    expect(typeof result.current.executionTime).toBe('number');
  });

  it('should disable auto-update when specified', async () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    const filter: QueryFilter = {
      all: [ComponentTypes.TEXT]
    };

    const { result } = renderHook(() => 
      useQuery(filter, { autoUpdate: false }), 
      { wrapper }
    );

    expect(result.current.entities).toHaveLength(0);

    // 新しいエンティティを追加
    act(() => {
      const entity = mockWorld.createEntity();
      mockWorld.addComponent(entity, createTextComponent('New Text', 'idea'));
    });

    // 少し待っても自動更新されないはず
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.entities).toHaveLength(0);
  });
});