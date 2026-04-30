# 塔造型 AI 出图指南

> 创建：2026-04-26
> 用途：把这些 prompt 喂给 Midjourney / Stable Diffusion / DALL-E 3,生成 3 把核心塔的成品美术。
> 对应占位 SVG:`assets/towers/{spark,frost,arc}.svg`(已升级到精致版,可作为视觉锚点)。

---

## 共通约束(每条 prompt 都加)

```
top-down view, isometric tilt, transparent background, centered subject,
square crop 1:1, 96px-friendly clean silhouette, no ground shadow baked in,
no text, no logo, no watermark, no characters, no UI, no border,
dark fantasy tower defense art style, painterly but readable at small size,
high contrast against dark battlefield, soft inner glow on energy core
```

**风格基调**:暗色背景适配 / 偏冷色环境 / 元素核心高饱和发光 / 金属质感哑光 / 不要写实细节、不要超塔身轮廓的杂物。

**否定提示**(MJ 用 `--no` / SD 加到 negative):
```
text, watermark, logo, character, person, hand, ground, terrain, shadow,
multiple objects, blurry, photorealistic, 3d render glossy, hdri,
cluttered, ugly, low contrast
```

**Midjourney 后缀建议**: `--ar 1:1 --style raw --stylize 200 --v 6`

**SD/SDXL 参数建议**: 768×768 起步,然后放大到 1024×1024 → 缩到 96px 切透明。CFG 6~8,steps 28~35,采样器 DPM++ 2M Karras。

---

## 1. spark · 火花塔(火元素 / 基础)

**视觉关键词**:黄铜炮台 + 中央燃烧火核 + 4 个排气尖刺 + 暗红辉光环

### 1.1 HUD icon(`towers/spark_icon.png`,64×64)

```
A small ornate brass cannon turret, top-down 3/4 view, glowing ember core
in the center radiating warm orange-red light, four small exhaust spikes
pointing in cardinal directions, dark stone octagonal base ring,
fantasy tower defense icon, painterly stylised, transparent background,
high contrast, readable silhouette, soft fiery glow halo
```

### 1.2 Lv1(`towers/spark_lv1.png`,96×96)

```
A compact brass-collared fire turret on a dark octagonal stone platform,
top-down view, central glowing ember core (warm white-yellow to deep red
gradient), four short pointed exhaust vents, brass rim with subtle
filigree, soft orange rim-glow, dark fantasy tower defense art,
painterly stylised, transparent background, no characters
```

### 1.3 Lv2(`towers/spark_lv2.png`,96×96)

```
Upgraded fire turret, twin parallel barrels emerging laterally from a
brass collar, central ember core glowing brighter with visible flame
licks, six exhaust vents now etched with rune lines, dark stone platform
with cracked glowing seams, top-down view, soft heat-shimmer haze around
crown, painterly dark fantasy, transparent background
```

### 1.4 Lv3(`towers/spark_lv3.png`,96×96)

```
Master-tier fire turret, ornate brass collar engraved with phoenix
filigree, central blazing ember sphere encased in a slowly orbiting
ring of small glowing ember motes (suggesting motion), eight exhaust
vents radiating from the core, dark obsidian platform with molten
veining, broad warm rim-aura, top-down view, painterly dark fantasy
masterpiece, transparent background
```

---

## 2. frost · 霜针塔(冰元素 / 基础)

**视觉关键词**:六棱冰晶 + 钢制底环 + 6 道辐射冰刺 + 浅蓝寒霜辉光

### 2.1 HUD icon(`towers/frost_icon.png`,64×64)

```
A faceted hexagonal ice crystal seated in a cold steel rim, top-down
view, six short ice shards radiating outward, pale cyan-white glow
emanating from the crystal core, dark stone octagonal base, fantasy
tower defense icon, painterly stylised, transparent background,
high contrast, soft frosted halo
```

### 2.2 Lv1(`towers/frost_lv1.png`,96×96)

```
A faceted hexagonal pale-blue ice crystal mounted in a dark brushed
steel rim, top-down view, six short triangular ice shards radiating
outward symmetrically, dark octagonal stone platform underneath,
inner crystal glowing white-cyan, soft frosted halo, dark fantasy
tower defense art, painterly stylised, transparent background,
no characters, clean silhouette
```

### 2.3 Lv2(`towers/frost_lv2.png`,96×96)

