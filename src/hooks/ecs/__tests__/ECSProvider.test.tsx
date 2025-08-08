/**
 * ECSProvider コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { ECSProvider, useECSContext } from '../ECSProvider';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';

// テスト用コンポーネント
const TestComponent: React.FC = () => {
  const context = useECSContext();
  
  return (
    <div>
      <div data-testid="world-exists">{context.world ? 'true' : 'false'}</div>
      <div data-testid="eventbus-exists">{context.eventBus ? 'true' : 'false'}</div>
      <div data-testid="synchronizer-exists">{context.stateSynchronizer ? 'true' : 'false'}</div>
      <div data-testid="batcher-exists">{context.batchUpdater ? 'true' : 'false'}</div>
    </div>
  );
};

// エラーテスト用コンポーネント
const ErrorTestComponent: React.FC = () => {
  useECSContext(); // ECSProvider外で呼び出すとエラーになる
  return <div>Should not render</div>;
};

describe('ECSProvider', () => {
  let mockWorld: World;
  let mockEventBus: EventBusImpl;

  beforeEach(() => {
    mockEventBus = new EventBusImpl();
    mockWorld = new World(mockEventBus);
  });

  it('should provide ECS context with default instances', () => {
    render(
      <ECSProvider>
        <TestComponent />
      </ECSProvider>
    );

    expect(screen.getByTestId('world-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('eventbus-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('synchronizer-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('batcher-exists')).toHaveTextContent('true');
  });

  it('should use provided world and eventBus instances', () => {
    render(
      <ECSProvider world={mockWorld} eventBus={mockEventBus}>
        <TestComponent />
      </ECSProvider>
    );

    expect(screen.getByTestId('world-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('eventbus-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('synchronizer-exists')).toHaveTextContent('true');
    expect(screen.getByTestId('batcher-exists')).toHaveTextContent('true');
  });

  it('should throw error when useECSContext is used outside provider', () => {
    // エラーをキャッチするためのコンソールエラーを無効化
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ErrorTestComponent />);
    }).toThrow('useECSContext must be used within ECSProvider');

    consoleSpy.mockRestore();
  });

  it('should provide stable context across re-renders', () => {
    const { rerender } = render(
      <ECSProvider world={mockWorld} eventBus={mockEventBus}>
        <TestComponent />
      </ECSProvider>
    );

    const initialWorldExists = screen.getByTestId('world-exists').textContent;
    const initialEventBusExists = screen.getByTestId('eventbus-exists').textContent;

    // 再レンダリング
    rerender(
      <ECSProvider world={mockWorld} eventBus={mockEventBus}>
        <TestComponent />
      </ECSProvider>
    );

    expect(screen.getByTestId('world-exists')).toHaveTextContent(initialWorldExists!);
    expect(screen.getByTestId('eventbus-exists')).toHaveTextContent(initialEventBusExists!);
  });
});