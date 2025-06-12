# 中国独立音乐地图 (China Independent Music Map)

这是一个基于 Vue.js, D3.js 和 GSAP 构建的交互式中国音乐地图项目。它旨在通过地理可视化的方式，展示和探索分布在中国各地的独立乐队。

## 项目核心原理

本地图应用的核心数据驱动逻辑如下：

1. **加载流派**: 应用启动时，首先会读取 `public/data/genres.json` 文件，获取一个包含所有音乐流派标识符（通常是英文名）的列表。

2. **并行加载乐队数据**: 根据上一步获取的流派列表，应用会并行地、异步地请求每个流派文件夹下的 `bands.json` 文件 (例如 `public/data/shoegaze/bands.json`)。

3. **数据注入与合并**: 在加载每个乐队的数据时，程序会自动将该乐队所属的 `genre`（流派）信息注入到每个乐队对象中。这对于后续准确定位Logo资源至关重要。所有流派的乐队数据最终会合并成一个大的乐队列表。

4. **地理数据匹配**: 与此同时，应用会加载 `public/china.json` 这份标准的GeoJSON地理数据。程序会遍历所有乐队，并根据每个乐队的 `province` 字段（**必须是中文全称，如 "四川省"**），在GeoJSON数据中寻找与之 `properties.name` 字段相匹配的地理特征。

5. **动态定位与渲染**:
    * 一旦匹配成功，程序会利用D3.js计算出该省份区域的地理中心点。
    * 为了避免多个乐队在同一点上重叠，程序会以该中心点为基准，动态计算出一个网格布局，将该省份的所有乐队整齐地排列开。
    * 乐队信息最终以两种形式在地图上渲染：
        * 如果乐队数据中有 `logo` 字段，程序会根据流派和Logo文件名拼接出完整路径 (例如 `data/shoegaze/logos/my-logo.png`) 并显示Logo图片。
        * 如果 `logo` 字段为空或图片加载失败，则会优雅降级，直接显示乐队的名称文本。

## 技术栈

* **[Vue.js 3](https://vuejs.org/)**: 作为项目的基础框架，负责构建用户界面、管理组件状态（如加载动画、被选中的乐队信息）和处理用户交互。
* **[Vite](https://vitejs.dev/)**: 下一代前端开发与构建工具，为项目提供了极速的开发服务器和高效的打包能力。
* **[D3.js](https://d3js.org/)**: 数据可视化的核心。它负责解析和渲染 `china.json` 地理数据，生成SVG地图；计算省份的边界和中心点；并将乐队数据绑定到地图的可视化元素上。
* **[GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/)**: 专业的动画库，用于实现流畅、高性能的交互动画。本项目中，当用户点击某个省份时，GSAP会驱动该省份平滑地缩放并产生一个微妙的2.5D"凸起"效果，提升了交互的质感。

数据来源于<https://geojson.cn/data/atlas/china>

## 项目结构

```
/
├── public/
│   ├── data/
│   │   ├── genres.json           # 流派清单
│   │   └── [genre-name]/
│   │       └── bands.json        # 特定流派的乐队数据
│   └── china.json                # 中国地图的 GeoJSON 数据
├── src/
│   ├── components/
│   │   ├── App.vue               # 主应用组件
│   │   ├── MapContainer.vue      # 地图容器 (D3.js)
│   │   └── BandInfoPanel.vue     # 乐队信息侧边栏
│   ├── services/
│   │   └── d3-map.js             # 核心地图逻辑 (D3 + GSAP)
│   ├── assets/                   # (如果需要存放本地图片等)
│   └── main.js                   # 应用入口
├── index.html
├── package.json
└── README.md
```

## 数据格式

### `public/data/genres.json`

此文件定义了应用需要加载的所有音乐流派。它是一个简单的JSON对象，包含一个字符串数组。

```json
{
  "genres": [
    "shoegaze",
    "post-rock"
  ]
}
```

### `public/data/[genre-name]/bands.json`

每个流派文件夹下都有一个 `bands.json` 文件，包含了该流派下的乐队信息数组。

* `name`: 乐队名称 (必填)。
* `province`: 乐队所在的省份 (必填)。**该名称必须与 `china.json` 中省份的 `properties.name` 字段完全一致的中文全称** (例如: "北京市", "四川省")。
* `logo`: (可选) 乐队Logo的**文件名** (例如: `my-logo.png`)。程序会自动在对应流派的`logos`文件夹中查找该文件。
* `description`: (可选) 乐队的文字介绍。
* `links`: (可选) 包含乐队相关链接的对象，例如: `{ "bandcamp": "...", "soundcloud": "..." }`

**示例:**

```json
[
  {
    "name": "悲伤的奶牛",
    "province": "四川省",
    "logo": "15981748518446_.pic.jpg",
    "description": "来自成都的后摇/瞪鞋乐队。",
    "links": {}
  }
]
```

## 本地开发

1. **克隆项目**

    ```bash
    git clone [repository-url]
    cd [project-directory]
    ```

2. **安装依赖**

    ```bash
    npm install
    ```

3. **运行开发服务器**

    ```bash
    npm run dev
    ```

现在，应用应该运行在 `http://localhost:5173`。

## 功能

* 基于SVG的中国地图展示，可通过鼠标拖拽平移、滚轮缩放。
* 在每个省份中心显示淡淡的中文名称，不影响交互。
* 点击省份可平滑缩放聚焦，并带有伪2.5D的"凸起"动画效果，且修复了重复点击的Bug。
* 自动计算并在省份内以网格状整齐排列乐队Logo或名称。
* 点击乐队可弹出侧边栏，显示其详细信息（待实现）。
* 通过JSON文件即可轻松扩展乐队和流派数据，维护性强。
* 优雅的加载动画，进度条会真实反映数据加载过程。

## 后续计划

* [ ] 实现点击乐队Logo/名称后，弹出`BandInfoPanel`显示详细信息的功能。
* [ ] 丰富乐队数据，添加更多流派和乐队。
* [ ] 优化UI/UX，例如为选中的乐队和省份添加更高亮的视觉反馈。
* [ ] 研究并添加更多交互方式，如按流派筛选乐队。
