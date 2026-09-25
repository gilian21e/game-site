// =====================================================
// Логика сайта. Данные об играх лежат в data.js (массив GAMES).
// =====================================================

const root = document.documentElement;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const byId = (id) => GAMES.find((g) => g.id === id);

// ---------- Хранилище (в приватном режиме может не работать) ----------
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

// ---------- Состояние ----------
const DEFAULT_SETTINGS = { accent: 'amber', size: 'normal', motion: true, grain: true };
const state = {
    settings: Object.assign({}, DEFAULT_SETTINGS, store.get('gg-settings', {})),
    favs: store.get('gg-favs', []),            // id игр в избранном
    ratings: store.get('gg-ratings', {}),      // { id: 1..5 }
    wishes: store.get('gg-wishlist', []),      // [{ name, done }]
    filter: { q: '', genre: 'all', sort: 'popular', free: false, fav: false },
    view: store.get('gg-view', 'grid'),
    rouletteSource: 'top',
    modalGame: null,
};

const reduceMotion = () =>
    !state.settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

// ---------- Уведомления ----------
let toastTimer;
function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-shown'), 2200);
}

// ---------- Обложка: картинка или сгенерированная заглушка ----------
function hue(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
}

function coverFallback(game) {
    const div = document.createElement('div');
    div.className = 'cover-fallback';
    div.style.setProperty('--h', hue(game.id));
    const letters = game.short.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    div.innerHTML = '<span>' + escapeHtml(letters) + '</span>';
    return div;
}

function cover(game, lazy) {
    if (!game.img) return coverFallback(game);
    const img = document.createElement('img');
    img.src = game.img;
    img.alt = game.title;
    if (lazy) img.loading = 'lazy';
    img.addEventListener('error', () => img.replaceWith(coverFallback(game)), { once: true });
    return img;
}

// =====================================================
// Меню
// =====================================================
const SECTIONS = [
    ['top-games', 'Топ'],
    ['catalog', 'Каталог'],
    ['roulette', 'Рулетка'],
    ['wishlist', 'Хочу сыграть'],
    ['stats', 'Статистика'],
];

function renderNav() {
    const html = SECTIONS.map(([id, name]) => '<li><a href="#' + id + '">' + name + '</a></li>').join('');
    $('#nav-links').innerHTML = html;
    $('#menu-links').innerHTML = html;
    const menu = $('#menu');
    menu.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => menu.hidePopover && menu.hidePopover())
    );
}

