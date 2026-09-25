// =====================================================
// Все игры сайта. Чтобы добавить игру — допиши объект в список.
//   id      — короткое имя латиницей (без пробелов)
//   top     — место в «Моём топе» (1, 2, 3) или 0
//   steam   — номер игры в Steam (для картинки и ссылки) или 0
//   img     — своя картинка (если не из Steam), можно оставить пустым
//   free    — true, если игра бесплатная
// =====================================================
const STEAM_IMG = (id) => 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/' + id + '/header.jpg';

const GAMES = [
    {
        id: 'cs', title: 'Counter-Strike 2', short: 'Counter-Strike', top: 1,
        genre: 'Шутер', dev: 'Valve', year: 2023, yearNote: 'серия с 2000',
        mode: '5 на 5', free: true, platform: 'Steam', steam: 730,
        link: 'https://store.steampowered.com/app/730/',
        text: 'Две команды по пять игроков: террористы закладывают бомбу, спецназ пытается её обезвредить. Матч выигрывает команда, первой взявшая 13 раундов.',
    },
    {
        id: 'dota', title: 'DOTA 2', top: 2,
        genre: 'MOBA', dev: 'Valve', year: 2013,
        mode: '5 на 5', free: true, platform: 'Steam', steam: 570,
        img: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/570/capsule_616x353.jpg?t=1769535998',
        link: 'https://store.steampowered.com/app/570/',
        text: 'Две команды по пять героев сражаются на трёх линиях. Цель — разрушить главное здание (Древнего) на базе соперника. В игре больше 120 героев.',
    },
    {
        id: 'fortnite', title: 'Fortnite', top: 3,
        genre: 'Королевская битва', dev: 'Epic Games', year: 2017,
        mode: 'До 100 игроков', free: true, platform: 'Epic Games', steam: 0,
        img: 'https://play-lh.googleusercontent.com/nUzo52s5UVOrwyLCfFXM0PKgInAaLaYe-hrUedFAT3gMbhKBn0HlvnFai7Ao5GTEB51IvWtIC3szG2O-wxAPIA',
        link: 'https://www.epicgames.com/fortnite',
        text: 'До ста игроков высаживаются на остров, собирают оружие и строят укрепления. Побеждает тот, кто останется последним.',
    },
    {
        id: 'valorant', title: 'Valorant',
        genre: 'Шутер', dev: 'Riot Games', year: 2020,
        mode: '5 на 5', free: true, platform: 'Riot Client', steam: 0,
        link: 'https://playvalorant.com/',
        text: 'Командный тактический шутер: у каждого агента свои способности, а цель похожа на Counter-Strike — заложить или обезвредить заряд.',
    },
    {
        id: 'pubg', title: 'PUBG: Battlegrounds',
        genre: 'Королевская битва', dev: 'KRAFTON', year: 2017,
        mode: 'До 100 игроков', free: true, platform: 'Steam', steam: 578080,
        link: 'https://store.steampowered.com/app/578080/',
        text: 'Одна из игр, сделавших жанр королевской битвы популярным: большая карта, поиск снаряжения и сужающаяся зона.',
    },
    {
        id: 'apex', title: 'Apex Legends',
        genre: 'Королевская битва', dev: 'Respawn Entertainment', year: 2019,
        mode: 'Команды по 3', free: true, platform: 'Steam', steam: 1172470,
        link: 'https://store.steampowered.com/app/1172470/',
        text: 'Королевская битва с героями: у каждой легенды свои умения, а играют обычно отрядами по три человека.',
    },
    {
        id: 'rust', title: 'Rust',
        genre: 'Выживание', dev: 'Facepunch Studios', year: 2018,
        mode: 'Онлайн', free: false, platform: 'Steam', steam: 252490,
        link: 'https://store.steampowered.com/app/252490/',
        text: 'Онлайн-выживание: начинаешь с камнем в руке, добываешь ресурсы, строишь базу и защищаешь её от других игроков.',
    },
    {
        id: 'gta5', title: 'Grand Theft Auto V',
        genre: 'Экшен', dev: 'Rockstar North', year: 2015, yearNote: 'на PC',
        mode: 'Сюжет и GTA Online', free: false, platform: 'Steam', steam: 271590,
        link: 'https://store.steampowered.com/app/271590/',
        text: 'Открытый город Лос-Сантос, три главных героя в сюжете и отдельный онлайн-режим GTA Online.',
    },
    {
        id: 'minecraft', title: 'Minecraft',
        genre: 'Песочница', dev: 'Mojang Studios', year: 2011,
        mode: 'Соло и онлайн', free: false, platform: 'Minecraft Launcher', steam: 0,
        link: 'https://www.minecraft.net/',
        text: 'Мир из блоков, в котором можно строить что угодно, выживать ночью среди мобов или играть на серверах с друзьями.',
    },
    {
        id: 'terraria', title: 'Terraria',
        genre: 'Песочница', dev: 'Re-Logic', year: 2011,
        mode: 'Соло и кооператив', free: false, platform: 'Steam', steam: 105600,
        link: 'https://store.steampowered.com/app/105600/',
        text: 'Двухмерная песочница: копаешь, строишь, собираешь снаряжение и сражаешься с боссами.',
    },
    {
        id: 'tf2', title: 'Team Fortress 2',
        genre: 'Шутер', dev: 'Valve', year: 2007,
        mode: 'До 12 на 12', free: true, platform: 'Steam', steam: 440,
        link: 'https://store.steampowered.com/app/440/',
        text: 'Весёлый командный шутер с девятью классами — от пулемётчика до шпиона.',
    },
    {
        id: 'warframe', title: 'Warframe',
        genre: 'Экшен', dev: 'Digital Extremes', year: 2013,
        mode: 'Кооператив до 4', free: true, platform: 'Steam', steam: 230410,
        link: 'https://store.steampowered.com/app/230410/',
        text: 'Кооперативный экшен про космических ниндзя: миссии, сбор варфреймов и оружия, быстрое передвижение.',
    },
    {
        id: 'amongus', title: 'Among Us',
        genre: 'Пати', dev: 'Innersloth', year: 2018,
        mode: 'От 4 до 15 игроков', free: false, platform: 'Steam', steam: 945360,
        link: 'https://store.steampowered.com/app/945360/',
        text: 'Команда выполняет задания на корабле, а среди неё прячутся предатели. Нужно вычислить их голосованием.',
    },
    {
        id: 'stardew', title: 'Stardew Valley',
        genre: 'Симулятор', dev: 'ConcernedApe', year: 2016,
        mode: 'Соло и кооператив', free: false, platform: 'Steam', steam: 413150,
        link: 'https://store.steampowered.com/app/413150/',
        text: 'Спокойный симулятор фермы: выращиваешь урожай, ловишь рыбу, исследуешь шахты и знакомишься с жителями городка.',
    },
    {
        id: 'hollow', title: 'Hollow Knight',
        genre: 'Метроидвания', dev: 'Team Cherry', year: 2017,
        mode: 'Одиночная', free: false, platform: 'Steam', steam: 367520,
        link: 'https://store.steampowered.com/app/367520/',
        text: 'Сложное приключение в подземном королевстве насекомых с красивой рисованной графикой.',
    },
    {
        id: 'portal2', title: 'Portal 2',
        genre: 'Головоломка', dev: 'Valve', year: 2011,
        mode: 'Соло и кооператив на двоих', free: false, platform: 'Steam', steam: 620,
        link: 'https://store.steampowered.com/app/620/',
        text: 'Головоломки с порталами: ставишь два портала и проходишь комнаты, которые иначе не пройти.',
    },
    {
        id: 'witcher3', title: 'The Witcher 3: Wild Hunt',
        genre: 'RPG', dev: 'CD Projekt Red', year: 2015,
        mode: 'Одиночная', free: false, platform: 'Steam', steam: 292030,
        link: 'https://store.steampowered.com/app/292030/',
        text: 'Большая ролевая игра с открытым миром: ведьмак Геральт ищет свою приёмную дочь Цири.',
    },
    {
        id: 'cyberpunk', title: 'Cyberpunk 2077',
        genre: 'RPG', dev: 'CD Projekt Red', year: 2020,
        mode: 'Одиночная', free: false, platform: 'Steam', steam: 1091500,
        link: 'https://store.steampowered.com/app/1091500/',
        text: 'Ролевая игра в огромном футуристическом городе Найт-Сити от первого лица.',
    },
    {
        id: 'eldenring', title: 'Elden Ring',
        genre: 'RPG', dev: 'FromSoftware', year: 2022,
        mode: 'Одиночная и онлайн', free: false, platform: 'Steam', steam: 1245620,
        link: 'https://store.steampowered.com/app/1245620/',
        text: 'Сложная ролевая игра с открытым миром, где каждый босс — отдельное испытание.',
    },
];

// картинка по умолчанию берётся из Steam
GAMES.forEach((g, i) => {
    g.order = i;
    if (!g.img && g.steam) g.img = STEAM_IMG(g.steam);
    if (!g.short) g.short = g.title;
});
