/**
 * VisualComponent のテスト
 */

import { describe, it, expect } from 'vitest';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  type IVisualComponent,
  DEFAULT_VISUAL_COMPONENT,
  DEFAULT_THEME_VISUAL_COMPONENT,
  DEFAULT_IDEA_VISUAL_COMPONENT,
  createVisualComponent,
  createThemeVisualComponent,
  createIdeaVisualComponent,
  isVisualComponent,
} from '../VisualComponent';

describe('VisualComponent', () => {
  describe('createVisualComponent', () => {
    it('基本的な視覚コンポーネントを作成できる', () => {
      const component = createVisualComponent('circle');

      expect(component.type).toBe(ComponentTypes.VISUAL);
      expect(component.shape).toBe('circle');
      expect(component.visible).toBe(true);
      expect(component.opacity).toBe(1.0);
      expect(component.width).toBe(40);
      expect(component.height).toBe(20);
    });

    it('デフォルト形状でコンポーネントを作成できる', () => {
      const component = createVisualComponent();

      expect(component.shape).toBe('leaf'); // デフォルト形状
      expect(component.fillColor).toBe('#10B981');
      expect(component.strokeColor).toBe('#059669');
      expect(component.strokeWidth).toBe(2);
    });

    it('オプションで設定を上書きできる', () => {
      const component = createVisualComponent('rect', {
        width: 100,
        height: 50,
        fillColor: '#FF0000',
        opacity: 0.8,
      });

      expect(component.shape).toBe('rect');
      expect(component.width).toBe(100);
      expect(component.height).toBe(50);
      expect(component.fillColor).toBe('#FF0000');
      expect(component.opacity).toBe(0.8);
    });

    it('グラデーション設定を含むコンポーネントを作成できる', () => {
      const gradient = {
        type: 'linear' as const,
        stops: [
          { offset: 0, color: '#FF0000' },
          { offset: 1, color: '#0000FF' },
        ],
        direction: '45deg',
      };

      const component = createVisualComponent('circle', {
        gradient,
      });

      expect(component.gradient).toEqual(gradient);
    });

    it('影設定を含むコンポーネントを作成できる', () => {
      const shadow = {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: '#000000',
      };

      const component = createVisualComponent('ellipse', {
        shadow,
      });

      expect(component.shadow).toEqual(shadow);
    });
  });

  describe('createThemeVisualComponent', () => {
    it('テーマ用の視覚コンポーネントを作成できる', () => {
      const component = createThemeVisualComponent();

      expect(component.type).toBe(ComponentTypes.VISUAL);
      expect(component.shape).toBe('circle');
      expect(component.width).toBe(80);
      expect(component.height).toBe(80);
      expect(component.fillColor).toBe('#8B5CF6');
      expect(component.strokeColor).toBe('#7C3AED');
      expect(component.strokeWidth).toBe(3);
    });

    it('オプションでテーマ設定を上書きできる', () => {
      const component = createThemeVisualComponent({
        width: 120,
        fillColor: '#00FF00',
      });

      expect(component.width).toBe(120);
      expect(component.fillColor).toBe('#00FF00');
      expect(component.shape).toBe('circle'); // デフォルトは維持
      expect(component.height).toBe(80); // デフォルトは維持
    });
  });

  describe('createIdeaVisualComponent', () => {
    it('アイデア用の視覚コンポーネントを作成できる', () => {
      const component = createIdeaVisualComponent();

      expect(component.type).toBe(ComponentTypes.VISUAL);
      expect(component.shape).toBe('leaf');
      expect(component.width).toBe(40);
      expect(component.height).toBe(20);
      expect(component.fillColor).toBe('#10B981');
      expect(component.strokeColor).toBe('#059669');
      expect(component.strokeWidth).toBe(2);
    });

    it('オプションでアイデア設定を上書きできる', () => {
      const component = createIdeaVisualComponent({
        width: 60,
        height: 30,
        fillColor: '#FF00FF',
      });

      expect(component.width).toBe(60);
      expect(component.height).toBe(30);
      expect(component.fillColor).toBe('#FF00FF');
      expect(component.shape).toBe('leaf'); // デフォルトは維持
    });
  });

  describe('isVisualComponent', () => {
    it('VisualComponentを正しく識別できる', () => {
      const visualComponent = createVisualComponent('circle');
      const otherComponent = { type: ComponentTypes.TEXT };

      expect(isVisualComponent(visualComponent)).toBe(true);
      expect(isVisualComponent(otherComponent as any)).toBe(false);
    });
  });

  describe('デフォルト値', () => {
    it('DEFAULT_VISUAL_COMPONENTが適切な値を持つ', () => {
      expect(DEFAULT_VISUAL_COMPONENT).toEqual({
        visible: true,
        opacity: 1.0,
        shape: 'leaf',
        width: 40,
        height: 20,
        fillColor: '#10B981',
        strokeColor: '#059669',
        strokeWidth: 2,
        cssClasses: [],
        customStyles: {},
      });
    });

    it('DEFAULT_THEME_VISUAL_COMPONENTがテーマ用の設定を持つ', () => {
      expect(DEFAULT_THEME_VISUAL_COMPONENT).toEqual({
        ...DEFAULT_VISUAL_COMPONENT,
        shape: 'circle',
        width: 80,
        height: 80,
        fillColor: '#8B5CF6',
        strokeColor: '#7C3AED',
        strokeWidth: 3,
      });
    });

    it('DEFAULT_IDEA_VISUAL_COMPONENTがアイデア用の設定を持つ', () => {
      expect(DEFAULT_IDEA_VISUAL_COMPONENT).toEqual({
        ...DEFAULT_VISUAL_COMPONENT,
        shape: 'leaf',
        width: 40,
        height: 20,
        fillColor: '#10B981',
        strokeColor: '#059669',
      });
    });
  });

  describe('CSS連携', () => {
    it('CSSクラスとカスタムスタイルを設定できる', () => {
      const component = createVisualComponent('rect', {
        cssClasses: ['custom-class', 'animated'],
        customStyles: {
          'border-radius': '4px',
          'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
        },
      });

      expect(component.cssClasses).toEqual(['custom-class', 'animated']);
      expect(component.customStyles).toEqual({
        'border-radius': '4px',
        'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
      });
    });
  });

  describe('SVG特有設定', () => {
    it('カスタムSVGパスと属性を設定できる', () => {
      const svgPath = 'M10,10 L20,20 L10,30 Z';
      const svgAttributes = {
        'stroke-dasharray': '5,5',
        'stroke-linecap': 'round',
      };

      const component = createVisualComponent('custom', {
        svgPath,
        svgAttributes,
      });

      expect(component.svgPath).toBe(svgPath);
      expect(component.svgAttributes).toEqual(svgAttributes);
    });
  });

  describe('型安全性', () => {
    it('IVisualComponentインターフェースに準拠している', () => {
      const component: IVisualComponent = createVisualComponent('circle');
      
      // TypeScriptの型チェックが通ることを確認
      expect(component.type).toBe(ComponentTypes.VISUAL);
      expect(typeof component.visible).toBe('boolean');
      expect(typeof component.opacity).toBe('number');
      expect(['circle', 'ellipse', 'rect', 'leaf', 'custom'].includes(component.shape)).toBe(true);
      expect(typeof component.width).toBe('number');
      expect(typeof component.height).toBe('number');
      expect(typeof component.fillColor).toBe('string');
      expect(typeof component.strokeColor).toBe('string');
      expect(typeof component.strokeWidth).toBe('number');
      expect(Array.isArray(component.cssClasses)).toBe(true);
      expect(typeof component.customStyles).toBe('object');
    });

    it('オプショナルプロパティが正しく処理される', () => {
      const component = createVisualComponent('leaf');
      
      expect(component.gradient).toBeUndefined();
      expect(component.shadow).toBeUndefined();
      expect(component.svgPath).toBeUndefined();
      expect(component.svgAttributes).toBeUndefined();
    });
  });
});