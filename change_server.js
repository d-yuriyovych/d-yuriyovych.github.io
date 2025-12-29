(function () {
    const servers = [
        { name: 'Lapma (MX)', url: 'http://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    function checkStatus(url) {
        return fetch(url, { method: 'HEAD', mode: 'no-cors', timeout: 3000 })
            .then(() => true)
            .catch(() => false);
    }

    function startPlugin() {
        Lampa.Component.add('server_manager', function (object) {
            let comp = new Lampa.Interaction();
            let selectedServer = null;

            this.create = function () {
                this.refresh();
            };

            this.refresh = function() {
                comp.clear();
                const currentUrl = Lampa.Storage.get('source_url') || 'lampa.mx';
                const currentServer = servers.find(s => s.url.includes(currentUrl)) || { name: 'Невідомий', url: currentUrl };

                // Заголовок поточного сервера
                comp.append({
                    title: 'Поточний сервер:',
                    type: 'caption'
                });

                let currentItem = {
                    title: currentServer.name + ' - <span class="server-status">перевірка...</span>',
                    style: 'color: #ffca28' // Жовтий колір
                };
                
                let currentHtml = comp.append(currentItem);
                checkStatus(currentServer.url).then(online => {
                    currentHtml.find('.server-status').html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                });

                comp.append({ title: 'Список серверів:', type: 'caption' });

                servers.forEach(server => {
                    let item = comp.append({
                        title: server.name + ' - <span class="status-' + server.name.replace(/\s/g, '') + '">...</span>',
                        onSelect: () => {
                            selectedServer = server;
                            this.refreshInfo();
                        }
                    });

                    checkStatus(server.url).then(online => {
                        const statusTag = item.find('.status-' + server.name.replace(/\s/g, ''));
                        statusTag.html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                        if (!online) item.addClass('not-selectable').css('opacity', '0.5');
                    });
                });

                comp.append({ title: 'Дія:', type: 'caption' });
                this.infoBlock = comp.append({
                    title: 'Оберіть сервер зі списку вище',
                    type: 'text'
                });

                this.btn = comp.append({
                    title: 'Змінити сервер',
                    onSelect: () => {
                        if (selectedServer) {
                            Lampa.Storage.set('source_url', selectedServer.url);
                            Lampa.Noty.show('Сервер змінено на ' + selectedServer.name + '. Перезавантаження...');
                            setTimeout(() => { location.reload(); }, 1500);
                        }
                    }
                });
                this.btn.css('display', 'none');
            };

            this.refreshInfo = function() {
                if (selectedServer) {
                    this.infoBlock.find('.simple-button__title').text('Вибрано: ' + selectedServer.name + '. Натисніть кнопку нижче для застосування.');
                    this.btn.css({'display': 'block', 'background-color': '#2196f3', 'color': '#fff'});
                }
            };

            this.render = function () {
                return comp.render();
            };
        });

        // Додавання пункту в бічне меню
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') {
                let menu_item = $('<li class="menu__item selector">' +
                    '<div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 15V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 3V15M12 15L16 11M12 15L8 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
                    '<div class="menu__text">Зміна сервера</div>' +
                    '</li>');

                menu_item.on('hover:enter', () => {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Менеджер серверів',
                        component: 'server_manager',
                        page: 1
                    });
                });
                $('.menu .menu__list').append(menu_item);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') startPlugin(); });
})();
