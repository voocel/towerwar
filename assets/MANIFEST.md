# TowerWar 资源清单

> 创建：2026-04-26 · 阶段 6 美术接入
> 用途：所有图像 / 音频资源的目录结构 + 规格 + AI 生成提示词。
> 状态字段:`[ ]` 未制作 · `[~]` 占位 SVG · `[x]` 终稿。

约定:
- 图像优先 PNG(透明底);允许 SVG 占位,Phaser 4 可直接 `load.svg`(指定尺寸)。
- 风格统一:暗色背景适配,色彩偏冷调,带轻微辉光,**不要写实**。
- 所有路径相对项目根 `assets/`。

---

## 1. 章节地图 `maps/`

5 个章节各两张:战场底图 + 章节卡缩略图。底图直接铺在 GameScene 背景层(深度 0),缩略图用于 ChapterScene 卡片。

| 路径 | 尺寸 | 用途 | 状态 | AI Prompt |
|---|---|---|---|---|
| `maps/ch1_meadow_bg.png`     | 1280×720 | Ch1 战场底图     | [ ] | "lush green meadow, top-down tile-based, soft daylight, low-poly, dark muted palette, no characters, leave dirt path empty" |
| `maps/ch1_meadow_thumb.png`  | 480×270  | Ch1 章节卡       | [ ] | 同上,缩略构图 |
| `maps/ch2_forest_bg.png`     | 1280×720 | Ch2 战场底图     | [ ] | "autumn forest floor, top-down, fallen leaves, mossy stones, dim filtered sunlight, dark earthy palette" |
| `maps/ch2_forest_thumb.png`  | 480×270  | Ch2 章节卡       | [ ] | 同上 |
| `maps/ch3_tundra_bg.png`     | 1280×720 | Ch3 战场底图     | [ ] | "frozen tundra plain, top-down, snow drifts and ice cracks, blue-gray desaturated palette, faint aurora glow at edges" |
| `maps/ch3_tundra_thumb.png`  | 480×270  | Ch3 章节卡       | [ ] | 同上 |
| `maps/ch4_volcano_bg.png`    | 1280×720 | Ch4 战场底图     | [ ] | "volcanic basalt floor, top-down, lava cracks glowing orange, dark charcoal stone, embers floating" |
| `maps/ch4_volcano_thumb.png` | 480×270  | Ch4 章节卡       | [ ] | 同上 |
| `maps/ch5_void_bg.png`       | 1280×720 | Ch5 战场底图     | [ ] | "void plane, top-down, dark purple cosmic dust, faint star fields, surreal floating geometry, deep space palette" |
| `maps/ch5_void_thumb.png`    | 480×270  | Ch5 章节卡       | [ ] | 同上 |

**规则**:每章战场图必须保留中央的 S 形通路区域较暗,以便绘制路径线条 + 敌人不被背景吞噬。

---

## 2. 塔造型 `towers/`

8 塔 × 3 等级 = 24 个 sprite,加 1 个共用底座。每塔身 96×96 透明 PNG,俯视角。等级用尺寸+饰物递进区分:Lv1 朴素,Lv2 加纹饰,Lv3 加发光环。

颜色锚点(对应 PALETTE 元素色):

| Tower ID  | 元素     | 主色 | Lv1 关键词           | Lv2 升级       | Lv3 升级       |
|-----------|----------|------|-----------------------|-----------------|-----------------|
| spark     | fire     | 橙红 | 电火花投射器          | 加双管          | 加旋转能量环    |
| lava      | fire     | 朱红 | 熔岩炮                | 加岩浆滴落      | 加爆裂轮廓      |
| frost     | ice      | 青蓝 | 霜针水晶              | 加多刺          | 加冰晶光环      |
| blizzard  | ice      | 蓝白 | 暴风塔                | 加旋风          | 加雪花辉光      |
| arc       | thunder  | 黄白 | 电弧线圈              | 加导电杆        | 加电场扭曲      |
| magstorm  | thunder  | 紫蓝 | 磁暴轴心              | 加副轴          | 加磁场涟漪      |
| toxin     | poison   | 黄绿 | 毒刺枪                | 加毒囊          | 加滴毒效果      |
| miasma    | poison   | 暗绿 | 瘴雾发生器            | 加雾喷口        | 加瘴气云盖      |

