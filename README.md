# COSMOS — 星索

深空背景里的球形知识爆炸浏览器：搜索关键词 → 相关图片从中心炸成球 → 拖拽旋转 → 点击看简介 → 以该事物为中心再次炸开。

灵感来自 [neal.fun/wiki-spy](https://neal.fun/wiki-spy/) 的气质，但交互升级为 3D Fibonacci sphere「宇宙大爆炸」。**非 Wikimedia / Neal 官方**，个人学习与创意探索项目。

## 快速开始

```bash
pnpm install
pnpm dev
```

浏览器打开终端提示的本地地址。离线也可完整体验：数据会回退到 `public/demo/`。

## 在线地址

- 仓库：[github.com/maggiecycy/Cosmos-Search](https://github.com/maggiecycy/Cosmos-Search)
- GitHub Pages：`https://maggiecycy.github.io/Cosmos-Search/`（push `main` 后由 Actions 自动部署）
- 也可把仓库导入 [Vercel](https://vercel.com/new) 一键部署（已含 `vercel.json` 代理重写）

## 体验路径

1. 首屏输入 `bottle` / `猫` / `earth`
2. 图片从中心炸开成可旋转的球（拖拽旋转、滚轮缩放）
3. 点击图片查看详情与许可证
4. 点「以此为中心探索」或双击图片，二次爆炸
5. 用顶部「← 返回上一中心」回退；URL `/?q=` 可分享首次搜索

## 技术栈

- Vite + React 19 + TypeScript
- Three.js + React Three Fiber + Drei
- GSAP（爆炸 / 坍缩）
- Zustand（中心词、选中、历史栈）
- Tailwind CSS v4（HUD / 详情卡）

## 数据与版权

- **优先**：Wikipedia MediaWiki `generator=search` + `pageimages`（一批拿齐缩略图与简介）
- **默认直连** Wikimedia（官方 CORS）。开发环境**不要**默认开 proxy——本地 `/api/img` 易超时，会把真图全打成色球占位
- Wikipedia `pageimages` + 分批 `extracts`（解决「有图无简介」）
- 并用 Commons 搜图补密度（太空球云更「满」）
- **可选 proxy**：仅当 `VITE_USE_PROXY=true`（配合 `vercel.json`）
- 语言路由：英文 → `en`；假名 → `ja`；汉字 → 依次试 `zh` / `ja` / `en`
- 真图不足 6 张或请求失败时，回退 `public/demo/`（右上角会标 **Demo**，并弹出说明）——**不是**「相似词推荐」

## 背景音乐

右上角 **Music** 开关会循环播放 `public/audio/ambient.mp3`。

**不要**把受版权保护的原声带（如 Hans Zimmer *Interstellar*）提交进仓库。请用你合法取得的本地文件，或免版税 ambience；说明见 `public/audio/README.md`。

## 中英切换

右上角 **EN / 中文** 切换 HUD 文案；选择会写入 `localStorage`。

## 项目结构

```
src/
  components/          # HUD + DetailCard + AmbientAudio
  components/canvas/   # R3F 场景、球体、星空
  i18n/                # zh/en 文案
  lib/                 # 布局数学、Wiki/Demo 数据层
  store/               # Zustand 状态
public/demo/           # 离线演示目录与 SVG
public/audio/          # 自备 ambient.mp3（可选）
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |

## 阶段进度

- [x] Phase 0 — 骨架：星空 + 居中搜索
- [x] Phase 1 — 假数据球形爆炸 + OrbitControls
- [x] Phase 2 — 点击详情 + attribution
- [x] Phase 3 — Wikipedia / Commons 真图 + `?q=`
- [x] Phase 4 — 二次爆炸 + 历史栈 + 相机过渡
- [x] Phase 4.5 — 太空氛围 / 水波纹 / 加载仪式（打磨中）
- [ ] Phase 5 — 移动端手感 / FPS 降级 / 部署上线
- [ ] Phase 6（可选）— 透明抠图 cutout、bloom 后期

### 当前主线（建议）

1. **手感验收**：真图比例、跃迁丝滑度、波纹观感
2. **Phase 5**：手机双指、性能开关、Vercel 部署
3. 有余力再上 bloom / 抠图

## 许可说明

代码以仓库内声明为准。Demo 占位图为项目生成的抽象图形，不替代真实 Wikimedia 资源的许可证义务；接入真图时请保留并展示对应 attribution。
