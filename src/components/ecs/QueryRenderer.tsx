/**
 * QueryRenderer - クエリ結果の表示とエラーハンドリングを提供するコンポーネント
 */

'use client';

import React from 'react';
import { useQuery } from '@/hooks/ecs/useQuery';
import type { QueryRendererProps } from '@/hooks/ecs/types';

/**
 * クエリ結果の表示とエラーハンドリングを提供するコンポーネント
 */
export const QueryRenderer: React.FC<QueryRendererProps> = ({
  filter,
  children,
  fallback = <div>Loading entities...</div>,
  emptyState = <div>No entities found</div>,
  errorBoundary: ErrorBoundary,
  options
}) => {
  const queryResult = useQuery(filter, options);

  // エラーハンドリング
  if (queryResult.error && ErrorBoundary) {
    return <ErrorBoundary error={queryResult.error} filter={filter} />;
  }

  // ローディング状態
  if (queryResult.isLoading) {
    return <>{fallback}</>;
  }

  // 結果が空の場合
  if (queryResult.entities.length === 0) {
    return <>{emptyState}</>;
  }

  // 正常な場合は子要素をレンダリング
  return <>{children(queryResult)}</>;
};