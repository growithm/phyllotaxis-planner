/**
 * アニメーションタイプの定義
 */
export type AnimationType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'pulse'
  | 'bounce'
  | 'scale';

/**
 * イージングタイプの定義
 */
export type EasingType = 
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'
  | 'cubic-bezier';