// подсветка текущего раздела
function watchSections() {
    const links = $$('#nav-links a');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((a) => {
                const on = a.getAttribute('href') === '#' + entry.target.id;
                a.classList.toggle('is-current', on);
                if (on) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach((s) => observer.observe(s));
}

// =====================================================
// Первый экран и бегущая строка
// =====================================================
function renderHero() {
    const genres = new Set(GAMES.map((g) => g.genre)).size;
    const free = GAMES.filter((g) => g.free).length;
    $('#hero-numbers').innerHTML =
        '<div><dt>Игр в каталоге</dt><dd>' + GAMES.length + '</dd></div>' +
        '<div><dt>Жанров</dt><dd>' + genres + '</dd></div>' +
        '<div><dt>Бесплатных</dt><dd>' + free + '</dd></div>';

    const items = GAMES.map((g) => '<span>' + escapeHtml(g.short) + '</span><i></i>').join('');
    $('#marquee').innerHTML = items + items;
}

// =====================================================
// Мой топ
// =====================================================
function renderTop() {
    const list = $('#top-list');
    list.replaceChildren();
    GAMES.filter((g) => g.top).sort((a, b) => a.top - b.top).forEach((g) => {
        const li = document.createElement('li');
        li.className = 'game reveal' + (g.top === 1 ? ' game--first' : '');
        li.innerHTML =
            '<div class="bezel"><div class="bezel__core game__core">' +
                '<div class="game__media"><span class="tag">' + escapeHtml(g.genre) + '</span></div>' +
                '<div class="game__body">' +
                    '<span class="game__rank mono">#0' + g.top + '</span>' +
                    '<h3>' + escapeHtml(g.short) + '</h3>' +
                    '<div class="game__actions">' +
                        '<a class="btn btn--small" href="' + g.link + '" target="_blank" rel="noopener"><em>Начать играть</em>' +
                        '<span class="btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>' +
                        '<button class="text-btn" data-open="' + g.id + '">Подробнее</button>' +
                    '</div>' +
                '</div>' +
            '</div></div>';
        li.querySelector('.game__media').prepend(cover(g, true));
        list.append(li);
    });
}

// =====================================================
// Каталог
// =====================================================
function renderGenreChips() {
    const genres = ['all'].concat(Array.from(new Set(GAMES.map((g) => g.genre))).sort((a, b) => a.localeCompare(b, 'ru')));
    const box = $('#genre-chips');
    box.innerHTML = genres.map((g) => {
        const count = g === 'all' ? GAMES.length : GAMES.filter((x) => x.genre === g).length;
        const on = state.filter.genre === g;
        return '<button class="chip' + (on ? ' is-active' : '') + '" data-genre="' + escapeHtml(g) + '" aria-pressed="' + on + '">' +
            (g === 'all' ? 'Все жанры' : escapeHtml(g)) + ' <span class="chip__count">' + count + '</span></button>';
    }).join('');
}

function filteredGames() {
    const f = state.filter;
    const q = f.q.trim().toLowerCase();
    let list = GAMES.filter((g) => {
        if (f.genre !== 'all' && g.genre !== f.genre) return false;
        if (f.free && !g.free) return false;
        if (f.fav && !state.favs.includes(g.id)) return false;
        if (q && !(g.title + ' ' + g.dev + ' ' + g.genre).toLowerCase().includes(q)) return false;
        return true;
    });
    const sorters = {
        popular: (a, b) => (a.top || 99) - (b.top || 99) || a.order - b.order,
        name: (a, b) => a.title.localeCompare(b.title, 'ru'),
        new: (a, b) => b.year - a.year,
        old: (a, b) => a.year - b.year,
        rating: (a, b) => (state.ratings[b.id] || 0) - (state.ratings[a.id] || 0) || a.order - b.order,
    };
    return list.sort(sorters[f.sort]);
}

function starsText(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

// animate = true, когда меняются фильтры (карточки плавно появляются заново)
function renderCatalog(animate) {
    const list = $('#catalog-list');
    const games = filteredGames();
    list.className = 'catalog catalog--' + state.view + (animate ? ' catalog--animate' : '');
    list.replaceChildren();

    games.forEach((g, i) => {
        const fav = state.favs.includes(g.id);
        const rating = state.ratings[g.id] || 0;
        const li = document.createElement('li');
        li.className = 'card';
        li.style.setProperty('--i', Math.min(i, 8));
        li.innerHTML =
            '<div class="card__media"></div>' +
            '<div class="card__body">' +
                '<p class="card__genre mono">' + escapeHtml(g.genre) + (g.top ? ' · Топ ' + g.top : '') + '</p>' +
                '<h3 class="card__title">' + escapeHtml(g.title) + '</h3>' +
                '<p class="card__meta muted">' + escapeHtml(g.dev) + ' · ' + g.year + '</p>' +
                '<div class="card__foot">' +
                    '<span class="badge' + (g.free ? ' badge--free' : '') + '">' + (g.free ? 'Бесплатно' : 'Платная') + '</span>' +
                    (rating ? '<span class="card__stars" aria-label="Моя оценка ' + rating + ' из 5">' + starsText(rating) + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<button class="card__open" data-open="' + g.id + '"><span class="visually-hidden">Подробнее: ' + escapeHtml(g.title) + '</span></button>' +
            '<button class="card__fav' + (fav ? ' is-on' : '') + '" data-fav="' + g.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Убрать из избранного' : 'В избранное') + '">' +
                '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' +
            '</button>';
        li.querySelector('.card__media').append(cover(g, true));
        list.append(li);
    });

    const n = games.length;
    $('#catalog-count').textContent = 'Показано ' + n + ' ' + plural(n, 'игра', 'игры', 'игр') + ' из ' + GAMES.length;
    $('#catalog-empty').hidden = n > 0;
}

function setupCatalog() {
    renderGenreChips();

    $('#genre-chips').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-genre]');
        if (!chip) return;
        state.filter.genre = chip.dataset.genre;
        renderGenreChips();
        renderCatalog(true);
    });

    $('#search').addEventListener('input', (e) => {
        state.filter.q = e.target.value;
        renderCatalog(true);
    });

    $('#sort').addEventListener('change', (e) => {
        state.filter.sort = e.target.value;
        renderCatalog(true);
    });

    const toggleChip = (btn, key) => btn.addEventListener('click', () => {
        state.filter[key] = !state.filter[key];
        btn.classList.toggle('is-active', state.filter[key]);
        btn.setAttribute('aria-pressed', String(state.filter[key]));
        renderCatalog(true);
    });
    toggleChip($('#only-free'), 'free');
    toggleChip($('#only-fav'), 'fav');

    $$('[data-view]').forEach((btn) => btn.addEventListener('click', () => {
        state.view = btn.dataset.view;
        store.set('gg-view', state.view);
        syncViewButtons();
        renderCatalog(true);
    }));
    syncViewButtons();

    $('#filters-reset').addEventListener('click', resetFilters);

    // клавиша «/» — перейти к поиску
    document.addEventListener('keydown', (e) => {
        const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
        if (e.key === '/' && !typing && !$('#game-modal').open) {
            e.preventDefault();
            $('#search').focus();
            $('#search').scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' });
        }
    });

    renderCatalog();
}

function syncViewButtons() {
    $$('[data-view]').forEach((b) => {
        const on = b.dataset.view === state.view;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
    });
}

function resetFilters() {
    Object.assign(state.filter, { q: '', genre: 'all', sort: 'popular', free: false, fav: false });
    $('#search').value = '';
    $('#sort').value = 'popular';
    ['#only-free', '#only-fav'].forEach((s) => {
        $(s).classList.remove('is-active');
        $(s).setAttribute('aria-pressed', 'false');
    });
    renderGenreChips();
    renderCatalog(true);
}

// =====================================================
// Избранное и оценки
// =====================================================
function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i === -1) state.favs.push(id);
    else state.favs.splice(i, 1);
    store.set('gg-favs', state.favs);
    const g = byId(id);
    toast(i === -1 ? g.short + ' — в избранном' : g.short + ' — убрана из избранного');
    refreshAll();
}

