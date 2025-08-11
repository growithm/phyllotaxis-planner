# テスト実装ガイドライン

## ECSアーキテクチャのテスト観点

### Entity（エンティティ）テスト
**重要な観点**:
- エンティティIDの一意性
- ライフサイクル管理（作成・削除）
- コンポーネントアタッチメント/デタッチメント

```typescript
describe('Entity Lifecycle', () => {
  it('should maintain unique entity IDs', () => {
    const world = new World();
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    expect(entity1).not.toBe(entity2);
  });
});
```

### Component（コンポーネント）テスト
**重要な観点**:
- データの整合性
- シリアライゼーション/デシリアライゼーション
- バリデーション機能

```typescript
describe('PositionComponent', () => {
  it('should validate coordinate bounds', () => {
    const position = new PositionComponent({ x: -1000, y: 5000 });
    expect(() => position.validate()).toThrow('Coordinates out of bounds');
  });
});
```

### System（システム）テスト
**重要な観点**:
- クエリ条件の正確性
- 処理順序の保証
- パフォーマンス特性

```typescript
describe('PhyllotaxisSystem', () => {
  it('should process entities in correct order', () => {
    const world = new World();
    const system = new PhyllotaxisSystem();
    
    // エンティティ作成とコンポーネント追加
    const entities = createTestEntities(world, 100);
    
    // システム実行
    system.update(entities, world, 16);
    
    // 結果検証
    entities.forEach(entity => {
      const position = world.getComponent(entity, PositionComponent);
      expect(position.angle).toBeCloseTo(137.5, 1);
    });
  });
});
```

## イベント駆動システムのテスト観点

### EventBus（イベントバス）テスト
**重要な観点**:
- イベント配信の確実性
- ハンドラー実行順序
- エラーハンドリング

```typescript
describe('EventBus Integration', () => {
  it('should handle event propagation with error recovery', async () => {
    const eventBus = new EventBus();
    const errorHandler = vi.fn();
    const successHandler = vi.fn();
    
    eventBus.on('test-event', () => { throw new Error('Handler error'); });
    eventBus.on('test-event', successHandler);
    eventBus.on('error', errorHandler);
    
    await eventBus.emit('test-event', { data: 'test' });
    
    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled(); // エラー後も継続実行
  });
});
```

### Event Flow（イベントフロー）テスト
**重要な観点**:
- 複数イベントの連鎖
- 状態変更の追跡
- 副作用の検証

```typescript
describe('Idea Addition Flow', () => {
  it('should complete full idea addition workflow', async () => {
    const world = new World();
    const eventBus = new EventBus();
    
    // イベントハンドラー設定
    setupIdeaHandlers(eventBus, world);
    
    // アイデア追加イベント発火
    await eventBus.emit('idea:add', { 
      text: 'テストアイデア',
      position: { x: 100, y: 100 }
    });
    
    // ECSエンティティ作成確認
    const entities = world.query([TextComponent, PositionComponent]);
    expect(entities).toHaveLength(1);
    
    // フィロタキシス計算実行確認
    const position = world.getComponent(entities[0], PositionComponent);
    expect(position.angle).toBeDefined();
  });
});
```

## フィロタキシス計算のテスト観点

### 数学的精度テスト
**重要な観点**:
- 黄金角（137.5°）の精度
- 座標変換の正確性
- 浮動小数点誤差の管理

```typescript
describe('Phyllotaxis Calculations', () => {
  it('should maintain mathematical precision for golden angle', () => {
    const calculator = new PhyllotaxisCalculator();
    const nodes = calculator.generatePositions(1000);
    
    nodes.forEach((node, index) => {
      const expectedAngle = (index * 137.5) % 360;
      expect(node.angle).toBeCloseTo(expectedAngle, 2);
    });
  });
  
  it('should handle large node counts without precision loss', () => {
    const calculator = new PhyllotaxisCalculator();
    const nodes = calculator.generatePositions(10000);
    
    // 最後のノードでも精度を維持
    const lastNode = nodes[nodes.length - 1];
    expect(lastNode.position.x).toBeFinite();
    expect(lastNode.position.y).toBeFinite();
  });
});
```

