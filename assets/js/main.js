(function() {
    $(document).ready(function() {
        var isMasterMode = window.location.hash === '#master';
        var imageUrls = [
            '/assets/images/test1.jpg',
            '/assets/images/test2.jpg',
            '/assets/images/test3.jpg'
        ];
        var viewer = initOpenSeadragon(imageUrls, isMasterMode);

        var socket = io.connect('http://localhost:3000');
        socket.on('connect', function() {
            socket.emit('SLAVE_AUTH', {
                key: 123
            });
        });

        socket.on('MID_MASTER_COMMAND', function(data) {
            console.log(data);
            executeCommand(data);
        });


        function initOpenSeadragon(imageUrls, isMasterMode) {
            var tileSources = $.map(imageUrls, function(url, i) {
                return {
                    type: 'image',
                    url: url
                };
            });
            return OpenSeadragon({
                id: 'openseadragon',
                // prefixUrl: '/assets/images/',
                tileSources: tileSources,
                zoomPerClick: 1.0,
                showNavigationControl: false,
                showSequenceControl: false,
                sequenceMode: true,
                showReferenceStrip: isMasterMode,

                visibilityRatio: 0.4,
                blendTime: 0.5,
                // 最大缩放比例，大于1可失真放大
                maxZoomPixelRatio: 1.3,
            });
        }

        function executeCommand(data) {
            switch (data.command) {
                case 'prev':
                    $('.left.carousel-control').click();
                    break;
                case 'next':
                    $('.right.carousel-control').click();
                    break;
                default:
                    break;
            }
        }
    });
})();
