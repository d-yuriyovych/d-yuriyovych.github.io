(function () {
    'use strict';

    const servers = [
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    const icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13V11C21 7.13401 17.866 4 14 4H10C6.13401 4 3 7.13401 3 11V13C3 16.866 6.13401 20 10 20H14C17.866 20 21 16.866 21 13Z" stroke="currentColor" stroke-width="2"/><path d="M8 12H16M16 12L13 9M16 12L13 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function checkStatus(url) {
        // Визначаємо протокол. Koyeb потребує https.
        let protocol = url.indexOf('koyeb.app') > -1 ? 'https://' : (window.location.protocol === 'https:' ? 'https://' : 'http://');
        let fullUrl = url.startsWith('http') ? url : protocol + url;
        
        return fetch(fullUrl, { method: 'HEAD', mode: 'no-cors', timeout: 3000 })
            .then(() => '<span style="color: #4cfb4c">● Online</span>')
            .catch(() => '<span style="color: #ff4c4c">● Offline</span>');
    }

    function getCleanHost(url) {
        return url.replace(/^https?:\/\//, '').split('/')[0];
    }

    function createServerComponent() {
        Lampa.Component.add('server_redirect', function (object) {
            let network = new Lampa.Reguest();
            let scroll = new Lampa.Scroll({ mask: true, over: true });
            let items = [];
            let activeServer = null;
            let html = $('<div></div>');
            let body = $('<div class="category-full"></div>');

            this.create = function () {
                this.build();
            };

            this.build = async function () {
                // Поточний сервер
                let currentHost = window.location.hostname;
                let currentName = servers.find(s => getCleanHost(s.url) === currentHost)?.name || "Unknown";
                let currentStatus = await checkStatus(currentHost);

                // Заголовок Поточний
                let headNow = $('<div class="search-item selector static" style="font-weight: bold; margin-bottom: 10px;">Поточний сервер:</div>');
                let infoNow = $('<div class="search-item selector static" style="color: #ffd700; margin-bottom: 20px;">' + currentName + ' - ' + currentStatus + '</div>');
                
                body.append(headNow);
                body.append(infoNow);

                // Заголовок Список
                body.append('<div class="search-item selector static" style="font-weight: bold; margin-top: 20px;">Список серверів:</div>');

                // Рендер списку
                for (let server of servers) {
                    let status = await checkStatus(server.url);
                    let isOnline = status.includes('Online');
                    let item = $('<div class="search-item selector' + (isOnline ? '' : ' dead') + '" style="display: flex; justify-content: space-between; align-items: center;"><div>' + server.name + '</div><div style="font-size: 0.8em;">' + status + '</div></div>');
                    
                    if (isOnline) {
                        item.on('hover:enter', () => {
                            activeServer = server;
                            Lampa.Noty.show('Вибрано: ' + server.name + '. Натисніть "Змінити сервер" нижче.');
                        });
                    } else {
                        item.css('opacity', '0.5');
                    }
                    body.append(item);
                }

                // Кнопка дії
                let btn = $('<div class="search-item selector" style="background: #34495e; color: #fff; text-align: center; margin-top: 30px; font-weight: bold;">Змінити сервер</div>');
                btn.on('hover:enter', () => {
                    if (activeServer) {
                        let target = activeServer.url.startsWith('http') ? activeServer.url : 'http://' + activeServer.url;
                        Lampa.Noty.show('Перенаправлення на ' + activeServer.name + '...');
                        setTimeout(() => {
                            window.location.href = target;
                        }, 1000);
                    } else {
                        Lampa.Noty.show('Будь ласка, спочатку виберіть доступний сервер зі списку');
                    }
                });
                body.append(btn);

                scroll.append(body);
                html.append(scroll.render());
            };

            this.render = function () {
                return html;
            };

            this.back = function () {
                Lampa.Activity.backward();
            };
        });
    }

    function addInterfaceElements() {
        // 1. Додавання в Налаштування
        Lampa.SettingsApi.addComponent({
            component: 'server_redirect',
            name: 'Переїзд (Сервери)',
            icon: icon
        });

        // 2. Додавання в ліве меню
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                let menu_item = $('<li class="menu__item selector" data-action="server_redirect">' +
                    '<div class="menu__ico">' + icon + '</div>' +
                    '<div class="menu__text">Змінити сервер</div>' +
                    '</li>');

                menu_item.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Вибір сервера',
                        component: 'server_redirect',
                        page: 1
                    });
                });
                $('.menu .menu__list').append(menu_item);

                // 3. Додавання в шапку (Header)
                let head_icon = $('<div class="header__item selector" data-action="server_redirect">' + icon + '</div>');
                head_icon.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Вибір сервера',
                        component: 'server_redirect',
                        page: 1
                    });
                });
                $('.header__secondary').prepend(head_icon);
            }
        });
    }

    // Запуск
    if (window.appready) {
        createServerComponent();
        addInterfaceElements();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                createServerComponent();
                addInterfaceElements();
            }
        });
    }
})();
