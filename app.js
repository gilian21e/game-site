// ================= Данные об играх =================
const GAMES = {
    cs: {
        title: 'Counter-Strike 2',
        genre: 'Тактический шутер',
        img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
        link: 'https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/',
        text: 'Две команды по пять игроков: террористы закладывают бомбу, спецназ пытается её обезвредить. Матч выигрывает команда, первой взявшая 13 раундов.',
        facts: [
            ['Разработчик', 'Valve'],
            ['Вышла', '2023 (серия с 2000)'],
            ['Режим', '5 на 5'],
            ['Цена', 'Бесплатно'],
            ['Где играть', 'Steam'],
        ],
    },
    dota: {
        title: 'DOTA 2',
        genre: 'MOBA',
        img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/570/capsule_616x353.jpg?t=1769535998',
        link: 'https://store.steampowered.com/app/570/Defense_of_the_Planet/',
        text: 'Две команды по пять героев сражаются на трёх линиях. Цель — разрушить главное здание (Древнего) на базе соперника. В игре больше 120 героев.',
        facts: [
            ['Разработчик', 'Valve'],
            ['Вышла', '2013'],
            ['Режим', '5 на 5'],
            ['Цена', 'Бесплатно'],
            ['Где играть', 'Steam'],
        ],
    },
    fortnite: {
        title: 'Fortnite',
        genre: 'Королевская битва',
        img: 'https://play-lh.googleusercontent.com/nUzo52s5UVOrwyLCfFXM0PKgInAaLaYe-hrUedFAT3gMbhKBn0HlvnFai7Ao5GTEB51IvWtIC3szG2O-wxAPIA',
        link: 'https://www.epicgames.com/fortnite',
        text: 'До ста игроков высаживаются на остров, собирают оружие и строят укрепления. Побеждает тот, кто останется последним.',
        facts: [
            ['Разработчик', 'Epic Games'],
            ['Вышла', '2017'],
            ['Режим', 'До 100 игроков'],
            ['Цена', 'Бесплатно'],
            ['Где играть', 'Epic Games'],
        ],
    },
};

const root = document.documentElement;
const reduceMotion = () =>
    root.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

// безопасная работа с localStorage (в приватном режиме может не работать)
const store = {
    get(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    },
};

// ================= Появление при прокрутке =================
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealItems.forEach((el, i) => {
        el.style.setProperty('--delay', (i % 4) * 90 + 'ms');
        revealObserver.observe(el);
    });
} else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
}

// ================= Подсветка раздела в меню =================
const navLinks = document.querySelectorAll('.nav__links a');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
            const active = a.getAttribute('href') === '#' + entry.target.id;
            a.classList.toggle('is-current', active);
            if (active) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
        });
    });
}, { rootMargin: '-45% 0px -50% 0px' });
['top', 'favorite', 'top-games', 'roulette', 'wishlist', 'platforms'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
});

// мобильное меню закрывается после выбора пункта
const menu = document.getElementById('menu');
menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
        if (menu.hidePopover) menu.hidePopover();
    })
);

// ================= Настройки =================
const settings = Object.assign({ accent: 'amber', motion: true, grain: true }, store.get('gg-settings', {}));
const accentInputs = document.querySelectorAll('input[name="accent"]');
const motionInput = document.getElementById('opt-motion');
const grainInput = document.getElementById('opt-grain');

function applySettings() {
    root.dataset.accent = settings.accent;
    root.classList.toggle('no-motion', !settings.motion);
    root.classList.toggle('no-grain', !settings.grain);
    accentInputs.forEach((i) => (i.checked = i.value === settings.accent));
    motionInput.checked = settings.motion;
    grainInput.checked = settings.grain;
    if (!settings.motion) revealItems.forEach((el) => el.classList.add('is-visible'));
    store.set('gg-settings', settings);
}

accentInputs.forEach((input) =>
    input.addEventListener('change', () => {
        settings.accent = input.value;
        applySettings();
    })
);
motionInput.addEventListener('change', () => {
    settings.motion = motionInput.checked;
    applySettings();
});
grainInput.addEventListener('change', () => {
    settings.grain = grainInput.checked;
    applySettings();
});
document.getElementById('opt-reset').addEventListener('click', () => {
    Object.assign(settings, { accent: 'amber', motion: true, grain: true });
    applySettings();
});
applySettings();

// ================= Фильтр игр =================
const chips = document.querySelectorAll('.chip');
const gameCards = document.querySelectorAll('.game');
const gamesEmpty = document.querySelector('.games__empty');
const gamesList = document.querySelector('.games');

chips.forEach((chip) =>
    chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        chips.forEach((c) => {
            const on = c === chip;
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-pressed', String(on));
        });
        let shown = 0;
        gameCards.forEach((card) => {
            const match = filter === 'all' || card.dataset.genre === filter;
            card.hidden = !match;
            if (match) shown++;
        });
        gamesList.classList.toggle('is-filtered', filter !== 'all');
        gamesEmpty.hidden = shown > 0;
    })
);