```
Upgraded frost turret, taller multi-layered hexagonal crystal cluster
(one large central + three smaller stacked), steel rim now thicker with
embedded ice prisms, eight ice shards radiating in two staggered rings,
dark stone platform with hairline frost cracks, pale cyan glow with
faint snowflake particles in air around it, top-down view, painterly
dark fantasy, transparent background
```

### 2.4 Lv3(`towers/frost_lv3.png`,96×96)

```
Master-tier frost turret, towering crystalline structure of stacked
prismatic ice with internal blue-white refractive light, steel rim
ornamented with engraved snowflake glyphs, twelve ice shards radiating
outward like a blooming frost flower, slowly orbiting ring of frost
motes around the crown, dark stone platform veined with permafrost,
deep cyan rim-glow, top-down view, painterly dark fantasy masterpiece,
transparent background
```

---

## 3. arc · 电弧塔(雷元素 / 基础)

**视觉关键词**:同心铜线圈 + 4 根电极柱 + 中心电火花 + 黄色电弧辉光

### 3.1 HUD icon(`towers/arc_icon.png`,64×64)

```
A miniature tesla coil tower, top-down view, two concentric copper
coil rings, four upright copper electrode posts at the diagonals,
bright white-yellow spark at the center, faint yellow electric arcs
crackling between posts, dark octagonal stone base, fantasy tower
defense icon, painterly stylised, transparent background, soft
yellow rim-glow
```

### 3.2 Lv1(`towers/arc_lv1.png`,96×96)

```
A compact tesla coil device on a dark octagonal stone platform, top-down
view, two concentric copper coil rings, four short copper electrode
posts arranged at the diagonals, bright white-hot spark dot at the
center, thin yellow electric arcs crackling between adjacent posts,
soft warm-yellow rim-glow, dark fantasy tower defense art, painterly
stylised, transparent background, no characters
```

### 3.3 Lv2(`towers/arc_lv2.png`,96×96)

```
Upgraded tesla turret, three concentric copper coil rings of increasing
elevation suggesting a stepped cone, six taller electrode posts with
small ceramic insulators at the base, brighter pulsating central spark,
denser yellow arc network connecting all posts, dark stone platform
with copper conduit lines, top-down view, painterly dark fantasy,
transparent background
```

### 3.4 Lv3(`towers/arc_lv3.png`,96×96)

```
Master-tier tesla coil tower, stacked tower of four concentric copper
rings forming a bright energy crown, eight electrode posts radiating
outward, central plasma sphere of pure white-yellow light, swirling
electric field distortion ring around the entire structure, miniature
arc bolts visible jumping between every pair of posts, dark obsidian
platform with embedded glowing copper veins, deep yellow rim-aura,
top-down view, painterly dark fantasy masterpiece, transparent background
```

---

## 4. 生成后的处理流程

1. **确认输出**:1024×1024 透明底 PNG(若 AI 给的是白底,用 PS / GIMP / `rembg` 抠透明)。
2. **缩放**:Lv1/Lv2/Lv3 缩到 96×96,icon 缩到 64×64。优先用 PNG-8 或 PNG-24 压缩(`pngquant --quality=80-95`)。
3. **命名**:严格按上面括号里给的路径放入 `assets/towers/`。
4. **接入**:Phaser 已默认从 `assets/towers/{id}.svg` 读图,改成 PNG 后:
   - 当前实现只用一张主图(Lv1 当 base),先把 `spark_lv1.png` → 复制成 `spark.png`,Phaser 按等级缩放即可
   - 后续要分级显示时,在 `PreloadScene.ts` 多 `load.image('tower_spark_lv2', ...)`,Tower 实体根据 `this.level` 切贴图
5. **风格一致性检查**:三把塔放在同一张图里对比,看金属调 / 发光 / 投影方向是否一致。MJ 推荐用 `--seed` 锁定风格,SD 推荐固定模型 + LoRA。

---

## 5. 风格对照(出图前看一眼)

当前 SVG 占位的视觉锚点:
- `assets/towers/spark.svg` — 黄铜环 + 橙红火核 + 4 尖刺
- `assets/towers/frost.svg` — 钢环 + 六棱冰晶 + 6 冰刺
- `assets/towers/arc.svg` — 铜线圈 + 4 电极柱 + 黄白火花

AI 出图时尽量保持「轮廓、元素核心位置、辐射数量」一致,这样切换到真图时玩家不会感到错位。颜色和细节随便发挥。
