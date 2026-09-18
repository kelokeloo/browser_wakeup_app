# Wakeup Demo

Windows / macOS 最小应用唤起示例：浏览器中的两个固定链接分别打开首页窗口、详情窗口。每次点击新建一个对应窗口；不传递 ID，不使用 preload、IPC 或页面路由。

## 运行

需要 Windows 或 macOS、Node.js 22.12+ 和 pnpm 11。在 `browser_wakeup_app` 目录安装依赖：

```sh
pnpm install
```

### Windows

在 Windows 上执行：

```sh
pnpm package:win
```

打开 `apps/desktop/out/Wakeup Demo-win32-x64/Wakeup Demo.exe`（使用 ARM64 Node.js 打包时目录为 `win32-arm64`），完成协议注册。保留整个打包目录，不能只复制其中的 `.exe`；移动目录后需要从新位置手动打开一次应用，更新协议关联。

### macOS

在 macOS 上执行：

```sh
pnpm package:mac
```

打开 `apps/desktop/out/Wakeup Demo-darwin-arm64/Wakeup Demo.app`（使用 x64 Node.js 打包时目录为 `darwin-x64`），完成协议注册。

### 浏览器唤起

两个平台都在项目根目录运行：

```sh
pnpm dev:web
```

访问 http://127.0.0.1:3000 ，点击两个链接，浏览器询问时允许打开应用。

`pnpm dev:desktop` 仅用于界面开发；本 demo 的协议注册只在打包应用中执行。修改桌面代码后，需要先退出旧应用，再重新打包并打开新包。本地包未做面向分发的签名、公证；国产化系统尚未适配。

## 代码结构

```text
apps/launcher-web/
  index.html          两个原生链接
  src/main.js         从共享包取链接地址
apps/desktop/
  src/main.js         接收链接、打开对应窗口
  src/home.html       首页窗口内容
  src/detail.html     详情窗口内容
  scripts/            构建、macOS 打包、Windows 打包
  packaging/macos/    macOS 协议声明
packages/deep-link/
  src/index.js        两个 URL 常量、页面映射、启动参数识别
```

两个应用只依赖共享协议包，互不依赖。原理文档分别展开 [macOS 的完整流程](docs/core-principles.md#macos-的完整流程)和 [Windows 的完整流程](docs/core-principles.md#windows-的完整流程)，各自说明应用未运行与已运行时如何接收链接，再通过[流程对照](docs/core-principles.md#两条流程的关键差异)解释差异。

## 验证

```sh
pnpm test           # 链接和 Windows 启动参数识别测试
pnpm build          # 构建网页和桌面应用
```

手动验证：

1. 手动打开打包应用，默认出现首页窗口，并建立协议关联。
2. 保持应用运行，在浏览器连续点击首页、详情链接，每次应新建对应窗口。
3. 完全退出应用（Windows 关闭全部窗口；macOS 可使用 Command+Q），再点击详情链接，应直接打开详情窗口。这一步验证冷启动，不能只最小化或隐藏窗口。
4. 应用运行时，打开带查询参数或未定义的协议链接，应忽略该链接，不新建窗口。

还可用系统命令验证协议关联。Windows 在 PowerShell 中执行：

```powershell
Start-Process 'wakeup-demo://app/home'
Start-Process 'wakeup-demo://app/detail'
```

macOS 在终端执行：

```sh
open 'wakeup-demo://app/home'
open 'wakeup-demo://app/detail'
```
