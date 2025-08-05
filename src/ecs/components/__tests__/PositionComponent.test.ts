/**
 * PositionComponent のテスト
 */

import { describe, it, expect } from 'vitest';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  type IPositionComponent,
  DEFAULT_POSITION_COMPONENT,
  createPositionComponent,
  createPhyllotaxisPositionComponent,
  isPositionComponent,
} from '../PositionComponent';

describe('PositionComponent', () => {
  describe('createPositionComponent', () => {
    it('基本的な位置コンポーネントを作成できる', () => {
      const component = createPositionComponent(100, 200);

      expect(component.type).toBe(ComponentTypes.POSITION);
      expect(component.x).toBe(100);
      expect(component.y).toBe(200);
      expect(component.angle).toBe(0);
      expect(component.radius).toBe(0);
      expect(component.index).toBe(0);
      expect(component.scale).toBe(1.0);
      expect(component.zIndex).toBe(0);
      expect(component.isAnimating).toBe(false);
    });

    it('デフォルト値で位置コンポーネントを作成できる', () => {
      const component = createPositionComponent();

      expect(component.x).toBe(0);
      expect(component.y).toBe(0);
      expect(component).toMatchObject(DEFAULT_POSITION_COMPONENT);
    });

    it('オプションで追加プロパティを設定できる', () => {
      const component = createPositionComponent(50, 75, {
        scale: 1.5,
        zIndex: 10,
        isAnimating: true,
        targetX: 100,
        targetY: 150,
      });

      expect(component.x).toBe(50);
      expect(component.y).toBe(75);
      expect(component.scale).toBe(1.5);
      expect(component.zIndex).toBe(10);
      expect(component.isAnimating).toBe(true);
      expect(component.targetX).toBe(100);
      expect(component.targetY).toBe(150);
    });
  });

  describe('createPhyllotaxisPositionComponent', () => {
    it('フィロタキシス用の位置コンポーネントを作成できる', () => {
      const component = createPhyllotaxisPositionComponent(
        5,      // index
        137.5,  // angle
        100,    // radius
        250,    // x
        300     // y
      );

      expect(component.type).toBe(ComponentTypes.POSITION);
      expect(component.index).toBe(5);
      expect(component.angle).toBe(137.5);
      expect(component.radius).toBe(100);
      expect(component.x).toBe(250);
      expect(component.y).toBe(300);
      expect(component.scale).toBe(1.0);
      expect(component.zIndex).toBe(5); // indexがzIndexとして使用される
      expect(component.isAnimating).toBe(false);
    });
  });

  describe('isPositionComponent', () => {
    it('PositionComponentを正しく識別できる', () => {
      const positionComponent = createPositionComponent(10, 20);
      const otherComponent = { type: ComponentTypes.TEXT };

      expect(isPositionComponent(positionComponent)).toBe(true);
      expect(isPositionComponent(otherComponent as any)).toBe(false);
    });
  });

  describe('DEFAULT_POSITION_COMPONENT', () => {
    it('適切なデフォルト値を持つ', () => {
      expect(DEFAULT_POSITION_COMPONENT).toEqual({
        x: 0,
        y: 0,
        angle: 0,
        radius: 0,
        index: 0,
        scale: 1.0,
        zIndex: 0,
        isAnimating: false,
      });
    });
  });

  describe('型安全性', () => {
    it('IPositionComponentインターフェースに準拠している', () => {
      const component: IPositionComponent = createPositionComponent(0, 0);
      
      // TypeScriptの型チェックが通ることを確認
      expect(component.type).toBe(ComponentTypes.POSITION);
      expect(typeof component.x).toBe('number');
      expect(typeof component.y).toBe('number');
      expect(typeof component.angle).toBe('number');
      expect(typeof component.radius).toBe('number');
      expect(typeof component.index).toBe('number');
      expect(typeof component.scale).toBe('number');
      expect(typeof component.zIndex).toBe('number');
      expect(typeof component.isAnimating).toBe('boolean');
    });
  });
});