function setRating(id, value) {
    if (state.ratings[id] === value) delete state.ratings[id];
    else state.ratings[id] = value;
    store.set('gg-ratings', state.ratings);
    refreshAll();
}

// один обработчик кликов на всю страницу
document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) openModal(open.dataset.open);
    const fav = e.target.closest('[data-fav]');
    if (fav) toggleFav(fav.dataset.fav);
});

// =====================================================
// Окно «Подробнее»
// =====================================================
function openModal(id) {
    const g = byId(id);
    if (!g) return;
    state.modalGame = g;
    const media = $('#modal-media');
    media.replaceChildren(cover(g, false));
    $('#modal-genre').textContent = g.genre + (g.top ? ' · Мой топ #' + g.top : '');
    $('#modal-title').textContent = g.title;
    $('#modal-text').textContent = g.text;
    $('#modal-link').href = g.link;

    const facts = [
        ['Разработчик', g.dev],
        ['Вышла', g.year + (g.yearNote ? ' (' + g.yearNote + ')' : '')],
        ['Режим', g.mode],
        ['Цена', g.free ? 'Бесплатно' : 'Платная'],
        ['Где играть', g.platform],
    ];
    const dl = $('#modal-facts');
    dl.replaceChildren();
    facts.forEach(([k, v]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = v;
        row.append(dt, dd);
        dl.append(row);
    });

    renderModalState();
    const modal = $('#game-modal');
    if (!modal.open) modal.showModal();
}

