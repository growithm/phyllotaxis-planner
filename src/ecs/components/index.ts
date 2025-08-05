/**
 * ECSコンポーネントのエクスポート
 */

// Position Component
export type { IPositionComponent } from './PositionComponent';
export {
  DEFAULT_POSITION_COMPONENT,
  createPositionComponent,
  createPhyllotaxisPositionComponent,
  isPositionComponent,
} from './PositionComponent';

// Text Component
export type { ITextComponent } from './TextComponent';
export {
  DEFAULT_TEXT_COMPONENT,
  DEFAULT_THEME_TEXT_COMPONENT,
  DEFAULT_IDEA_TEXT_COMPONENT,
  createTextComponent,
  createThemeTextComponent,
  createIdeaTextComponent,
  isTextComponent,
} from './TextComponent';

// Visual Component
export type { IVisualComponent } from './VisualComponent';
export {
  DEFAULT_VISUAL_COMPONENT,
  DEFAULT_THEME_VISUAL_COMPONENT,
  DEFAULT_IDEA_VISUAL_COMPONENT,
  createVisualComponent,
  createThemeVisualComponent,
  createIdeaVisualComponent,
  isVisualComponent,
} from './VisualComponent';

// Animation Component
export type { IAnimationComponent } from './AnimationComponent';
export {
  DEFAULT_ANIMATION_COMPONENT,
  createAnimationComponent,
  createPositionAnimationComponent,
  isAnimationComponent,
} from './AnimationComponent';