/**
 * 位置情報を表すインターフェース
 */
export interface Position {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** 角度（度） */
  angle?: number;
  /** 中心からの距離 */
  radius?: number;
}