function renderModalState() {
    const g = state.modalGame;
    if (!g) return;
    const fav = state.favs.includes(g.id);
    const favBtn = $('#modal-fav');
    favBtn.textContent = fav ? '♥ В избранном' : '♡ В избранное';
    favBtn.classList.toggle('is-active', fav);
    favBtn.setAttribute('aria-pressed', String(fav));

    const inWish = state.wishes.some((w) => w.name.toLowerCase() === g.title.toLowerCase());
    const wishBtn = $('#modal-wish');
    wishBtn.textContent = inWish ? '✓ В списке' : '+ Хочу сыграть';
    wishBtn.disabled = inWish;

    const rating = state.ratings[g.id] || 0;
    const stars = $('#modal-stars');
    stars.innerHTML = [1, 2, 3, 4, 5].map((n) =>
        '<button class="star' + (n <= rating ? ' is-on' : '') + '" data-star="' + n + '" role="radio" aria-checked="' + (n === rating) + '" aria-label="' + n + ' из 5">★</button>'
    ).join('');
}

function setupModal() {
    const modal = $('#game-modal');
    $('#modal-fav').addEventListener('click', () => toggleFav(state.modalGame.id));
    $('#modal-wish').addEventListener('click', () => addWish(state.modalGame.title));
    $('#modal-stars').addEventListener('click', (e) => {
        const star = e.target.closest('[data-star]');
        if (star) setRating(state.modalGame.id, Number(star.dataset.star));
    });

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
}

// =====================================================
// Хочу сыграть
// =====================================================
function saveWishes() {
    store.set('gg-wishlist', state.wishes);
    refreshAll();
}

function addWish(name) {
    name = name.trim();
    if (!name) return 'Напиши название игры.';
    if (state.wishes.some((w) => w.name.toLowerCase() === name.toLowerCase())) return 'Эта игра уже есть в списке.';
    state.wishes.push({ name, done: false });
    saveWishes();
    toast(name + ' — добавлена в «Хочу сыграть»');
    return '';
}

function renderWishes() {
    const list = $('#wish-list');
    list.replaceChildren();
    state.wishes.forEach((w, index) => {
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

        li.append(check, label);

        const known = GAMES.find((g) => g.title.toLowerCase() === w.name.toLowerCase());
        if (known) {
            const info = document.createElement('button');
            info.type = 'button';
            info.className = 'text-btn wish__info';
            info.dataset.open = known.id;
            info.textContent = 'инфо';
            li.append(info);
        }

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'wish__remove';
        remove.setAttribute('aria-label', 'Удалить ' + w.name);
        remove.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
        remove.addEventListener('click', () => {
            state.wishes.splice(index, 1);
            saveWishes();
        });

        li.append(remove);
        list.append(li);
    });

    const total = state.wishes.length;
    const done = state.wishes.filter((w) => w.done).length;
    $('#wish-empty').hidden = total > 0;
    $('#wish-count').textContent = total
        ? total + ' ' + plural(total, 'игра', 'игры', 'игр') + ' · сыграно ' + done
        : '';
    $('#wish-clear-done').hidden = done === 0;
}

function setupWishlist() {
    $('#game-titles').innerHTML = GAMES.map((g) => '<option value="' + escapeHtml(g.title) + '">').join('');
    const input = $('#wish-input');
    const error = $('#wish-error');

    $('#wish-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const message = addWish(input.value);
        error.textContent = message;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (message) input.focus();
        else input.value = '';
    });
    input.addEventListener('input', () => {
        error.textContent = '';
        input.setAttribute('aria-invalid', 'false');
    });
    $('#wish-clear-done').addEventListener('click', () => {
        state.wishes = state.wishes.filter((w) => !w.done);
        saveWishes();
    });
}

