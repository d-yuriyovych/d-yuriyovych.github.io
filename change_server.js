(function () {
    'use strict';

    function ServerSwitcher() {
        var _this = this;
        var servers_list = [
            { name: 'Lampa (MX)',       url: 'http://lampa.mx',         host: 'lampa.mx' },
            { name: 'Lampa (Koyeb)',    url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', host: 'koyeb.app' },
            { name: 'Lampa (VIP)',      url: 'http://lampa.vip',        host: 'lampa.vip' },
            { name: 'Lampa (NNMTV)',    url: 'http://lam.nnmtv.pw',     host: 'lam.nnmtv.pw' },
            { name: 'Prisma',           url: 'http://prisma.ws/',       host: 'prisma.ws' }
        ];

        var current_host = window.location.hostname;
        var selected_target = null;

        var css = `
            .ss-wrapper { padding: 10px; }
            .ss-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-radius: 6px; margin-bottom: 6px; }
            .ss-item.selector:hover, .ss-item.selector.focus { background-color: #fff !important; color: #000; cursor: pointer; }
            .ss-title { margin: 20px 0 10px 0; opacity: 0.5; font-size: 0.9em; text-transform: uppercase; }
            .ss-current-name { color: #f5c518; font-weight: bold; text-transform: uppercase; font-size: 1.1em; }
            .ss-led { width: 10px; height: 10px; border-radius: 50%; background: #444; }
            .ss-led.online { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
            .ss-led.offline { background: #f44336; }
            .ss-led.checking { background: #ffeb3b; }
            .ss-item.active { border: 2px solid #f5c518; }
            .ss-item.disabled { opacity: 0.3; filter: grayscale(1); pointer-events: none; }
            .ss-btn { margin-top: 20px; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; background: #333; text-transform: uppercase; }
            .ss-btn.ready { background: #f5c518 !important; color: #000 !important; cursor: pointer; }
        `;

        this.init = function () {
            Lampa.Utils.putStyle('server-switcher', css);

            // 1. Додавання в головне меню НАЛАШТУВАНЬ (не в "Інше")
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'server_switch_main') {
                    _this.render(e.body);
                }
            });

            // Створюємо пункт в основному списку налаштувань
            this.injectSettingsLink();
            
            // 2. Інжектор для ШАПКИ та МЕНЮ ЗЛІВА
            this.runInjector();
        };

        this.openMenu = function() {
            Lampa.Settings.open('server_switch_main');
        };

        // Вставка кнопки в основний список налаштувань
        this.injectSettingsLink = function() {
            setInterval(function() {
                if ($('.settings__content').length && !$('.settings-ss-link').length) {
                    var link = $(`
                        <div class="settings-param selector settings-ss-link">
                            <div class="settings-param__name">Зміна сервера</div>
                            <div class="settings-param__descr">Вибір дзеркала Lampa</div>
                        </div>
                    `);
                    link.on('click hover:enter', _this.openMenu);
                    $('.settings__content').prepend(link);
                }
            }, 1000);
        };

        this.runInjector = function() {
            setInterval(function() {
                // ШАПКА
                if ($('.header__actions').length && !$('.header-ss-btn').length) {
                    var headBtn = $(`<div class="header__action selector header-ss-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><line x1="2" y1="20" x2="2.01" y2="20"></line></svg>
                    </div>`);
                    headBtn.on('click hover:enter', function(e) {
                        e.stopPropagation();
                        _this.openMenu();
                    });
                    $('.header__actions').prepend(headBtn);
                }

                // МЕНЮ ЗЛІВА
                if ($('.menu__list').length && !$('.menu-ss-btn').length) {
                    var menuBtn = $(`<li class="menu__item selector menu-ss-btn">
                        <div class="menu__ico">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                        </div>
                        <div class="menu__text">Сервер</div>
                    </li>`);
                    menuBtn.on('click hover:enter', function(e) {
                        e.stopPropagation();
                        _this.openMenu();
                    });
                    var settings = $('.menu__item[data-action="settings"]');
                    if(settings.length) settings.before(menuBtn);
                    else $('.menu__list').append(menuBtn);
                }
            }, 1000);
        };

        this.render = function (container) {
            selected_target = null;
            var content = $('<div class="ss-wrapper"></div>');
            
            content.append('<div class="ss-title">Поточний сервер:</div>');
            var cur = servers_list.find(s => current_host.includes(s.host)) || {name: 'Невідомий', url: window.location.href};
            var curItem = $(`
                <div class="ss-item" style="border: 1px solid #ffffff1a;">
                    <div>
                        <div class="ss-current-name">${cur.name}</div>
                        <div style="font-size: 0.8em; opacity: 0.6;">${window.location.protocol}//${window.location.hostname}</div>
                    </div>
                    <div class="ss-led checking" id="led-current"></div>
                </div>
            `);
            content.append(curItem);
            _this.check(cur.url, curItem.find('#led-current'));

            content.append('<div class="ss-title">Список серверів:</div>');
            servers_list.forEach(function(s){
                var item = $(`
                    <div class="ss-item selector">
                        <div style="font-size:1.1em">${s.name}</div>
                        <div class="ss-led checking"></div>
                    </div>
                `);
                item.on('click hover:enter', function(){
                    if($(this).hasClass('disabled')) return;
                    content.find('.ss-item').removeClass('active');
                    $(this).addClass('active');
                    selected_target = s;
                    updateBtn();
                });
                content.append(item);
                _this.check(s.url, item.find('.ss-led'), function(ok){
                    if(!ok) {
                        item.addClass('disabled');
                        item.find('div:first-child').css('text-decoration','line-through');
                    }
                });
            });

            var btn = $('<div class="ss-btn selector">Виберіть сервер</div>');
            function updateBtn() {
                if(selected_target) {
                    btn.addClass('ready').text('Змінити сервер на: ' + selected_target.name);
                } else {
                    btn.removeClass('ready').text('Виберіть сервер зі списку');
                }
            }

            btn.on('click hover:enter', function(){
                if(!selected_target) return;
                Lampa.Select.show({
                    title: 'Зміна сервера',
                    items: [
                        {title: 'Перейти на ' + selected_target.name, confirm: true},
                        {title: 'Скасувати'}
                    ],
                    onSelect: function(a){
                        if(a.confirm) window.location.href = selected_target.url;
                        else Lampa.Controller.toggle('content');
                    },
                    onBack: function(){ Lampa.Controller.toggle('content'); }
                });
            });

            content.append(btn);
            container.empty().append(content);
        };

        this.check = function(url, el, cb) {
            fetch(url, { method: 'HEAD', mode: 'no-cors' })
                .then(()=>{ el.removeClass('checking').addClass('online'); if(cb) cb(true); })
                .catch(()=>{ el.removeClass('checking').addClass('offline'); if(cb) cb(false); });
        };
    }

    if(window.appready) new ServerSwitcher().init();
    else Lampa.Listener.follow('app', function(e){ if(e.type=='ready') new ServerSwitcher().init(); });
})();
