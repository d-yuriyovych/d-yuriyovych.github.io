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

        var selected_target = null;
        var current_host = window.location.hostname;

        this.init = function () {
            Lampa.Utils.putStyle('server-switcher', `
                .ss-page { padding: 20px; }
                .ss-title { font-size: 1.2em; opacity: 0.6; margin: 20px 0 10px 0; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; }
                .ss-title.no-select { pointer-events: none; }
                .ss-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-radius: 8px; margin-bottom: 8px; background: rgba(255,255,255,0.05); cursor: pointer; }
                .ss-item.focus { background: #fff !important; color: #000; }
                .ss-item.active { border: 2px solid #f5c518; background: rgba(245, 197, 24, 0.1); }
                .ss-item.disabled { opacity: 0.3; filter: grayscale(1); pointer-events: none; }
                .ss-current-name { color: #f5c518; font-weight: bold; font-size: 1.2em; }
                .ss-status { display: flex; align-items: center; font-size: 0.9em; }
                .ss-led { width: 12px; height: 12px; border-radius: 50%; margin-left: 10px; background: #555; }
                .ss-led.online { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
                .ss-led.offline { background: #f44336; }
                .ss-led.checking { background: #ffeb3b; }
                .ss-btn-change { margin-top: 30px; padding: 18px; text-align: center; border-radius: 10px; font-weight: bold; background: #333; text-transform: uppercase; font-size: 1.1em; }
                .ss-btn-change.ready { background: #f5c518 !important; color: #000 !important; }
            `);

            // Реєструємо компонент, щоб не було Script Error
            Lampa.Component.add('server_switch_main', this.createPage);

            this.runInjector();
        };

        this.open = function() {
            Lampa.Activity.push({
                url: '',
                title: 'Зміна сервера',
                component: 'server_switch_main',
                page: 1
            });
        };

        this.runInjector = function() {
            setInterval(function() {
                // ШАПКА
                if ($('.header__actions').length && !$('.header-ss-btn').length) {
                    var headBtn = $('<div class="header__action selector header-ss-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path><circle cx="2" cy="20" r="1"></circle></svg></div>');
                    headBtn.on('click hover:enter', _this.open);
                    $('.header__actions').prepend(headBtn);
                }

                // МЕНЮ ЗЛІВА
                if ($('.menu__list').length && !$('.menu-ss-btn').length) {
                    var menuBtn = $('<li class="menu__item selector menu-ss-btn"><div class="menu__ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg></div><div class="menu__text">Сервер</div></li>');
                    menuBtn.on('click hover:enter', _this.open);
                    var settings = $('.menu__item[data-action="settings"]');
                    if(settings.length) settings.before(menuBtn);
                    else $('.menu__list').append(menuBtn);
                }

                // В ГОЛОВНИХ НАЛАШТУВАННЯХ
                if ($('.settings__content').length && !$('.settings-ss-link').length) {
                    var link = $('<div class="settings-param selector settings-ss-link"><div class="settings-param__name">Зміна сервера</div><div class="settings-param__descr">Вибір дзеркала для редиректу</div></div>');
                    link.on('click hover:enter', _this.open);
                    $('.settings__content').prepend(link);
                }
            }, 1000);
        };

        this.createPage = function(object) {
            var scroll = new Lampa.Scroll({mask: true, over: true});
            var content = $('<div class="ss-page"></div>');
            
            this.create = function() {
                var _page = this;
                selected_target = null;

                // Поточний сервер
                content.append('<div class="ss-title no-select">Поточний сервер:</div>');
                var cur = servers_list.find(s => current_host.includes(s.host)) || {name: 'Стандартний', url: window.location.origin};
                var curItem = $('<div class="ss-item ss-current-block no-select"><div class="ss-current-name">' + cur.name + '</div><div class="ss-status">перевірка...<div class="ss-led checking"></div></div></div>');
                content.append(curItem);
                _this.ping(cur.url, curItem);

                // Список
                content.append('<div class="ss-title no-select">Список серверів:</div>');
                servers_list.forEach(function(s) {
                    var item = $('<div class="ss-item selector"><div class="ss-name">' + s.name + '</div><div class="ss-status">-<div class="ss-led checking"></div></div></div>');
                    item.on('hover:enter', function() {
                        if(item.hasClass('disabled')) return;
                        content.find('.ss-item').removeClass('active');
                        item.addClass('active');
                        selected_target = s;
                        _page.updateBtn();
                    });
                    content.append(item);
                    _this.ping(s.url, item, true);
                });

                // Кнопка
                this.btn = $('<div class="ss-btn-change selector">Оберіть сервер</div>');
                this.btn.on('hover:enter', function() {
                    if(!selected_target) {
                        Lampa.Noty.show('Будь ласка, оберіть сервер зі списку');
                        return;
                    }
                    Lampa.Select.show({
                        title: 'Редирект',
                        items: [{title: 'Змінити сервер на ' + selected_target.name, ready: true}, {title: 'Відміна'}],
                        onSelect: function(a) {
                            if(a.ready) window.location.href = selected_target.url;
                            else Lampa.Controller.toggle('content');
                        },
                        onBack: function() { Lampa.Controller.toggle('content'); }
                    });
                });
                content.append(this.btn);

                scroll.append(content);
                return scroll.render();
            };

            this.updateBtn = function() {
                if(selected_target) {
                    this.btn.addClass('ready').text('Змінити сервер');
                }
            };

            this.render = function() { return this.create(); };
            this.pause = function() {};
            this.stop = function() {};
            this.destroy = function() { scroll.destroy(); content.remove(); };
        };

        this.ping = function(url, el, canDisable) {
            var led = el.find('.ss-led');
            var statusText = el.find('.ss-status');
            fetch(url, {method: 'HEAD', mode: 'no-cors', cache: 'no-cache'})
                .then(function() {
                    led.removeClass('checking').addClass('online');
                    statusText.html('онлайн <div class="ss-led online"></div>');
                })
                .catch(function() {
                    led.removeClass('checking').addClass('offline');
                    statusText.html('офлайн <div class="ss-led offline"></div>');
                    if(canDisable) el.addClass('disabled');
                });
        };
    }

    var switcher = new ServerSwitcher();
    if(window.appready) switcher.init();
    else Lampa.Listener.follow('app', function(e){ if(e.type=='ready') switcher.init(); });
})();
