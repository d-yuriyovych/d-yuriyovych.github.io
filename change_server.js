(function () {
    'use strict';

    function LampaServerSwitcher() {
        var _this = this;
        var servers = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];

        var selectedIndex = -1;

        // Впровадження стилів
        var style = document.createElement('style');
        style.innerHTML = `
            .sv-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 9999; display: none; align-items: center; justify-content: center; font-family: sans-serif; }
            .sv-modal { background: #1a1a1a; width: 80%; max-width: 500px; padding: 25px; border-radius: 15px; color: #fff; border: 1px solid #333; }
            .sv-title { font-size: 14px; opacity: 0.5; text-transform: uppercase; margin: 15px 0 10px; }
            .sv-title:first-child { margin-top: 0; }
            .sv-current { color: #f5c518; font-weight: bold; font-size: 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .sv-item { padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border: 2px solid transparent; }
            .sv-item.focused { border-color: #fff; background: rgba(255,255,255,0.1); }
            .sv-item.selected { border-color: #f5c518; background: rgba(245, 197, 24, 0.1); }
            .sv-item.disabled { opacity: 0.3; pointer-events: none; }
            .sv-led { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-left: 8px; }
            .sv-online { background: #4caf50; box-shadow: 0 0 8px #4caf50; }
            .sv-offline { background: #f44336; }
            .sv-checking { background: #ffeb3b; }
            .sv-btn { margin-top: 20px; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; background: #333; text-transform: uppercase; cursor: pointer; }
            .sv-btn.active { background: #f5c518; color: #000; }
        `;
        document.head.appendChild(style);

        // Створення HTML вікна
        var overlay = document.createElement('div');
        overlay.className = 'sv-overlay';
        overlay.innerHTML = `
            <div class="sv-modal">
                <div class="sv-title">Поточний сервер:</div>
                <div class="sv-current" id="sv-cur-box">
                    <span id="sv-cur-name">Визначається...</span>
                    <div class="sv-led sv-checking" id="sv-cur-led"></div>
                </div>
                <div class="sv-title">Список серверів:</div>
                <div id="sv-list"></div>
                <div class="sv-btn" id="sv-go">Виберіть сервер</div>
                <div style="text-align:center; margin-top:15px; opacity:0.5; font-size:12px;">Натисніть BACK для виходу</div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.open = function() {
            overlay.style.display = 'flex';
            this.render();
            Lampa.Controller.add('sv_modal', {
                toggle: function() {},
                back: function() {
                    overlay.style.display = 'none';
                    Lampa.Controller.toggle('content');
                }
            });
            Lampa.Controller.toggle('sv_modal');
        };

        this.render = function() {
            var list = document.getElementById('sv-list');
            var curName = document.getElementById('sv-cur-name');
            var curLed = document.getElementById('sv-cur-led');
            var goBtn = document.getElementById('sv-go');
            
            curName.innerText = window.location.hostname;
            list.innerHTML = '';
            selectedIndex = -1;
            goBtn.className = 'sv-btn';
            goBtn.innerText = 'Виберіть сервер';

            this.checkStatus(window.location.origin, curLed);

            servers.forEach(function(s, index) {
                var item = document.createElement('div');
                item.className = 'sv-item';
                item.innerHTML = `<span>${s.name}</span><div class="sv-status">... <div class="sv-led sv-checking"></div></div>`;
                
                item.onclick = function() {
                    if (item.classList.contains('disabled')) return;
                    document.querySelectorAll('.sv-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedIndex = index;
                    goBtn.className = 'sv-btn active';
                    goBtn.innerText = 'Змінити сервер';
                };

                list.appendChild(item);
                _this.checkStatus(s.url, item.querySelector('.sv-led'), item);
            });

            goBtn.onclick = function() {
                if (selectedIndex > -1) {
                    window.location.href = servers[selectedIndex].url;
                }
            };
        };

        this.checkStatus = function(url, led, row) {
            fetch(url, { method: 'HEAD', mode: 'no-cors' }).then(function() {
                led.className = 'sv-led sv-online';
                if (row) row.querySelector('.sv-status').innerHTML = 'OK <div class="sv-led sv-online"></div>';
            }).catch(function() {
                led.className = 'sv-led sv-offline';
                if (row) {
                    row.classList.add('disabled');
                    row.querySelector('.sv-status').innerHTML = 'OFF <div class="sv-led sv-offline"></div>';
                }
            });
        };

        // Ін'єкція в інтерфейс
        this.inject = function() {
            setInterval(function() {
                // 1. Шапка
                if (document.querySelector('.header__actions') && !document.querySelector('.sv-h-btn')) {
                    var b = document.createElement('div');
                    b.className = 'header__action selector sv-h-btn';
                    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path></svg>';
                    b.onclick = function(e) { e.preventDefault(); _this.open(); };
                    document.querySelector('.header__actions').prepend(b);
                }
                // 2. Меню зліва
                if (document.querySelector('.menu__list') && !document.querySelector('.sv-m-btn')) {
                    var m = document.createElement('li');
                    m.className = 'menu__item selector sv-m-btn';
                    m.innerHTML = '<div class="menu__ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg></div><div class="menu__text">Сервер</div>';
                    m.onclick = function(e) { e.preventDefault(); _this.open(); };
                    var s = document.querySelector('.menu__item[data-action="settings"]');
                    if(s) s.before(m); else document.querySelector('.menu__list').appendChild(m);
                }
                // 3. Налаштування
                if (document.querySelector('.settings__content') && !document.querySelector('.sv-s-btn')) {
                    var s = document.createElement('div');
                    s.className = 'settings-param selector sv-s-btn';
                    s.innerHTML = '<div class="settings-param__name">Зміна сервера</div><div class="settings-param__descr">Вибір іншого дзеркала</div>';
                    s.onclick = _this.open;
                    document.querySelector('.settings__content').prepend(s);
                }
            }, 1000);
        };
    }

    var plugin = new LampaServerSwitcher();
    plugin.inject();
})();
