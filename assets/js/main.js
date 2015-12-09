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
            var EVENT_MASTER_COMMAND = 'MASTER_COMMAND';
            // 同步OSD移动和缩放数据，在动画结束时触发
            viewer.addHandler('animation-finish', function(e) {
                socket.emit(EVENT_MASTER_COMMAND, {
                    command: 'viewport-change',
                    center: viewport.getCenter(),
                    zoom: viewport.getZoom()
                });
            });

            // 同步OSD切换页面数据，在打开成功时触发
            viewer.addHandler('open', function(e) {
                socket.emit(EVENT_MASTER_COMMAND, {
                    command: 'page-change',
                    page: viewer.currentPage()
                });
                // HACK: OpenSeadragon的缩略图有一个textarea元素，在手机端点击总会弹出屏幕键盘，因此需要把它禁用掉
                $('.openseadragon-container textarea').attr('disabled', 'disabled');
            });

            viewer.addHandler('canvas-click', function(e) {
                // e.quick表明了是否为点击，OSD中拖动也会触发canvas-click事件，只是e.quick为false
                if (!e.quick) {
                    return;
                }
                var viewportPos = viewport.windowToViewportCoordinates(e.position);
                var $pin = createPin();
                createPinOverlay($pin[0], viewportPos);
                socket.emit(EVENT_MASTER_COMMAND, {
                    command: 'pin',
                    position: viewportPos
                });
            });
        }

        function initSlaveProtocal(viewer, socket) {
            socket.on('FORWARD_MASTER_COMMAND', function(data) {
                executeCommand(data);
            });
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
                case 'pin':
                    var $pin = createPin();
                    createPinOverlay($pin[0], data.position);
                    break;
                default:
                    break;
            }
        }

        function createPin() {
            var $pin = $('<div class="pin-hint hatch"></div>').appendTo($('.main'));
            $pin.delay(2000).queue(function() {
                $(this).addClass('pulse');
            });
            return $pin;
        }

        function createPinOverlay(pin, pos) {
            viewer.addOverlay(pin, pos, OpenSeadragon.OverlayPlacement.TOP_LEFT);
        }
    });
})();
