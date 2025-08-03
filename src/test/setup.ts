import '@testing-library/jest-dom';

// グローバルなテストセットアップ
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// SVGのモック
Object.defineProperty(window, 'SVGElement', {
  writable: true,
  value: class SVGElement extends Element {
    getBBox() {
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
    }
  },
});

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});