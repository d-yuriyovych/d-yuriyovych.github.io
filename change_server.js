(function () {
    'use strict';

    Lampa.Utils.putScript(['https://lampa.mx/plugins/redirect.js'], () => {});

    function RedirectPlugin() {
        var network = new Lampa.Reguest();
        var servers = [
            { title: 'Lampa.mx', url: 'https://lampa.mx' },
            { title: 'Bwa.one', url: 'https://bwa.one' },
            { title: 'Lampa.run', url: 'https://lampa.run' }
        ];
        
        var is_switching = false;

        // Перевірка доступності з захистом від кешу та таймаутом
        this.checkServer = function (url, callback) {
            var controller = new AbortController();
            var timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд на відповідь

            fetch(url + '/?v=' + Math.random(), { 
                method: 'HEAD', 
                mode: 'no-cors',
                signal: controller.signal 
            })
            .then(() => {
                clearTimeout(timeoutId);
                callback(true);
            })
            .catch(() => {
                clearTimeout(timeoutId);
                callback(false);
            });
        };

        this.apply = function () {
            var _this = this;

            // Додавання кнопки в шапку (незалежно від сервера)
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    _this.addHeaderButton();
                }
            });
        };

        this.addHeaderButton = function () {
            var header = $('.header');
            if (!header.find('.header__server-change').length) {
                var btn = $('<div class="header__item header__item--button header__server-change">' +
                    '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6a5.87 5.87 0 0 1-2.8-.7l-1.46 1.46A7.93 7.93 0 0 0 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46A7.93 7.93 0 0 0 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" fill="white"/></svg>' +
                    '</div>');

                btn.on('hover:enter', function () {
                    _this.showServerSelect();
                });

                header.find('.header__items').append(btn);
            }
        };

        this.showServerSelect = function () {
            var _this = this;
            Lampa.Select.show({
                title: 'Зміна сервера',
                items: servers,
                onSelect: function (item) {
                    is_switching = true; // Блокуємо авто-редирект
                    Lampa.Activity.push({
                        url: item.url,
                        title: 'Перехід на ' + item.title,
                        component: 'full_reboot'
                    });
                    window.location.href = item.url;
                },
                onBack: function () {
                    Lampa.Controller.toggle('header');
                }
            });
        };

        // Логіка перевірки поточного стану для запобігання зацикленню
        this.initAutoCheck = function() {
            var current_url = window.location.origin;
            
            // Якщо ми вже в процесі ручної зміни - нічого не робимо
            if (is_switching) return;

            this.checkServer(current_url, (available) => {
                if (!available) {
                    // Шукаємо перший доступний сервер, який НЕ є поточним
                    var next_server = servers.find(s => s.url !== current_url);
                    if (next_server) {
                        this.checkServer(next_server.url, (next_available) => {
                            if (next_available) {
                                window.location.href = next_server.url;
                            }
                        });
                    }
                }
            });
        };
    }

    if (!window.redirect_plugin_initialized) {
        var plugin = new RedirectPlugin();
        plugin.apply();
        // Запуск перевірки з невеликою затримкою, щоб VPN встиг з'єднатися
        setTimeout(() => plugin.initAutoCheck(), 3000);
        window.redirect_plugin_initialized = true;
    }
})();