// =====================================================
// Рулетка
// =====================================================
function roulettePool() {
    const src = state.rouletteSource;
    if (src === 'top') return GAMES.filter((g) => g.top).map((g) => ({ name: g.short, id: g.id }));
    if (src === 'all') return GAMES.map((g) => ({ name: g.short, id: g.id }));
    if (src === 'fav') return state.favs.map(byId).filter(Boolean).map((g) => ({ name: g.short, id: g.id }));
    return state.wishes.filter((w) => !w.done).map((w) => {
        const g = GAMES.find((x) => x.title.toLowerCase() === w.name.toLowerCase());
        return { name: w.name, id: g ? g.id : null };
    });
}

function updateRouletteHint() {
    const n = roulettePool().length;
    const hint = $('#roulette-hint');
    const empty = {
        fav: 'В избранном пока пусто — отметь игры сердечком в каталоге.',
        wish: 'В списке «Хочу сыграть» нет несыгранных игр.',
    };
    hint.textContent = n ? 'Вариантов: ' + n : (empty[state.rouletteSource] || '');
    $('#roulette-btn').disabled = n === 0;
}

function setupRoulette() {
    const btn = $('#roulette-btn');
    const result = $('#roulette-result');
    const openBtn = $('#roulette-open');
    let winnerId = null;

    $('#roulette-source').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-source]');
        if (!chip) return;
        state.rouletteSource = chip.dataset.source;
        $$('#roulette-source .chip').forEach((c) => {
            const on = c === chip;
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-checked', String(on));
        });
        updateRouletteHint();
    });

    openBtn.addEventListener('click', () => winnerId && openModal(winnerId));

    btn.addEventListener('click', () => {
        const pool = roulettePool();
        if (!pool.length) return;
        const winner = pool[Math.floor(Math.random() * pool.length)];
        openBtn.hidden = true;

        const finish = () => {
            result.textContent = winner.name;
            result.classList.remove('is-spinning');
            result.classList.add('is-win');
            setTimeout(() => result.classList.remove('is-win'), 700);
            winnerId = winner.id;
            openBtn.hidden = !winner.id;
            btn.disabled = false;
        };

        if (reduceMotion() || pool.length === 1) return finish();

        btn.disabled = true;
        result.classList.add('is-spinning');
        let step = 0;
        const tick = () => {
            step++;
            if (step < 16) {
                result.textContent = pool[Math.floor(Math.random() * pool.length)].name;
                setTimeout(tick, 50 + step * step * 1.4);
            } else {
                finish();
            }
        };
        tick();
    });

    updateRouletteHint();
}

// =====================================================
// Статистика
// =====================================================
function renderStats() {
    const favGames = state.favs.map(byId).filter(Boolean);
    const rated = Object.keys(state.ratings).filter(byId);
    const avg = rated.length ? rated.reduce((s, id) => s + state.ratings[id], 0) / rated.length : 0;
    const doneWishes = state.wishes.filter((w) => w.done).length;

    const counts = {};
    favGames.forEach((g) => (counts[g.genre] = (counts[g.genre] || 0) + 1));
    const genres = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topGenre = genres.length ? genres[0][0] : '—';

    const cells = [
        ['В избранном', favGames.length],
        ['Оценено игр', rated.length],
        ['Средняя оценка', avg ? avg.toFixed(1).replace('.', ',') + ' / 5' : '—'],
        ['Любимый жанр', topGenre],
        ['Хочу сыграть', state.wishes.length],
        ['Уже сыграно', doneWishes],
    ];
    $('#stat-grid').innerHTML = cells.map(([k, v]) =>
        '<div class="stat"><dt class="mono muted">' + k + '</dt><dd>' + escapeHtml(v) + '</dd></div>'
    ).join('');

    const max = genres.length ? genres[0][1] : 1;
    $('#genre-bars').innerHTML = genres.map(([name, n]) =>
        '<li><span class="genre-bars__name">' + escapeHtml(name) + '</span>' +
        '<span class="genre-bars__track"><span class="genre-bars__fill" style="--w:' + (n / max) + '"></span></span>' +
        '<span class="genre-bars__value mono">' + n + '</span></li>'
    ).join('');
    $('#genre-bars-empty').hidden = genres.length > 0;
}

