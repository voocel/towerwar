# 地图路线制作规范

TowerWar 的地图路线必须同时满足两个条件：

- 视觉上：路是地图地形的一部分，不是后期叠上去的线。
- 逻辑上：敌人移动、路径阻挡、建塔限制都和视觉路中心一致。

## 推荐流程

1. 用 gpt-image2 生成完整地图背景，直接把路画进地形里。
2. 保存为 `assets/maps/{chapterId}_bg_gptroad.png`。
3. 用调试叠线脚本检查 `waypoints` 是否位于路中心。
4. 若有偏差，优先微调 `src/data/chapters.ts` 的 `waypoints`，不要再叠一层运行时道路。
5. `npm run build` 验证。

当前运行时只加载 `*_bg_gptroad.png`。`GameScene` 不再绘制道路主体，只保留出生点和出口点标记。

## gpt-image2 Prompt 模板

关键是让模型按隐藏网格理解路线，但不要画网格：

```text
Use case: stylized-concept
Asset type: complete 16:9 top-down tower defense battlefield background for TowerWar, directly usable as a map image
Primary request: Create a complete top-down <theme> battlefield background with the road painted naturally into the terrain itself, not overlaid.
Canvas and layout: 16:9 landscape game background, intended for 1280x720. Imagine a hidden 25 columns x 15 rows grid. Do not draw the grid.
Required road route: a continuous <road material> path, about 1.4 grid cells wide, following this exact orthogonal route: <describe each segment with column/row>.
Road style: <theme-specific road details>, no glowing outline, no UI line, no perfect vector stroke, no painted overlay look.
Composition constraints: leave enough clear buildable terrain around the route for tower placement. Keep enemies/towers absent. No text, no labels, no watermark, no grid lines, no UI markers.
Quality: high detail terrain texture, coherent lighting, route integrated as if illustrated together with the map.
```

## 路线描述方式

使用 `25 x 15` 的隐藏网格。坐标写法和代码一致：

- `gx`: 列，从左到右。
- `gy`: 行，从上到下。
- 敌人实际走在格子中心：`(gx + 0.5, gy + 0.5)`。
- 允许入口/出口在画面外，例如 `gx = -1` 或 `gx = 25`。

示例，第 1 章最终对齐后的路线：

```ts
[
  { gx: -1, gy: 3 },
  { gx: 9,  gy: 3 },
  { gx: 9,  gy: 7 },
  { gx: 18, gy: 7 },
  { gx: 18, gy: 11 },
  { gx: 25, gy: 11 },
]
```

对应给 gpt-image2 的自然语言：

```text
starts off-canvas from the left edge at row 3,
runs horizontally to column 9,
turns down to row 7,
runs horizontally to column 18,
turns down to row 11,
then runs horizontally off-canvas to the right edge.
```

## 调试叠线

生成地图后，用脚本把当前逻辑路线画到背景上：

```bash
node scripts/overlay-path-debug.mjs \
  assets/maps/ch1_meadow_bg_gptroad.png \
  /tmp/ch1_path_debug.png \
  '-1,3;9,3;9,7;18,7;18,11;25,11'
```

打开 `/tmp/ch1_path_debug.png` 检查红线是否在路中心：

- 红线偏上：增大对应段的 `gy`。
- 红线偏下：减小对应段的 `gy`。
- 红线偏左：增大对应段的 `gx`。
- 红线偏右：减小对应段的 `gx`。

调点时要同时改转折点两侧相关坐标，否则转角会错位。

## 注意事项

- 不要让 gpt-image2 画 UI 标记、箭头、网格线或发光边框。
- 不要在 `GameScene` 再画一层道路主体，否则会重新出现拼贴感。
- 新地图如果视觉路线和旧 `waypoints` 不一致，以视觉路为准微调 `waypoints`。
- 每次调整 `waypoints` 后，`pathSet` 会自动随 `GameContext` 重算，建塔阻挡也会同步。
