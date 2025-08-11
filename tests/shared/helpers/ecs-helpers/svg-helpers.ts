/**
 * SVG関連のテストヘルパー
 */

import type { EntityId } from '@/ecs/core/Entity';

/**
 * テスト用のSVG要素を作成
 */
export function createMockSVGElement(): SVGSVGElement {
  // JSDOMでSVG要素を作成
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  svg.setAttribute('viewBox', '0 0 800 600');
  return svg;
}

/**
 * SVG要素が作成されているかを確認
 */
export function hasSVGElement(svgElement: SVGSVGElement, entityId: EntityId): boolean {
  const element = svgElement.querySelector(`#entity-${entityId}`);
  return element !== null;
}

/**
 * SVG要素の位置を取得
 */
export function getSVGElementPosition(svgElement: SVGSVGElement, entityId: EntityId): { x: number; y: number } | null {
  const element = svgElement.querySelector(`#entity-${entityId}`) as SVGGElement;
  if (!element) {
    return null;
  }

  const transform = element.getAttribute('transform');
  if (!transform) {
    return { x: 0, y: 0 };
  }

  // transform="translate(x, y) rotate(angle)" の形式から座標を抽出
  const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  if (!translateMatch) {
    return { x: 0, y: 0 };
  }

  return {
    x: parseFloat(translateMatch[1]),
    y: parseFloat(translateMatch[2]),
  };
}

/**
 * SVG要素の数を取得
 */
export function getSVGElementCount(svgElement: SVGSVGElement): number {
  return svgElement.querySelectorAll('g[id^="entity-"]').length;
}

/**
 * SVG要素が表示されているかを確認
 */
export function isSVGElementVisible(svgElement: SVGSVGElement, entityId: EntityId): boolean {
  const element = svgElement.querySelector(`#entity-${entityId}`) as SVGGElement;
  if (!element) {
    return false;
  }

  const style = element.style.display;
  const opacity = element.getAttribute('opacity');
  
  return style !== 'none' && opacity !== '0';
}

/**
 * SVG要素のクリーンアップ
 */
export function cleanupSVGElement(svgElement: SVGSVGElement): void {
  while (svgElement.firstChild) {
    svgElement.removeChild(svgElement.firstChild);
  }
}

/**
 * SVG要素の属性を取得
 */
export function getSVGElementAttributes(svgElement: SVGSVGElement, entityId: EntityId): Record<string, string> | null {
  const element = svgElement.querySelector(`#entity-${entityId}`);
  if (!element) {
    return null;
  }

  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }

  return attributes;
}