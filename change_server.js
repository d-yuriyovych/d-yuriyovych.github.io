(function () {
    'use strict';

    function ServerRedirect() {
        var network = new Lampa.Reguest();
        var selectedServer = null;
        var servers = [
            { name: 'Lapma (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws' }
        ];

        // Функція перевірки доступності
        function checkStatus(url, callback) {
            var start = Date.now();
            fetch(url, { mode: 'no-cors', cache: 'no-cache' })
                .then(function() {
                    callback('online');
                })
                .catch(function() {
                    callback('offline');
                });
        }

        this.create = function () {
            var _this = this;
            this.prepare();
        };

        this.prepare = function () {
            var _this = this;
            
            // Створюємо інтерфейс
            this.render = function () {
                var html = $('<div class="settings-list"></div>');
                var currentUrl = Lampa.Storage.get('server_url', 'http://lampa.mx');
                var currentName = "Невідомий";
                
                servers.forEach(function(s) {
                    if (currentUrl.indexOf(s.url.replace('http://','').replace('https://','')) > -1) currentName = s.name;
                });

                // Шапка списку
                html.append('<div class="settings-list__caption" style="pointer-events: none;">Поточний сервер: <span style="color: #ffde1a;">' + currentName + '</span> <span id="current-status">- ...</span></div>');
                
                checkStatus(currentUrl, function(status) {
                    $('#current-status').text('- ' + (status === 'online' ? '●' : '○')).css('color', status === 'online' ? '#27ae60' : '#e74c3c');
                });

                html.append('<div class="settings-list__caption" style="pointer-events: none;">Список серверів:</div>');

                // Рендер списку серверів
                servers.forEach(function (server) {
                    var item = $('<div class="settings-list__item selector" data-url="' + server.url + '">\
                        <div class="settings-list__name">' + server.name + ' <span class="server-status" data-url="' + server.url + '">- ...</span></div>\
                    </div>');

                    item.on('hover:enter', function () {
                        selectedServer = server;
                        $('.redirect-info').text('Вибрано: ' + server.name + '. Натисніть кнопку нижче для переходу.');
                        $('.btn-redirect').css('opacity', '1');
                    });

                    html.append(item);

                    // Перевірка статусу кожного сервера
                    checkStatus(server.url, function(status) {
                        var statusEl = item.find('.server-status');
                        statusEl.text('- ' + (status === 'online' ? '●' : '○')).css('color', status === 'online' ? '#27ae60' : '#e74c3c');
                        if (status === 'offline') {
                            item.removeClass('selector').css('opacity', '0.5');
                        }
                    });
                });

                html.append('<div class="settings-list__caption redirect-info" style="pointer-events: none; color: #ccc;">Оберіть сервер зі списку</div>');

                var btn = $('<div class="settings-list__item selector btn-redirect" style="background: #3498db; color: #fff; text-align: center; margin-top: 10px; opacity: 0.5;">\
                    <div class="settings-list__name" style="width: 100%;">Змінити сервер та перезавантажити</div>\
                </div>');

                btn.on('hover:enter', function () {
                    if (!selectedServer) {
                        Lampa.Noty.show('Помилка: треба спочатку вибрати сервер!');
                    } else {
                        Lampa.Storage.set('server_url', selectedServer.url);
                        Lampa.Noty.show('Сервер змінено на ' + selectedServer.name + '. Перезавантаження...');
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    }
                });

                html.append(btn);

                return html;
            };

            // Додавання в меню налаштувань
            Lampa.Settings.add({
                title: 'Зміна сервера',
                type: 'book',
                icon: '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 15v4H5v-4h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 18.5c-.82 0-1.5-.67-1.5-1.5s.68-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 5v4H5V5h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 8.5c-.82 0-1.5-.67-1.5-1.5S6.18 5.5 7 5.5s1.5.67 1.5 1.5S7.82 8.5 7 8.5z"/></svg>',
                name: 'server_redirect',
                component: 'server_redirect'
            });

            Lampa.Component.add('server_redirect', this.render);
        };

        // Додавання в ліве меню та шапку
        function addToMenu() {
            var menu_item = $('<li class="menu__item selector" data-action="server_redirect">\
                <div class="menu__ico"><svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 15v4H5v-4h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM19 5v4H5V5h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1z"/></svg></div>\
                <div class="menu__text">Зміна сервера</div>\
            </li>');

            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'Зміна сервера',
                    component: 'server_redirect',
                    page: 1
                });
            });
            $('.menu .menu__list').append(menu_item);

            // Кнопка в шапці
            var head_item = $('<div class="head__action selector" data-action="server_redirect">\
                <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="#fff"><path d="M19 15v4H5v-4h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM19 5v4H5V5h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1z"/></svg>\
            </div>');

            head_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'Зміна сервера',
                    component: 'server_redirect',
                    page: 1
                });
            });
            $('.head .head__actions').prepend(head_item);
        }

        if (window.appready) addToMenu();
        else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') addToMenu(); });
    }

    if (!window.server_redirect_plugin) {
        window.server_redirect_plugin = true;
        new ServerRedirect().create();
    }
})();

