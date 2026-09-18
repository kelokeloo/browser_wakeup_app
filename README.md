# Wakeup Demo

macOS 最小应用唤起示例：浏览器中的两个固定链接分别打开首页窗口、详情窗口。每次点击新建一个对应窗口；不传递 ID，不使用 preload、IPC 或页面路由。

## 运行

需要 macOS、Node.js 22.12+ 和 pnpm 11。

```sh
pnpm install
pnpm package:mac
```

打开 `apps/desktop/out/Wakeup Demo-darwin-arm64/Wakeup Demo.app`（Intel Mac 对应 `darwin-x64`），完成协议注册，再运行：

```sh
pnpm dev:web
```

访问 http://127.0.0.1:3000 ，点击两个链接，浏览器询问时允许打开应用。

`pnpm dev:desktop` 仅用于界面开发；macOS 协议唤起使用打包后的 `.app`。修改桌面代码后需要重新打包，退出旧应用并打开新包。本地包未做面向分发的签名、公证；Windows 和国产化系统尚未适配。

## 代码结构

```text
apps/launcher-web/
  index.html          两个原生链接
  src/main.js         从共享包取链接地址
apps/desktop/
  src/main.js         接收链接、打开对应窗口
  src/home.html       首页窗口内容
  src/detail.html     详情窗口内容
  scripts/            构建与打包
  packaging/macos/    协议声明
packages/deep-link/
  src/index.js        两个 URL 常量和对应页面的映射
```

两个应用只依赖共享协议包，互不依赖。详见 [核心原理](docs/core-principles.md)。

## 验证与格式

```sh
pnpm test           # 链接识别测试
pnpm build          # 构建网页和桌面应用
pnpm format         # 格式化源文件
pnpm format:check   # 检查格式
```

手动验证：点击两个链接，分别出现首页窗口和详情窗口；Command+Q 退出应用后点击详情链接，应直接打开详情窗口。带查询参数或未定义的链接会被忽略。
