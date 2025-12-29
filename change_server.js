(function () {
    'use strict';

    var icon_server = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></svg>';

    function startPlugin() {
        // Додаємо новий розділ в Налаштування
        Lampa.SettingsApi.addComponent({
            component: 'server_switcher',
            name: 'Зміна сервера',
            icon: icon_server
        });

        // Додаємо параметр вибору всередину розділу
        Lampa.SettingsApi.addParam({
            component: 'server_switcher',
            param: {
                name: 'selected_lampa_domain',
                type: 'select',
                values: {
                    'none': 'Поточний',
                    'lampa.mx': 'Lampa (MX)',
                    'central-roze-d-yuriyovych-74a9dc5c.koyeb.app': 'Lampa (Koyeb)',
                    'lampa.vip': 'Lampa (VIP)',
                    'lam.nnmtv.pw': 'Lampa (NNMTV)',
                    'prisma.ws': 'Prisma'
                },
                default: 'none'
            },
            field: {
                name: 'Оберіть домен Lampa',
                description: 'Після вибору додаток автоматично перезавантажиться на новий сервер'
            },
            onChange: function (value) {
                if (value && value !== 'none') {
                    var protocol = value.includes('koyeb.app') || value.includes('prisma.ws') ? 'https://' : 'http://';
                    
                    Lampa.Noty.show('Перенаправлення на ' + value);
                    
                    // Невеликий таймаут, щоб користувач побачив сповіщення
                    setTimeout(function() {
                        window.location.href = protocol + value;
                    }, 1000);
                }
            }
        });
    }

    // Чекаємо готовності додатку
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                startPlugin();
            }
        });
    }
})();
