/**
 * Vitest テストセットアップファイル
 */
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// React Testing Library のマッチャーを追加
expect.extend(matchers);

// 各テスト後にクリーンアップを実行
afterEach(() => {
  cleanup();
});