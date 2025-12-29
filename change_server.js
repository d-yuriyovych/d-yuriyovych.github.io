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
            xhr.timeout = 2500;
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

    function startPlugin() {
        Lampa.Component.add('server_manager', function (object) {
            this.create = function () {
                const currentUrl = Lampa.Storage.get('source_url') || 'lampa.mx';
                const current = servers.find(s => s.url.includes(currentUrl)) || { name: 'Стандартний', url: currentUrl };
                
                const menuItems = [];

                // 1. Поточний сервер (Заголовок та статус)
                menuItems.push({
                    title: 'Поточний сервер:',
                    header: true
                });

                const currentItem = {
                    title: '<span style="color: #ffca28">' + current.name + '</span> - <span class="st-curr">зачекайте...</span>',
                    fixed: true
                };
                menuItems.push(currentItem);

                // 2. Список для вибору
                menuItems.push({
                    title: 'Список серверів:',
                    header: true
                });

                servers.forEach(server => {
                    menuItems.push({
                        title: server.name + ' - <span class="st-' + server.name.replace(/\W/g, '') + '">...</span>',
                        server: server,
                        onSelect: (item) => {
                            if (item.offline) {
                                Lampa.Noty.show('Цей сервер зараз недоступний');
                            } else {
                                showConfirmMenu(item.server);
                            }
                        }
                    });
                });

                // Виклик стандартного меню Lampa
                Lampa.Select.show({
                    title: 'Менеджер серверів',
                    items: menuItems,
                    onRender: (html) => {
                        // Перевірка статусів після відмальовки
                        checkStatus(current.url).then(online => {
                            html.find('.st-curr').html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                        });

                        servers.forEach(server => {
                            checkStatus(server.url).then(online => {
                                const el = html.find('.st-' + server.name.replace(/\W/g, ''));
                                el.html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                                if (!online) {
                                    el.closest('.selector').css('opacity', '0.4').addClass('is-offline');
                                    const item = menuItems.find(i => i.server === server);
                                    if(item) item.offline = true;
                                }
                            });
                        });
                    },
                    onBack: () => {
                        Lampa.Activity.backward();
                    }
                });
            };

            function showConfirmMenu(server) {
                Lampa.Select.show({
                    title: 'Підтвердження',
                    items: [
                        {
                            title: 'Вибрано: ' + server.name,
                            header: true
                        },
                        {
                            title: 'Що робити далі?',
                            description: 'Натисніть кнопку нижче для редиректу',
                            fixed: true
                        },
                        {
                            title: 'ЗМІНИТИ СЕРВЕР ТА ПЕРЕЗАВАНТАЖИТИ',
                            style: 'background-color: #ffca28; color: #000; font-weight: bold;',
                            onSelect: () => {
                                let cleanUrl = server.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                Lampa.Storage.set('source_url', cleanUrl);
                                Lampa.Noty.show('Сервер змінено на ' + server.name);
                                setTimeout(() => { location.reload(); }, 1000);
                            }
                        }
                    ],
                    onBack: () => {
                        Lampa.Activity.push({ component: 'server_manager' });
                    }
                });
            }

            this.render = function () { return ''; };
        });

        // Додавання пункту в меню
        const addBtn = () => {
            if ($('.menu__list').length && !$('.menu__item[data-action="server_manager"]').length) {
                const item = $('<li class="menu__item selector" data-action="server_manager">' +
                    '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20"/></svg></div>' +
                    '<div class="menu__text">Зміна сервера</div>' +
                    '</li>');

                item.on('hover:enter', () => {
                    Lampa.Activity.push({
                        title: 'Сервери',
                        component: 'server_manager',
                        page: 1
                    });
                });
                $('.menu__list').append(item);
            }
        };

        Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') addBtn(); });
        addBtn();
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') startPlugin(); });
})();
