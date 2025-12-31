(function () {
    'use strict';

    var servers = [
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    var icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17L10 11L4 5"/><path d="M12 19H20"/><path d="M5 19H14"/></svg>';

    function startPlugin() {
        // Додаємо компонент в налаштування
        Lampa.SettingsApi.addComponent({
            component: 'redirect_plugin',
            name: 'Зміна сервера',
            icon: icon
        });

        // Створюємо логіку відображення сторінки плагіна
        Lampa.Component.add('redirect_plugin', function (object) {
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var files = new Lampa.Files(object);
            var html = $('<div></div>');
            var body = $('<div class="category-full"></div>');
            var active_url = '';

            this.create = function () {
                var _this = this;
                
                // 1. Поточний сервер
                body.append('<div class="search-item selector static" style="padding: 10px 20px; font-size: 1.2em; opacity: 0.6;">Поточний сервер:</div>');
                
                var current_host = window.location.hostname;
                var current_name = "Невідомий";
                servers.forEach(function(s) { if(s.url.indexOf(current_host) > -1) current_name = s.name; });

                var now_item = $('<div class="search-item selector static" style="padding: 0 20px 20px; color: #ffd700;">' + current_name + ' - <span class="status-check" data-url="'+current_host+'">перевірка...</span></div>');
                body.append(now_item);

                // 2. Список для вибору
                body.append('<div class="search-item selector static" style="padding: 10px 20px; font-size: 1.2em; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.1);">Список серверів:</div>');

                servers.forEach(function (server) {
                    var item = $('<div class="search-item selector" style="display: flex; justify-content: space-between; padding: 15px 20px;">' +
                        '<span>' + server.name + '</span>' +
                        '<span class="status-check" data-url="' + server.url + '" style="font-size: 0.8em;">перевірка...</span>' +
                    '</div>');

                    item.on('hover:enter', function () {
                        if (item.hasClass('is-offline')) {
                            Lampa.Noty.show('Сервер недоступний');
                        } else {
                            active_url = server.url;
                            Lampa.Noty.show('Вибрано: ' + server.name + '. Натисніть кнопку "Змінити" нижче.');
                        }
                    });

                    body.append(item);
                });

                // 3. Кнопка підтвердження
                var btn = $('<div class="search-item selector" style="margin: 30px 20px; background: #35a3e1; color: #fff; text-align: center; border-radius: 5px; font-weight: bold;">Змінити сервер</div>');
                btn.on('hover:enter', function () {
                    if (active_url) {
                        var target = active_url.startsWith('http') ? active_url : 'http://' + active_url;
                        Lampa.Noty.show('Перехід на ' + active_url);
                        setTimeout(function() { window.location.href = target; }, 800);
                    } else {
                        Lampa.Noty.show('Будь ласка, виберіть сервер зі списку');
                    }
                });
                body.append(btn);

                scroll.append(body);
                html.append(scroll.render());

                // Функція перевірки статусів
                setTimeout(function() {
                    body.find('.status-check').each(function() {
                        var el = $(this);
                        var url = el.data('url');
                        var check_url = url.startsWith('http') ? url : 'http://' + url;
                        
                        fetch(check_url, {mode: 'no-cors'}).then(function() {
                            el.html('<span style="color: #4cfb4c">● Доступний</span>');
                        }).catch(function() {
                            el.html('<span style="color: #ff4c4c">● Офлайн</span>');
                            el.closest('.selector').addClass('is-offline').css('opacity', '0.4');
                        });
                    });
                }, 200);
            };

            this.render = function () { return html; };
            this.back = function () { Lampa.Activity.backward(); };
        });

        // Додавання в МЕНЮ (зліва)
        var menu_item = $('<li class="menu__item selector" data-action="redirect_plugin">' +
            '<div class="menu__ico">' + icon + '</div>' +
            '<div class="menu__text">Зміна сервера</div>' +
        '</li>');
        menu_item.on('hover:enter', function () {
            Lampa.Activity.push({ title: 'Сервери', component: 'redirect_plugin' });
        });
        $('.menu .menu__list').append(menu_item);

        // Додавання в ШАПКУ
        var head_item = $('<div class="header__item selector">' + icon + '</div>');
        head_item.on('hover:enter', function () {
            Lampa.Activity.push({ title: 'Сервери', component: 'redirect_plugin' });
        });
        $('.header__secondary').prepend(head_item);
    }

    // Очікування завантаження додатку
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') startPlugin();
        });
    }
})();