// ================= Окно «Подробнее» =================
const modal = document.getElementById('game-modal');

document.querySelectorAll('[data-details]').forEach((btn) =>
    btn.addEventListener('click', () => {
        const g = GAMES[btn.dataset.details];
        if (!g) return;
        document.getElementById('modal-img').src = g.img;
        document.getElementById('modal-img').alt = g.title;
        document.getElementById('modal-genre').textContent = g.genre;
        document.getElementById('modal-title').textContent = g.title;
        document.getElementById('modal-text').textContent = g.text;
        document.getElementById('modal-link').href = g.link;
        const facts = document.getElementById('modal-facts');
        facts.replaceChildren();
        g.facts.forEach(([k, v]) => {
            const row = document.createElement('div');
            const dt = document.createElement('dt');
            const dd = document.createElement('dd');
            dt.textContent = k;
            dd.textContent = v;
            row.append(dt, dd);
            facts.append(row);
        });
        modal.showModal();
    })
);

// закрытие по клику на фон для браузеров без closedby
if (!('closedBy' in HTMLDialogElement.prototype)) {
    modal.addEventListener('click', (event) => {
        if (event.target !== modal) return;
        const r = modal.getBoundingClientRect();
        const inside = r.top <= event.clientY && event.clientY <= r.bottom &&
            r.left <= event.clientX && event.clientX <= r.right;
        if (!inside) modal.close();
    });
}

// ================= Вишлист =================
const wishForm = document.getElementById('wish-form');
const wishInput = document.getElementById('wish-input');
const wishError = document.getElementById('wish-error');
const wishList = document.getElementById('wish-list');
const wishEmpty = document.getElementById('wish-empty');
const wishCount = document.getElementById('wish-count');
let wishes = store.get('gg-wishlist', []);

function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

function renderWishes() {
    wishList.replaceChildren();
    wishes.forEach((w, index) => {
        const li = document.createElement('li');
        li.className = 'wish' + (w.done ? ' is-done' : '');

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = w.done;
        check.id = 'wish-' + index;
        check.addEventListener('change', () => {
            w.done = check.checked;
            saveWishes();
        });

        const label = document.createElement('label');
        label.htmlFor = check.id;
        label.textContent = w.name;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'wish__remove';
        remove.setAttribute('aria-label', 'Удалить ' + w.name);
        remove.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        remove.addEventListener('click', () => {
            wishes.splice(index, 1);
            saveWishes();
        });

        li.append(check, label, remove);
        wishList.append(li);
    });

    wishEmpty.hidden = wishes.length > 0;
    const done = wishes.filter((w) => w.done).length;
    wishCount.textContent = wishes.length
        ? wishes.length + ' ' + plural(wishes.length, 'игра', 'игры', 'игр') + ' · сыграно ' + done
        : '';
}

function saveWishes() {
    store.set('gg-wishlist', wishes);
    renderWishes();
}

function showWishError(text) {
    wishError.textContent = text;
    wishInput.setAttribute('aria-invalid', text ? 'true' : 'false');
}

wishForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = wishInput.value.trim();
    if (!name) {
        showWishError('Напиши название игры.');
        wishInput.focus();
        return;
    }
    if (wishes.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
        showWishError('Эта игра уже есть в списке.');
        wishInput.select();
        return;
    }
    showWishError('');
    wishes.push({ name, done: false });
    wishInput.value = '';
    saveWishes();
});
wishInput.addEventListener('input', () => showWishError(''));
renderWishes();

// ================= Рулетка =================
const rouletteBtn = document.getElementById('roulette-btn');
const rouletteResult = document.getElementById('roulette-result');

rouletteBtn.addEventListener('click', () => {
    const pool = ['Counter-Strike', 'DOTA 2', 'Fortnite']
        .concat(wishes.filter((w) => !w.done).map((w) => w.name));
    const winner = pool[Math.floor(Math.random() * pool.length)];

    if (reduceMotion()) {
        rouletteResult.textContent = winner;
        return;
    }

    rouletteBtn.disabled = true;
    rouletteResult.classList.add('is-spinning');
    let step = 0;
    const total = 16;
    const tick = () => {
        step++;
        if (step < total) {
            rouletteResult.textContent = pool[Math.floor(Math.random() * pool.length)];
            setTimeout(tick, 50 + step * step * 1.4);
        } else {
            rouletteResult.textContent = winner;
            rouletteResult.classList.remove('is-spinning');
            rouletteResult.classList.add('is-win');
            setTimeout(() => rouletteResult.classList.remove('is-win'), 700);
            rouletteBtn.disabled = false;
        }
    };
    tick();
});
