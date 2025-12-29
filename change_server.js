(function () {
    'use strict';

    function LampaRedirect() {
        var servers = [
            { name: 'Lapma (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws' }
        ];

        var selectedServer = null;

        // Функція перевірки доступності через fetch
        async function checkStatus(url) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                await fetch(url, { mode: 'no-cors', signal: controller.signal });
                return '<span style="color: #2ecc71">● Online</span>';
            } catch (e) {
                return '<span style="color: #e74c3c">● Offline</span>';
            }
        }

        this.create = async function () {
            var _this = this;
            var html = $('<div class="settings-list"></div>');
            
            // Поточний сервер
            var currentHost = window.location.hostname;
            var currentName = "Невідомий";
            servers.forEach(s => { if(s.url.includes(currentHost)) currentName = s.name; });

            var currentStatus = await checkStatus(window.location.origin);
            
            html.append('<div class="settings-list__caption" style="pointer-events: none;">Поточний сервер:</div>');
            html.append('<div class="settings-list__item no-select" style="color: #f1c40f">' + currentName + ' - ' + currentStatus + '</div>');

            // Список серверів
            html.append('<div class="settings-list__caption" style="pointer-events: none;">Список серверів:</div>');

            for (let server of servers) {
                let status = await checkStatus(server.url);
                let isOffline = status.includes('Offline');
                
                let item = $('<div class="settings-list__item selector' + (isOffline ? ' scroll-no-select' : '') + '">' + server.name + ' - ' + status + '</div>');
                
                if (!isOffline) {
                    item.on('hover:enter', function () {
                        selectedServer = server;
                        _this.updateInfo('Вибрано: ' + server.name + '. Натисніть "Змінити сервер" для переходу.');
                    });
                } else {
                    item.css('opacity', '0.5');
                }
                html.append(item);
            }

            // Інфо та кнопка
            this.info = $('<div class="settings-list__caption" style="margin-top: 20px;">Будь ласка, виберіть сервер зі списку</div>');
            html.append(this.info);

            var btn = $('<div class="settings-list__item selector" style="background: #3498db; text-align: center; font-weight: bold;">Змінити сервер</div>');
            btn.on('hover:enter', function () {
                if (selectedServer) {
                    window.location.href = selectedServer.url;
                } else {
                    _this.updateInfo('<span style="color: #e74c3c">Помилка: Спочатку виберіть доступний сервер!</span>');
                }
            });
            html.append(btn);

            this.updateInfo = function(text) {
                this.info.html(text);
            };

            return html;
        };
    }

    // Реєстрація в меню
    function startPlugin() {
        if (window.app_ready) {
            var plugin = new LampaRedirect();
            
            // Додаємо в налаштування
            Lampa.Settings.add({
                title: 'Зміна сервера',
                type: 'open',
                name: 'server_redirect',
                icon: '<svg height="36" viewBox="0 0 24 24" width="36"><path d="M0 0h24v24H0V0z" fill="none"/><path fill="currentColor" d="M19 15v4H5v-4h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 18.5c-.82 0-1.5-.67-1.5-1.5s.68-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM19 5v4H5V5h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 8.5c-.82 0-1.5-.67-1.5-1.5S6.18 5.5 7 5.5s1.5.68 1.5 1.5S7.82 8.5 7 8.5z"/></svg>',
                onRender: function (body) {
                    plugin.create().then(html => {
                        $(body).empty().append(html);
                    });
                }
            });

            // Додаємо в ліве меню
            Lampa.Component.add('server_redirect_menu', {
                title: 'Зміна сервера',
                onRender: function() {
                    plugin.create().then(html => {
                        Lampa.Select.show({
                            title: 'Вибір сервера',
                            items: [{title: 'Закрити'}],
                            onRender: (body) => { $(body).empty().append(html); },
                            onSelect: () => { Lampa.Select.close(); }
                        });
                    });
                }
            });

            // Додаємо кнопку в шапку (якщо є місце)
            var headIcon = $('<div class="head__action selector"><svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M17 16l-4-4V8h8v8h-4zM7 8V4h10v4H7z"/></svg></div>');
            headIcon.on('hover:enter', function(){
                Lampa.Settings.main('server_redirect');
            });
            $('.head .head__actions').prepend(headIcon);
        } else {
            setTimeout(startPlugin, 100);
        }
    }

    startPlugin();
})();
