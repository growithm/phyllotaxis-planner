import { EventBusImpl } from '@/events/core';

/**
 * グローバルEventBusインスタンス
 * アプリケーション全体で共有されるEventBusインスタンス
 */
export const globalEventBus = new EventBusImpl({
  enableBatching: true,
  enableLogging: process.env.NODE_ENV === 'development',
  maxListeners: 100,
});

/**
 * EventBusインスタンスを作成するファクトリ関数
 * テスト時や特別な用途で独立したEventBusが必要な場合に使用
 */
export const createEventBus = (options?: {
  enableBatching?: boolean;
  enableLogging?: boolean;
  maxListeners?: number;
}) => {
  return new EventBusImpl({
    enableBatching: false,
    enableLogging: false,
    maxListeners: 100,
    ...options,
  });
};