| 路径 | 尺寸 | 状态 | 备注 |
|---|---|---|---|
| `towers/base.png`        | 96×96 | [ ] | 通用石质底座,所有塔共享 |
| `towers/{id}_lv1.png`    | 96×96 | [ ] | 共 8 个 |
| `towers/{id}_lv2.png`    | 96×96 | [ ] | 共 8 个 |
| `towers/{id}_lv3.png`    | 96×96 | [ ] | 共 8 个 |
| `towers/{id}_icon.png`   | 64×64 | [ ] | HUD 建塔列表用,共 8 个 |

**示例占位**:`towers/spark_lv1.svg` 已生成(纯橙圆 + 标签),作为格式参考。

---

## 3. 敌人造型 `enemies/`

| 路径 | 尺寸 | 类型 | 状态 | AI Prompt 关键词 |
|---|---|---|---|---|
| `enemies/normal.png`    | 64×64   | 普通兵   | [ ] | small humanoid soldier, gray armor, faceless, top-down |
| `enemies/fast.png`      | 64×64   | 快速     | [ ] | slim runner, cyan accents, motion blur trail |
| `enemies/elite.png`     | 96×96   | 精英     | [ ] | armored brute, orange-red plates, heavy build |
| `enemies/flying.png`    | 64×64   | 飞空     | [ ] | winged sprite, purple aura, hovering shadow below |
| `enemies/defender.png`  | 64×64   | 防御者   | [ ] | shield-bearer, rose-pink crest |
| `enemies/support.png`   | 64×64   | 支援者   | [ ] | mage-like figure, mint-green robe, glowing orb |
| `enemies/boss1.png`     | 128×128 | 狂化兽王 | [ ] | massive beast king, red mane, top-down |
| `enemies/boss2.png`     | 128×128 | 林之腐主 | [ ] | rotting tree spirit, magenta blight, top-down |
| `enemies/boss3.png`     | 128×128 | 霜雪女皇 | [ ] | ice queen, lavender gown, frost crown |
| `enemies/boss4.png`     | 128×128 | 熔心暴君 | [ ] | molten warlord, lava cracks, charcoal armor |
| `enemies/boss5.png`     | 128×128 | 虚空之主 | [ ] | cosmic horror, purple void, multiple eyes |

**示例占位**:`enemies/normal.svg` 已生成。

---

## 4. 元素印记 `marks/`

敌人 HP 条上方显示已附着的元素,作为反应触发的视觉提示。

| 路径 | 尺寸 | 元素 | 状态 |
|---|---|---|---|
| `marks/fire.png`    | 24×24 | 火 | [ ] |
| `marks/ice.png`     | 24×24 | 冰 | [ ] |
| `marks/thunder.png` | 24×24 | 雷 | [ ] |
| `marks/poison.png`  | 24×24 | 毒 | [ ] |

风格要求:24px 内识别度高,纯色填充 + 内描边,**不要细节**。

---

## 5. 反应特效 `fx/`

6 种元素反应,每种一张 spritesheet(8 帧水平排布)。

| 路径 | 总尺寸 | 反应 | 元素源 | 状态 |
|---|---|---|---|---|
| `fx/steam_8f.png`     | 2048×256 (8 × 256²) | 蒸汽         | fire+ice     | [ ] |
| `fx/overload_8f.png`  | 2048×256            | 超载         | fire+thunder | [ ] |
| `fx/detonate_8f.png`  | 2048×256            | 燃爆         | fire+poison  | [ ] |
| `fx/frostarc_8f.png`  | 2048×256            | 冻电链       | ice+thunder  | [ ] |
| `fx/toxicice_8f.png`  | 2048×256            | 剧毒冰原     | ice+poison   | [ ] |
| `fx/plague_8f.png`    | 2048×256            | 瘟疫传导     | thunder+poison | [ ] |

当前阶段:用 `src/systems/FxSystem.ts` 的 Tween 粒子顶替,有图后切换到 ParticleEmitter。

---

## 6. 子弹精灵 `fx/projectiles/`

| 路径 | 尺寸 | 元素 | 状态 |
|---|---|---|---|
| `fx/projectiles/fire.png`    | 32×32 | 火 | [ ] |
| `fx/projectiles/ice.png`     | 32×32 | 冰 | [ ] |
| `fx/projectiles/thunder.png` | 32×32 | 雷 | [ ] |
| `fx/projectiles/poison.png`  | 32×32 | 毒 | [ ] |

---

## 7. 技能 `skills/`

| 路径 | 尺寸 | 状态 | 说明 |
|---|---|---|---|
| `skills/meteor_icon.png`     | 64×64    | [ ] | HUD 技能按钮图标 |
| `skills/meteor_impact_8f.png`| 2048×256 | [ ] | 陨石命中冲击 spritesheet,8 帧 |

