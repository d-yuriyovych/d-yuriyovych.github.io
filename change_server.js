
(function () {
    'use strict';

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604M18.364 5.63604L15 6M18.364 5.63604L19 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var servers = [
        { name: 'Lapma (MX)', url: 'lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    function startMe() {
        // Редирект як у вашому коді
        if (window.location.search != '?redirect=1') {
            var saved = Lampa.Storage.get('location_server_new');
            if (saved && saved !== '-' && saved !== window.location.hostname) {
                var target = saved.indexOf('http') > -1 ? saved : 'http://' + saved;
                window.location.href = target + '?redirect=1';
            }
        }

        // Реєстрація в налаштуваннях
        Lampa.SettingsApi.addComponent({
            component: 'location_redirect_new',
            name: 'Зміна сервера',
            icon: icon_server_redirect
        });

        // Додавання параметрів (візуалізація списку)
        Lampa.SettingsApi.addParam({
            component: 'location_redirect_new',
            param: {
                name: 'location_server_new',
                type: 'select',
                values: { '-': 'Не обрано' }, // Заповниться динамічно
                default: '-'
            },
            field: {
                name: 'Виберіть сервер із списку'
            },
            onChange: function (value) {
                if (value !== '-') {
                    var sName = "";
                    servers.forEach(function(s) { if(s.url === value) sName = s.name; });
                    Lampa.Noty.show('Вибрано: ' + sName + '. Натисніть "Змінити сервер" для переходу.');
                }
            }
        });

        // Кастомне відображення всередині налаштувань (Статуси та Заголовки)
        Lampa.Listener.follow('settings', function (e) {
            if (e.type === 'open' && e.name === 'location_redirect_new') {
                setTimeout(renderCustomMenu, 10);
            }
        });

        // Додавання кнопки в ліве меню та шапку
        appendInterface();
    }

    function renderCustomMenu() {
        var body = $('.settings-list');
        if (!body.length) return;

        body.empty(); // Очищаємо стандартний вивід Lampa, щоб зробити свій за вашим ТЗ

        // 1. Поточний сервер
        body.append('<div class="settings-param selector static" style="color:#fff; font-weight:bold;">Поточний сервер:</div>');
        var currentHost = window.location.hostname;
        var currentName = "Стандартний";
        servers.forEach(function(s) { if(s.url.indexOf(currentHost) > -1) currentName = s.name; });
        
        var nowEl = $('<div class="settings-param selector static" style="color:#ffd700; margin-bottom:10px;">' + currentName + ' - <span id="cur-status">перевірка...</span></div>');
        body.append(nowEl);
        checkServerStatus(currentHost, '#cur-status');

        // 2. Список серверів
        body.append('<div class="settings-param selector static" style="color:#fff; font-weight:bold; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">Список серверів:</div>');

        var selectedUrl = Lampa.Storage.get('location_server_new');

        servers.forEach(function (s, index) {
            var statusId = 'stat-' + index;
            var item = $('<div class="settings-param selector" style="display:flex; justify-content:space-between;">' +
                '<span>' + s.name + '</span>' +
                '<span id="' + statusId + '">перевірка...</span>' +
            '</div>');

            item.on('hover:enter', function () {
                if (!item.hasClass('is-offline')) {
                    $('.settings-param.selector').css('background', ''); // скидаємо виділення
                    item.css('background', 'rgba(255,255,255,0.1)');
                    Lampa.Storage.set('location_server_new', s.url);
                    Lampa.Noty.show('Обрано: ' + s.name);
                }
            });

            body.append(item);
            checkServerStatus(s.url, '#' + statusId, item);
        });

        // 3. Кнопка дії
        var btn = $('<div class="settings-param selector" style="margin-top:20px; background:#e67e22; color:#fff; text-align:center; font-weight:bold; border-radius:4px;">Змінити сервер</div>');
        btn.on('hover:enter', function () {
            var targetUrl = Lampa.Storage.get('location_server_new');
            if (targetUrl && targetUrl !== '-') {
                var finalUrl = targetUrl.startsWith('http') ? targetUrl : 'http://' + targetUrl;
                Lampa.Noty.show('Перенаправлення...');
                setTimeout(function () { window.location.href = finalUrl + '?redirect=1'; }, 500);
            } else {
                Lampa.Noty.show('Помилка: треба вибрати сервер!');
            }
        });
        body.append(btn);
    }

    function checkServerStatus(url, elementId, parentItem) {
        var checkUrl = url.startsWith('http') ? url : 'http://' + url;
        fetch(checkUrl, { mode: 'no-cors' }).then(function () {
            $(elementId).html('<span style="color:#4cfb4c">● Online</span>');
        }).catch(function () {
            $(elementId).html('<span style="color:#ff4c4c">● Offline</span>');
            if (parentItem) parentItem.addClass('is-offline').css('opacity', '0.4');
        });
    }

    function appendInterface() {
        // Кнопка в бічне меню
        var menuBtn = $('<li class="menu__item selector" data-action="server_redir">' +
            '<div class="menu__ico">' + icon_server_redirect + '</div>' +
            '<div class="menu__text">Сервери</div>' +
        '</li>');
        menuBtn.on('hover:enter', function () {
            Lampa.Settings.main('location_redirect_new');
        });
        $('.menu .menu__list').append(menuBtn);

        // Кнопка в шапку
        var headBtn = $('<div class="header__item selector">' + icon_server_redirect + '</div>');
        headBtn.on('hover:enter', function () {
            Lampa.Settings.main('location_redirect_new');
        });
        $('.header__secondary').prepend(headBtn);
    }

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startMe();
        });
    }
})();
