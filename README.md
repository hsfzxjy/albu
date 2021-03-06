# albu

中文 | [English](README-en.md)

基于腾讯对象储存服务（COS）和云函数（Serverless）搭建的半静态移动端相册。

[示例](demo/README.md)

## 特性

 + **几乎免费**。**albu** 使用腾讯 COS 作为照片和网页的静态服务器 以及 Serverless 作为认证后端，只需为流量和储存付费，和传统 VPS 建站相比节省了许多开销。
 + **手账风格的时间线**。所有的照片按时间顺序陈列。同时，可以在照片前后添加文字作为「插话」或「里程碑」，作为特定事件或纪念日的提醒。
 + **权限控制**。可选择将照片、插话 或 里程碑公开或设为私密。公开的内容可以被所有人查看，私密内容则仅在登录（完成手势验证）后可见。
 + **自定义分享**。除了在首页展示所有公开内容，用户可以选择生成自定义的分享链接，以展示特定时间段中的内容。
 + **网站已高度优化**。包括但不限于：
   + 提前压缩所有照片，以节约照片加载所需的流量；
   + 仅渲染可见的元素，以减少网页的内存占用；
   + 根据字频切分汉字字体，以缩短自定义字体的加载时间。
 + **支持微信分享**。通过配置，**albu** 可以支持在分享至微信好友/朋友圈时展示自定义标题与缩略图。

## 总览

和其他静态网站生成器类似，**albu** 先在本地完成如图片压缩、网页编译等的一系列重活，再将生成好的静态文件部署至云服务上。

`tools/` 目录包含了一些脚本，用于简化诸如选图、压图、字体切分、上传资源等工作。

`web/` 目录包含了网页前端的源码。**albu** 采用 Vue.js 作为前端框架。

`auth/` 目录包含了认证后端的源码，此后端将在腾讯 Serverless 上运行。该服务用于验证用户所画的手势图案，并为认证通过者返回一个 token。此 token 将用于访问 COS 上的私密内容。此外，认证后端还为微信分享提供签名服务。

`assets/source/` 为相册原始照片所在的目录。

`assets/_generated/` 目录包含了所有生成的静态资源，将被上传至腾讯 COS。**不推荐** 手动编辑此目录下的任何文件。

## 快速上手

此处假设你已注册了腾讯云，并开通了 COS 和 Serverless 服务。

### 配置

在项目根目录下，将 `config.example.json` 拷贝为 `config.json`，并根据以下指示填写：

 + `tcloud` 一节应填写你腾讯云账户的信息。
 + `cos` 一节应填写你所建的 COS Bucket 的信息。
 + `secret` 为 **albu** 加密所用的秘钥。此处可以填任意随机字符串。
 + `passwords` 为自定义的手势密码。此列表中应为 `0 ~ 8` 的字符串，用于表示手势图案的路径。九宫格中每个圆圈所对应的数字如下：
   ```
   0 1 2
   3 4 5
   6 7 8
   ```
   如 `"0124678"` 为一个大的「Z」字形。
 + `web` 一节包含了网页的一些元信息：
   + `web.authURL` 为认证后端部署后的 URL。此域应在后续填写。
   + `web.title` 为网页的标题。
 + `wx` 一节（可选） 包含了微信开发者账号的信息。此节将用于微信分享功能。

填写完毕后，运行 `python3 setup.py` 将配置文件分发至各个子项目的目录中。

### 安装依赖

**albu** 要求用户装有 `Node.js >= 10` 及 `Python >= 3.6`。

运行以下命令以安装全局依赖：

```bash
[sudo] python3 -m pip install -r requirements.txt
[sudo] npm install -g serverless
```

### 准备 & 部署照片

原始图片需储存在 `assets/source/` 下。你可以选择将照片拷贝至此，也可以选择在其中创建符号链接。

**albu** 提供了一个简易的照片选择器，以方便用户从一堆照片中选取一部分部署至相册中。运行 `tools/selector.py --src <glob>` 以打开选择器，其中 `<glob>` 是一个如 `Photos/*.jpg` 的 glob 表达式。在窗口中，可以按 <kbd>A</kbd>/<kbd>D</kbd> 向前 / 向后翻页，按 <kbd>Space</kbd>/<kbd>X</kbd> 以选中 / 取消选中 一张照片。

准备好原始照片后，需执行 `tools/proc.py` 预处理照片。该脚本会对照片进行压缩，并生成相关的元数据。生成的静态文件被储存在 `assets/_generated/` 下。

做完这些后，执行 `tools/sync.py` 以同步本地和远端的资源。

如果未来某些照片被删除，或是有新的照片加入，只需重复以上预处理和同步的步骤即可完成部署。**albu** 只会在本地和云端之间传输必要的更改。

### 部署认证后端

运行以下命令以完成部署：

```bash
cd auth/
serverless deploy
```

部署完成后，控制台会打印一条形如 `https://service-xxxxxxxx-1254463987.gz.apigw.tencentcs.com/release/` 的 URL，此即为认证后端的 URL。请将其填写至 `config.json` 的 `web.authURL` 字段。

### 部署网页

运行以下命令以完成部署：

```bash
cd web/
npm install
npm run deploy
```

如果你想自定义 插话 和 里程碑 的中文字体，只需字体放至 `web/src/fonts/` 下并命名为 `custom.ttf`。运行 `tools/makefont.py` 以切分字体并生成对应的 SCSS 文件。

如果你想自定义 favico 图标或是微信分享的缩略图，覆盖 `web/public/` 下的 `favico.png` 和 `wx_cover.png` 两个文件即可。