# 教训积累

## 2026-04-26 · Phaser 4 是纯 ESM，无 default export

**事故**：阶段 0 启动时 dev server 报 `does not provide an export named 'default'`，黑屏。

**原因**：Phaser 3 时代用 `import Phaser from 'phaser'`，但 Phaser 4.0.0 改为纯 ESM，没有 default export，只有 named exports（Scene/Game/Scale/AUTO 等）。

**修法**：
```ts
// ❌ Phaser 3 写法，Phaser 4 会报错
import Phaser from 'phaser';

// ✅ Phaser 4 正确写法
import * as Phaser from 'phaser';
```

**规则**：所有新建的 `.ts` 文件用 `import * as Phaser from 'phaser'`。不要从 design.md 或网上随便复制 Phaser 3 教程的 import 语句。

## 2026-04-26 · 继承 Phaser.GameObjects.Container 时避开内置属性名

**事故**：阶段 1 类型检查报 `Property 'body' in type 'Enemy' is not assignable to the same property in base type 'Container'` 和 `'scale' is defined as a property in class 'Container', but is overridden here in 'Tower' as an accessor`。

**原因**：Phaser 4 的 `Container` 已经定义了若干内置属性，子类不能用同名字段覆盖：
- `body`：Phaser physics body 槽位（即使没启用物理也存在）
- `scale`：Container 的复合 setter/getter（同时控制 scaleX/scaleY）
- 其他常见冲突：`name` `active` `visible` `alpha` `angle` `depth` `parent` `state`

**修法**：给视觉子对象起非冲突名（如 `bodyArc`、`spriteBody`），给 getter 改语义化名（如 `levelScale`）。

**规则**：写 `class X extends Phaser.GameObjects.{Container,Sprite,Image,...}` 时，私有字段或 getter 命名前先想一下 Phaser 是否已用。冲突就加前缀（`gfx*`、`ui*`）或换具体语义名。

## 2026-04-26 · `as const` 字面量 + 三元/重赋值会触发字面量类型推断

**事故**：`let color = PALETTE.hpHigh; if (...) color = PALETTE.hpLow;` 报 `Type '"#c44a3a"' is not assignable to type '"#7ac49a"'`。

**原因**：`PALETTE` 是 `as const`，每个值是字面量类型（如 `'#7ac49a'`）。`let color = PALETTE.hpHigh` 推断出的也是该字面量类型，于是后面赋一个不同字面量字符串时类型不兼容。

**修法**：显式标注为 `string`：`let color: string = PALETTE.hpHigh;`。

**规则**：从 `as const` 调色板里取多个值放进同一变量时，要主动标 `string`（或更窄的联合）来扩宽类型。

## 2026-04-26 · `Scene.update()` 早返回会跳过结束态调度

**事故**：在 GameScene.update() 开头有 `if (gameOver || victory) return;`，结束态调度（scheduleResult）写在 `tick()` 末尾。结果当 victory 被外部置 true 时，update 直接早返回，永远不会走到 tick，结束态调度从未触发，玩家被永久卡在 GameScene 里。

**修法**：把结束态检查从 tick() 提到 update() 顶部，且要在 return 之前调度：
```ts
update() {
  if (this.ctx.gameOver) { this.showOverlay(false); this.scheduleResult(false); return; }
  if (this.ctx.victory)  { this.showOverlay(true);  this.scheduleResult(true);  return; }
  // ... normal tick
}
```

**规则**：游戏循环里所有"终态副作用"必须放在早返回守卫前面，否则一旦终态被外部置位（测试 / 作弊 / 远程同步），副作用就永远不触发。

## 2026-04-26 · TS `private` 是类型层面的，运行时 JS 里照样可以从外部访问

**踩点**：写 Playwright 测试时担心 `gameScene.ctx`（TS 标了 `private`）能不能从浏览器 DevTools 拿到。结论：能拿到，TS 的 `private` 只在编译期检查，esbuild/vite 编译后属性名照常保留。要真正 runtime-private 得用 ECMAScript 私有字段（`#field`）。

**规则**：测试或调试期用 `window.__game.scene.getScene('Game').ctx` 直接读写状态是 OK 的。如果某天确实想锁死外部访问，再改用 `#fields`。
