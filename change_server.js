(function () {
    const servers = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    // Функція перевірки через Image (обхід Mixed Content блокування для статусів)
    function checkStatus(url, callback) {
        const img = new Image();
        img.onload = () => callback(true);
        img.onerror = () => callback(true); // Якщо прийшла відповідь (навіть 404), сервер живий
        img.src = url + '/favicon.ico?' + Math.random();
        setTimeout(() => { img.src = ""; callback(false); }, 3500);
    }

    function startPlugin() {
        Lampa.Component.add('server_manager', function (object) {
            let comp = new Lampa.Interaction();
            let selectedServer = null;

            this.create = function () {
                this.build();
            };

            this.build = function() {
                comp.clear();
                
                // Отримуємо поточну адресу
                const currentUrl = Lampa.Storage.get('source_url') || 'lampa.mx';
                const currentServer = servers.find(s => s.url.replace(/^https?:\/\//, '') === currentUrl.replace(/^https?:\/\//, '')) || { name: 'Стандартний', url: currentUrl };

                // Поточний сервер
                comp.append({
                    title: 'Поточний сервер:',
                    type: 'caption'
                });

                let currentItem = comp.append({
                    title: currentServer.name + ' - <span class="status-current">перевірка...</span>',
                    style: 'color: #ffca28'
                });
                
                checkStatus(currentServer.url, (online) => {
                    currentItem.find('.status-current').html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                });

                // Список серверів
                comp.append({ title: 'Список серверів:', type: 'caption' });

                servers.forEach(server => {
                    let item = comp.append({
                        title: server.name + ' - <span class="st-' + server.name.replace(/\W/g, '') + '">...</span>',
                        onSelect: () => {
                            checkStatus(server.url, (online) => {
                                if(online) {
                                    selectedServer = server;
                                    this.updateInfo();
                                } else {
                                    Lampa.Noty.show('Сервер недоступний!');
                                }
                            });
                        }
                    });

                    checkStatus(server.url, (online) => {
                        item.find('.st-' + server.name.replace(/\W/g, '')).html(online ? '<span style="color: #4caf50">Online</span>' : '<span style="color: #f44336">Offline</span>');
                        if (!online) {
                            item.css('opacity', '0.4');
                        }
                    });
                });

                comp.append({ title: 'Керування:', type: 'caption' });
                
                this.infoBlock = comp.append({
                    title: 'Виберіть сервер зі списку',
                    type: 'text'
                });

                this.btn = comp.append({
                    title: 'ЗМІНИТИ СЕРВЕР ТА ПЕРЕЗАВАНТАЖИТИ',
                    onSelect: () => {
                        if (selectedServer) {
                            Lampa.Storage.set('source_url', selectedServer.url.replace(/^https?:\/\//, ''));
                            Lampa.Noty.show('Зміна на ' + selectedServer.name);
                            setTimeout(() => { location.reload(); }, 1000);
                        }
                    }
                });
                this.btn.hide();
            };

            this.updateInfo = function() {
                this.infoBlock.find('.simple-button__title').text('Обрано: ' + selectedServer.name + '. Натисніть кнопку нижче.');
                this.btn.show();
                this.btn.css({'background-color': '#e91e63', 'color': '#fff'});
                Lampa.Controller.focus(this.btn[0]); // Переводимо фокус на кнопку
            };

            this.render = function () {
                return comp.render();
            };
        });

        // Додавання в меню
        function addMenuItem() {
            if ($('.menu').length) {
                const item = $('<li class="menu__item selector" data-action="server_manager">' +
                    '<div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>' +
                    '<div class="menu__text">Зміна сервера</div>' +
                    '</li>');

                item.on('hover:enter', () => {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Сервери',
                        component: 'server_manager',
                        page: 1
                    });
                });

                if (!$('.menu__item[data-action="server_manager"]').length) {
                    $('.menu .menu__list').append(item);
                }
            }
        }

        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') addMenuItem();
        });
        addMenuItem(); // На випадок якщо додаток вже завантажений
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') startPlugin(); });
})();