### 視覚的配置テスト
**重要な観点**:
- ノード間の最小距離
- 境界条件での配置
- スケーリング時の比率維持

```typescript
describe('Visual Layout', () => {
  it('should maintain minimum distance between nodes', () => {
    const layout = new PhyllotaxisLayout();
    const nodes = layout.arrange(100, { minDistance: 20 });
    
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = calculateDistance(nodes[i], nodes[j]);
        expect(distance).toBeGreaterThanOrEqual(20);
      }
    }
  });
});
```

## パフォーマンステストの観点

### レンダリング性能
**測定項目**:
- フレームレート（60FPS維持）
- 描画時間（16ms以内）
- メモリ使用量

```typescript
describe('Rendering Performance', () => {
  it('should maintain 60fps with 1000 nodes', async () => {
    const renderer = new PhyllotaxisRenderer();
    const nodes = generateTestNodes(1000);
    
    const startTime = performance.now();
    const frames = [];
    
    // 60フレーム測定
    for (let i = 0; i < 60; i++) {
      const frameStart = performance.now();
      await renderer.render(nodes);
      const frameEnd = performance.now();
      frames.push(frameEnd - frameStart);
    }
    
    const avgFrameTime = frames.reduce((a, b) => a + b) / frames.length;
    expect(avgFrameTime).toBeLessThan(16); // 60fps = 16.67ms/frame
  });
});
```

### メモリ効率性
**測定項目**:
- メモリリーク検出
- オブジェクトプール効率
- ガベージコレクション頻度

```typescript
describe('Memory Efficiency', () => {
  it('should not leak memory during continuous operations', () => {
    const world = new World();
    const initialMemory = getMemoryUsage();
    
    // 1000回のエンティティ作成・削除
    for (let i = 0; i < 1000; i++) {
      const entity = world.createEntity();
      world.addComponent(entity, new PositionComponent());
      world.removeEntity(entity);
    }
    
    // ガベージコレクション強制実行
    if (global.gc) global.gc();
    
    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加が許容範囲内
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB以内
  });
});
```

## E2Eテストの観点

### ユーザーインタラクション
**テスト項目**:
- マウス操作の応答性
- キーボードショートカット
- タッチデバイス対応

```typescript
test('User Interaction Flow', async ({ page }) => {
  await page.goto('/');
  
  // アイデア入力
  await page.fill('[data-testid="idea-input"]', 'テストアイデア');
  await page.press('[data-testid="idea-input"]', 'Enter');
  
  // フィロタキシス表示確認
  const node = page.locator('[data-testid="phyllotaxis-node"]').first();
  await expect(node).toBeVisible();
  
  // アニメーション完了待機
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="phyllotaxis-node"]');
    return element && !element.classList.contains('animating');
  });
  
  // ノード位置の検証
  const boundingBox = await node.boundingBox();
  expect(boundingBox.x).toBeGreaterThan(0);
  expect(boundingBox.y).toBeGreaterThan(0);
});
```

### ビジュアルリグレッション
**テスト項目**:
- スクリーンショット比較
- アニメーション品質
- レスポンシブ表示

```typescript
test('Visual Regression', async ({ page }) => {
  await page.goto('/');
  
  // テストデータ投入
  await setupTestData(page);
  
  // アニメーション完了待機
  await page.waitForTimeout(2000);
  
  // スクリーンショット撮影・比較
  await expect(page).toHaveScreenshot('phyllotaxis-layout.png');
  
  // レスポンシブ表示確認
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page).toHaveScreenshot('phyllotaxis-mobile.png');
});
```

## テストデータ管理

### フィクスチャ設計原則
1. **再現性**: 同じ入力で同じ結果
2. **独立性**: テスト間の依存関係なし
3. **現実性**: 実際の使用パターンに近い
4. **多様性**: エッジケースを含む

### モック戦略
1. **外部依存**: API、ファイルシステム
2. **時間依存**: アニメーション、タイマー
3. **ランダム要素**: 乱数、UUID生成
4. **ブラウザAPI**: Canvas、WebGL

この ガイドラインに従うことで、Phyllotaxis Plannerの複雑なアーキテクチャを効果的にテストし、高品質なソフトウェアを維持できます。