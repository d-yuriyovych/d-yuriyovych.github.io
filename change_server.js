(function () {
    const servers = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    function checkStatus(url) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url.replace(/\/$/, '') + '/favicon.ico', true);
            xhr.timeout = 2000;
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    resolve(xhr.status >= 200 && xhr.status < 400 || xhr.status === 0);
                }
            };
            xhr.onerror = () => resolve(false);
            xhr.ontimeout = () => resolve(false);
            xhr.send();
        });
    }

    function openServerManager() {
        const currentUrl = Lampa.Storage.get('source_url') || 'lampa.mx';
        const current = servers.find(s => s.url.includes(currentUrl)) || { name: 'Стандартний', url: currentUrl };
        
        const menuItems = [];

        // Заголовок поточного сервера (не вибирається)
        menuItems.push({
            title: 'Поточний сервер:',
            header: true
        });

        menuItems.push({
            title: '<span style="color: #ffca28">' + current.name + '</span> - <span class="st-curr">...</span>',
            fixed: true
        });

        // Список серверів (Заголовок не вибирається)
        menuItems.push({
            title: 'Список серверів:',
            header: true
        });

        servers.forEach(server => {
            menuItems.push({
                title: server.name + ' - <span class="st-' + server.name.replace(/\W/g, '') + '">...</span>',
                server: server,
                onSelect: (item) => {
                    if (item.is_offline) {
                        Lampa.Noty.show('Сервер недоступний!');
                    } else {
                        showConfirm(server);
                    }
                }
            });
        });

        Lampa.Select.show({
            title: 'Вибір сервера',
            items: menuItems,
            onRender: (html) => {
                // Оновлення статусів
                checkStatus(current.url).then(online => {
                    html.find('.st-curr').html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                });

                servers.forEach(server => {
                    checkStatus(server.url).then(online => {
                        const el = html.find('.st-' + server.name.replace(/\W/g, ''));
                        el.html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                        if (!online) {
                            const parent = el.closest('.selector');
                            parent.css('opacity', '0.4');
                            // Знаходимо об'єкт в масиві по імені через DOM атрибут або індекс
                            const index = html.find('.selector').index(parent);
                            if(menuItems[index]) menuItems[index].is_offline = true;
                        }
                    });
                });
            }
        });
    }

    function showConfirm(server) {
        Lampa.Select.show({
            title: 'Підтвердження',
            items: [
                {
                    title: 'Вибрано: ' + server.name,
                    header: true
                },
                {
                    title: 'Для зміни натисніть кнопку нижче:',
                    fixed: true
                },
                {
                    title: 'ЗМІНИТИ СЕРВЕР (REDIRECT)',
                    onSelect: () => {
                        let cleanUrl = server.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                        Lampa.Storage.set('source_url', cleanUrl);
                        Lampa.Noty.show('Перемикання...');
                        setTimeout(() => { location.reload(); }, 500);
                    }
                }
            ],
            onRender: (html) => {
                // Фарбуємо кнопку редиректу
                html.find('.selector').last().css({
                    'background-color': '#ffca28',
                    'color': '#000',
                    'margin-top': '10px',
                    'font-weight': 'bold'
                });
            }
        });
    }

    // Додавання в налаштування
    function addSettings() {
        Lampa.Settings.main().render().find('[data-name="more"]').after('<div class="settings-param selector" data-name="server_change" data-static="true"><div class="settings-param__name">Зміна сервера (Redirect)</div><div class="settings-param__value">Перейти до списку</div></div>');
        
        $('body').on('click', '[data-name="server_change"]', function() {
            openServerManager();
        });
    }

    // Додавання в бічне меню
    function addMenu() {
        if ($('.menu__list').length && !$('.menu__item[data-action="server_redirect"]').length) {
            const item = $('<li class="menu__item selector" data-action="server_redirect">' +
                '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17l5-5-5-5M19.8 12H9M10 3H4v18h6"/></svg></div>' +
                '<div class="menu__text">Зміна сервера</div>' +
                '</li>');

            item.on('hover:enter', openServerManager);
            $('.menu__list').append(item);
        }
    }

    // Запуск
    const pluginInit = () => {
        addSettings();
        addMenu();
        // Повторна спроба через 3 секунди для меню (якщо воно завантажується довго)
        setTimeout(addMenu, 3000);
    };

    if (window.appready) pluginInit();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') pluginInit(); });
})();
