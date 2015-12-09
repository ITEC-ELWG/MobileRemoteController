(function() {
    $(document).ready(function() {
        var isMaster = window.location.hash === '#master';
        var imageUrls = [
            '/assets/images/test1.jpg',
            '/assets/images/test2.jpg',
            '/assets/images/test3.jpg'
        ];
        var SOCKET_URL = 'http://192.168.95.1:3000';

        var viewer = initOpenSeadragon(imageUrls, isMaster);
        var viewport = viewer.viewport;

        var socket = initSocket(SOCKET_URL, isMaster);

        if (isMaster) {
            initMasterProtocal(viewer, socket);
        } else {
            initSlaveProtocal(viewer, socket);
        }

        socket.on('MID_MASTER_COMMAND', function(data) {
            console.log(data);
            executeCommand(data);
        });

        function initOpenSeadragon(imageUrls, isMaster) {
            var tileSources = $.map(imageUrls, function(url, i) {
                return {
                    type: 'image',
                    url: url
                };
            });
            var viewer = OpenSeadragon({
                id: 'openseadragon',
                // prefixUrl: '/assets/images/',
                tileSources: tileSources,
                zoomPerClick: 1.0,
                showNavigationControl: false,
                showSequenceControl: false,
                sequenceMode: true,
                showReferenceStrip: isMaster,

                visibilityRatio: 0.8,
                blendTime: 0.5,
                animationTime: 0.6,
                // 最大缩放比例，大于1可失真放大
                maxZoomPixelRatio: 1.3,
            });

            return viewer;
        }

        function initSocket(url, isMaster) {
            var socket = io.connect(url);
            socket.on('connect', function() {
                console.info('Connect to', url, 'succeed! Socket ID:', socket.id,
                    isMaster ? '[Master]' : '[Slave]');
                if (!isMaster) {
                    socket.emit('SLAVE_AUTH', {
                        key: 123
                    });
                }
            });
            return socket;
        }

        function initMasterProtocal(viewer, socket) {
            // 同步OSD移动和缩放数据，在动画结束时触发
            viewer.addHandler('animation-finish', function(e) {
                socket.emit('MASTER_COMMAND', {
                    command: 'viewport-change',
                    center: viewport.getCenter(),
                    zoom: viewport.getZoom()
                });
            });

            // 同步OSD切换页面数据，在打开成功时触发
            viewer.addHandler('open', function(e) {
                socket.emit('MASTER_COMMAND', {
                    command: 'page-change',
                    page: viewer.currentPage()
                });

                // HACK: OpenSeadragon的缩略图有一个textarea元素，在手机端点击总会弹出屏幕键盘，因此需要把它禁用掉
                $('.openseadragon-container textarea').attr('disabled', 'disabled');
            });

            viewer.addHandler('canvas-click', function(e) {
                console.log(e.position);
            });
        }

        function initSlaveProtocal(viewer, socket) {
            socket.on('FORWARD_MASTER_COMMAND', function(data) {
                executeCommand(data);
            });
            // console.log(e, viewer.viewport.getCenter());
        }

        function executeCommand(data) {
            console.log('Execute command:', data);
            switch (data.command) {
                case 'viewport-change':
                    viewport.panTo(data.center);
                    viewport.zoomTo(data.zoom);
                    break;
                case 'page-change':
                    viewer.goToPage(data.page);
                    break;
                default:
                    break;
            }
        }
    });
})();
