/**
 * EntityRenderer - エンティティの存在チェックとエラーハンドリングを提供するコンポーネント
 */

'use client';

import React from 'react';
import { useEntity } from '@/hooks/ecs/useEntity';
import type { EntityRendererProps } from '@/hooks/ecs/types';

/**
 * エンティティの存在チェックとエラーハンドリングを提供するコンポーネント
 */
export const EntityRenderer: React.FC<EntityRendererProps> = ({
  entityId,
  children,
  fallback = <div>Entity not found</div>,
  errorBoundary: ErrorBoundary
}) => {
  const entityResult = useEntity(entityId);

  // エラーハンドリング
  if (entityResult.error && ErrorBoundary) {
    return <ErrorBoundary error={entityResult.error} entityId={entityId} />;
  }

  // ローディング状態
  if (entityResult.isLoading) {
    return <div>Loading entity...</div>;
  }

  // エンティティが存在しない場合
  if (!entityResult.exists) {
    return <>{fallback}</>;
  }

  // 正常な場合は子要素をレンダリング
  return <>{children(entityResult)}</>;
};