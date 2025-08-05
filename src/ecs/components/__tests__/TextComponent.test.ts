/**
 * TextComponent のテスト
 */

import { describe, it, expect } from 'vitest';
import { ComponentTypes } from '@/ecs/core/Component';
import {
  type ITextComponent,
  DEFAULT_TEXT_COMPONENT,
  DEFAULT_THEME_TEXT_COMPONENT,
  DEFAULT_IDEA_TEXT_COMPONENT,
  createTextComponent,
  createThemeTextComponent,
  createIdeaTextComponent,
  isTextComponent,
} from '../TextComponent';

describe('TextComponent', () => {
  describe('createTextComponent', () => {
    it('基本的なテキストコンポーネントを作成できる', () => {
      const component = createTextComponent('テストテキスト', 'idea');

      expect(component.type).toBe(ComponentTypes.TEXT);
      expect(component.content).toBe('テストテキスト');
      expect(component.entityType).toBe('idea');
      expect(component.maxLength).toBe(100);
      expect(component.isEditable).toBe(true);
    });

    it('テーマタイプでテキストコンポーネントを作成できる', () => {
      const component = createTextComponent('テーマタイトル', 'theme');

      expect(component.entityType).toBe('theme');
      expect(component.fontSize).toBe(20);
      expect(component.fontWeight).toBe('bold');
      expect(component.color).toBe('#1F2937');
      expect(component.placeholder).toBe('テーマを入力してください');
    });

    it('アイデアタイプでテキストコンポーネントを作成できる', () => {
      const component = createTextComponent('アイデア内容', 'idea');

      expect(component.entityType).toBe('idea');
      expect(component.fontSize).toBe(14);
      expect(component.fontWeight).toBe('normal');
      expect(component.color).toBe('#374151');
    });

    it('最大文字数制限が適用される', () => {
      const longText = 'a'.repeat(150);
      const component = createTextComponent(longText, 'idea');

      expect(component.content.length).toBe(100); // デフォルトのmaxLength
    });

    it('カスタムオプションで設定を上書きできる', () => {
      const component = createTextComponent('テスト', 'idea', {
        fontSize: 18,
        color: '#FF0000',
        maxLength: 50,
      });

      expect(component.fontSize).toBe(18);
      expect(component.color).toBe('#FF0000');
      expect(component.maxLength).toBe(50);
    });

    it('カスタムmaxLengthが適用される', () => {
      const longText = 'a'.repeat(100);
      const component = createTextComponent(longText, 'idea', {
        maxLength: 20,
      });

      expect(component.content.length).toBe(20);
    });
  });

  describe('createThemeTextComponent', () => {
    it('テーマ用のテキストコンポーネントを作成できる', () => {
      const component = createThemeTextComponent('メインテーマ');

      expect(component.type).toBe(ComponentTypes.TEXT);
      expect(component.content).toBe('メインテーマ');
      expect(component.entityType).toBe('theme');
      expect(component.fontSize).toBe(20);
      expect(component.fontWeight).toBe('bold');
    });

    it('オプションでテーマ設定を上書きできる', () => {
      const component = createThemeTextComponent('カスタムテーマ', {
        fontSize: 24,
        color: '#0000FF',
      });

      expect(component.fontSize).toBe(24);
      expect(component.color).toBe('#0000FF');
      expect(component.entityType).toBe('theme'); // entityTypeは変更されない
    });
  });

  describe('createIdeaTextComponent', () => {
    it('アイデア用のテキストコンポーネントを作成できる', () => {
      const component = createIdeaTextComponent('新しいアイデア');

      expect(component.type).toBe(ComponentTypes.TEXT);
      expect(component.content).toBe('新しいアイデア');
      expect(component.entityType).toBe('idea');
      expect(component.fontSize).toBe(14);
      expect(component.fontWeight).toBe('normal');
    });

    it('オプションでアイデア設定を上書きできる', () => {
      const component = createIdeaTextComponent('カスタムアイデア', {
        fontSize: 16,
        fontWeight: 'bold',
      });

      expect(component.fontSize).toBe(16);
      expect(component.fontWeight).toBe('bold');
      expect(component.entityType).toBe('idea'); // entityTypeは変更されない
    });
  });

  describe('isTextComponent', () => {
    it('TextComponentを正しく識別できる', () => {
      const textComponent = createTextComponent('テスト', 'idea');
      const otherComponent = { type: ComponentTypes.POSITION };

      expect(isTextComponent(textComponent)).toBe(true);
      expect(isTextComponent(otherComponent as any)).toBe(false);
    });
  });

  describe('デフォルト値', () => {
    it('DEFAULT_TEXT_COMPONENTが適切な値を持つ', () => {
      expect(DEFAULT_TEXT_COMPONENT).toEqual({
        maxLength: 100,
        isEditable: true,
        fontSize: 14,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: 'normal',
        color: '#374151',
        alignment: 'center',
      });
    });

    it('DEFAULT_THEME_TEXT_COMPONENTがテーマ用の設定を持つ', () => {
      expect(DEFAULT_THEME_TEXT_COMPONENT).toEqual({
        ...DEFAULT_TEXT_COMPONENT,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        placeholder: 'テーマを入力してください',
      });
    });

    it('DEFAULT_IDEA_TEXT_COMPONENTがアイデア用の設定を持つ', () => {
      expect(DEFAULT_IDEA_TEXT_COMPONENT).toEqual({
        ...DEFAULT_TEXT_COMPONENT,
        fontSize: 14,
        fontWeight: 'normal',
        color: '#374151',
      });
    });
  });

  describe('型安全性', () => {
    it('ITextComponentインターフェースに準拠している', () => {
      const component: ITextComponent = createTextComponent('テスト', 'idea');
      
      // TypeScriptの型チェックが通ることを確認
      expect(component.type).toBe(ComponentTypes.TEXT);
      expect(typeof component.content).toBe('string');
      expect(typeof component.maxLength).toBe('number');
      expect(typeof component.isEditable).toBe('boolean');
      expect(typeof component.fontSize).toBe('number');
      expect(typeof component.fontFamily).toBe('string');
      expect(['normal', 'bold', 'lighter'].includes(component.fontWeight as string) || 
             typeof component.fontWeight === 'number').toBe(true);
      expect(typeof component.color).toBe('string');
      expect(['left', 'center', 'right'].includes(component.alignment)).toBe(true);
      expect(['idea', 'theme'].includes(component.entityType)).toBe(true);
    });

    it('オプショナルプロパティが正しく処理される', () => {
      const component = createTextComponent('テスト', 'theme');
      
      expect(component.placeholder).toBe('テーマを入力してください');
      expect(component.tags).toBeUndefined();
      expect(component.category).toBeUndefined();
    });
  });
});