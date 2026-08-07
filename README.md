# COSMOS — 星索

3D 知识球探索器：输入关键词，从 Wikipedia / Commons 拉取相关图像，炸成可旋转的深空球云；点击查看详情，双击以该词为中心继续探索。

灵感来自 [neal.fun/wiki-spy](https://neal.fun/wiki-spy/)，非官方个人项目。

## 功能

- 关键词搜索 → 球形爆炸布局（拖拽旋转 / 滚轮缩放）
- 详情卡（简介、许可、来源页）
- 双击跃迁到新中心；面包屑可跳转任意历史节点
- 中 / EN 界面切换
- 深空背景与氛围音乐
- 真图不足时自动回退本地 Demo 球云

## 技术栈

- Vite · React 19 · TypeScript
- Three.js · React Three Fiber · Drei
- GSAP · Zustand · Tailwind CSS v4

## 开始使用

```bash
pnpm install
pnpm dev
```

```bash
pnpm build    # 生产构建
pnpm preview  # 预览构建产物
```

## 链接

- 仓库：https://github.com/maggiecycy/Cosmos-Search
- 演示：https://maggiecycy.github.io/Cosmos-Search/

## 数据说明

图像优先来自 Wikipedia / Wikimedia Commons（保留 attribution）。Demo 占位图仅用于离线或检索失败时的演示。
