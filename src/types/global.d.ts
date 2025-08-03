// グローバル型定義

declare module '*.svg' {
  import React from 'react';
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}

declare module '*.svg?url' {
  const content: string;
  export default content;
}

// 環境変数の型定義
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_VERCEL_URL?: string;
  }
}

// Window オブジェクトの拡張
declare global {
  interface Window {
    // 将来的にグローバルな機能を追加する場合
  }
}