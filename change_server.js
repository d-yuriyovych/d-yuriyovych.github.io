(function () {
    'use strict';

    // Функція очікування завантаження Lampa
    function waitLampa(callback) {
        if (window.Lampa && window.Lampa.SettingsApi && window.jQuery) {
            callback();
        } else {
            setTimeout(function () {
                waitLampa(callback);
            }, 200);
        }
    }

    waitLampa(function () {
        // Основний клас плагіна
        function ServerSwitcher() {
            var _this = this;
            var servers_list = [
                { name: 'Lampa (MX)',       url: 'http://lampa.mx',         host: 'lampa.mx' },
                { name: 'Lampa (Koyeb)',    url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', host: 'koyeb.app' },
                { name: 'Lampa (VIP)',      url: 'http://lampa.vip',        host: 'lampa.vip' },
                { name: 'Lampa (NNMTV)',    url: 'http://lam.nnmtv.pw',     host: 'lam.nnmtv.pw' },
                { name: 'Prisma',           url: 'http://prisma.ws/',       host: 'prisma.ws' }
            ];

            var selected_target = null;
            var current_host = window.location.hostname;

            // CSS Стилі
            var css = `
                .server-switcher-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-radius: 5px; margin-bottom: 5px; cursor: pointer; position: relative; }
                .server-switcher-item.selector { background-color: rgba(255,255,255,0.05); }
                .server-switcher-item.focus { background-color: #fff !important; color: #000; }
                .server-switcher-item.selected-item { border: 2px solid #f5c518; }
                .server-switcher-item.disabled { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
                
                .server-status-indicator { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-left: 10px; background: #555; }
                .server-status-indicator.online { background: #4caf50; box-shadow: 0 0 5px #4caf50; }
                .server-status-indicator.offline { background: #f44336; }
                .server-status-indicator.checking { background: #ffeb3b; animation: sv-pulse 1s infinite; }
                
                .server-current-name { color: #f5c518; font-weight: bold; font-size: 1.2em; text-transform: uppercase; }
                .server-list-header { margin: 20px 0 10px 0; opacity: 0.6; font-size: 0.9em; text-transform: uppercase; padding-left: 5px; }
                
                .server-btn-change { margin-top: 30px; padding: 15px; text-align: center; background-color: #333; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 1.1em; }
                .server-btn-change.ready { background-color: #f5c518; color: #000; box-shadow: 0 0 10px rgba(245, 197, 24, 0.3); }
                
                /* Іконка в меню зліва */
                .menu__item[data-action="server_switch"] .menu__ico svg { color: #f5c518; }

                @keyframes sv-pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            `;

            this.init = function () {
                Lampa.Utils.putStyle('server-switcher-css', css);

                // 1. Реєстрація компонента налаштувань
                Lampa.Settings.listener.follow('open', function (e) {
                    if (e.name == 'server_switch') {
                        _this.renderPage(e.body);
                    }
                });

                // Додаємо пункт в меню налаштувань
                Lampa.SettingsApi.addParam({
                    component: 'server_switch',
                    param: {
                        name: 'server_switch',
                        title: 'Зміна сервера',
                        description: 'Вибір дзеркала та редирект',
                        icon: 'server' // Може бути 'settings' якщо немає іконки
                    },
                    field: {
                        name: 'Відкрити меню',
                    },
                    onChange: function(){}
                });

                // 2. Додавання в UI (Header та Left Menu)
                this.startUiInjector();
                
                // Сповіщення про успішний старт (можна прибрати, якщо заважає)
                Lampa.Noty.show('Плагін Server Switch готовий');
            };

            // Інжектор для елементів інтерфейсу (працює постійно, бо лампа перемальовує меню)
            this.startUiInjector = function() {
                setInterval(function(){
                    // Шапка
                    if($('.header__actions').length && !$('.header__action[data-action="server_switch"]').length) {
                        var headItem = $(`<div class="header__action selector" data-action="server_switch" title="Зміна сервера">
                            <svg height="22" width="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#f5c518"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line></svg>
                        </div>`);
                        
                        headItem.on('hover:enter click', function() {
                            Lampa.Settings.open('server_switch');
                        });
                        
                        $('.header__actions').prepend(headItem);
                    }

                    // Ліве меню
                    if($('.menu__list').length && !$('.menu__item[data-action="server_switch"]').length) {
                         var menuItem = $(`<li class="menu__item selector" data-action="server_switch">
                            <div class="menu__ico">
                                <svg height="22" width="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#f5c518"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                            </div>
                            <div class="menu__text">Сервер</div>
                        </li>`);

                        menuItem.on('hover:enter click', function(){
                             Lampa.Settings.open('server_switch');
                        });

                        // Вставляємо перед "Налаштуваннями" або в кінець
                        var settingsItem = $('.menu__item[data-action="settings"]');
                        if(settingsItem.length) settingsItem.before(menuItem);
                        else $('.menu__list').append(menuItem);
                    }
                }, 1500); // Перевіряємо кожні 1.5 сек
            };

            // Рендер сторінки налаштувань
            this.renderPage = function (container) {
                selected_target = null;
                var content = $('<div></div>');
                
                // 1. Поточний сервер
                var currentServerObj = servers_list.find(s => current_host.includes(s.host));
                var currentName = currentServerObj ? currentServerObj.name : 'Невідомий (' + current_host + ')';
                var currentUrl = window.location.protocol + '//' + window.location.host;

                content.append('<div class="server-list-header">Поточний сервер:</div>');
                
                var currentBlock = $(`
                    <div class="server-switcher-item" style="border: 1px solid #ffffff1a;">
                        <div style="display:flex; flex-direction:column;">
                            <span class="server-current-name">${currentName}</span>
                            <span style="font-size: 0.8em; opacity: 0.5;">${currentUrl}</span>
                        </div>
                        <div class="server-status-indicator checking" id="current-status-led"></div>
                    </div>
                `);
                
                content.append(currentBlock);
                _this.checkStatus(currentUrl, currentBlock.find('#current-status-led'));

                // 2. Список серверів
                content.append('<div class="server-list-header">Список серверів:</div>');
                
                servers_list.forEach(function(server){
                    var item = $(`
                        <div class="server-switcher-item selector" data-url="${server.url}">
                            <div class="server-name" style="font-size: 1.1em;">${server.name}</div>
                            <div class="server-status-indicator checking"></div>
                        </div>
                    `);

                    // Клік/Ентер
                    item.on('hover:enter click', function(){
                        if($(this).hasClass('disabled')) return;
                        
                        content.find('.server-switcher-item').removeClass('selected-item');
                        $(this).addClass('selected-item');
                        selected_target = server;
                        updateBtn();
                    });

                    content.append(item);

                    // Перевірка
                    _this.checkStatus(server.url, item.find('.server-status-indicator'), function(alive){
                        if(!alive) {
                            item.addClass('disabled');
                            item.find('.server-name').css({'text-decoration':'line-through', 'opacity':'0.5'});
                        }
                    });
                });

                // 3. Кнопка
                var btn = $(`<div class="server-btn-change selector">Виберіть сервер</div>`);
                
                function updateBtn(){
                    if(selected_target){
                        btn.text('ЗМІНИТИ СЕРВЕР НА: ' + selected_target.name);
                        btn.addClass('ready');
                        btn.css('background-color', '#f5c518');
                    } else {
                        btn.text('Виберіть сервер');
                        btn.removeClass('ready');
                        btn.css('background-color', '#333');
                    }
                }

                btn.on('hover:enter click', function(){
                    if(!selected_target) {
                        Lampa.Noty.show('Спочатку виберіть доступний сервер');
                        return;
                    }
                    if(confirm('Змінити сервер на ' + selected_target.name + '?')) {
                        window.location.href = selected_target.url;
                    }
                });

                // confirm для Lampa (використовуємо нативний модал Lampa)
                btn.off('hover:enter click').on('hover:enter click', function(){
                     if(!selected_target) {
                        Lampa.Noty.show('Спочатку виберіть доступний сервер');
                        return;
                    }
                    Lampa.Select.show({
                        title: 'Зміна сервера',
                        items: [
                            {title: 'Перейти на ' + selected_target.name, confirm: true},
                            {title: 'Відміна'}
                        ],
                        onSelect: function(a){
                            if(a.confirm) window.location.href = selected_target.url;
                            else Lampa.Controller.toggle('content');
                        },
                        onBack: function(){
                            Lampa.Controller.toggle('content');
                        }
                    });
                });

                content.append(btn);
                container.empty().append(content);
            };

            // Функція пінгу (no-cors)
            this.checkStatus = function(url, el, cb) {
                fetch(url, { method: 'HEAD', mode: 'no-cors' })
                    .then(()=>{
                        el.removeClass('checking').addClass('online');
                        if(cb) cb(true);
                    })
                    .catch(()=>{
                        el.removeClass('checking').addClass('offline');
                        if(cb) cb(false);
                    });
            };
        }

        // Запуск
        var plugin = new ServerSwitcher();
        plugin.init();
    });
})();
