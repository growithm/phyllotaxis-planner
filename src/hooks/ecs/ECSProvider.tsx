/**
 * ECS React Context Provider
 */

'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { StateSynchronizer } from './StateSynchronizer';
import { BatchUpdater } from './BatchUpdater';
import type { ECSContext } from './types';

// Context作成
const ECSContextProvider = createContext<ECSContext | null>(null);

/**
 * ECSProviderのProps
 */
interface ECSProviderProps {
  children: React.ReactNode;
  world?: World;
  eventBus?: EventBusImpl;
}

/**
 * ECSコンテキストを提供するプロバイダー
 */
export const ECSProvider: React.FC<ECSProviderProps> = ({
  children,
  world: providedWorld,
  eventBus: providedEventBus
}) => {
  // World と EventBus のインスタンスを作成または使用
  const ecsContext = useMemo(() => {
    const eventBus = providedEventBus || new EventBusImpl();
    const world = providedWorld || new World(eventBus);
    
    const stateSynchronizer = new StateSynchronizer(world, eventBus);
    const batchUpdater = new BatchUpdater(world);

    return {
      world,
      eventBus,
      stateSynchronizer,
      batchUpdater
    };
  }, [providedWorld, providedEventBus]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      ecsContext.stateSynchronizer.dispose();
      ecsContext.batchUpdater.dispose();
    };
  }, [ecsContext]);

  return (
    <ECSContextProvider.Provider value={ecsContext}>
      {children}
    </ECSContextProvider.Provider>
  );
};

/**
 * ECSコンテキストを取得するフック
 */
export const useECSContext = (): ECSContext => {
  const context = useContext(ECSContextProvider);
  
  if (!context) {
    throw new Error('useECSContext must be used within ECSProvider');
  }
  
  return context;
};