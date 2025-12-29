(function () {
    const servers = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    // Надійна перевірка статусу через XHR (працює з http/https краще)
    function checkStatus(url, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url.replace(/\/$/, '') + '/favicon.ico', true);
        xhr.timeout = 3000;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // Якщо статус 0 - це може бути CORS помилка, але сервер відповів (живий)
                // Якщо статус 200-399 - точно живий
                callback(xhr.status >= 200 && xhr.status < 400 || xhr.status === 0);
            }
        };
        xhr.onerror = function() { callback(false); };
        xhr.ontimeout = function() { callback(false); };
        xhr.send();
    }

    function startPlugin() {
        // Створюємо компонент
        Lampa.Component.add('server_manager', function (object) {
            let comp = new Lampa.Interaction();
            let selectedServer = null;

            this.create = function () {
                this.build();
            };

            this.build = function() {
                comp.clear();
                let currentUrl = Lampa.Storage.get('source_url') || 'lampa.mx';
                let currentServer = servers.find(s => s.url.includes(currentUrl)) || { name: 'Стандартний', url: currentUrl };

                comp.append({ title: 'Поточний сервер:', type: 'caption' });

                let currentItem = comp.append({
                    title: '<span style="color: #ffca28">' + currentServer.name + '</span> - <span class="st-curr">...</span>'
                });

                checkStatus(currentServer.url, (online) => {
                    currentItem.find('.st-curr').html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                });

                comp.append({ title: 'Список серверів:', type: 'caption' });

                servers.forEach(server => {
                    let item = comp.append({
                        title: server.name + ' - <span class="st-' + server.name.replace(/\W/g, '') + '">...</span>',
                        onSelect: () => {
                            if (item.hasClass('is-offline')) {
                                Lampa.Noty.show('Сервер недоступний!');
                            } else {
                                selectedServer = server;
                                this.updateInfo();
                            }
                        }
                    });

                    checkStatus(server.url, (online) => {
                        item.find('.st-' + server.name.replace(/\W/g, '')).html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                        if (!online) {
                            item.addClass('is-offline').css('opacity', '0.4');
                        }
                    });
                });

                comp.append({ title: 'Дія:', type: 'caption' });
                this.infoBlock = comp.append({ title: 'Виберіть робочий сервер', type: 'text' });

                this.btn = comp.append({
                    title: 'ЗМІНИТИ СЕРВЕР',
                    onSelect: () => {
                        if (selectedServer) {
                            let cleanUrl = selectedServer.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                            Lampa.Storage.set('source_url', cleanUrl);
                            Lampa.Noty.show('Змінено на ' + selectedServer.name);
                            setTimeout(() => { location.reload(); }, 1200);
                        }
                    }
                });
                this.btn.hide();
            };

            this.updateInfo = function() {
                this.infoBlock.find('.simple-button__title').text('Вибрано: ' + selectedServer.name + '. Натисніть кнопку нижче.');
                this.btn.show();
                this.btn.css({'background-color': '#ffca28', 'color': '#000'});
            };

            this.render = function () { return comp.render(); };
        });

        // Додаємо в Налаштування (найбільш стабільний шлях для Android)
        Lampa.Settings.main().render().find('[data-name="more"]').after('<div class="settings-param selector" data-name="server_change" data-static="true"><div class="settings-param__name">Зміна сервера (Redirect)</div><div class="settings-param__value">Вибір джерела</div></div>');
        
        $('body').on('click', '[data-name="server_change"]', function() {
            Lampa.Activity.push({
                url: '',
                title: 'Сервери',
                component: 'server_manager',
                page: 1
            });
        });

        // Спроба додати в бічне меню через невелику затримку
        setTimeout(() => {
            if ($('.menu__list').length && !$('.menu__item[data-action="server_manager"]').length) {
                let menu_item = $('<li class="menu__item selector" data-action="server_manager">' +
                    '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 11l-7-7-7 7m14 6l-7-7-7 7"/></svg></div>' +
                    '<div class="menu__text">Зміна сервера</div>' +
                    '</li>');

                menu_item.on('hover:enter', () => {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Сервери',
                        component: 'server_manager',
                        page: 1
                    });
                });
                $('.menu__list').append(menu_item);
            }
        }, 2000);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') startPlugin(); });
})();
