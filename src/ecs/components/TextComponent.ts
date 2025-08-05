/**
 * テキスト情報を管理するコンポーネント
 * アイデアのテキスト内容や表示設定を扱う
 */

import { ComponentTypes } from '@/ecs/core/Component';
import type { IComponent } from '@/ecs/core/Component';

/**
 * テキストコンポーネントインターフェース
 */
export interface ITextComponent extends IComponent {
  readonly type: typeof ComponentTypes.TEXT;
  
  // テキスト内容
  content: string;              // 表示するテキスト内容
  maxLength: number;            // 最大文字数制限
  
  // 編集制御
  isEditable: boolean;          // 編集可能かどうか
  placeholder?: string;         // プレースホルダーテキスト
  
  // 表示設定
  fontSize: number;             // フォントサイズ（px）
  fontFamily: string;           // フォントファミリー
  fontWeight: 'normal' | 'bold' | 'lighter' | number; // フォント太さ
  color: string;                // テキスト色（CSS色値）
  alignment: 'left' | 'center' | 'right'; // テキスト配置
  
  // エンティティ分類用
  entityType: 'idea' | 'theme'; // エンティティタイプ識別子
  
  // 検索・フィルタリング用
  tags?: string[];              // タグ（将来の拡張用）
  category?: string;            // カテゴリ（将来の拡張用）
}

/**
 * テキストコンポーネントのデフォルト値
 */
export const DEFAULT_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  maxLength: 100,
  isEditable: true,
  fontSize: 14,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontWeight: 'normal',
  color: '#374151',
  alignment: 'center',
};

/**
 * 中心テーマ用のデフォルト値
 */
export const DEFAULT_THEME_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  ...DEFAULT_TEXT_COMPONENT,
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1F2937',
  placeholder: 'テーマを入力してください',
};

/**
 * アイデア用のデフォルト値
 */
export const DEFAULT_IDEA_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  ...DEFAULT_TEXT_COMPONENT,
  fontSize: 14,
  fontWeight: 'normal',
  color: '#374151',
};

/**
 * 基本的なテキストコンポーネントを作成
 */
export const createTextComponent = (
  content: string,
  entityType: 'idea' | 'theme',
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => {
  const baseDefaults = entityType === 'theme' 
    ? DEFAULT_THEME_TEXT_COMPONENT 
    : DEFAULT_IDEA_TEXT_COMPONENT;
    
  return {
    type: ComponentTypes.TEXT,
    content: content.slice(0, options.maxLength || baseDefaults.maxLength),
    entityType,
    ...baseDefaults,
    ...options,
  };
};

/**
 * テーマ用のテキストコンポーネントを作成
 */
export const createThemeTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'theme', options);

/**
 * アイデア用のテキストコンポーネントを作成
 */
export const createIdeaTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'idea', options);

/**
 * テキストコンポーネントの型ガード
 */
export const isTextComponent = (
  component: IComponent
): component is ITextComponent => 
  component.type === ComponentTypes.TEXT;