---

## 8. UI 套件 `ui/`

| 路径 | 尺寸 / 类型 | 状态 | 说明 |
|---|---|---|---|
| `ui/panel_9slice.png`      | 96×96 / 9-slice | [ ] | 通用面板边框,12px 边角 |
| `ui/btn_primary_9slice.png`| 96×48 / 9-slice | [ ] | 主按钮 |
| `ui/btn_danger_9slice.png` | 96×48 / 9-slice | [ ] | 撤销/危险按钮 |
| `ui/coin.png`              | 32×32           | [ ] | 金币图标 |
| `ui/heart.png`             | 32×32           | [ ] | 生命图标 |
| `ui/star_filled.png`       | 64×64           | [ ] | 三星评价填充态 |
| `ui/star_empty.png`        | 64×64           | [ ] | 三星评价空态 |

---

## 9. 音频 `audio/`

### 9.1 BGM(每章一首,可循环)

| 路径 | 时长建议 | 风格 | 状态 |
|---|---|---|---|
| `audio/bgm_ch1_meadow.mp3` | 90~120s | 田园 + 紧张感渐进     | [ ] |
| `audio/bgm_ch2_forest.mp3` | 90~120s | 阴沉 + 不祥           | [ ] |
| `audio/bgm_ch3_tundra.mp3` | 90~120s | 寒冷 + 空灵           | [ ] |
| `audio/bgm_ch4_volcano.mp3`| 90~120s | 紧迫 + 鼓点           | [ ] |
| `audio/bgm_ch5_void.mp3`   | 90~120s | 太空 + 不安           | [ ] |
| `audio/bgm_title.mp3`      | 60~90s  | 主题曲(Title 用)     | [ ] |

### 9.2 SFX

| 路径 | 时长 | 用途 | 状态 |
|---|---|---|---|
| `audio/sfx_click.ogg`         | 0.05~0.1s | 通用按钮 | [ ] |
| `audio/sfx_tower_place.ogg`   | 0.2s      | 放置塔   | [ ] |
| `audio/sfx_tower_sell.ogg`    | 0.2s      | 卖塔     | [ ] |
| `audio/sfx_fire_shot.ogg`     | 0.1s      | 火塔射击 | [ ] |
| `audio/sfx_ice_shot.ogg`      | 0.1s      | 冰塔射击 | [ ] |
| `audio/sfx_thunder_shot.ogg`  | 0.1s      | 雷塔射击 | [ ] |
| `audio/sfx_poison_shot.ogg`   | 0.1s      | 毒塔射击 | [ ] |
| `audio/sfx_enemy_hit.ogg`     | 0.05s     | 敌人受击 | [ ] |
| `audio/sfx_enemy_die.ogg`     | 0.2s      | 敌人死亡 | [ ] |
| `audio/sfx_reaction.ogg`      | 0.3s      | 反应触发 | [ ] |
| `audio/sfx_skill_meteor.ogg`  | 1.0s      | 陨石施放 | [ ] |
| `audio/sfx_wave_start.ogg`    | 0.4s      | 开波号角 | [ ] |
| `audio/sfx_lose_life.ogg`     | 0.3s      | 漏怪扣血 | [ ] |
| `audio/sfx_victory.ogg`       | 1.5s      | 胜利     | [ ] |
| `audio/sfx_defeat.ogg`        | 1.5s      | 失败     | [ ] |

---

## 10. 接入流程

1. 美术按本清单产出文件,按路径放入 `assets/` 对应子目录。
2. 修改 `src/scenes/PreloadScene.ts`,把对应 key 加进 `load.image` / `load.audio` / `load.spritesheet`。命名约定:文件名去后缀即 key(如 `ch1_meadow_bg`)。
3. 调整对应实体或场景,把 `Graphics`/`Tween` 占位绘制改成 `add.image(key)` / `add.sprite(key)`。
4. 验证:
   - 资源缺失时 PreloadScene 不应卡死(Phaser 默认会报警告,可接受)。
   - 替换后视觉与原占位风格一致(色相、亮度、透明度)。

## 11. 当前已生成的占位

仅作为格式样例,**不是终稿**:

- `towers/spark_lv1.svg` — 96×96,纯橙色圆 + "spark Lv1" 文字
- `enemies/normal.svg` — 64×64,灰圆 + "normal"
- `maps/ch1_meadow_thumb.svg` — 480×270,绿渐变 + "Ch1 Meadow"

AI 出图时直接覆盖同名 PNG 即可(SVG 留作 fallback 或删除)。
