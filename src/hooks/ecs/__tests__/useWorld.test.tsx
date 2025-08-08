/**
 * useWorld フックのテスト
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { ECSProvider } from '../ECSProvider';
import { useWorld } from '../useWorld';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { createTextComponent } from '@/ecs/components/TextComponent';

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

describe('useWorld', () => {
  let mockWorld: World;
  let mockEventBus: EventBusImpl;

  beforeEach(() => {
    mockEventBus = new EventBusImpl();
    mockWorld = new World(mockEventBus);
  });

  it('should provide world instance and basic operations', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld(), { wrapper });

    expect(result.current.world).toBe(mockWorld);
    expect(typeof result.current.createEntity).toBe('function');
    expect(typeof result.current.destroyEntity).toBe('function');
    expect(typeof result.current.addComponent).toBe('function');
    expect(typeof result.current.removeComponent).toBe('function');
    expect(typeof result.current.getComponent).toBe('function');
    expect(typeof result.current.query).toBe('function');
    expect(typeof result.current.batchUpdate).toBe('function');
  });

  it('should create and destroy entities', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld(), { wrapper });

    const initialEntityCount = result.current.entities.length;

    act(() => {
      const entityId = result.current.createEntity();
      expect(result.current.entities.length).toBe(initialEntityCount + 1);
      
      result.current.destroyEntity(entityId);
      expect(result.current.entities.length).toBe(initialEntityCount);
    });
  });

  it('should handle component operations', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld(), { wrapper });

    act(() => {
      const entityId = result.current.createEntity();
      const textComponent = createTextComponent('Test Text', 'idea');
      
      result.current.addComponent(entityId, textComponent);
      
      const retrievedComponent = result.current.getComponent(entityId, 'text');
      expect(retrievedComponent).toEqual(textComponent);
      
      const removed = result.current.removeComponent(entityId, 'text');
      expect(removed).toBe(true);
      
      const afterRemoval = result.current.getComponent(entityId, 'text');
      expect(afterRemoval).toBeUndefined();
    });
  });

  it('should handle batch updates', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld(), { wrapper });

    act(() => {
      result.current.batchUpdate(() => {
        const entity1 = result.current.createEntity();
        const entity2 = result.current.createEntity();
        
        result.current.addComponent(entity1, createTextComponent('Test 1', 'idea'));
        result.current.addComponent(entity2, createTextComponent('Test 2', 'idea'));
      });
    });

    expect(result.current.entities.length).toBe(2);
  });

  it('should handle errors gracefully', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld(), { wrapper });

    act(() => {
      // 存在しないエンティティからコンポーネントを削除しようとする
      const removed = result.current.removeComponent('non-existent', 'text');
      expect(removed).toBe(false);
      expect(result.current.error).toBeNull(); // エラーは発生しないはず
    });
  });

  it('should sync with world automatically', async () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld({ autoSync: true, syncInterval: 50 }), { wrapper });

    const initialVersion = result.current.version;

    // Worldを直接変更
    act(() => {
      mockWorld.createEntity();
    });

    // 少し待ってから同期を確認
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.version).toBeGreaterThan(initialVersion);
  });

  it('should disable auto sync when specified', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useWorld({ autoSync: false }), { wrapper });

    const initialVersion = result.current.version;

    act(() => {
      result.current.createEntity();
    });

    // autoSyncが無効なので、バージョンは変わらないはず
    expect(result.current.version).toBe(initialVersion);
  });
});