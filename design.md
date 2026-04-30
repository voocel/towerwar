# 网页塔防策略游戏设计与开发文档

## 1. 项目概述

### 1.1 项目目标

开发一款运行于浏览器的 2D 塔防策略游戏。游戏具有多关卡、不同道路形态、塔与敌人的克制关系、技能系统、关卡成长与基础运营扩展能力。

### 1.2 技术路线

采用以下技术组合：

* **Phaser**：负责游戏核心循环、地图渲染、敌人移动、战斗逻辑、特效、输入处理
* **React**：负责外层菜单、关卡选择、设置、登录、活动页、商城、任务、存档管理界面
* **Canvas / WebGL**：由 Phaser 提供底层渲染能力
* **JSON 配置**：用于关卡、敌人、塔、防御塔升级、波次、技能、掉落与平衡参数配置

### 1.3 项目定位

* 类型：塔防 / 轻策略 / 单机关卡制
* 视角：俯视角 2D
* 平台：PC 浏览器优先，兼容移动端浏览器
* 商业形态：可先做单机版，再扩展广告、内购、通行证或账号系统

---

## 2. 为什么这套组合适合

### 2.1 Phaser 适合游戏主体

Phaser 更适合处理：

* 游戏主循环
* 多单位移动
* 子弹与命中逻辑
* 精灵动画
* 特效与层级
* 相机与缩放
* Web 端性能优化

### 2.2 React 适合外围系统

React 更适合处理：

* 首页与活动页
* 登录、注册、游客进入
* 关卡选择页
* 商城与任务页
* 设置、公告、邮件
* 数据面板与弹窗

### 2.3 JSON 配置适合多关卡扩展

JSON 化后，可以：

* 快速新增关卡而不改核心代码
* 平衡策划可以独立调数值
* 支持后续活动关卡、挑战模式、主题地图
* 降低代码耦合

---

## 3. 游戏核心玩法设计

### 3.1 基础循环

1. 进入关卡
2. 玩家使用初始金币建造防御塔
3. 敌人按波次沿道路推进
4. 防御塔自动攻击范围内目标
5. 击杀敌人获得金币
6. 玩家继续建造、升级、释放技能
7. 敌人到达终点则扣除生命
8. 全部波次消灭则胜利；生命归零则失败

### 3.2 核心乐趣

* 路径阅读与布防决策
* 资源分配（先扩塔还是先升级）
* 属性克制与塔组合
* 不同关卡道路形状带来的差异化策略
* 多入口、多路线和 Boss 波次带来的压迫感

### 3.3 战斗节奏

* 前期：低压，教学与资源积累
* 中期：引入克制与分路压力
* 后期：高密度、多类型混编、Boss 与技能决策

---

## 4. 关卡设计

### 4.1 关卡结构

每一关由以下元素组成：

* 背景主题
* 路径数据
* 塔位数据
* 出生点与终点
* 波次配置
* 初始金币与生命值
* 可用塔种类
* 可用技能
* 通关目标与三星条件

### 4.2 地图主题建议

* 森林边境：单路线弯道，适合新手
* 荒漠遗迹：长路径，适合炮塔与持续输出
* 冰雪山脉：双路线汇合，适合减速塔
* 火山裂谷：短路径高压，适合爆发塔
* 王城外围：多入口防守，考验全局调度

### 4.3 道路设计类型

* 单一路径：新手引导关
* 双路径：需要左右兼顾
* 多入口汇合：适合范围塔与减速控制
* 环形绕路：适合持续输出塔
* S 型长路：适合点杀与多段覆盖
* 分叉路线：适合塔位取舍与优先级判断

### 4.4 难度控制维度

* 敌人数量
* 敌人速度
* 敌人抗性
* 飞行/地面混编
* Boss 技能
* 路径长度
* 塔位稀缺程度
* 初始资源多寡

---

## 5. 地图与道路系统设计

### 5.1 推荐方案：路径点系统

每条道路使用一组路径点表示，敌人依次朝路径点移动。

优点：

* 实现简单
* 适合绝大多数塔防关卡
* 便于 JSON 配置
* 容易做多路线

### 5.2 路径数据示例

```json
{
  "paths": [
    [
      {"x": 0, "y": 320},
      {"x": 180, "y": 320},
      {"x": 180, "y": 180},
      {"x": 500, "y": 180},
      {"x": 500, "y": 420},
      {"x": 980, "y": 420}
    ]
  ]
}
```

### 5.3 多路线支持

* `paths` 支持数组
* 每个出生点绑定一条路径
* 可在后期扩展敌人随机选择路径、指定路径、动态换路

### 5.4 塔位设计

建议第一版使用**固定塔位**，而不是自由建造。

优点：

* 更容易做平衡
* 更容易控制地图节奏
* 更适合塔防新项目快速落地

塔位数据示例：

```json
{
  "towerSlots": [
    {"id": "s1", "x": 250, "y": 260},
    {"id": "s2", "x": 420, "y": 350},
    {"id": "s3", "x": 640, "y": 220}
  ]
}
```

---

## 6. 防御塔系统设计

### 6.1 初始塔种建议

* 箭塔：单体、攻速快、成本低
* 炮塔：范围伤害、对群有效
* 冰塔：减速控制
* 火塔：持续灼烧
* 法师塔：穿甲或魔法伤害
* 毒塔：持续掉血、适合肉怪

### 6.2 塔的基础属性

* 建造成本
* 攻击范围
* 攻击速度
* 单次伤害
* 伤害类型
* 是否溅射
* 是否带控制
* 升级费用
* 售卖返还比例

### 6.3 塔的数据结构示例

```json
{
  "id": "arrow_tower",
  "name": "箭塔",
  "cost": 50,
  "range": 140,
  "attackSpeed": 0.8,
  "damage": 20,
  "damageType": "physical",
  "targetStrategy": "first",
  "projectile": "arrow",
  "upgrades": ["arrow_tower_lv2", "sniper_tower_lv2"]
}
```

### 6.4 目标选择策略

* first：最靠近终点
* last：离起点最近
* nearest：最近目标
* strongest：血量最高
* weakest：血量最低

### 6.5 升级系统建议

每个塔可做两种升级路线：

* 路线 A：强化单体输出
* 路线 B：强化控制或范围效果

---

## 7. 敌人系统设计

### 7.1 敌人类型建议

* 小兵：低血、速度中等
* 快怪：低血、高速
* 盾兵：高护甲
* 法抗怪：魔法抗性高
* 飞行怪：仅特定塔可攻击
* 自爆怪：接近终点造成额外伤害
* 治疗怪：为附近敌人回血
* Boss：高血量、技能机制

### 7.2 敌人属性

* hp
* speed
* armor
* magicResist
* reward
* lifeDamage
* tags（ground / flying / boss）
* skill list

### 7.3 敌人数据示例

```json
{
  "id": "orc_shield",
  "name": "盾兵兽人",
  "hp": 320,
  "speed": 45,
  "armor": 20,
  "magicResist": 0,
  "reward": 15,
  "lifeDamage": 1,
  "tags": ["ground"]
}
```

---

## 8. 波次系统设计

### 8.1 波次配置目标

通过 JSON 定义：

* 敌人种类
* 数量
* 间隔
* 出生路径
* 精英/Boss
* 预警信息

### 8.2 波次示例

```json
{
  "waves": [
    {
      "id": 1,
      "groups": [
        {"enemyId": "goblin", "count": 10, "interval": 1000, "pathIndex": 0}
      ]
    },
    {
      "id": 2,
      "groups": [
        {"enemyId": "goblin_fast", "count": 8, "interval": 700, "pathIndex": 0},
        {"enemyId": "orc_shield", "count": 3, "interval": 1800, "pathIndex": 0}
      ]
    }
  ]
}
```

### 8.3 高级扩展

* 延迟出现
* 混编群组
* 从不同出生点刷怪
* Boss 入场动画
* 波次预览面板

---

## 9. 技能系统设计

### 9.1 技能类型建议

* 陨石：范围爆发伤害
* 冰冻：大范围减速/冻结
* 闪电链：多目标弹射伤害
* 治疗：恢复基地生命或修复城墙
* 援军：召唤临时单位

### 9.2 技能资源机制

二选一：

* 冷却制
* 能量点数制

第一版建议使用**冷却制**，更简单易懂。

### 9.3 技能数据示例

```json
{
  "id": "meteor",
  "name": "陨石术",
  "cooldown": 30,
  "radius": 120,
  "damage": 180,
  "targetType": "ground"
}
```