// =====================================================
// Настройки
// =====================================================
function applySettings() {
    const s = state.settings;
    root.dataset.accent = s.accent;
    root.dataset.size = s.size;
    root.classList.toggle('no-motion', !s.motion);
    root.classList.toggle('no-grain', !s.grain);
    $$('input[name="accent"]').forEach((i) => (i.checked = i.value === s.accent));
    $$('input[name="size"]').forEach((i) => (i.checked = i.value === s.size));
    $('#opt-motion').checked = s.motion;
    $('#opt-grain').checked = s.grain;
    if (!s.motion) $$('.reveal').forEach((el) => el.classList.add('is-visible'));
    store.set('gg-settings', s);
}

function setupSettings() {
    $$('input[name="accent"]').forEach((i) => i.addEventListener('change', () => {
        state.settings.accent = i.value;
        applySettings();
    }));
    $$('input[name="size"]').forEach((i) => i.addEventListener('change', () => {
        state.settings.size = i.value;
        applySettings();
    }));
    $('#opt-motion').addEventListener('change', (e) => {
        state.settings.motion = e.target.checked;
        applySettings();
    });
    $('#opt-grain').addEventListener('change', (e) => {
        state.settings.grain = e.target.checked;
        applySettings();
    });
    $('#opt-reset').addEventListener('click', () => {
        state.settings = Object.assign({}, DEFAULT_SETTINGS);
        applySettings();
        toast('Настройки сброшены');
    });

    // скачать мои данные в файл
    $('#data-export').addEventListener('click', () => {
        const data = { favs: state.favs, ratings: state.ratings, wishes: state.wishes, settings: state.settings };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'moi-igry.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Файл moi-igry.json сохранён');
    });

    // загрузить данные из файла
    $('#data-import').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const data = JSON.parse(await file.text());
            if (Array.isArray(data.favs)) state.favs = data.favs.filter((id) => byId(id));
            if (data.ratings && typeof data.ratings === 'object') state.ratings = data.ratings;
            if (Array.isArray(data.wishes)) state.wishes = data.wishes.filter((w) => w && typeof w.name === 'string');
            if (data.settings) state.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
            store.set('gg-favs', state.favs);
            store.set('gg-ratings', state.ratings);
            store.set('gg-wishlist', state.wishes);
            applySettings();
            refreshAll();
            toast('Данные загружены');
        } catch (err) {
            toast('Не получилось прочитать файл');
        }
        e.target.value = '';
    });

    // очистить избранное, оценки и список (с подтверждением вторым нажатием)
    const clearBtn = $('#data-clear');
    let armed = false;
    clearBtn.addEventListener('click', () => {
        if (!armed) {
            armed = true;
            clearBtn.textContent = 'Точно?';
            setTimeout(() => {
                armed = false;
                clearBtn.textContent = 'Очистить';
            }, 3000);
            return;
        }
        state.favs = [];
        state.ratings = {};
        state.wishes = [];
        store.set('gg-favs', []);
        store.set('gg-ratings', {});
        store.set('gg-wishlist', []);
        armed = false;
        clearBtn.textContent = 'Очистить';
        refreshAll();
        toast('Избранное, оценки и список очищены');
    });

    applySettings();
}

// =====================================================
// Появление блоков при прокрутке
// =====================================================
function watchReveal() {
    const items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion()) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    items.forEach((el, i) => {
        el.style.setProperty('--delay', (i % 4) * 90 + 'ms');
        observer.observe(el);
    });
}

// =====================================================
// Запуск
// =====================================================
function refreshAll() {
    renderCatalog();
    renderWishes();
    renderStats();
    renderModalState();
    updateRouletteHint();
}

renderNav();
renderHero();
renderTop();
setupCatalog();
setupModal();
setupWishlist();
setupRoulette();
setupSettings();
renderWishes();
renderStats();
watchReveal();
watchSections();
