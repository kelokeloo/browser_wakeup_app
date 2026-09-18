# Wakeup Demo

Windows / macOS / Linux 最小应用唤起示例：浏览器中的两个固定链接分别打开首页窗口、详情窗口。每次点击新建一个对应窗口；不传递 ID，不使用 preload、IPC 或页面路由。

## 运行

需要 Windows、macOS 或 Linux（已在银河麒麟 V10 SP1 上验证）、Node.js 22.12+ 和 pnpm 11。在 `browser_wakeup_app` 目录安装依赖：

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

### Linux（麒麟、统信 UOS 等）

在 Linux 上执行：

```sh
pnpm package:linux
```

产物是 `apps/desktop/out/wakeup-demo_0.1.0_amd64.deb`，用 `sudo dpkg -i` 安装。协议关联由包内的 `.desktop` 文件建立，安装后**立即生效，不需要注销或重启**。卸载用 `sudo dpkg -r wakeup-demo`。

Linux 的协议关联不依赖注册表或系统数据库里的"默认程序"设置，而是由 `.desktop` 文件里的 `MimeType=x-scheme-handler/wakeup-demo;` 声明、由 `Exec` 行指明启动命令。详见[原理文档](docs/core-principles.md#linux-的完整流程)。

国产化系统（麒麟、UOS）在技术上就是 Linux，这套写法通用；差别只在桌面环境、预装浏览器与包格式，不影响唤起机制。

### 浏览器唤起

三个平台都在项目根目录运行：

```sh
pnpm dev:web
```

访问 http://127.0.0.1:3000 ，点击两个链接，浏览器询问时允许打开应用。

`pnpm dev:desktop` 仅用于界面开发；本 demo 的协议注册只在打包应用中执行。三平台都是如此：Linux 上开发模式没有安装 `.desktop` 文件，macOS 上没有 `Info.plist` 声明，Windows 上没有注册表项，因此都必须用打包后的产物验证。修改桌面代码后，需要先退出旧应用，再重新打包并打开新包。本地包未做面向分发的签名、公证。

## 代码结构

```text
apps/launcher-web/
  index.html          两个原生链接
  src/main.js         从共享包取链接地址
apps/desktop/
  src/main.js         接收链接、打开对应窗口
  src/home.html       首页窗口内容
  src/detail.html     详情窗口内容
  scripts/            构建、macOS / Windows / Linux 打包
  packaging/macos/    macOS 协议声明
  packaging/linux/    Linux 包信息与协议名
packages/deep-link/
  src/index.js        两个 URL 常量、页面映射、启动参数识别
```

两个应用只依赖共享协议包，互不依赖。原理文档先讲清[心智模型](docs/core-principles.md)：macOS 是「管家」模型，系统知道谁在运行，负责把链接投递给应用；Windows 和 Linux 是「命令」模型，系统只记住一条启动命令，每次点击都真的新起一个进程。再分别展开 [macOS](docs/core-principles.md#macos-的完整流程)、[Windows](docs/core-principles.md#windows-的完整流程)、[Linux](docs/core-principles.md#linux-的完整流程) 的完整流程，最后通过[流程对照](docs/core-principles.md#三条流程的关键差异)解释差异。

## 验证

```sh
pnpm test           # 链接和 Windows 启动参数识别测试
pnpm build          # 构建网页和桌面应用
```

手动验证：

1. 手动打开打包应用，默认出现首页窗口，并建立协议关联。
2. 保持应用运行，在浏览器连续点击首页、详情链接，每次应新建对应窗口。
3. 完全退出应用（Windows 关闭全部窗口；macOS 可使用 Command+Q；Linux 用 `pkill -x wakeup-demo`），再点击详情链接，应直接打开详情窗口。这一步验证冷启动，不能只最小化或隐藏窗口。
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

Linux 在终端执行：

```sh
xdg-mime query default x-scheme-handler/wakeup-demo   # 确认关联到了 wakeup-demo.desktop
xdg-open 'wakeup-demo://app/home'
xdg-open 'wakeup-demo://app/detail'
```

`xdg-open` 走的是与浏览器点击完全相同的路径，可直接用于验证。
