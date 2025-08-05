/**
 * AnimationComponent のテスト
 */

import { describe, it, expect } from 'vitest';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  type IAnimationComponent,
  DEFAULT_ANIMATION_COMPONENT,
  createAnimationComponent,
  createPositionAnimationComponent,
  isAnimationComponent,
} from '../AnimationComponent';

describe('AnimationComponent', () => {
  describe('createAnimationComponent', () => {
    it('基本的なアニメーションコンポーネントを作成できる', () => {
      const component = createAnimationComponent('fadeIn', 1000);

      expect(component.type).toBe(ComponentTypes.ANIMATION);
      expect(component.animationType).toBe('fadeIn');
      expect(component.duration).toBe(1000);
      expect(component.isAnimating).toBe(false);
      expect(component.delay).toBe(0);
      expect(component.easing).toBe('ease-out');
      expect(component.progress).toBe(0);
    });

    it('デフォルト値でアニメーションコンポーネントを作成できる', () => {
      const component = createAnimationComponent();

      expect(component.animationType).toBe('fadeIn');
      expect(component.duration).toBe(500);
      expect(component.loop).toBe(false);
      expect(component.loopCount).toBe(1);
      expect(component.currentLoop).toBe(0);
    });

    it('オプションで設定を上書きできる', () => {
      const component = createAnimationComponent('slideIn', 800, {
        delay: 200,
        easing: 'ease-in',
        loop: true,
        loopCount: 3,
        isAnimating: true,
      });

      expect(component.animationType).toBe('slideIn');
      expect(component.duration).toBe(800);
      expect(component.delay).toBe(200);
      expect(component.easing).toBe('ease-in');
      expect(component.loop).toBe(true);
      expect(component.loopCount).toBe(3);
      expect(component.isAnimating).toBe(true);
    });

    it('CSS連携設定を含むコンポーネントを作成できる', () => {
      const component = createAnimationComponent('pulse', 600, {
        cssTransition: 'opacity 600ms ease-in-out',
        cssClasses: ['pulse-animation', 'highlight'],
      });

      expect(component.cssTransition).toBe('opacity 600ms ease-in-out');
      expect(component.cssClasses).toEqual(['pulse-animation', 'highlight']);
    });

    it('コールバック関数を設定できる', () => {
      const onStart = () => console.log('start');
      const onComplete = () => console.log('complete');
      const onLoop = () => console.log('loop');

      const component = createAnimationComponent('bounce', 400, {
        onStart,
        onComplete,
        onLoop,
      });

      expect(component.onStart).toBe(onStart);
      expect(component.onComplete).toBe(onComplete);
      expect(component.onLoop).toBe(onLoop);
    });
  });

  describe('createPositionAnimationComponent', () => {
    it('位置アニメーション用のコンポーネントを作成できる', () => {
      const component = createPositionAnimationComponent(750, 'ease-in-out');

      expect(component.type).toBe(ComponentTypes.ANIMATION);
      expect(component.animationType).toBe('slideIn');
      expect(component.duration).toBe(750);
      expect(component.easing).toBe('ease-in-out');
      expect(component.cssTransition).toBe('transform 750ms ease-in-out');
    });

    it('デフォルト値で位置アニメーションコンポーネントを作成できる', () => {
      const component = createPositionAnimationComponent();

      expect(component.animationType).toBe('slideIn');
      expect(component.duration).toBe(500);
      expect(component.easing).toBe('ease-out');
      expect(component.cssTransition).toBe('transform 500ms ease-out');
    });
  });

  describe('isAnimationComponent', () => {
    it('AnimationComponentを正しく識別できる', () => {
      const animationComponent = createAnimationComponent('fadeIn');
      const otherComponent = { type: ComponentTypes.POSITION };

      expect(isAnimationComponent(animationComponent)).toBe(true);
      expect(isAnimationComponent(otherComponent as any)).toBe(false);
    });
  });

  describe('DEFAULT_ANIMATION_COMPONENT', () => {
    it('適切なデフォルト値を持つ', () => {
      expect(DEFAULT_ANIMATION_COMPONENT).toEqual({
        isAnimating: false,
        animationType: 'fadeIn',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        progress: 0,
        loop: false,
        loopCount: 1,
        currentLoop: 0,
        cssClasses: [],
      });
    });
  });

  describe('アニメーション状態管理', () => {
    it('進行状況を正しく管理できる', () => {
      const component = createAnimationComponent('scale', 1000, {
        isAnimating: true,
        progress: 0.5,
        startTime: performance.now(),
      });

      expect(component.isAnimating).toBe(true);
      expect(component.progress).toBe(0.5);
      expect(typeof component.startTime).toBe('number');
    });

    it('終了時刻を設定できる', () => {
      const startTime = performance.now();
      const duration = 1000;
      const endTime = startTime + duration;

      const component = createAnimationComponent('fadeOut', duration, {
        startTime,
        endTime,
      });

      expect(component.startTime).toBe(startTime);
      expect(component.endTime).toBe(endTime);
    });
  });

  describe('ループ制御', () => {
    it('無限ループを設定できる', () => {
      const component = createAnimationComponent('pulse', 500, {
        loop: true,
        loopCount: -1, // 無限ループ
      });

      expect(component.loop).toBe(true);
      expect(component.loopCount).toBe(-1);
    });

    it('有限ループを設定できる', () => {
      const component = createAnimationComponent('bounce', 300, {
        loop: true,
        loopCount: 5,
        currentLoop: 2,
      });

      expect(component.loop).toBe(true);
      expect(component.loopCount).toBe(5);
      expect(component.currentLoop).toBe(2);
    });
  });

  describe('型安全性', () => {
    it('IAnimationComponentインターフェースに準拠している', () => {
      const component: IAnimationComponent = createAnimationComponent('slideOut');
      
      // TypeScriptの型チェックが通ることを確認
      expect(component.type).toBe(ComponentTypes.ANIMATION);
      expect(typeof component.isAnimating).toBe('boolean');
      expect(['fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'pulse', 'bounce', 'scale'].includes(component.animationType)).toBe(true);
      expect(typeof component.duration).toBe('number');
      expect(typeof component.delay).toBe('number');
      expect(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier'].includes(component.easing)).toBe(true);
      expect(typeof component.progress).toBe('number');
      expect(typeof component.loop).toBe('boolean');
      expect(typeof component.loopCount).toBe('number');
      expect(typeof component.currentLoop).toBe('number');
      expect(Array.isArray(component.cssClasses)).toBe(true);
    });

    it('オプショナルプロパティが正しく処理される', () => {
      const component = createAnimationComponent('fadeIn');
      
      expect(component.startTime).toBeUndefined();
      expect(component.endTime).toBeUndefined();
      expect(component.cssTransition).toBeUndefined();
      expect(component.onStart).toBeUndefined();
      expect(component.onComplete).toBeUndefined();
      expect(component.onLoop).toBeUndefined();
    });
  });

  describe('アニメーションタイプ', () => {
    const animationTypes = ['fadeIn', 'fadeOut', 'slideIn', 'slideOut', 'pulse', 'bounce', 'scale'] as const;

    animationTypes.forEach(animationType => {
      it(`${animationType}アニメーションを作成できる`, () => {
        const component = createAnimationComponent(animationType);
        expect(component.animationType).toBe(animationType);
      });
    });
  });

  describe('イージングタイプ', () => {
    const easingTypes = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'cubic-bezier'] as const;

    easingTypes.forEach(easingType => {
      it(`${easingType}イージングを設定できる`, () => {
        const component = createAnimationComponent('fadeIn', 500, {
          easing: easingType,
        });
        expect(component.easing).toBe(easingType);
      });
    });
  });
});