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

        // Перевірка статусу (fetch)
        async function checkStatus(url) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                await fetch(url, { mode: 'no-cors', signal: controller.signal });
                return '<span style="color: #2ecc71">● Online</span>';
            } catch (e) {
                return '<span style="color: #e74c3c">● Offline</span>';
            }
        }

        this.start = function () {
            var _this = this;
            
            // 1. Додаємо в Налаштування
            Lampa.Settings.add({
                title: 'Зміна сервера',
                type: 'open',
                name: 'server_redirect',
                icon: '<svg height="36" viewBox="0 0 24 24" width="36" fill="currentColor"><path d="M19 15v4H5v-4h14m1-2H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 8.5c-.82 0-1.5-.67-1.5-1.5S6.18 5.5 7 5.5s1.5.68 1.5 1.5S7.82 8.5 7 8.5z"/></svg>',
                onRender: function (body) {
                    _this.renderInterface(body);
                }
            });

            // 2. Додаємо в ліве меню (Sidebar)
            Lampa.Menu.add({
                id: 'server_redirect',
                title: 'Зміна сервера',
                icon: '<svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M17 16l-4-4V8h8v8h-4zM7 8V4h10v4H7z"/></svg>',
                onSelect: function() {
                    Lampa.Settings.main('server_redirect');
                }
            });

            // 3. Додаємо іконку в шапку (Top bar)
            var headIcon = $('<div class="head__action selector"><svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>');
            headIcon.on('hover:enter click', function(){
                Lampa.Settings.main('server_redirect');
            });
            $('.head .head__actions').prepend(headIcon);
        };

        this.renderInterface = async function (body) {
            var _this = this;
            var container = $('<div class="settings-list"></div>');
            
            // Відображення поточного сервера
            var currentHost = window.location.hostname;
            var currentName = "Lampa App";
            servers.forEach(s => { if(s.url.includes(currentHost)) currentName = s.name; });

            container.append('<div class="settings-list__caption">Поточний сервер:</div>');
            var currentItem = $('<div class="settings-list__item" style="color: #f1c40f; pointer-events: none;">' + currentName + ' - <span id="cur-status">Завантаження...</span></div>');
            container.append(currentItem);
            
            checkStatus(window.location.origin).then(res => $('#cur-status').html(res));

            // Список серверів
            container.append('<div class="settings-list__caption">Список серверів:</div>');

            for (let server of servers) {
                let status = await checkStatus(server.url);
                let isOffline = status.includes('Offline');
                
                let item = $('<div class="settings-list__item selector focusable">' + server.name + ' - ' + status + '</div>');
                
                if (isOffline) {
                    item.css('opacity', '0.4').removeClass('selector focusable');
                } else {
                    item.on('hover:focus', function () {
                        selectedServer = server;
                        _this.updateInfo('Вибрано: ' + server.name + '. Натисніть кнопку нижче.');
                    });
                }
                container.append(item);
            }

            // Інфо та кнопка
            this.info = $('<div class="settings-list__caption" style="margin-top: 15px; color: #fff;">Оберіть сервер зі списку вище</div>');
            container.append(this.info);

            var btn = $('<div class="settings-list__item selector focusable" style="background: #3498db !important; text-align: center; margin-top: 10px;">Змінити сервер</div>');
            
            btn.on('hover:enter click', function () {
                if (selectedServer) {
                    Lampa.Noty.show('Перехід на ' + selectedServer.name);
                    setTimeout(() => { window.location.href = selectedServer.url; }, 500);
                } else {
                    _this.updateInfo('<span style="color: #e74c3c">Потрібно вибрати доступний сервер!</span>');
                }
            });

            container.append(btn);
            $(body).empty().append(container);

            this.updateInfo = function(text) {
                this.info.html(text);
            };
            
            // Оновлюємо навігацію для TV
            Lampa.Controller.add('server_redirect_ui', {
                toggle: function () {
                    Lampa.Controller.collectionSet(container);
                    Lampa.Controller.focus(container.find('.selector').eq(0));
                },
                back: function () {
                    Lampa.Settings.main();
                }
            });
            Lampa.Controller.toggle('server_redirect_ui');
        };
    }

    if (window.app_ready) {
        new LampaRedirect().start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') new LampaRedirect().start();
        });
    }
})();
