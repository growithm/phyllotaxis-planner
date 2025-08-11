/**
 * イベント関連のテストヘルパー
 */

import type { EventBus } from '@/events/core/EventBus';

/**
 * イベントの発火を待機
 */
export function waitForEvent(
  eventBus: EventBus,
  eventName: string,
  timeout: number = 1000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      eventBus.off(eventName, handler);
      reject(new Error(`Event ${eventName} not fired within ${timeout}ms`));
    }, timeout);

    const handler = (data: any) => {
      clearTimeout(timeoutId);
      eventBus.off(eventName, handler);
      resolve(data);
    };

    eventBus.on(eventName, handler);
  });
}

/**
 * 複数のイベントの発火を待機
 */
export function waitForEvents(
  eventBus: EventBus,
  eventNames: string[],
  timeout: number = 1000
): Promise<Record<string, any>> {
  const promises = eventNames.map(eventName => 
    waitForEvent(eventBus, eventName, timeout).then(data => ({ [eventName]: data }))
  );
  
  return Promise.all(promises).then(results => 
    results.reduce((acc, result) => ({ ...acc, ...result }), {})
  );
}

/**
 * イベントが発火されたかを確認（非同期）
 */
export function expectEventToFire(
  eventBus: EventBus,
  eventName: string,
  timeout: number = 1000
): Promise<boolean> {
  return waitForEvent(eventBus, eventName, timeout)
    .then(() => true)
    .catch(() => false);
}

/**
 * イベントリスナーのモック作成
 */
export function createEventListenerMock() {
  const calls: Array<{ eventName: string; data: any; timestamp: number }> = [];
  
  const mockListener = (eventName: string) => (data: any) => {
    calls.push({
      eventName,
      data,
      timestamp: Date.now(),
    });
  };

  return {
    listener: mockListener,
    getCalls: () => [...calls],
    getCallsForEvent: (eventName: string) => calls.filter(call => call.eventName === eventName),
    getCallCount: () => calls.length,
    getCallCountForEvent: (eventName: string) => calls.filter(call => call.eventName === eventName).length,
    clear: () => calls.length = 0,
  };
}

/**
 * イベントの順序を検証
 */
export function verifyEventOrder(
  eventBus: EventBus,
  expectedOrder: string[],
  timeout: number = 2000
): Promise<boolean> {
  const receivedEvents: string[] = [];
  const listeners: Array<() => void> = [];

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // クリーンアップ
      listeners.forEach(cleanup => cleanup());
      reject(new Error(`Event order verification timed out. Expected: ${expectedOrder.join(' -> ')}, Received: ${receivedEvents.join(' -> ')}`));
    }, timeout);

    expectedOrder.forEach(eventName => {
      const handler = () => {
        receivedEvents.push(eventName);
        
        // 全てのイベントが受信されたかチェック
        if (receivedEvents.length === expectedOrder.length) {
          clearTimeout(timeoutId);
          // クリーンアップ
          listeners.forEach(cleanup => cleanup());
          
          // 順序が正しいかチェック
          const isCorrectOrder = expectedOrder.every((event, index) => 
            receivedEvents[index] === event
          );
          
          resolve(isCorrectOrder);
        }
      };

      eventBus.on(eventName, handler);
      listeners.push(() => eventBus.off(eventName, handler));
    });
  });
}