---

## 10. 经济与成长设计

### 10.1 局内经济

来源：

* 击杀敌人
* 波次奖励
* 成就奖励

消耗：

* 建塔
* 升级
* 使用特定主动道具（如后续要做）

### 10.2 局外成长（可选）

* 新塔解锁
* 技能升级
* 天赋树
* 地图星级奖励
* 新章节开启

第一版建议：

* 先做局内成长
* 局外成长留到版本 2

---

## 11. 数值设计原则

### 11.1 早期原则

* 箭塔成本最低，作为基础塔
* 炮塔清群强但攻速慢
* 冰塔不承担主输出
* 法师塔针对高甲敌人
* 技能不能代替布防，只能救场

### 11.2 平衡切入点

优先调以下参数：

* 敌人 hp / speed
* 塔 cost / damage / range
* 升级收益曲线
* 波次密度
* 基地生命值

### 11.3 设计避免点

* 某一塔在所有关卡都最优
* 技能过强导致塔无意义
* 关卡纯数值堆怪，没有地图策略差异

---

## 12. UI / UX 设计

### 12.1 核心界面

* 顶部 HUD：金币、生命、波次、暂停、倍速
* 底部建塔栏：塔图标、价格、可建状态
* 右侧信息面板：选中塔详情、升级、出售
* 技能栏：技能图标、冷却遮罩
* 结算页：胜利、失败、星级、奖励

### 12.2 外层页面（React）

* 首页
* 登录/游客模式
* 章节地图页
* 关卡选择页
* 设置页
* 商城页（可后置）
* 活动页（可后置）

### 12.3 UX 原则

* 新手关只开放 2 到 3 种塔
* 清晰展示敌人抗性
* 塔的范围预览必须直观
* 冷却、金币不足、不可建造状态必须可视化

---

## 13. 技术架构设计

### 13.1 总体架构

* React 管理外层应用壳
* Phaser 运行在单独的游戏容器中
* React 与 Phaser 通过事件总线或状态桥接通信

### 13.2 模块划分

#### React 层

* 路由管理
* 页面状态
* 用户资料
* 存档读取
* 关卡选择
* 设置与商城

#### Phaser 层

* Scene 管理
* 地图渲染
* 敌人实体
* 塔实体
* 子弹系统
* 波次系统
* 特效系统
* 碰撞和命中判定

#### 数据层

