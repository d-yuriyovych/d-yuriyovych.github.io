(function () {
    const servers = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    // Найнадійніший метод перевірки для Android
    function pingServer(url, callback) {
        const img = new Image();
        const timer = setTimeout(() => {
            img.src = "";
            callback(false);
        }, 3000);
        
        img.onload = () => { clearTimeout(timer); callback(true); };
        img.onerror = () => { clearTimeout(timer); callback(true); }; // Навіть помилка означає, що сервер відповів
        img.src = url.replace(/\/$/, '') + '/favicon.ico?' + Math.random();
    }

    function openServerManager() {
        // Отримуємо значення максимально надійно
        const currentUrl = Lampa.Storage.get('source_url') || localStorage.getItem('source_url') || 'lampa.mx';
        const current = servers.find(s => s.url.includes(currentUrl)) || { name: 'Стандартний', url: currentUrl };
        
        const items = [];
        items.push({ title: 'Поточний: ' + current.name, header: true });
        items.push({ title: 'Статус: <span class="st-curr">перевірка...</span>', fixed: true });
        items.push({ title: 'Виберіть новий сервер:', header: true });

        servers.forEach(server => {
            items.push({
                title: server.name + ' - <span class="st-' + server.name.replace(/\W/g, '') + '">...</span>',
                server: server,
                onSelect: () => showConfirm(server)
            });
        });

        Lampa.Select.show({
            title: 'Менеджер серверів',
            items: items,
            onRender: (html) => {
                pingServer(current.url, (ok) => {
                    html.find('.st-curr').html(ok ? '<span style="color:#4caf50">Online</span>' : '<span style="color:#f44336">Offline</span>');
                });
                servers.forEach(s => {
                    pingServer(s.url, (ok) => {
                        html.find('.st-' + s.name.replace(/\W/g, '')).html(ok ? '<span style="color:#4caf50">Online</span>' : '<span style="color:#f44336">Offline</span>');
                    });
                });
            }
        });
    }

    function showConfirm(server) {
        Lampa.Select.show({
            title: 'Підтвердження',
            items: [
                { title: 'Вибрано: ' + server.name, header: true },
                { title: 'Натисніть кнопку для редиректу:', fixed: true },
                {
                    title: 'ЗМІНИТИ ТА ПЕРЕЗАПУСТИТИ',
                    onSelect: () => {
                        const cleanUrl = server.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                        
                        // Записуємо всюди, куди можна
                        Lampa.Storage.set('source_url', cleanUrl);
                        localStorage.setItem('source_url', cleanUrl);
                        
                        // Спеціальний хак для Android додатка
                        if (window.Lampa && window.Lampa.Platform && window.Lampa.Platform.is('android')) {
                            // Спроба викликати внутрішній метод Android, якщо він доступний
                            try { Android.setSourceURL(cleanUrl); } catch(e) {}
                        }

                        Lampa.Noty.show('Сервер змінено. Перезавантаження...');
                        setTimeout(() => { 
                            if(window.app && window.app.exit) window.app.exit(); // Для деяких Android версій
                            location.replace(location.origin + location.pathname); 
                        }, 1000);
                    }
                }
            ],
            onRender: (html) => {
                html.find('.selector').last().css({'background-color': '#ffca28', 'color': '#000', 'font-weight': 'bold'});
            }
        });
    }

    function injectSettings() {
        // Чекаємо поки налаштування завантажаться
        Lampa.Listener.follow('settings', (e) => {
            if (e.type === 'open' && e.name === 'main') {
                setTimeout(() => {
                    if (!$('.settings-param[data-name="server_change"]').length) {
                        const btn = $('<div class="settings-param selector" data-name="server_change" data-static="true"><div class="settings-param__name">Зміна сервера (Redirect)</div><div class="settings-param__value">Відкрити меню</div></div>');
                        btn.on('click', openServerManager);
                        $('.settings__content').prepend(btn); // Додаємо на самий початок налаштувань
                    }
                }, 100);
            }
        });
    }

    function addMenu() {
        if ($('.menu__list').length && !$('.menu__item[data-action="server_redirect"]').length) {
            const item = $('<li class="menu__item selector" data-action="server_redirect"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M16 17l5-5-5-5M19.8 12H9M10 3H4v18h6"/></svg></div><div class="menu__text">Зміна сервера</div></li>');
            item.on('hover:enter', openServerManager);
            $('.menu__list').append(item);
        }
    }

    const init = () => {
        addMenu();
        injectSettings();
        // Циклічна перевірка меню для Android
        setInterval(addMenu, 5000);
    };

    if (window.appready) init();
    else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') init(); });
})();
