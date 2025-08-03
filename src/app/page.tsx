import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phyllotaxis Planner - 有機的な思考整理ツール',
  description: '植物の葉序の法則を応用して、アイデアを自然で美しい配置で整理しましょう。',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="card max-w-4xl w-full p-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-primary-700 mb-6">
          Phyllotaxis Planner
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-8 text-balance">
          植物の葉序の法則を応用した<br />
          有機的な思考整理ツール
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl mb-4">🌿</div>
            <h3 className="text-lg font-semibold text-primary-600 mb-2">
              自然な配置
            </h3>
            <p className="text-gray-600 text-sm">
              フィロタキシス（葉序）の黄金角を使用して、アイデアを美しく配置
            </p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-4">💡</div>
            <h3 className="text-lg font-semibold text-secondary-600 mb-2">
              直感的な操作
            </h3>
            <p className="text-gray-600 text-sm">
              シンプルなインターフェースで、思考の流れを妨げない設計
            </p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-accent-600 mb-2">
              視覚的な美しさ
            </h3>
            <p className="text-gray-600 text-sm">
              SVGベースの滑らかなアニメーションで、思考を視覚化
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <button className="btn-primary text-lg px-8 py-3">
            アプリを開始
          </button>
          
          <p className="text-sm text-gray-500">
            Next.js 15 + TypeScript + Tailwind CSS で構築
          </p>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© 2024 Phyllotaxis Planner Team. MIT License.</p>
      </footer>
    </main>
  );
}