* levels/*.json
* towers.json
* enemies.json
* skills.json
* balance/*.json

### 13.3 通信方案

建议：

* React -> Phaser：开始关卡、暂停、继续、使用技能、设置倍速
* Phaser -> React：金币变化、生命变化、波次变化、胜利失败、掉落奖励

可通过：

* EventEmitter
* Zustand / Redux 共享状态桥
* 自定义 message bus

---

## 14. 项目目录建议

```text
src/
  app/
    router/
    pages/
      Home/
      LevelSelect/
      Settings/
      Store/
  game/
    core/
      GameBootstrap.ts
      EventBus.ts
    scenes/
      BootScene.ts
      PreloadScene.ts
      MenuScene.ts
      LevelScene.ts
      UIScene.ts
    entities/
      Enemy.ts
      Tower.ts
      Projectile.ts
      SkillEffect.ts
    systems/
      PathSystem.ts
      WaveSystem.ts
      CombatSystem.ts
      TargetSystem.ts
      EconomySystem.ts
    data/
      towers.json
      enemies.json
      skills.json
      levels/
        level_001.json
        level_002.json
    utils/
  shared/
    types/
    constants/
  assets/
    images/
    audio/
    maps/
    fx/
```

---

## 15. 关卡 JSON 规范建议

```json
{
  "id": "level_001",
  "name": "森林边境",
  "theme": "forest",
  "map": {
    "width": 1280,
    "height": 720,
    "background": "forest_bg_001"
  },
  "player": {
    "startGold": 150,
    "startLives": 20
  },
  "paths": [
    [
      {"x": 0, "y": 320},
      {"x": 160, "y": 320},
      {"x": 160, "y": 180},
      {"x": 480, "y": 180},
      {"x": 480, "y": 420},
      {"x": 980, "y": 420}
    ]
  ],
  "spawnPoints": [
    {"x": 0, "y": 320, "pathIndex": 0}
  ],
  "goal": {
    "x": 980,
    "y": 420
  },
  "towerSlots": [
    {"id": "s1", "x": 250, "y": 260},
    {"id": "s2", "x": 360, "y": 380},
    {"id": "s3", "x": 640, "y": 240}
  ],
  "allowedTowers": ["arrow_tower", "cannon_tower", "ice_tower"],
  "skills": ["meteor"],
  "waves": [
    {
      "id": 1,
      "groups": [
        {"enemyId": "goblin", "count": 10, "interval": 1000, "pathIndex": 0}
      ]
    }
  ],
  "starConditions": {
    "win": true,
    "livesAtLeast": 15,
    "noSkillUsed": false
  }
}
```

---

## 16. 核心系统实现说明

### 16.1 敌人移动系统

* 读取敌人当前路径点索引
* 按 speed 与 deltaTime 朝目标点移动
* 抵达后切换到下一个路径点
* 到达终点触发扣血并销毁

### 16.2 塔攻击系统

* 周期性扫描攻击范围内目标
* 按 targetStrategy 选择目标
* 生成 projectile 或直接造成伤害
* 应用元素效果（减速、中毒、灼烧）

### 16.3 投射物系统

* 子弹飞行
* 命中检测
* 爆炸范围判定
* 命中特效
* 销毁回收

### 16.4 波次系统

* 管理当前 wave、group、spawn timer
* 广播下一波预警
* 全部清空且无存活敌人时触发胜利

### 16.5 经济系统

* 监听击杀事件
* 发放金币
* 校验建塔/升级消耗
* 负责结算页奖励数据

---

## 17. 开发阶段规划

### 17.1 第一阶段：最小可玩原型（2~4 周）

目标：证明核心玩法成立

交付：

* 1 张地图
* 1 条路径
* 3 种塔
* 3 种敌人
* 5 波怪
* 胜负结算
* 基础 HUD

### 17.2 第二阶段：内容扩展（3~6 周）

交付：

* 5~10 关
* 6 种塔
* 8~12 种敌人
* 3 个技能
* 章节与关卡选择界面
* 升级与更多波次机制

### 17.3 第三阶段：表现与商业化（4~8 周）

交付：

* 特效优化
* 音效与 BGM
* 登录/存档
* 每日任务/活动
* 商城或广告位

---

## 18. 团队分工建议

### 18.1 程序

* 前端 / React 工程师：外层页面、状态管理、账号与界面系统
* 游戏客户端工程师：Phaser 核心玩法、实体与战斗系统

### 18.2 设计

* 系统策划：塔、敌人、关卡与数值
* 关卡策划：道路、波次、塔位分布
* UI 设计师：HUD、菜单、弹窗、图标
* 美术：地图、塔、敌人、特效、界面装饰

### 18.3 测试

* 功能测试
* 数值体验测试
* 多分辨率与浏览器兼容测试

---

## 19. 风险与规避

### 19.1 常见风险

* 过早追求华丽美术，核心玩法却不成立
* 没有配置化，导致新增关卡必须改代码
* 多路线逻辑写死，后期难扩展
* React 与 Phaser 状态耦合混乱
* 第一版就做太多系统，开发周期失控

### 19.2 建议规避

* 先做灰盒原型再做美术
* 所有关卡和数值 JSON 化
* 先固定塔位，后续再考虑自由建造
* 先做单机存档，联网功能放后面
* 先验证 1 关可玩，再批量扩关

---

## 20. 首版推荐范围（MVP）

### 20.1 必做

* 1~3 张地图
* 3 种塔
* 4 种敌人
* 1 个技能
* 关卡选择
* 胜负结算
* 本地存档

### 20.2 可后置

* 登录系统
* 商城
* 活动页
* 天赋树
* PVP
* 公会

---

## 21. 结论

这套“React + Phaser + Canvas/WebGL + JSON 关卡配置”的组合，非常适合你的网页塔防策略游戏，尤其适合：

* 多关卡
* 道路形态多变
* 多塔种与克制关系
* 后续持续扩展新内容

推荐的落地原则是：

1. 先做 Phaser 可玩原型
2. 再做 JSON 配置化
3. 再接入 React 外层页面
4. 最后完善美术表现与运营系统

如果继续往下推进，下一份最值得产出的文档是：

* 《详细关卡配置规范》
* 《塔/敌人数值表》
* 《前端技术实施方案》
* 《Phaser 原型开发任务拆解表》

---

## 22. 详细关卡 JSON 配置规范

### 22.1 设计目标

关卡配置需要满足以下要求：

* 可读性强，策划能理解
* 可扩展，方便后续增加路线、机关、Boss、天气系统
* 可校验，避免漏字段导致运行时报错
* 可复用，支持不同主题地图共享同一套逻辑结构

### 22.2 推荐字段结构

```json
{
  "id": "level_001",
  "name": "森林边境",
  "chapterId": "chapter_01",
  "theme": "forest",
  "difficulty": 1,
  "map": {},
  "player": {},
  "camera": {},
  "paths": [],
  "spawnPoints": [],
  "goal": {},
  "towerSlots": [],
  "decorations": [],
  "allowedTowers": [],
  "skills": [],
  "waves": [],
  "starConditions": {},
  "rewards": {},
  "meta": {}
}
```

### 22.3 字段说明

#### 基本信息

* `id`：关卡唯一 ID
* `name`：关卡名称
* `chapterId`：所属章节
* `theme`：地图主题，如 forest / desert / ice / volcano
* `difficulty`：难度等级，建议 1~5

#### 地图信息

* `map.width`、`map.height`：逻辑尺寸
* `map.background`：背景资源 key
* `map.gridSize`：可选，便于编辑器对齐

#### 玩家初始状态

* `player.startGold`
* `player.startLives`
* `player.maxTowers`：可选，特殊关卡使用

#### 相机信息

* `camera.zoom`
* `camera.scrollX`
* `camera.scrollY`

#### 路径与刷怪点

* `paths`：路径点数组，支持多路线
* `spawnPoints`：出生点，绑定到路径索引
* `goal`：终点坐标，可后续扩展为多个终点

#### 建塔位

* `towerSlots`：固定塔位列表
* 可增加 `slotType` 字段，用于特殊塔位限制

#### 装饰物

* `decorations`：仅用于表现，不参与逻辑

#### 关卡内容限制

* `allowedTowers`：该关可建塔种
* `skills`：该关可用技能

#### 波次

* `waves`：核心字段，定义敌人出现顺序和节奏

#### 星级目标

* `starConditions`：三星条件

#### 奖励

* `rewards.gold`
* `rewards.gems`
* `rewards.unlockLevel`

#### 额外元数据

* `meta.recommendedPower`
* `meta.tags`
* `meta.version`

### 22.4 波次字段规范

每个 wave 推荐包含：

```json
{
  "id": 1,
  "delayBefore": 0,
  "groups": [
    {
      "enemyId": "goblin",
      "count": 10,
      "interval": 1000,
      "pathIndex": 0,
      "delay": 0
    }
  ],
  "rewardGold": 30,
  "tips": "前方出现高速敌人"
}
```

字段说明：

* `delayBefore`：本波开始前等待时间
* `groups`：本波敌人组
* `rewardGold`：清完本波额外金币奖励
* `tips`：预警文案

### 22.5 敌人组字段规范

* `enemyId`：敌人类型
* `count`：数量
* `interval`：刷怪间隔（毫秒）
* `pathIndex`：走哪条路
* `delay`：该组延迟出现时间
* `elite`：是否精英
* `levelMultiplier`：数值倍率，可用于活动关

### 22.6 塔位字段规范

```json
{
  "id": "slot_01",
  "x": 320,
  "y": 240,
  "slotType": "ground",
  "tags": ["highland"]
}
```

扩展建议：

* `ground`：普通塔位
* `magic`：仅能放法系塔
* `support`：仅能放辅助塔
* `block`：特殊阻挡位

### 22.7 星级条件规范

```json
{
  "win": true,
  "livesAtLeast": 15,
  "maxBuildCount": 8,
  "noSkillUsed": false,
  "timeLimit": 300
}
```

### 22.8 奖励字段规范

```json
{
  "gold": 100,
  "gems": 10,
  "unlockLevel": "level_002",
  "dropTable": ["material_wood", "material_stone"]
}
```

### 22.9 配置校验建议

建议在启动关卡前做 schema 校验：

* 必填字段是否存在
* 路径点数量是否大于 1
* `spawnPoints.pathIndex` 是否越界
* `towerSlots.id` 是否唯一
* `allowedTowers` 是否都存在于塔表中
* `waves.groups.enemyId` 是否都存在于敌人表中

---

## 23. 三张示例地图配置

### 23.1 示例一：森林边境（新手单路线）

设计目标：

* 教学关
* 单一路线
* 低复杂度
* 适合认识箭塔、炮塔、冰塔

```json
{
  "id": "level_001",
  "name": "森林边境",
  "chapterId": "chapter_01",
  "theme": "forest",
  "difficulty": 1,
  "map": {
    "width": 1280,
    "height": 720,
    "background": "forest_bg_001",
    "gridSize": 40
  },
  "player": {
    "startGold": 180,
    "startLives": 20
  },
  "camera": {
    "zoom": 1,
    "scrollX": 0,
    "scrollY": 0
  },
  "paths": [
    [
      {"x": 0, "y": 340},
      {"x": 180, "y": 340},
      {"x": 180, "y": 200},
      {"x": 460, "y": 200},
      {"x": 460, "y": 460},
      {"x": 980, "y": 460},
      {"x": 1180, "y": 360}
    ]
  ],
  "spawnPoints": [
    {"x": 0, "y": 340, "pathIndex": 0}
  ],
  "goal": {
    "x": 1180,
    "y": 360
  },
  "towerSlots": [
    {"id": "s1", "x": 250, "y": 280, "slotType": "ground"},
    {"id": "s2", "x": 360, "y": 160, "slotType": "ground"},
    {"id": "s3", "x": 560, "y": 300, "slotType": "ground"},
    {"id": "s4", "x": 740, "y": 520, "slotType": "ground"},
    {"id": "s5", "x": 930, "y": 360, "slotType": "ground"}
  ],
  "allowedTowers": ["arrow_tower", "cannon_tower", "ice_tower"],
  "skills": ["meteor"],
  "waves": [
    {
      "id": 1,
      "delayBefore": 0,
      "groups": [
        {"enemyId": "goblin", "count": 8, "interval": 1000, "pathIndex": 0, "delay": 0}
      ],
      "rewardGold": 20,
      "tips": "第一波敌人正在接近"
    },
    {
      "id": 2,
      "delayBefore": 4000,
      "groups": [
        {"enemyId": "goblin", "count": 10, "interval": 900, "pathIndex": 0, "delay": 0},
        {"enemyId": "goblin_fast", "count": 4, "interval": 700, "pathIndex": 0, "delay": 3000}
      ],
      "rewardGold": 30,
      "tips": "小心高速敌人"
    },
    {
      "id": 3,
      "delayBefore": 5000,
      "groups": [
        {"enemyId": "orc_shield", "count": 5, "interval": 1600, "pathIndex": 0, "delay": 0}
      ],
      "rewardGold": 40,
      "tips": "重甲敌人出现，试试炮塔或法术"
    }
  ],
  "starConditions": {
    "win": true,
    "livesAtLeast": 15,
    "maxBuildCount": 6,
    "noSkillUsed": false
  },
  "rewards": {
    "gold": 100,
    "gems": 5,
    "unlockLevel": "level_002"
  },
  "meta": {
    "recommendedPower": 1,
    "tags": ["tutorial", "single_path"],
    "version": 1
  }
}
```

### 23.2 示例二：沙漠双线（双路线汇合）

设计目标：

* 引导玩家兼顾两条路
* 需要在中段汇合处做火力集中
* 适合引入范围塔与减速塔

```json
{
  "id": "level_002",
  "name": "沙漠裂谷",
  "chapterId": "chapter_01",
  "theme": "desert",
  "difficulty": 2,
  "map": {
    "width": 1280,
    "height": 720,
    "background": "desert_bg_001",
    "gridSize": 40
  },
  "player": {
    "startGold": 220,
    "startLives": 20
  },
  "camera": {
    "zoom": 1,
    "scrollX": 0,
    "scrollY": 0
  },
  "paths": [
    [
      {"x": 0, "y": 180},
      {"x": 220, "y": 180},
      {"x": 220, "y": 320},
      {"x": 620, "y": 320},
      {"x": 860, "y": 360},
      {"x": 1180, "y": 360}
    ],
    [
      {"x": 0, "y": 540},
      {"x": 260, "y": 540},
      {"x": 260, "y": 420},
      {"x": 620, "y": 420},
      {"x": 860, "y": 360},
      {"x": 1180, "y": 360}
    ]
  ],
  "spawnPoints": [
    {"x": 0, "y": 180, "pathIndex": 0},
    {"x": 0, "y": 540, "pathIndex": 1}
  ],
  "goal": {
    "x": 1180,
    "y": 360
  },
  "towerSlots": [
    {"id": "s1", "x": 180, "y": 280, "slotType": "ground"},
    {"id": "s2", "x": 180, "y": 440, "slotType": "ground"},
    {"id": "s3", "x": 420, "y": 260, "slotType": "ground"},
    {"id": "s4", "x": 420, "y": 460, "slotType": "ground"},
    {"id": "s5", "x": 700, "y": 360, "slotType": "ground"},
    {"id": "s6", "x": 910, "y": 300, "slotType": "ground"},
    {"id": "s7", "x": 910, "y": 430, "slotType": "ground"}
  ],
  "allowedTowers": ["arrow_tower", "cannon_tower", "ice_tower", "magic_tower"],
  "skills": ["meteor", "freeze_field"],
  "waves": [
    {
      "id": 1,
      "delayBefore": 0,
      "groups": [
        {"enemyId": "goblin", "count": 6, "interval": 900, "pathIndex": 0, "delay": 0},
        {"enemyId": "goblin", "count": 6, "interval": 900, "pathIndex": 1, "delay": 0}
      ],
      "rewardGold": 25,
      "tips": "敌人正从两侧逼近"
    },
    {
      "id": 2,
      "delayBefore": 4000,
      "groups": [
        {"enemyId": "goblin_fast", "count": 8, "interval": 650, "pathIndex": 0, "delay": 0},
        {"enemyId": "orc_shield", "count": 4, "interval": 1500, "pathIndex": 1, "delay": 1000}
      ],
      "rewardGold": 35,
      "tips": "两种敌人同时出现，注意火力分配"
    },
    {
      "id": 3,
      "delayBefore": 6000,
      "groups": [
        {"enemyId": "orc_shield", "count": 6, "interval": 1400, "pathIndex": 0, "delay": 0},
        {"enemyId": "shaman_healer", "count": 3, "interval": 1800, "pathIndex": 1, "delay": 2500}
      ],
      "rewardGold": 50,
      "tips": "治疗型敌人出现，优先集火"
    }
  ],
  "starConditions": {
    "win": true,
    "livesAtLeast": 14,
    "maxBuildCount": 7,
    "noSkillUsed": false
  },
  "rewards": {
    "gold": 140,
    "gems": 8,
    "unlockLevel": "level_003"
  },
  "meta": {
    "recommendedPower": 2,
    "tags": ["double_path", "merge_point"],
    "version": 1
  }
}
```

### 23.3 示例三：火山环道（长路径高压）

设计目标：

* 长路径、多转折
* 强调持续输出与减速覆盖
* 适合作为中期难度关卡

```json
{
  "id": "level_003",
  "name": "熔岩回廊",
  "chapterId": "chapter_02",
  "theme": "volcano",
  "difficulty": 3,
  "map": {
    "width": 1440,
    "height": 900,
    "background": "volcano_bg_001",
    "gridSize": 40
  },
  "player": {
    "startGold": 260,
    "startLives": 18
  },
  "camera": {
    "zoom": 1,
    "scrollX": 0,
    "scrollY": 0
  },
  "paths": [
    [
      {"x": 0, "y": 450},
      {"x": 180, "y": 450},
      {"x": 180, "y": 180},
      {"x": 620, "y": 180},
      {"x": 620, "y": 700},
      {"x": 1040, "y": 700},
      {"x": 1040, "y": 280},
      {"x": 1320, "y": 280},
      {"x": 1380, "y": 450}
    ]
  ],
  "spawnPoints": [
    {"x": 0, "y": 450, "pathIndex": 0}
  ],
  "goal": {
    "x": 1380,
    "y": 450
  },
  "towerSlots": [
    {"id": "s1", "x": 280, "y": 320, "slotType": "ground"},
    {"id": "s2", "x": 420, "y": 120, "slotType": "ground"},
    {"id": "s3", "x": 720, "y": 260, "slotType": "ground"},
    {"id": "s4", "x": 760, "y": 520, "slotType": "ground"},
    {"id": "s5", "x": 920, "y": 760, "slotType": "ground"},
    {"id": "s6", "x": 1120, "y": 540, "slotType": "ground"},
    {"id": "s7", "x": 1180, "y": 180, "slotType": "ground"},
    {"id": "s8", "x": 1280, "y": 360, "slotType": "ground"}
  ],
  "allowedTowers": ["arrow_tower", "cannon_tower", "ice_tower", "magic_tower", "fire_tower"],
  "skills": ["meteor", "freeze_field", "chain_lightning"],
  "waves": [
    {
      "id": 1,
      "delayBefore": 0,
      "groups": [
        {"enemyId": "goblin", "count": 10, "interval": 800, "pathIndex": 0, "delay": 0}
      ],
      "rewardGold": 25,
      "tips": "敌人数量增加，注意持续火力"
    },
    {
      "id": 2,
      "delayBefore": 4000,
      "groups": [
        {"enemyId": "goblin_fast", "count": 10, "interval": 550, "pathIndex": 0, "delay": 0},
        {"enemyId": "orc_shield", "count": 5, "interval": 1400, "pathIndex": 0, "delay": 2000}
      ],
      "rewardGold": 40,
      "tips": "快速单位与重甲单位混编来袭"
    },
    {
      "id": 3,
      "delayBefore": 6000,
      "groups": [
        {"enemyId": "lava_beast", "count": 4, "interval": 2200, "pathIndex": 0, "delay": 0},
        {"enemyId": "shaman_healer", "count": 4, "interval": 1800, "pathIndex": 0, "delay": 3000}
      ],
      "rewardGold": 60,
      "tips": "高生命敌人与支援单位同时出现"
    },
    {
      "id": 4,
      "delayBefore": 7000,
      "groups": [
        {"enemyId": "volcano_boss", "count": 1, "interval": 0, "pathIndex": 0, "delay": 0}
      ],
      "rewardGold": 100,
      "tips": "Boss 来袭，准备技能救场"
    }
  ],
  "starConditions": {
    "win": true,
    "livesAtLeast": 12,
    "maxBuildCount": 8,
    "noSkillUsed": false
  },
  "rewards": {
    "gold": 180,
    "gems": 12,
    "unlockLevel": "level_004"
  },
  "meta": {
    "recommendedPower": 3,
    "tags": ["long_path", "boss", "mid_game"],
    "version": 1
  }
}
```

---

## 24. 关卡设计方法论

### 24.1 先设计道路，再设计塔位

正确顺序：

1. 先定主题
2. 先画敌人路线
3. 再放塔位
4. 最后配波次

原因：

* 道路决定整体节奏
* 塔位决定布阵空间
* 波次只是把压力填进去

### 24.2 常见塔位放置原则

* 弯道内侧放关键塔位
* 汇合点给 1~2 个高价值塔位
* 长直线适合单体输出塔
* 终点前给救场塔位，但不要过强
* 地图两端不要都太强，避免策略单一

### 24.3 道路设计与玩法关系

* 长路径：更适合持续输出、灼烧、减速
* 短路径：更适合爆发塔与技能救场
* 双路径：适合范围塔和全局调度
* 多入口：强调资源分配与应急能力
* 环道：适合多段覆盖和复合火力区

---

## 25. 下一步最推荐产出

基于当前文档，最适合继续补的内容有三份：

1. 《塔与敌人的完整数值表》
2. 《Phaser 项目代码骨架与模块职责》
3. 《首个可玩原型开发任务拆解表》

建议优先顺序：

* 先做数值表
* 再做代码骨架
* 最后做任务排期

这样你就能从“概念方案”直接进入“可以开发”的状态。

---

## 26. 美术资源拆分方案

### 26.1 总原则

效果图不直接作为游戏本体使用，而是拆成可复用素材：

* 地图底图
* 道路层
* 建塔位底座
* 塔素材
* 敌人素材
* 子弹与技能特效
* UI 面板与图标

目标是做到：

* 可替换
* 可复用
* 可配置
* 可动画化

### 26.2 美术资源分层

推荐分为以下 7 层：

#### A. 背景层

用于表现主题氛围，不参与逻辑：

* 地表纹理
* 山体 / 岩石 / 火山 / 树木
* 远景装饰
* 光照阴影氛围

#### B. 道路层

用于视觉表现道路：

* 泥土路
* 石板路
* 沙地路
* 熔岩路
* 路口装饰

注意：

* 逻辑上的路线仍然由 `paths` 数据控制
* 道路图片只负责“看起来像路”

#### C. 塔位层

用于显示可建造位置：

* 空塔位底座
* 已占用塔位底座
* 高级塔位样式
* 特殊塔位样式

#### D. 建筑层

实际建造的塔：

* 箭塔
* 炮塔
* 冰塔
* 火塔
* 法师塔
* 升级后的不同外观

#### E. 敌人层

动态单位：

* 小兵
* 快怪
* 肉盾怪
* 飞行怪
* 治疗怪
* Boss

#### F. 特效层

动态表现：

* 箭矢
* 炮弹
* 爆炸
* 火焰
* 冰冻
* 雷电
* 命中火花
* 技能范围提示圈

#### G. UI 层

游戏界面：

* 顶部 HUD 背板
* 金币 / 生命 / 波次图标
* 建塔按钮
* 技能按钮
* 选中塔信息面板
* 升级 / 出售按钮
* 结算页边框

---

## 27. 素材清单（MVP 版本）

### 27.1 地图资源

首版建议做 3 张地图：

* `forest_bg_001`
* `desert_bg_001`
* `volcano_bg_001`

每张地图建议拆成：

* `bg_base`：纯底图
* `bg_deco_front`：前景装饰（树、石头、火焰）
* `road_overlay`：道路表现层（可选）

### 27.2 塔资源

建议首版至少 4 种塔：

* 箭塔
* 炮塔
* 冰塔
* 法师塔

每种塔建议资源：

* idle 图
* attack 图
* level2 图
* level3 图
* base 底座图
* range 预览圈（程序画也可）

### 27.3 敌人资源

建议首版至少 5 种敌人：

* 哥布林
* 快速哥布林
* 盾兵兽人
* 治疗萨满
* Boss

每种敌人建议资源：

* idle / run 动画帧
* hit 帧（可选）
* death 帧（可选）
* 血条挂点
* 阴影图（可选）

### 27.4 特效资源

MVP 必备：

* arrow_projectile
* cannon_ball
* explosion_small
* freeze_effect
* fire_hit
* meteor_impact

### 27.5 UI 资源

MVP 必备：

* top_hud_bg
* gold_icon
* life_icon
* wave_icon
* tower_btn_arrow
* tower_btn_cannon
* tower_btn_ice
* tower_btn_magic
* skill_btn_meteor
* panel_tower_info
* btn_upgrade
* btn_sell
* result_panel_win
* result_panel_lose

---

## 28. 美术规格建议

### 28.1 画面风格建议

推荐风格：

* 2D 半卡通
* 中高饱和
* 俯视角偏斜 45°
* 轮廓清晰
* UI 偏手游塔防风格

### 28.2 尺寸建议

#### 地图底图

* PC 主尺寸建议：`1280x720` 或 `1440x900`
* 如果做可缩放大地图，可做更高尺寸，例如 `2048x1024`

#### 塔与敌人

* 普通塔：`96x96` 或 `128x128`
* 小怪：`64x64`
* 精英怪：`96x96`
* Boss：`192x192` 或更大

#### UI 图标

* 小图标：`32x32` / `48x48`
* 按钮图：`64x64` / `96x96`
* 面板可切 9-slice 风格边框

### 28.3 导出建议

* 静态图：PNG
* 动画序列：PNG 序列图或 spritesheet
* 大地图背景：WebP 也可，但首版建议 PNG 优先，便于调试

---

## 29. 命名规范

### 29.1 总体规则

命名统一采用：

* 小写
* 下划线分隔
* 资源类别前缀明确

### 29.2 推荐命名方式

#### 地图

* `map_forest_bg_001`
* `map_forest_front_001`
* `map_desert_bg_001`

#### 道路

* `road_forest_001`
* `road_volcano_001`

#### 塔

* `tower_arrow_lv1`
* `tower_arrow_lv2`
* `tower_cannon_lv1`
* `tower_ice_lv1`

#### 敌人

* `enemy_goblin_run`
* `enemy_goblin_fast_run`
* `enemy_orc_shield_run`
* `enemy_shaman_idle`
* `enemy_boss_volcano_run`

#### 特效

* `fx_arrow_hit`
* `fx_cannon_explode`
* `fx_freeze_loop`
* `fx_meteor_impact`

#### UI

* `ui_top_hud_bg`
* `ui_icon_gold`
* `ui_btn_tower_arrow`
* `ui_panel_tower_info`
* `ui_result_win`

---

## 30. 切图与制作规则

### 30.1 地图不要把所有内容烘焙成一张

推荐拆为：

* 底图
* 前景装饰
* 独立塔位
* 独立道路层（可选）

这样可以：

* 更好做层级遮挡
* 更容易换关卡元素
* 减少后续返工

### 30.2 塔不要和底座画死在一起

建议拆开：

* `tower_base_common`
* `tower_arrow_lv1`
* `tower_arrow_lv2`

优点：

* 可统一塔位风格
* 升级替换简单
* 节省美术工作量

### 30.3 敌人优先做面向移动方向的统一视角

首版建议：

* 不做 8 向转身
* 统一俯视角斜视图
* 敌人只做 run 动画即可

### 30.4 特效优先 spritesheet

比如：

* 爆炸 8 帧
* 火焰 6 帧
* 冰冻 8 帧
* 陨石命中 10 帧

这样在 Phaser 中最好管理。

---

## 31. Phaser 资源加载方案

### 31.1 资源注册建议

在 `PreloadScene` 中统一加载：

* 图片
* spritesheet
* 音效
* JSON 配置

示例：

```ts
this.load.image('map_forest_bg_001', 'assets/maps/forest/bg_001.png')
this.load.image('tower_arrow_lv1', 'assets/towers/arrow/lv1.png')
this.load.spritesheet('enemy_goblin_run', 'assets/enemies/goblin/run.png', {
  frameWidth: 64,
  frameHeight: 64
})
this.load.image('ui_top_hud_bg', 'assets/ui/top_hud_bg.png')
this.load.json('level_001', 'assets/data/levels/level_001.json')
```

### 31.2 建议目录结构

```text
assets/
  maps/
    forest/
      bg_001.png
      front_001.png
    desert/
      bg_001.png
    volcano/
      bg_001.png
  towers/
    arrow/
      lv1.png
      lv2.png
    cannon/
      lv1.png
    ice/
      lv1.png
  enemies/
    goblin/
      run.png
      death.png
    orc_shield/
      run.png
  fx/
    explosion_small.png
    meteor_impact.png
  ui/
    top_hud_bg.png
    btn_tower_arrow.png
    icon_gold.png
  data/
    levels/
      level_001.json
      level_002.json
    towers.json
    enemies.json
    skills.json
```

### 31.3 动画创建建议

在 `BootScene` 或 `PreloadScene` 后统一创建动画：

```ts
this.anims.create({
  key: 'enemy_goblin_run_anim',
  frames: this.anims.generateFrameNumbers('enemy_goblin_run', { start: 0, end: 5 }),
  frameRate: 10,
  repeat: -1
})
```

---

## 32. 画面层级建议

### 32.1 深度层级示例

建议统一使用 depth：

* 0：地图底图
* 10：道路层
* 20：塔位底座
* 30：建筑
* 40：敌人
* 50：子弹
* 60：命中特效
* 70：前景装饰
* 100：HUD
* 110：弹窗

### 32.2 为什么需要前景装饰层

例如树木、岩石、火焰可以压在敌人和塔上方，画面会更立体。

---

## 33. 从效果图到正式资源的转化流程

### 33.1 推荐流程

1. 先确定 1 张风格图
2. 基于风格图拆出资源清单
3. 先做灰盒版本占位图
4. 再逐步替换为正式资源
5. 最后加特效和细节装饰

### 33.2 不建议的流程

* 一开始就想把整张效果图直接塞进游戏
* 没有玩法原型就大量做高精度美术
* 没有统一命名就开始到处导图

---

## 34. 美术与程序协作规范

### 34.1 美术交付格式

每个资源交付时建议包含：

* 文件名
* 对应功能说明
* 尺寸
* 锚点说明
* 是否透明底
* 是否动画序列

### 34.2 锚点建议

#### 塔

锚点建议在底座中心偏下

#### 敌人

锚点建议在脚底中心

#### 特效

* 爆炸类：中心点
* 命中类：命中中心
* 地面范围技能：圆心

### 34.3 程序接图注意事项

* 不要在代码里写死奇怪偏移值，尽量统一锚点规范
* 不同资源尺寸差异过大时，先在美术规范层统一
* UI 图尽量支持 9-slice 或分块拉伸

---

## 35. 首版最小美术包建议

如果要尽快做出“看起来像成品”的试玩版，建议第一批资源只做这些：

### 35.1 地图

* 1 张森林地图
* 1 张沙漠地图
* 1 张火山地图

### 35.2 塔

* 箭塔 lv1 / lv2
* 炮塔 lv1 / lv2
* 冰塔 lv1
* 法师塔 lv1

### 35.3 敌人

* 哥布林
* 快速哥布林
* 盾兵
* 治疗怪
* 火山 Boss

### 35.4 特效

* 箭矢
* 炮弹
* 小爆炸
* 冰冻环
* 陨石命中

### 35.5 UI

* 顶部 HUD
* 4 个塔按钮
* 1 个技能按钮
* 塔信息面板
* 胜利 / 失败结算框

只要这些资源齐了，Phaser-only 已经足够做出一个视觉效果不错的塔防试玩版。

---

## 36. 最终建议

你当前最合适的落地路线不是“不要图片”，而是：

**Phaser-only + JSON 配置关卡 + 拆分式图片素材方案**

这条路线兼顾了：

* 开发速度
* 视觉效果
* 可扩展性
* 后续内容增长

接下来最值得继续产出的文档是：

1. 《塔与敌人的完整数值表》
2. 《Phaser-only 项目代码骨架》
3. 《首个可玩原型任务拆解表》

建议优先下一步直接做：
**《Phaser-only 项目代码骨架》**

这样你就能从“设计文档”正式进入“代码开工”阶段。

---

# 第二部分：Phaser-only 详细实现规划

## 37. 最终技术决策

### 37.1 是否需要 React

第一版不使用 React。

原因：

* 游戏目标是“好玩、效果好、界面漂亮、有策略”
* 登录、商城、邮件、复杂网页运营系统不是核心需求
* Phaser 足够完成关卡选择、章节地图、游戏内 HUD、暂停、结算、设置等界面
* 少一层 React，可以减少工程复杂度和状态同步问题

### 37.2 最终第一版技术栈

```text
Phaser 3
TypeScript
Vite
JSON 配置
PNG / WebP / Spritesheet
Howler.js 或 Phaser Audio
localStorage / IndexedDB 本地存档
```

### 37.3 核心目标

第一版要做成一个完整可玩的网页塔防试玩版，而不是只有技术 Demo。

目标体验：

* 有完整地图和 UI 质感
* 有 3 个主题关卡
* 有塔种搭配和敌人克制
* 有技能救场
* 有波次压力
* 有胜负结算与星级目标
* 有章节推进感

---

## 38. 第一版范围定义

### 38.1 必做功能

#### 玩法

* 敌人沿路径移动
* 多道路支持
* 固定塔位建造
* 防御塔自动攻击
* 子弹与命中
* 范围伤害
* 减速效果
* 中毒 / 灼烧效果
* 技能释放
* 波次系统
* Boss 波次
* 金币经济
* 生命值系统
* 暂停 / 倍速
* 胜利 / 失败

#### 内容

* 3 张地图：森林、沙漠、火山
* 6 种塔：箭塔、炮塔、法师塔、冰塔、特斯拉塔、德鲁伊塔
* 6 种敌人：普通哥布林、快速哥布林、盾兵、萨满、巨魔、火山 Boss
* 4 个技能：陨石、暴风雪、援军、圣盾
* 9 个关卡：每个主题 3 关

#### 界面

* 启动页
* 章节地图页
* 关卡选择页
* 游戏 HUD
* 建塔面板
* 塔详情面板
* 技能栏
* 波次提示
* 暂停菜单
* 胜利结算
* 失败结算
* 设置页

#### 存档

* 已解锁关卡
* 每关最高星级
* 总金币 / 水晶
* 设置项
* 教学完成状态

### 38.2 明确不做

第一版不做：

* 登录注册
* 云存档
* 商城
* 邮件
* 公会
* PVP
* 排行榜
* 复杂账号体系
* 后台配置器

---

## 39. 游戏结构规划

### 39.1 Scene 划分

```text
BootScene
PreloadScene
TitleScene
ChapterScene
LevelSelectScene
GameScene
HUDScene
PauseScene
ResultScene
SettingsScene
```

### 39.2 Scene 职责

#### BootScene

* 初始化全局配置
* 检查设备尺寸
* 初始化存档
* 设置基础缩放策略

#### PreloadScene

* 加载基础 UI
* 加载全局配置 JSON
* 加载首批地图与单位资源
* 显示加载进度条

#### TitleScene

* 游戏标题
* 开始游戏
* 设置入口
* 继续游戏

#### ChapterScene

* 展示章节地图
* 显示森林、沙漠、火山章节
* 显示章节解锁状态

#### LevelSelectScene

* 显示当前章节关卡列表
* 显示星级
* 显示关卡主题与推荐策略
* 点击进入关卡

#### GameScene

游戏核心场景，负责：

* 地图渲染
* 塔位生成
* 敌人生成
* 塔攻击
* 子弹飞行
* 技能效果
* 波次推进
* 胜负判断

#### HUDScene

覆盖在 GameScene 上方，负责：

* 顶部资源栏
* 底部建塔栏
* 右侧塔详情面板
* 技能栏
* 倍速 / 暂停按钮
* 波次提示

#### PauseScene

* 暂停菜单
* 继续
* 重新开始
* 返回关卡选择
* 设置

#### ResultScene

* 胜利 / 失败
* 星级展示
* 奖励展示
* 下一关 / 重试 / 返回

#### SettingsScene

* 音乐开关
* 音效开关
* 画质等级
* 震屏开关

---

## 40. 代码目录规划

```text
src/
  main.ts
  game/
    GameApp.ts
    scenes/
      BootScene.ts
      PreloadScene.ts
      TitleScene.ts
      ChapterScene.ts
      LevelSelectScene.ts
      GameScene.ts
      HUDScene.ts
      PauseScene.ts
      ResultScene.ts
      SettingsScene.ts
    entities/
      Enemy.ts
      Tower.ts
      Projectile.ts
      SkillEffect.ts
      TowerSlot.ts
    systems/
      PathSystem.ts
      WaveSystem.ts
      CombatSystem.ts
      TargetSystem.ts
      ProjectileSystem.ts
      SkillSystem.ts
      EconomySystem.ts
      StatusEffectSystem.ts
      SaveSystem.ts
      AudioSystem.ts
      VfxSystem.ts
      InputSystem.ts
    managers/
      AssetManager.ts
      LevelManager.ts
      ConfigManager.ts
      SceneTransitionManager.ts
    data/
      levels/
        level_001.json
        level_002.json
        level_003.json
      towers.json
      enemies.json
      skills.json
      chapters.json
      balance.json
    types/
      LevelConfig.ts
      TowerConfig.ts
      EnemyConfig.ts
      SkillConfig.ts
      SaveData.ts
    ui/
      UIButton.ts
      UIPanel.ts
      UIIconButton.ts
      ProgressBar.ts
      Tooltip.ts
    utils/
      math.ts
      geometry.ts
      eventBus.ts
      constants.ts
assets/
  maps/
  towers/
  enemies/
  fx/
  ui/
  audio/
```

---

## 41. 数据配置规划

### 41.1 配置文件列表

```text
chapters.json
levels/level_001.json
levels/level_002.json
levels/level_003.json
towers.json
enemies.json
skills.json
balance.json
```

### 41.2 chapters.json

用于章节地图和关卡解锁。

```json
{
  "chapters": [
    {
      "id": "chapter_forest",
      "name": "水晶森林",
      "theme": "forest",
      "background": "chapter_forest_bg",
      "levels": ["level_001", "level_002", "level_003"]
    },
    {
      "id": "chapter_desert",
      "name": "荒漠遗迹",
      "theme": "desert",
      "background": "chapter_desert_bg",
      "levels": ["level_004", "level_005", "level_006"]
    },
    {
      "id": "chapter_volcano",
      "name": "熔岩裂谷",
      "theme": "volcano",
      "background": "chapter_volcano_bg",
      "levels": ["level_007", "level_008", "level_009"]
    }
  ]
}
```

### 41.3 towers.json

```json
{
  "arrow_tower": {
    "name": "箭塔",
    "cost": 200,
    "range": 180,
    "damage": 28,
    "attackRate": 0.75,
    "damageType": "physical",
    "targetType": ["ground", "air"],
    "projectile": "arrow",
    "levels": [
      {"level": 1, "damage": 28, "range": 180, "cost": 200},
      {"level": 2, "damage": 45, "range": 195, "cost": 260},
      {"level": 3, "damage": 70, "range": 210, "cost": 380}
    ]
  }
}
```

### 41.4 enemies.json

```json
{
  "goblin": {
    "name": "哥布林",
    "hp": 100,
    "speed": 65,
    "armor": 0,
    "magicResist": 0,
    "reward": 12,
    "lifeDamage": 1,
    "tags": ["ground"],
    "sprite": "enemy_goblin_run"
  }
}
```

### 41.5 skills.json

```json
{
  "meteor": {
    "name": "陨石",
    "cooldown": 35,
    "radius": 130,
    "damage": 260,
    "targetType": ["ground"],
    "icon": "ui_skill_meteor"
  }
}
```

---

## 42. 核心系统实现规划

### 42.1 PathSystem

职责：

* 读取路径点
* 计算敌人朝下一个点移动
* 计算敌人路径进度
* 判断是否到达终点

核心数据：

```ts
interface PathProgress {
  pathIndex: number
  pointIndex: number
  progressDistance: number
}
```

关键方法：

```ts
moveAlongPath(enemy: Enemy, delta: number): void
getPathProgress(enemy: Enemy): number
hasReachedGoal(enemy: Enemy): boolean
```

### 42.2 WaveSystem

职责：

* 管理当前波次
* 按时间刷怪
* 支持多个 group 同时刷怪
* 判断本波是否结束
* 触发下一波和胜利判定

关键方法：

```ts
startWave(waveIndex: number): void
update(time: number, delta: number): void
isAllWavesCleared(): boolean
```

### 42.3 TargetSystem

职责：

* 查找塔范围内敌人
* 按策略选择目标

目标策略：

* first：最接近终点
* nearest：最近
* strongest：血量最高
* weakest：血量最低

关键方法：

```ts
findTargetsInRange(tower: Tower, enemies: Enemy[]): Enemy[]
selectTarget(tower: Tower, enemies: Enemy[]): Enemy | null
```

### 42.4 CombatSystem

职责：

* 控制塔攻击冷却
* 生成投射物
* 处理直接命中型攻击
* 调用伤害公式

关键方法：

```ts
updateTowerAttack(tower: Tower, delta: number): void
applyDamage(enemy: Enemy, damage: DamagePayload): void
```

### 42.5 ProjectileSystem

职责：

* 子弹飞行
* 子弹命中
* 溅射伤害
* 销毁回收

关键方法：

```ts
spawnProjectile(tower: Tower, target: Enemy): void
updateProjectiles(delta: number): void
handleImpact(projectile: Projectile): void
```

### 42.6 StatusEffectSystem

职责：

* 减速
* 中毒
* 灼烧
* 眩晕
* 护盾

状态结构：

```ts
interface StatusEffect {
  type: 'slow' | 'poison' | 'burn' | 'stun' | 'shield'
  duration: number
  value: number
  tickInterval?: number
}
```

### 42.7 SkillSystem

职责：

* 管理技能冷却
* 处理技能瞄准
* 释放技能
* 生成技能特效
* 应用范围效果

### 42.8 EconomySystem

职责：

* 金币增减
* 建塔校验
* 升级校验
* 售卖返还
* 击杀奖励

### 42.9 SaveSystem

职责：

* localStorage 存档
* 关卡解锁
* 星级记录
* 设置保存

---

## 43. 游戏画面实现规划

### 43.1 地图渲染

每个关卡加载：

* 背景图
* 前景装饰图
* 塔位底座
* 路径调试线（开发模式）

第一版地图可以用整张背景图承载主要美术表现，但塔位、敌人、塔、特效和 UI 必须独立。

### 43.2 塔位显示

塔位分为三种状态：

* 空闲：显示可建底座
* 可选中：鼠标悬停高亮
* 已建造：显示塔和升级状态

### 43.3 建塔交互

流程：

1. 点击空塔位
2. 打开建塔轮盘或底部建塔栏
3. 选择塔
4. 检查金币
5. 创建塔实体
6. 扣金币
7. 更新 HUD

### 43.4 塔详情交互

点击已建塔后显示：

* 塔名
* 等级
* 伤害
* 范围
* 攻速
* 目标类型
* 升级按钮
* 出售按钮

### 43.5 技能释放交互

流程：

1. 点击技能按钮
2. 鼠标进入瞄准模式
3. 地图显示范围圈
4. 点击地图释放
5. 播放特效
6. 应用伤害或状态
7. 进入冷却

---

## 44. 策略深度设计规划

### 44.1 塔之间的分工

| 塔    | 定位          | 克制          | 弱点          |
| ---- | ----------- | ----------- | ----------- |
| 箭塔   | 低价单体        | 快速小怪、飞行怪    | 群怪          |
| 炮塔   | 范围伤害        | 密集地面怪       | 飞行怪、单体 Boss |
| 法师塔  | 魔法输出        | 重甲怪         | 法抗怪         |
| 冰塔   | 控制减速        | 快速怪、Boss 牵制 | 输出低         |
| 特斯拉塔 | 连锁伤害        | 中密度敌群       | 单体效率一般      |
| 德鲁伊塔 | 毒 / 召唤 / 辅助 | 高血量慢怪       | 爆发不足        |

### 44.2 敌人之间的差异

| 敌人      | 特点     | 克制方式       |
| ------- | ------ | ---------- |
| 哥布林     | 普通基础怪  | 任意塔        |
| 快速哥布林   | 速度快    | 冰塔、箭塔      |
| 盾兵      | 护甲高    | 法师塔、毒塔     |
| 萨满      | 治疗周围单位 | 优先集火、特斯拉   |
| 巨魔      | 血量高    | 毒、持续输出     |
| 火山 Boss | 高血量、技能 | 减速、技能、集中火力 |

### 44.3 关卡策略变化

* 森林：教学与基础组合
* 沙漠：双路线资源分配
* 火山：高压长路径与 Boss

### 44.4 三星目标带来的策略

每关可设置不同三星条件：

* 剩余生命不少于 X
* 建塔数量不超过 X
* 不使用技能
* 指定时间内通关
* 不升级某类塔

---

## 45. 美术实现规划

### 45.1 已确定美术方向

风格基于新生成效果图：

* 暗色奇幻中世纪
* 金属边框 UI
* 蓝色水晶魔法元素
* 高饱和技能特效
* 俯视角地图
* 固定圆形塔位

### 45.2 第一批可用素材方向

已生成以下方向素材：

* 完整战斗效果图
* 森林地图底图
* 沙漠地图底图
* 火山地图底图
* 塔图标 / 塔造型合集
* 敌人造型合集
* 技能特效合集
* UI 套件概念图

### 45.3 真正开发时还需要处理

当前生成图适合做“概念资源”和“切图参考”，但要真正进入游戏，需要进一步处理：

* 从合集图中切出单个塔
* 从敌人合集图中切出单个敌人
* 从 UI 套件中切出按钮、面板、图标
* 技能特效最好重新做成序列帧或粒子效果
* 地图底图可以第一版直接使用

### 45.4 第一版美术落地策略

优先级：

1. 地图底图先直接用
2. UI 面板先从 UI 套件切图
3. 塔和敌人先用单帧图
4. 子弹和技能先用简单动态图 + 单帧特效
5. 第二轮再补动画序列帧

---

## 46. 开发任务拆解

### 46.1 第 0 阶段：项目初始化

交付目标：项目能启动，显示 Phaser 画布。

任务：

* 创建 Vite + TypeScript 项目
* 安装 Phaser
* 配置资源目录
* 创建 BootScene / PreloadScene / TitleScene
* 实现基础分辨率适配

完成标准：

* 浏览器能打开游戏
* 显示标题页
* 能点击开始进入空 GameScene

### 46.2 第 1 阶段：地图与路径

交付目标：显示森林地图，敌人能沿路径移动。

任务：

* 加载 level_001.json
* 渲染地图背景
* 渲染路径调试线
* 实现 PathSystem
* 创建 Enemy 实体
* 敌人沿路径点移动
* 到达终点扣生命

完成标准：

* 敌人从入口走到终点
* 多个敌人能连续移动
* 到达终点生命减少

### 46.3 第 2 阶段：塔位与建塔

交付目标：玩家能在固定塔位建塔。

任务：

* 渲染塔位底座
* 点击塔位打开建塔选择
* 读取 towers.json
* 检查金币
* 创建 Tower 实体
* 扣金币
* 显示塔攻击范围

完成标准：

* 点击塔位可建塔
* 金币不足无法建造
* 已建塔不能重复建造

### 46.4 第 3 阶段：攻击与子弹

交付目标：塔能自动攻击敌人。

任务：

* 实现 TargetSystem
* 实现 CombatSystem
* 实现 ProjectileSystem
* 子弹追踪目标
* 命中扣血
* 敌人死亡发金币

完成标准：

* 塔自动找目标
* 子弹命中敌人
* 敌人死亡消失
* 金币增加

### 46.5 第 4 阶段：波次系统

交付目标：关卡可以按配置刷怪。

任务：

* 实现 WaveSystem
* 支持多个 group
* 支持多路径刷怪
* 显示当前波次
* 检测全部波次结束
* 触发胜利

完成标准：

* 关卡按 JSON 刷怪
* 波次之间有间隔
* 清完所有波次胜利

### 46.6 第 5 阶段：HUD 与 UI

交付目标：界面接近效果图的基础质感。

任务：

* 顶部生命 / 金币 / 波次栏
* 底部建塔栏
* 技能栏
* 暂停 / 倍速按钮
* 塔详情面板
* 统一 UI 皮肤

完成标准：

* 不需要控制台即可理解当前状态
* 游戏内所有核心操作都有 UI 入口

### 46.7 第 6 阶段：技能系统

交付目标：玩家可以释放主动技能。

任务：

* 实现 SkillSystem
* 技能按钮冷却
* 技能瞄准范围圈
* 陨石范围伤害
* 暴风雪减速
* 援军阻挡 / 攻击
* 圣盾保护基地

完成标准：

* 技能能释放
* 有冷却显示
* 能明显改变战局

### 46.8 第 7 阶段：塔升级与出售

交付目标：防御策略有成长深度。

任务：

* 塔等级系统
* 升级费用
* 升级后外观变化
* 升级后属性变化
* 出售返还金币

完成标准：

* 玩家能选择铺塔或升级
* 不同选择影响通关效率

### 46.9 第 8 阶段：章节与关卡选择

交付目标：形成完整游戏流程。

任务：

* TitleScene
* ChapterScene
* LevelSelectScene
* 关卡解锁
* 星级显示
* 进入指定关卡

完成标准：

* 玩家能从首页进入章节，再进入关卡
* 通关后解锁下一关

### 46.10 第 9 阶段：结算与存档

交付目标：有完整一局闭环。

任务：

* 胜利结算
* 失败结算
* 星级计算
* 奖励结算
* localStorage 存档
* 读取存档

完成标准：

* 刷新页面后进度仍保留
* 通关奖励与星级正常保存

### 46.11 第 10 阶段：表现打磨

交付目标：接近效果图质感。

任务：

* 替换正式地图图
* 替换正式塔图
* 替换正式敌人图
* 加命中特效
* 加技能特效
* 加按钮音效
* 加战斗音效
* 加屏幕震动
* 加 UI 动效

完成标准：

* 游戏画面不再像原型
* 有完整奇幻塔防质感

---

## 47. MVP 开发排期建议

### 第 1 周

* 项目初始化
* 地图加载
* 路径移动
* 敌人到达终点扣血

### 第 2 周

* 塔位
* 建塔
* 塔攻击
* 子弹系统
* 敌人死亡奖励

### 第 3 周

* 波次系统
* HUD
* 胜负判断
* 基础结算

### 第 4 周

* 技能系统
* 塔升级
* 关卡选择
* 本地存档

### 第 5 周

* 3 张地图接入
* 9 关配置
* 敌人与塔数值调整

### 第 6 周

* 美术替换
* UI 打磨
* 音效
* 特效
* 体验优化

如果单人开发，建议按 8~10 周估算。
如果有 2~3 人协作，6 周可以做出较完整 MVP。

---

## 48. 第一版数值表建议

### 48.1 塔数值

| id           | 名称   |  费用 | 伤害 |  范围 |   攻速 | 类型 | 定位   |
| ------------ | ---- | --: | -: | --: | ---: | -- | ---- |
| arrow_tower  | 箭塔   | 200 | 28 | 180 | 0.75 | 物理 | 低价单体 |
| cannon_tower | 炮塔   | 300 | 70 | 155 |  1.6 | 爆炸 | 范围清怪 |
| mage_tower   | 法师塔  | 400 | 60 | 170 | 1.25 | 魔法 | 克重甲  |
| frost_tower  | 冰塔   | 500 | 18 | 160 |  1.4 | 冰霜 | 减速控制 |
| tesla_tower  | 特斯拉塔 | 550 | 45 | 165 |  1.1 | 雷电 | 连锁伤害 |
| druid_tower  | 德鲁伊塔 | 450 | 20 | 155 |  1.3 | 毒  | 持续伤害 |

### 48.2 敌人数值

| id            | 名称      |   血量 |  速度 | 护甲 | 魔抗 |  奖励 | 特点   |
| ------------- | ------- | ---: | --: | -: | -: | --: | ---- |
| goblin        | 哥布林     |  100 |  65 |  0 |  0 |  12 | 基础怪  |
| goblin_fast   | 快速哥布林   |   75 | 105 |  0 |  0 |  14 | 高速   |
| orc_shield    | 盾兵      |  260 |  45 | 25 |  0 |  22 | 高护甲  |
| shaman_healer | 萨满      |  180 |  50 |  0 | 20 |  28 | 治疗   |
| troll_brute   | 巨魔      |  520 |  35 | 10 | 10 |  42 | 高血量  |
| volcano_boss  | 火山 Boss | 3000 |  28 | 20 | 20 | 180 | Boss |

---

## 49. 关键技术风险与解决方案

### 49.1 图片资源不能直接当可用素材

风险：AI 生成图经常是合集，不是透明背景、不是单独 sprite。

解决：

* 地图图可直接用
* 塔、敌人、UI 需要切图
* 后续最好重新生成透明背景单体素材
* 动画先用单帧，后续再补序列帧

### 49.2 关卡地图和路径不对齐

风险：敌人逻辑路径和视觉道路偏差。

解决：

* 开发模式显示路径线
* 路径点用调试工具微调
* 后期做简单路径点编辑器

### 49.3 UI 全用 Phaser 可能维护困难

风险：Phaser 做复杂 UI 不如 React。

解决：

* 第一版 UI 只做游戏需要的界面
* 所有 UI 用统一组件封装
* 不做商城、邮件等复杂列表页
* 如果后期真要平台化，再接 React

### 49.4 策略深度不足

风险：只是堆怪，没有真正选择。

解决：

* 通过敌人抗性逼迫玩家换塔
* 通过双路线逼迫资源分配
* 通过三星条件提供挑战
* 通过技能冷却制造关键决策

---

## 50. 第一版完成标准

第一版完成时，应该达到以下效果：

### 可玩性

* 至少 9 个可玩的关卡
* 每关道路不同
* 有明显塔种克制
* 有波次压力
* 有 Boss 战

### 视觉

* 至少 3 张主题地图
* UI 风格统一
* 塔和敌人有清晰识别度
* 技能释放有明显特效
* 整体接近生成效果图的暗黑奇幻塔防感觉

### 工程

* 关卡由 JSON 驱动
* 塔和敌人由配置驱动
* 可以继续扩展新关卡
* 可以继续替换素材
* 可以后续接 React，但第一版不依赖 React

---

## 51. 最终实施结论

当前项目不需要 React。

最优路线是：

**Phaser-only 第一版，专注玩法、视觉和策略。**

React 不是提升画面效果的关键。画面效果来自：

* 高质量地图图
* 独立塔素材
* 独立敌人素材
* UI 套件
* 技能特效
* 动画和层级管理

所以第一版应该把精力放在：

* 关卡设计
* 塔与敌人克制
* 波次节奏
* 素材切分与接入
* UI 统一风格
* 战斗反馈

这条路线可行，并且比一开始 React + Phaser 更适合当前目标。

