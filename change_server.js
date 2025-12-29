(function () {
    'use strict';

    function ServerSwitcher() {
        const server_list = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];

        let selected_new_server = null;
        let html = null;

        // Очищення URL для порівняння
        function cleanUrl(url) {
            return (url || '').replace(/\/$/, '').toLowerCase();
        }

        // Перевірка статусу
        function checkServerStatus(server, element, status_text) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            fetch(server.url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
                .then(() => {
                    clearTimeout(timeoutId);
                    status_text.text('Доступний').css('color', '#4caf50');
                    element.find('.status-dot').css('background-color', '#4caf50');
                    
                    // Робимо активним тільки якщо це елемент списку (не заголовок)
                    if(element.hasClass('server-candidate')) {
                        element.removeClass('server-offline').addClass('selector');
                    }
                })
                .catch(() => {
                    clearTimeout(timeoutId);
                    status_text.text('Недоступний').css('color', '#f44336');
                    element.find('.status-dot').css('background-color', '#f44336');
                    
                    if(element.hasClass('server-candidate')) {
                        element.addClass('server-offline').removeClass('selector');
                        element.css('opacity', '0.5');
                    }
                });
        }

        this.create = function () {
            // Створюємо основний контейнер
            html = $(`
                <div class="server-switcher-plugin">
                    <div class="server-switcher-scroll" style="padding: 20px;"></div>
                    <div class="server-switcher-footer" style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);"></div>
                </div>
            `);

            const scroll = html.find('.server-switcher-scroll');
            const footer = html.find('.server-switcher-footer');

            // --- 1. Поточний сервер ---
            scroll.append('<div style="margin-bottom: 10px; color: #aaa; font-size: 1.2em;">Поточний сервер:</div>');

            let current_url = Lampa.Storage.get('source', 'lampa.mx');
            if (current_url === 'lampa.mx') current_url = 'http://lampa.mx';

            const current_obj = server_list.find(s => cleanUrl(s.url) === cleanUrl(current_url)) || { name: current_url, url: current_url };

            const current_item = $(`
                <div class="server-item" style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 30px; display: flex; align-items: center;">
                    <div class="status-dot" style="width: 12px; height: 12px; border-radius: 50%; background: #999; margin-right: 15px;"></div>
                    <div>
                        <div style="font-size: 1.4em; font-weight: bold; color: #ffeb3b;">${current_obj.name}</div>
                        <div style="font-size: 0.9em; margin-top: 5px;">Статус: <span class="status-text">Перевірка...</span></div>
                    </div>
                </div>
            `);
            
            checkServerStatus(current_obj, current_item, current_item.find('.status-text'));
            scroll.append(current_item);

            // --- 2. Список серверів ---
            scroll.append('<div style="margin-bottom: 15px; color: #aaa; font-size: 1.2em;">Список доступних серверів:</div>');

            server_list.forEach(server => {
                const item = $(`
                    <div class="server-item server-candidate" style="padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; align-items: center; border: 2px solid transparent;">
                        <div class="status-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #999; margin-right: 15px;"></div>
                        <div style="flex-grow: 1;">
                            <div style="font-size: 1.2em; font-weight: 500;">${server.name}</div>
                            <div style="font-size: 0.8em; color: #ccc;">Статус: <span class="list-status-text">Перевірка...</span></div>
                        </div>
                    </div>
                `);

                // Спочатку елемент неактивний, поки не пройде перевірка
                item.removeClass('selector');

                item.on('hover:enter', function () {
                    if ($(this).hasClass('server-offline')) return;

                    selected_new_server = server;
                    
                    // Візуальне виділення
                    scroll.find('.server-candidate').css('background', 'transparent').css('border-color', 'transparent');
                    $(this).css('background', 'rgba(255,255,255,0.05)').css('border-color', '#ffeb3b');

                    // Оновлення кнопки
                    btn_text.text('Змінити сервер на: ' + server.name);
                    apply_btn.css('background-color', '#673ab7').css('opacity', '1');
                });

                checkServerStatus(server, item, item.find('.list-status-text'));
                scroll.append(item);
            });

            // --- 3. Кнопка дії ---
            const apply_btn = $(`
                <div class="selector" style="background-color: #333; padding: 15px; text-align: center; border-radius: 8px; cursor: pointer; transition: all 0.3s; opacity: 0.7;">
                    <span class="btn-text" style="font-weight: bold; font-size: 1.1em;">Виберіть сервер зі списку</span>
                </div>
            `);
            
            const btn_text = apply_btn.find('.btn-text');

            apply_btn.on('hover:enter', function () {
                if (!selected_new_server) {
                    Lampa.Noty.show('Спочатку виберіть доступний сервер (зелений статус)');
                    return;
                }

                Lampa.Select.show({
                    title: 'Зміна сервера',
                    text: `Змінити сервер на <b>${selected_new_server.name}</b> і перезавантажити додаток?`,
                    items: [
                        { title: 'Так, змінити', value: 1 },
                        { title: 'Скасувати', value: 0 }
                    ],
                    onSelect: (v) => {
                        if (v.value === 1) {
                            let final_url = selected_new_server.url;
                            if(final_url.includes('lampa.mx')) final_url = 'lampa.mx';
                            
                            Lampa.Storage.set('source', final_url);
                            location.reload();
                        }
                    }
                });
            });

            footer.append(apply_btn);

            return html; // ВАЖЛИВО: Повертаємо об'єкт для рендеру
        };
    }

    function addSettingsButton() {
        if (window.appready) {
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'main') {
                    // ВАЖЛИВО: Перевірка на дублікати
                    if ($('.settings-param[data-name="server_switch"]').length > 0) return;

                    let item = $(`
                        <div class="settings-param selector" data-type="button" data-name="server_switch">
                            <div class="settings-param__name">Змінити сервер</div>
                            <div class="settings-param__descr">Менеджер серверів (Plugin)</div>
                        </div>
                    `);

                    item.on('hover:enter', function () {
                        const switcher = new ServerSwitcher();
                        Lampa.Activity.push({
                            url: '',
                            title: 'Вибір сервера',
                            component: 'server_switcher',
                            stats: false,
                            create: function () { 
                                return switcher.create(); 
                            }
                        });
                    });

                    $('.settings__content').append(item);
                }
            });
        } else {
            setTimeout(addSettingsButton, 500);
        }
    }

    // Реєстрація контролера
    Lampa.Controller.add('server_switcher', {
        toggle: function () {
            // Шукаємо активний компонент
            let active = $('.server-switcher-plugin');
            Lampa.Controller.collectionSet(active);
            
            // Фокус на списку або кнопці
            let focusable = active.find('.selector').first();
            if(focusable.length) {
                Lampa.Controller.collectionFocus(focusable, active);
            }
        },
        left: function () { Lampa.Controller.toggle('settings'); },
        up: function () { 
            let active = $('.server-switcher-plugin');
            Lampa.Controller.collectionUp(active); 
        },
        down: function () { 
            let active = $('.server-switcher-plugin');
            Lampa.Controller.collectionDown(active); 
        },
        back: function () { Lampa.Activity.backward(); }
    });

    addSettingsButton();

})();
