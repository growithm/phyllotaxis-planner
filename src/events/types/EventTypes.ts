/**
 * アイデア関連のイベント定義
 */
export enum IdeaEvents {
  IDEA_ADDED = 'idea:added',
  IDEA_REMOVED = 'idea:removed',
  IDEA_UPDATED = 'idea:updated',
  THEME_CHANGED = 'theme:changed',
}

/**
 * システム関連のイベント定義
 */
export enum SystemEvents {
  POSITION_CALCULATED = 'position:calculated',
  ANIMATION_START = 'animation:start',
  ANIMATION_END = 'animation:end',
  RENDER_REQUESTED = 'render:requested',
  ERROR_OCCURRED = 'error:occurred',
  SYSTEM_READY = 'system:ready',
  SYSTEM_PROCESSED = 'system:processed',
  BATCH_UPDATE_COMPLETED = 'batch:update:completed',
  ERROR = 'error',
}

/**
 * UI関連のイベント定義
 */
export enum UIEvents {
  FORM_SUBMITTED = 'ui:form:submitted',
  BUTTON_CLICKED = 'ui:button:clicked',
  INPUT_CHANGED = 'ui:input:changed',
  MODAL_OPENED = 'ui:modal:opened',
  MODAL_CLOSED = 'ui:modal:closed',
}

/**
 * エンティティライフサイクル関連のイベント定義
 */
export enum LifecycleEvents {
  BEFORE_CREATE = 'entity:beforeCreate',
  AFTER_CREATE = 'entity:afterCreate',
  BEFORE_UPDATE = 'entity:beforeUpdate',
  AFTER_UPDATE = 'entity:afterUpdate',
  BEFORE_DESTROY = 'entity:beforeDestroy',
  AFTER_DESTROY = 'entity:afterDestroy',
  COMPONENT_ADDED = 'entity:componentAdded',
  COMPONENT_REMOVED = 'entity:componentRemoved',
  VALIDATION_FAILED = 'entity:validationFailed',
  STATE_CHANGED = 'entity:stateChanged',
}

/**
 * テスト関連のイベント定義
 */
export enum TestEvents {
  TEST_RECOVERY = 'test:recovery',
}

/**
 * React統合・同期関連のイベント定義
 * ECS状態とReact状態の同期で使用されるイベント
 */
export const SyncEventTypes = {
  ENTITY_CREATED: LifecycleEvents.AFTER_CREATE,
  ENTITY_DESTROYED: LifecycleEvents.AFTER_DESTROY,
  COMPONENT_ADDED: LifecycleEvents.COMPONENT_ADDED,
  COMPONENT_REMOVED: LifecycleEvents.COMPONENT_REMOVED,
  COMPONENT_UPDATED: LifecycleEvents.AFTER_UPDATE,
} as const;


