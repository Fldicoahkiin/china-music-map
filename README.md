# 中国独立音乐地图 (China Independent Music Map)

这是一个交互式的中国地图，用于展示和浏览不同省份的不同的风格乐队。项目基于 Vue 3 + Vite 构建，核心的地图渲染与交互功能由 **Apache ECharts** 强力驱动。

## 项目特点

- **稳定可靠的渲染**：采用成熟的 ECharts 库，内置中国地图支持，从根本上解决了地理定位不准、渲染异常的问题。
- **流畅的交互体验**：支持地图的平移和缩放，由 ECharts 内核提供优化，性能卓越。
- **清晰的数据呈现**：乐队以散点图（Scatter）的形式叠加在地理坐标上，通过标签清晰地展示其名称。
- **事件驱动**：点击乐队散点可触发事件，便于与应用其他部分（如信息面板）联动。
- **易于维护**：地图配置项集中管理，数据通过外部 JSON 加载，代码结构清晰，易于扩展。

## 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **核心可视化库**: [Apache ECharts](https://echarts.apache.org/)
- **Vue-ECharts 封装**: [vue-echarts](https://github.com/ecomfe/vue-echarts)

## 开发

### 环境准备

确保你已安装 [Node.js](https://nodejs.org/) (建议使用 v16 或更高版本)。

### 安装依赖

在项目根目录下运行以下命令：

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

服务启动后，在浏览器中打开对应的本地地址即可查看。

## 文件结构简介

```
.
├── public/
│ ├── data/ # 乐队和流派数据
│ └── china.json # 中国地理数据
├── src/
│ ├── components/
│ │ └── MapContainer.vue # 地图容器Vue组件 (使用 vue-echarts)
│ └── services/
│ └── echarts-map.js # 核心ECharts地图配置逻辑
└── ...
```

---
