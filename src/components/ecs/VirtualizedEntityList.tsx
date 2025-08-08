/**
 * VirtualizedEntityList - 大量のエンティティを効率的に表示する仮想化リストコンポーネント
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { VirtualizedEntityListProps } from '@/hooks/ecs/types';

/**
 * 大量のエンティティを効率的に表示する仮想化リストコンポーネント
 */
export const VirtualizedEntityList: React.FC<VirtualizedEntityListProps> = ({
  entities,
  itemHeight,
  containerHeight,
  renderItem
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // 表示範囲の計算
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      entities.length
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, entities.length]);

  // 表示するアイテムのリスト
  const visibleItems = useMemo(() => {
    return entities.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [entities, visibleRange]);

  // 全体の高さ
  const totalHeight = entities.length * itemHeight;

  // スクロールハンドラー
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`
          }}
        >
          {visibleItems.map((entityId, index) => (
            <div
              key={entityId}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderItem(entityId, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};