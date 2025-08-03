/**
 * ECSコンポーネント基底インターフェースとタイプ定義
 */

// コンポーネント基底インターフェース
export interface IComponent {
  readonly type: ComponentType;
}

// コンポーネントタイプの定義
export const ComponentTypes = {
  POSITION: 'position',
  TEXT: 'text',
  VISUAL: 'visual',
  ANIMATION: 'animation',
  INTERACTION: 'interaction'
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes];