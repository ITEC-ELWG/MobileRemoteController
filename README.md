# MobileRemoteController

这是一个简单的用手机浏览器遥控PC浏览器页面图片显示的小Demo（目前还没有上升到控件的层次）。

## Usage

```
git clone https://github.com/ITEC-ELWG/MobileRemoteController
cd MobileRemoteController
npm install
```

1. 然后用`node app`启动服务器，默认端口号为3000。
2. 查看测试服务器的IP地址（用cmd输入`ipconfig`查看），假设你电脑的IP地址是`192.168.95.1`，修改`assets/js/main.js`的第9行`SOCKET_URL`变量的IP地址。
3. 从端在PC浏览器上输入`http://localhost:3000`访问。
4. 主控端**确保连上的WIFI的IP与服务器在同一个网段**，打开手机浏览器（推荐Chrome），输入`http://192.168.95.1:3000#master`访问。实际地址视具体IP地址而定。如果部署到线上并绑定了域名，就可以省略查IP这一步。
5. 手机上可以拖拽、缩放图片，切换显示的图片，点图片的位置可以生成一个红色的标记。

## How it works

**概念：被控制端（通常为PC浏览器）称为从端（slave），遥控器（通常为手机浏览器）称为主控端（master）**

MobileRemoteController在前端使用OpenSeadragon（以下简称OSD）来做图片显示控件，后端使用Node.js和Express框架搭建HTTP服务器，使用Socket.IO库来传输控制数据。

主从端共用一个页面，JS通过URL hash`#master`来区分是主还是从。从端的功能只有显示，因此会自动隐藏掉OSD的ReferenceStrip。主端通过监听OSD的内置事件来判别发送控制数据的时机，调用OSD的API来获取相关数据，并向socket服务器emit `MASTER_COMMAND`事件。其中，`viewer`变量引用的是[`OpenSeadragon.Viewer`](https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html)，`viewport`引用的是[`OpenSeadragon.Viewport`](https://openseadragon.github.io/docs/OpenSeadragon.Viewport.html)

监听OSD事件说明：

* [open](https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#event:open)：加载图片完成（包括切换图片）时触发
```
{
    command: `page-change`,
    page: viewer.currentPage()  // 当前所处的页码
}
```
* [animation-finish](https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#event:animation-finish)：拖拽、缩放图片完成时触发（OSD默认的拖拽和缩放都会有缓动动画，这是动画完成事件）
```
{
    command: 'viewport-change',
    center: viewport.getCenter(),
    zoom: viewport.getZoom()
}
```
* [canvas-click](https://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#event:canvas-click)：点击屏幕时触发，表示要打一个标记
```
{
    command: 'pin',
    position: viewport.windowToViewportCoordinates(e.position);
}
```

从端连接到Node.js服务器后，服务器会记录下从端的socket id。服务器接受到主控端的控制数据后，向socket id推送`FORWARD_MASTER_COMMAND`事件，数据原样转发。从端收到`FORWARD_MASTER_COMMAND`事件后，解析具体的指令并调用OSD的API来还原操作，实现遥控。

# Licence

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
