(function () {
    'use strict';

    function ServerSwitcher() {
        var _this = this;
        var network_status_cache = {};
        
        // Список серверів згідно з твоїм запитом
        var servers_list = [
            { name: 'Lampa (MX)',       url: 'http://lampa.mx',         host: 'lampa.mx' },
            { name: 'Lampa (Koyeb)',    url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', host: 'koyeb.app' },
            { name: 'Lampa (VIP)',      url: 'http://lampa.vip',        host: 'lampa.vip' },
            { name: 'Lampa (NNMTV)',    url: 'http://lam.nnmtv.pw',     host: 'lam.nnmtv.pw' },
            { name: 'Prisma',           url: 'http://prisma.ws/',       host: 'prisma.ws' }
        ];

        var selected_target = null;
        var current_host = window.location.hostname;

        // Стилі CSS
        var css = `
            .server-switcher-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 5px; margin-bottom: 5px; cursor: pointer; }
            .server-switcher-item.selector { background-color: rgba(255,255,255,0.05); }
            .server-switcher-item.focus { background-color: rgba(255,255,255,0.2) !important; color: #fff; }
            .server-switcher-item.selected-item { border: 1px solid #f5c518; }
            .server-switcher-item.disabled { opacity: 0.4; pointer-events: none; }
            
            .server-status-indicator { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-left: 10px; background: #555; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
            .server-status-indicator.online { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
            .server-status-indicator.offline { background: #f44336; box-shadow: 0 0 8px #f44336; }
            .server-status-indicator.checking { background: #ffeb3b; animation: pulse 1s infinite; }
            
            .server-current-name { color: #f5c518; font-weight: bold; font-size: 1.1em; }
            
            .server-btn-change { margin-top: 20px; padding: 15px; text-align: center; background-color: #2b2b2b; border-radius: 8px; font-weight: bold; transition: all 0.3s; }
            .server-btn-change.ready { background-color: #f5c518; color: #000; cursor: pointer; }
            
            .server-header-title { margin-top: 20px; margin-bottom: 10px; opacity: 0.7; font-size: 0.9em; text-transform: uppercase; }
            
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        `;

        this.init = function () {
            Lampa.Utils.putStyle('server-switcher-css', css);
            
            // 1. Додаємо в меню налаштувань
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'server_switch') {
                    _this.renderSettings(e.body);
                }
            });

            // Реєструємо пункт в налаштуваннях
            Lampa.SettingsApi.addParam({
                component: 'server_switch',
                param: {
                    name: 'server_switch',
                    title: 'Зміна сервера',
                    description: 'Перемикання дзеркал Lampa',
                    icon: 'server' // іконка сервера
                },
                field: {
                    name: 'Змінити сервер',
                    description: 'Натисніть для вибору'
                },
                onChange: function(){}
            });

            // 2. Додаємо в Шапку (Header)
            _this.addToHeader();

            // 3. Додаємо в Меню зліва
            _this.addToLeftMenu();
        };

        // Логіка додавання в шапку
        this.addToHeader = function() {
            if(Lampa.Header){
                var icon = $(`<div class="header__action selector" title="Зміна сервера">
                    <svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                </div>`);
                
                icon.on('hover:enter', function() {
                    Lampa.Settings.open('server_switch');
                });
                
                $('.header__actions').prepend(icon);
            }
        };

        // Логіка додавання в ліве меню
        this.addToLeftMenu = function() {
            var menu_waiter = setInterval(function(){
                if($('.menu__list').length){
                    clearInterval(menu_waiter);
                    
                    var item = $(`<li class="menu__item selector" data-action="server_switch">
                        <div class="menu__ico">
                            <svg height="24" width="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                        </div>
                        <div class="menu__text">Сервер</div>
                    </li>`);

                    item.on('hover:enter', function(){
                         Lampa.Settings.open('server_switch');
                    });

                    // Вставляємо перед налаштуваннями або в кінець
                    if($('.menu__list .menu__item[data-action="settings"]').length) {
                        $('.menu__list .menu__item[data-action="settings"]').before(item);
                    } else {
                        $('.menu__list').append(item);
                    }
                }
            }, 1000);
        };

        // Головна функція рендеру меню
        this.renderSettings = function (container) {
            container.empty();
            selected_target = null; // Скидаємо вибір при вході

            var scroll = $('<div class="settings__content"></div>');
            var content = $('<div></div>');

            // --- Блок: Поточний сервер ---
            content.append('<div class="server-header-title">Поточний сервер:</div>');
            
            var currentServerObj = servers_list.find(s => current_host.includes(s.host)) || { name: 'Невідомий (' + current_host + ')', url: window.location.href };
            
            // Врахування жовтого кольору і статусу
            var current_html = $(`
                <div class="settings__item">
                    <div class="settings__param-title">
                        <span class="server-current-name">${currentServerObj.name}</span>
                        <span class="server-status-indicator checking" id="status-current"></span>
                    </div>
                    <div class="settings__param-descr">${window.location.protocol}//${window.location.host}</div>
                </div>
            `);
            content.append(current_html);

            // Перевірка статусу поточного
            _this.checkStatus(currentServerObj.url, $('#status-current', current_html));

            // --- Блок: Список серверів ---
            content.append('<div class="server-header-title">Список серверів:</div>');

            var list = $('<div></div>');
            
            servers_list.forEach(function(server){
                // Створюємо елемент списку
                var item = $(`
                    <div class="server-switcher-item selector">
                        <div class="server-name">${server.name}</div>
                        <div class="server-status-indicator checking" data-url="${server.url}"></div>
                    </div>
                `);

                // Логіка кліку (вибору)
                item.on('hover:enter click', function(){
                    if($(this).hasClass('disabled')) return;

                    container.find('.server-switcher-item').removeClass('selected-item');
                    $(this).addClass('selected-item');
                    selected_target = server;
                    
                    updateButtonState();
                });

                list.append(item);
                
                // Асинхронна перевірка доступності
                _this.checkStatus(server.url, item.find('.server-status-indicator'), function(isOnline){
                     if(!isOnline) {
                         item.addClass('disabled');
                         item.find('.server-name').css('text-decoration', 'line-through');
                     }
                });
            });

            content.append(list);

            // --- Блок: Кнопка дії ---
            var btn = $(`<div class="server-btn-change selector">Змінити сервер</div>`);
            
            function updateButtonState() {
                if(selected_target) {
                    btn.addClass('ready');
                    btn.text('Змінити сервер на: ' + selected_target.name);
                    btn.css('background-color', '#f5c518'); 
                } else {
                    btn.removeClass('ready');
                    btn.text('Виберіть сервер зі списку');
                    btn.css('background-color', '#2b2b2b');
                }
            }
            updateButtonState();

            btn.on('hover:enter click', function(){
                if(!selected_target) {
                    Lampa.Noty.show('Будь ласка, виберіть сервер зі списку');
                    return;
                }
                
                Lampa.Select.show({
                    title: 'Підтвердження',
                    items: [
                        {title: 'Так, перейти на ' + selected_target.name, confirm: true},
                        {title: 'Скасувати'}
                    ],
                    onSelect: function(a){
                        if(a.confirm){
                            // Власне РЕДИРЕКТ
                            window.location.href = selected_target.url;
                        }
                        Lampa.Controller.toggle('content');
                    },
                    onBack: function(){
                        Lampa.Controller.toggle('content');
                    }
                });
            });

            content.append(btn);
            scroll.append(content);
            container.append(scroll);
        };

        // Функція перевірки (Ping)
        this.checkStatus = function(url, element, callback) {
            var startTime = Date.now();
            
            // Використовуємо mode: 'no-cors', щоб браузер не блокував запит
            // Ми не побачимо вміст, але побачимо, чи сервер відповідає (status 0 або 200)
            fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' })
                .then(function() {
                    element.removeClass('checking').addClass('online');
                    if(callback) callback(true);
                })
                .catch(function() {
                    element.removeClass('checking').addClass('offline');
                    if(callback) callback(false);
                });
        };
    }

    if(!window.plugin_server_switcher) {
        window.plugin_server_switcher = new ServerSwitcher();
        // Запуск після завантаження додатку
        if(window.appready) window.plugin_server_switcher.init();
        else Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') window.plugin_server_switcher.init();
        });
    }

})();
