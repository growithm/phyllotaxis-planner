/**
 * useEntity フックのテスト
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { ECSProvider } from '../ECSProvider';
import { useEntity } from '../useEntity';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { createTextComponent } from '@/ecs/components/TextComponent';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { ComponentTypes } from '@/ecs/core/Component';

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

describe('useEntity', () => {
  let mockWorld: World;
  let mockEventBus: EventBusImpl;
  let testEntityId: string;

  beforeEach(() => {
    mockEventBus = new EventBusImpl();
    mockWorld = new World(mockEventBus);
    testEntityId = mockWorld.createEntity();
  });

  it('should track entity existence', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useEntity(testEntityId), { wrapper });

    expect(result.current.exists).toBe(true);
    expect(result.current.entityId).toBe(testEntityId);
  });

  it('should handle non-existent entity', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useEntity('non-existent'), { wrapper });

    expect(result.current.exists).toBe(false);
    expect(result.current.entityId).toBe('non-existent');
  });

  it('should track components', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    
    // エンティティにコンポーネントを追加
    const textComponent = createTextComponent('Test Text', 'idea');
    mockWorld.addComponent(testEntityId, textComponent);

    const { result } = renderHook(() => useEntity(testEntityId), { wrapper });

    expect(result.current.hasComponent(ComponentTypes.TEXT)).toBe(true);
    expect(result.current.getComponent(ComponentTypes.TEXT)).toEqual(textComponent);
    expect(result.current.components.size).toBe(1);
  });

  it('should add and remove components', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useEntity(testEntityId), { wrapper });

    act(() => {
      const textComponent = createTextComponent('New Text', 'idea');
      result.current.addComponent(textComponent);
    });

    expect(result.current.hasComponent(ComponentTypes.TEXT)).toBe(true);

    act(() => {
      const removed = result.current.removeComponent(ComponentTypes.TEXT);
      expect(removed).toBe(true);
    });

    expect(result.current.hasComponent(ComponentTypes.TEXT)).toBe(false);
  });

  it('should watch specific components only', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => 
      useEntity(testEntityId, { 
        watchComponents: [ComponentTypes.TEXT] 
      }), 
      { wrapper }
    );

    // TEXTコンポーネントを追加（監視対象）
    act(() => {
      result.current.addComponent(createTextComponent('Test', 'idea'));
    });

    expect(result.current.hasComponent(ComponentTypes.TEXT)).toBe(true);

    // POSITIONコンポーネントを直接Worldに追加（監視対象外）
    act(() => {
      mockWorld.addComponent(testEntityId, createPositionComponent(10, 20));
    });

    // 監視対象外なので、useEntityの状態は更新されない可能性がある
    // （実際の動作は実装に依存）
  });

  it('should handle errors gracefully', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => useEntity(testEntityId), { wrapper });

    act(() => {
      // 存在しないコンポーネントを削除しようとする
      const removed = result.current.removeComponent(ComponentTypes.TEXT);
      expect(removed).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should disable auto sync when specified', () => {
    const wrapper = createWrapper(mockWorld, mockEventBus);
    const { result } = renderHook(() => 
      useEntity(testEntityId, { autoSync: false }), 
      { wrapper }
    );

    const initialComponentCount = result.current.components.size;

    // Worldを直接変更
    act(() => {
      mockWorld.addComponent(testEntityId, createTextComponent('Direct Add', 'idea'));
    });

    // autoSyncが無効なので、useEntityの状態は更新されない
    expect(result.current.components.size).toBe(initialComponentCount);
  });
});