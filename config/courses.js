// Конфигурация курсов
// Этот файл содержит все курсы с их настройками
// Для добавления нового курса просто добавьте его в объект courses
// Для скрытия курса установите visible: false

const courses = {
    "scratch": {
        "visible": true,
        "order": 1,
        "name": {
            "en": "Scratch Visual Programming",
            "ru": "Визуальное программирование Scratch",
            "de": "Scratch Visuelles Programmieren",
            "he": "תכנות ויזואלי Scratch",
            "pl": "Programowanie wizualne Scratch",
            "nl": "Scratch Visueel Programmeren",
            "uk": "Візуальне програмування Scratch",
            "es": "Programación Visual Scratch",
            "it": "Programmazione Visuale Scratch"
        },
        "description": {
            "en": "Master the basics of programming logic by creating animations and games in a visual block-based editor.",
            "ru": "Освойте основы логики программирования, создавая анимации и игры в визуальном редакторе на основе блоков.",
            "de": "Meistern Sie die Grundlagen der Programmierlogik durch das Erstellen von Animationen und Spielen in einem visuellen Block-Editor.",
            "he": "שלוט ביסודות הלוגיקה התכנותית על ידי יצירת אנימציות ומשחקים בעורך ויזואלי מבוסס בלוקים.",
            "pl": "Opanuj podstawy logiki programowania tworząc animacje i gry w wizualnym edytorze opartym na blokach.",
            "nl": "Beheers de basis van programmeerlogica door animaties en spellen te maken in een visuele blokgebaseerde editor.",
            "uk": "Опануйте основи логіки програмування, створюючи анімації та ігри у візуальному редакторі на основі блоків.",
            "es": "Domina los fundamentos de la lógica de programación creando animaciones y juegos en un editor visual basado en bloques.",
            "it": "Padroneggia le basi della logica di programmazione creando animazioni e giochi in un editor visivo basato su blocchi."
        },
        "age": {
            "en": "7-11 years",
            "ru": "7-11 лет",
            "de": "7-11 Jahre",
            "he": "7-11 שנים",
            "pl": "7-11 lat",
            "nl": "7-11 jaar",
            "uk": "7-11 років",
            "es": "7-11 años",
            "it": "7-11 anni"
        },
        "duration": {
            "en": "2-4 Months",
            "ru": "2-4 месяца",
            "de": "2-4 Monate",
            "he": "2-4 חודשים",
            "pl": "2-4 miesiące",
            "nl": "2-4 maanden",
            "uk": "2-4 місяці",
            "es": "2-4 meses",
            "it": "2-4 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Scratch",
            "Pixlr"
        ],
        "defaultDuration": 50,
        "whatYouLearn": {
            "en": [
                "Understand fundamental programming concepts (sequences, loops, conditionals).",
                "Create interactive stories, animations, and games.",
                "Develop problem-solving and logical thinking skills.",
                "Design characters, backgrounds, and sound effects.",
                "Share projects with a global community.",
                "Transition from block-based to text-based coding concepts."
            ],
            "ru": [
                "Понимать основные концепции программирования (последовательности, циклы, условия).",
                "Создавать интерактивные истории, анимации и игры.",
                "Развивать навыки решения проблем и логического мышления.",
                "Проектировать персонажей, фоны и звуковые эффекты.",
                "Делиться проектами с глобальным сообществом.",
                "Переходить от блочного к текстовому программированию."
            ],
            "de": [
                "Grundlegende Programmierkonzepte verstehen (Sequenzen, Schleifen, Bedingungen).",
                "Interaktive Geschichten, Animationen und Spiele erstellen.",
                "Problemlösungs- und logische Denkfähigkeiten entwickeln.",
                "Charaktere, Hintergründe und Soundeffekte entwerfen.",
                "Projekte mit einer globalen Gemeinschaft teilen.",
                "Übergang von blockbasierten zu textbasierten Programmierkonzepten."
            ],
            "he": [
                "הבנת מושגי תכנות בסיסיים (רצפים, לולאות, תנאים).",
                "יצירת סיפורים אינטראקטיביים, אנימציות ומשחקים.",
                "פיתוח כישורי פתרון בעיות וחשיבה לוגית.",
                "עיצוב דמויות, רקעים ואפקטי קול.",
                "שיתוף פרויקטים עם קהילה גלובלית.",
                "מעבר מתכנות מבוסס בלוקים לתכנות מבוסס טקסט."
            ],
            "pl": [
                "Zrozumienie podstawowych koncepcji programowania (sekwencje, pętle, warunki).",
                "Tworzenie interaktywnych historii, animacji i gier.",
                "Rozwijanie umiejętności rozwiązywania problemów i myślenia logicznego.",
                "Projektowanie postaci, tła i efektów dźwiękowych.",
                "Dzielenie się projektami z globalną społecznością.",
                "Przejście od programowania blokowego do tekstowego."
            ],
            "nl": [
                "Begrijp fundamentele programmeerconcepten (sequenties, loops, voorwaarden).",
                "Maak interactieve verhalen, animaties en spellen.",
                "Ontwikkel probleemoplossende en logische denkvaardigheden.",
                "Ontwerp personages, achtergronden en geluidseffecten.",
                "Deel projecten met een wereldwijde gemeenschap.",
                "Overgang van blokgebaseerd naar tekstgebaseerd programmeren."
            ],
            "uk": [
                "Розуміти основні концепції програмування (послідовності, цикли, умови).",
                "Створювати інтерактивні історії, анімації та ігри.",
                "Розвивати навички вирішення проблем та логічного мислення.",
                "Проектувати персонажів, фони та звукові ефекти.",
                "Ділитися проектами з глобальною спільнотою.",
                "Переходити від блочного до текстового програмування."
            ],
            "es": [
                "Comprender conceptos fundamentales de programación (secuencias, bucles, condicionales).",
                "Crear historias interactivas, animaciones y juegos.",
                "Desarrollar habilidades de resolución de problemas y pensamiento lógico.",
                "Diseñar personajes, fondos y efectos de sonido.",
                "Compartir proyectos con una comunidad global.",
                "Transición de conceptos de programación basados en bloques a texto."
            ],
            "it": [
                "Comprendere i concetti fondamentali della programmazione (sequenze, loop, condizionali).",
                "Creare storie interattive, animazioni e giochi.",
                "Sviluppare abilità di problem solving e pensiero logico.",
                "Progettare personaggi, sfondi ed effetti sonori.",
                "Condividere progetti con una comunità globale.",
                "Transizione da concetti di programmazione basati su blocchi a testo."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: Intro to Scratch & Animation",
                    "ru": "Модуль 1-2: Введение в Scratch и анимацию",
                    "de": "Modul 1-2: Einführung in Scratch & Animation",
                    "he": "מודול 1-2: מבוא ל-Scratch ואנימציה",
                    "pl": "Moduł 1-2: Wprowadzenie do Scratch i animacji",
                    "nl": "Module 1-2: Introductie tot Scratch & Animatie",
                    "uk": "Модуль 1-2: Введення в Scratch та анімацію",
                    "es": "Módulo 1-2: Introducción a Scratch y Animación",
                    "it": "Modulo 1-2: Introduzione a Scratch e Animazione"
                },
                "description": {
                    "en": "Getting started with the Scratch interface, creating your first sprites and backdrops. Learning about motion, looks, and basic event handling to make simple animations.",
                    "ru": "Начало работы с интерфейсом Scratch, создание первых спрайтов и фонов. Изучение движения, внешнего вида и базовой обработки событий для создания простых анимаций.",
                    "de": "Erste Schritte mit der Scratch-Oberfläche, Erstellen Ihrer ersten Sprites und Hintergründe. Lernen über Bewegung, Aussehen und grundlegende Ereignisbehandlung für einfache Animationen.",
                    "he": "התחלת עבודה עם ממשק Scratch, יצירת הספרייטים והרקעים הראשונים. למידה על תנועה, מראה וטיפול בסיסי באירועים ליצירת אנימציות פשוטות.",
                    "pl": "Rozpoczęcie pracy z interfejsem Scratch, tworzenie pierwszych duszków i tła. Nauka o ruchu, wyglądzie i podstawowej obsłudze zdarzeń do tworzenia prostych animacji.",
                    "nl": "Aan de slag met de Scratch-interface, je eerste sprites en achtergronden maken. Leren over beweging, uiterlijk en basis event handling voor eenvoudige animaties.",
                    "uk": "Початок роботи з інтерфейсом Scratch, створення перших спрайтів та фонів. Вивчення руху, зовнішнього вигляду та базової обробки подій для створення простих анімацій.",
                    "es": "Comenzar con la interfaz de Scratch, crear tus primeros sprites y fondos. Aprender sobre movimiento, apariencia y manejo básico de eventos para hacer animaciones simples.",
                    "it": "Iniziare con l'interfaccia Scratch, creare i tuoi primi sprite e sfondi. Imparare movimento, aspetto e gestione base degli eventi per creare animazioni semplici."
                }
            }
        ]
    },
    "python": {
        "visible": true,
        "order": 2,
        "name": {
            "en": "Python Pro",
            "ru": "Python Pro",
            "de": "Python Pro",
            "he": "Python Pro",
            "pl": "Python Pro",
            "nl": "Python Pro",
            "uk": "Python Pro",
            "es": "Python Pro",
            "it": "Python Pro"
        },
        "description": {
            "en": "From basic syntax to creating neural networks and web applications. A complete path to becoming a junior developer.",
            "ru": "От базового синтаксиса до создания нейронных сетей и веб-приложений. Полный путь к становлению junior-разработчиком.",
            "de": "Von der Grundsyntax bis zur Erstellung von neuronalen Netzwerken und Webanwendungen. Ein vollständiger Weg zum Junior-Entwickler.",
            "he": "מתחביר בסיסי ועד יצירת רשתות עצביות ואפליקציות אינטרנט. נתיב מלא להפוך למפתח זוטר.",
            "pl": "Od podstawowej składni do tworzenia sieci neuronowych i aplikacji internetowych. Kompletna ścieżka do zostania juniorem.",
            "nl": "Van basissyntaxis tot het maken van neurale netwerken en webapplicaties. Een complete weg naar junior ontwikkelaar worden.",
            "uk": "Від базового синтаксису до створення нейронних мереж та веб-додатків. Повний шлях до стати junior-розробником.",
            "es": "Desde la sintaxis básica hasta crear redes neuronales y aplicaciones web. Un camino completo para convertirse en desarrollador junior.",
            "it": "Dalla sintassi di base alla creazione di reti neurali e applicazioni web. Un percorso completo per diventare sviluppatore junior."
        },
        "age": {
            "en": "12+ years",
            "ru": "12+ лет",
            "de": "12+ Jahre",
            "he": "12+ שנים",
            "pl": "12+ lat",
            "nl": "12+ jaar",
            "uk": "12+ років",
            "es": "12+ años",
            "it": "12+ anni"
        },
        "duration": {
            "en": "6-12 Months",
            "ru": "6-12 месяцев",
            "de": "6-12 Monate",
            "he": "6-12 חודשים",
            "pl": "6-12 miesięcy",
            "nl": "6-12 maanden",
            "uk": "6-12 місяців",
            "es": "6-12 meses",
            "it": "6-12 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Python 3",
            "VS Code",
            "Git & GitHub",
            "Flask",
            "SQLAlchemy",
            "Pygame",
            "TensorFlow"
        ],
        "defaultDuration": 50,
        "whatYouLearn": {
            "en": [
                "Write clean, efficient code in Python.",
                "Develop complex algorithms and data structures.",
                "Create interactive Telegram bots.",
                "Build dynamic websites and APIs with Flask.",
                "Work with databases using SQL.",
                "Train and implement basic neural networks."
            ],
            "ru": [
                "Писать чистый, эффективный код на Python.",
                "Разрабатывать сложные алгоритмы и структуры данных.",
                "Создавать интерактивные Telegram-боты.",
                "Строить динамические веб-сайты и API с Flask.",
                "Работать с базами данных используя SQL.",
                "Обучать и реализовывать базовые нейронные сети."
            ],
            "de": [
                "Sauberen, effizienten Code in Python schreiben.",
                "Komplexe Algorithmen und Datenstrukturen entwickeln.",
                "Interaktive Telegram-Bots erstellen.",
                "Dynamische Websites und APIs mit Flask erstellen.",
                "Mit Datenbanken mit SQL arbeiten.",
                "Grundlegende neuronale Netzwerke trainieren und implementieren."
            ],
            "he": [
                "כתיבת קוד נקי ויעיל ב-Python.",
                "פיתוח אלגוריתמים מורכבים ומבני נתונים.",
                "יצירת בוטים אינטראקטיביים ב-Telegram.",
                "בניית אתרים דינמיים ו-API עם Flask.",
                "עבודה עם מסדי נתונים באמצעות SQL.",
                "אימון ויישום רשתות עצביות בסיסיות."
            ],
            "pl": [
                "Pisanie czystego, wydajnego kodu w Pythonie.",
                "Rozwijanie złożonych algorytmów i struktur danych.",
                "Tworzenie interaktywnych botów Telegram.",
                "Budowanie dynamicznych stron internetowych i API z Flask.",
                "Praca z bazami danych używając SQL.",
                "Trenowanie i implementacja podstawowych sieci neuronowych."
            ],
            "nl": [
                "Schrijf schone, efficiënte code in Python.",
                "Ontwikkel complexe algoritmes en datastructuren.",
                "Maak interactieve Telegram-bots.",
                "Bouw dynamische websites en API's met Flask.",
                "Werk met databases met SQL.",
                "Train en implementeer basis neurale netwerken."
            ],
            "uk": [
                "Писати чистий, ефективний код на Python.",
                "Розробляти складні алгоритми та структури даних.",
                "Створювати інтерактивні Telegram-боти.",
                "Будувати динамічні веб-сайти та API з Flask.",
                "Працювати з базами даних використовуючи SQL.",
                "Навчати та реалізовувати базові нейронні мережі."
            ],
            "es": [
                "Escribir código limpio y eficiente en Python.",
                "Desarrollar algoritmos complejos y estructuras de datos.",
                "Crear bots interactivos de Telegram.",
                "Construir sitios web dinámicos y APIs con Flask.",
                "Trabajar con bases de datos usando SQL.",
                "Entrenar e implementar redes neuronales básicas."
            ],
            "it": [
                "Scrivere codice pulito ed efficiente in Python.",
                "Sviluppare algoritmi complessi e strutture dati.",
                "Creare bot interattivi di Telegram.",
                "Costruire siti web dinamici e API con Flask.",
                "Lavorare con database usando SQL.",
                "Addestrare e implementare reti neurali di base."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: Python Fundamentals",
                    "ru": "Модуль 1-2: Основы Python",
                    "de": "Modul 1-2: Python Grundlagen",
                    "he": "מודול 1-2: יסודות Python",
                    "pl": "Moduł 1-2: Podstawy Pythona",
                    "nl": "Module 1-2: Python Fundamentals",
                    "uk": "Модуль 1-2: Основи Python",
                    "es": "Módulo 1-2: Fundamentos de Python",
                    "it": "Modulo 1-2: Fondamenti di Python"
                },
                "description": {
                    "en": "Introduction to Python, data types, variables, loops, conditions, functions, and file handling. Mastering the core syntax.",
                    "ru": "Введение в Python, типы данных, переменные, циклы, условия, функции и работа с файлами. Освоение основного синтаксиса.",
                    "de": "Einführung in Python, Datentypen, Variablen, Schleifen, Bedingungen, Funktionen und Dateibehandlung. Beherrschung der Kernsyntax.",
                    "he": "מבוא ל-Python, סוגי נתונים, משתנים, לולאות, תנאים, פונקציות ועבודה עם קבצים. שליטה בתחביר הליבה.",
                    "pl": "Wprowadzenie do Pythona, typy danych, zmienne, pętle, warunki, funkcje i obsługa plików. Opanowanie podstawowej składni.",
                    "nl": "Introductie tot Python, gegevenstypen, variabelen, loops, voorwaarden, functies en bestandsverwerking. De kernsyntaxis beheersen.",
                    "uk": "Введення в Python, типи даних, змінні, цикли, умови, функції та робота з файлами. Опанування основного синтаксису.",
                    "es": "Introducción a Python, tipos de datos, variables, bucles, condiciones, funciones y manejo de archivos. Dominar la sintaxis central.",
                    "it": "Introduzione a Python, tipi di dati, variabili, loop, condizioni, funzioni e gestione file. Padroneggiare la sintassi core."
                }
            }
        ]
    },
    "roblox": {
        "visible": true,
        "order": 3,
        "name": {
            "en": "Roblox Game Developer",
            "ru": "Разработчик игр Roblox",
            "de": "Roblox Game Developer",
            "he": "Roblox Game Developer",
            "pl": "Roblox Game Developer",
            "nl": "Roblox Game Developer",
            "uk": "Roblox Game Developer",
            "es": "Roblox Game Developer",
            "it": "Roblox Game Developer"
        },
        "description": {
            "en": "Learn to create your own games on the Roblox platform using Lua scripting language.",
            "ru": "Научитесь создавать собственные игры на платформе Roblox, используя язык скриптинга Lua.",
            "de": "Lernen Sie, Ihre eigenen Spiele auf der Roblox-Plattform mit der Lua-Skriptsprache zu erstellen.",
            "he": "למדו ליצור משחקים משלכם בפלטפורמת Roblox באמצעות שפת הסקריפטים Lua.",
            "pl": "Naucz się tworzyć własne gry na platformie Roblox używając języka skryptowego Lua.",
            "nl": "Leer je eigen spellen maken op het Roblox platform met de Lua scripttaal.",
            "uk": "Навчіться створювати власні ігри на платформі Roblox, використовуючи мову скриптингу Lua.",
            "es": "Aprende a crear tus propios juegos en la plataforma Roblox usando el lenguaje de scripting Lua.",
            "it": "Impara a creare i tuoi giochi sulla piattaforma Roblox usando il linguaggio di scripting Lua."
        },
        "age": {
            "en": "9-12 years",
            "ru": "9-12 лет",
            "de": "9-12 Jahre",
            "he": "9-12 שנים",
            "pl": "9-12 lat",
            "nl": "9-12 jaar",
            "uk": "9-12 років",
            "es": "9-12 años",
            "it": "9-12 anni"
        },
        "duration": {
            "en": "3-6 Months",
            "ru": "3-6 месяцев",
            "de": "3-6 Monate",
            "he": "3-6 חודשים",
            "pl": "3-6 miesięcy",
            "nl": "3-6 maanden",
            "uk": "3-6 місяців",
            "es": "3-6 meses",
            "it": "3-6 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Roblox Studio",
            "Lua"
        ],
        "defaultDuration": 50,
        "whatYouLearn": {
            "en": [
                "Master Roblox Studio interface and tools.",
                "Write Lua scripts for game logic and interactivity.",
                "Design and build engaging game worlds.",
                "Create custom characters, items, and animations.",
                "Implement game mechanics like leaderboards and currency systems.",
                "Publish and share your games with the Roblox community."
            ],
            "ru": [
                "Освоить интерфейс и инструменты Roblox Studio.",
                "Писать Lua-скрипты для игровой логики и интерактивности.",
                "Проектировать и строить увлекательные игровые миры.",
                "Создавать пользовательских персонажей, предметы и анимации.",
                "Реализовывать игровую механику, такую как таблицы лидеров и валютные системы.",
                "Публиковать и делиться своими играми с сообществом Roblox."
            ],
            "de": [
                "Roblox Studio-Oberfläche und -Tools beherrschen.",
                "Lua-Skripte für Spiel-Logik und Interaktivität schreiben.",
                "Fesselnde Spielwelten entwerfen und bauen.",
                "Benutzerdefinierte Charaktere, Items und Animationen erstellen.",
                "Spielmechaniken wie Bestenlisten und Währungssysteme implementieren.",
                "Ihre Spiele mit der Roblox-Community veröffentlichen und teilen."
            ],
            "he": [
                "שליטה בממשק ובכלים של Roblox Studio.",
                "כתיבת סקריפטים של Lua ללוגיקת משחק ואינטראקטיביות.",
                "עיצוב ובניית עולמות משחק מרתקים.",
                "יצירת דמויות מותאמות אישית, פריטים ואנימציות.",
                "יישום מכניקות משחק כמו לוחות תוצאות ומערכות מטבע.",
                "פרסום ושיתוף המשחקים שלכם עם קהילת Roblox."
            ],
            "pl": [
                "Opanowanie interfejsu i narzędzi Roblox Studio.",
                "Pisanie skryptów Lua do logiki gry i interaktywności.",
                "Projektowanie i budowanie wciągających światów gier.",
                "Tworzenie niestandardowych postaci, przedmiotów i animacji.",
                "Implementowanie mechanik gier takich jak tablice wyników i systemy walut.",
                "Publikowanie i dzielenie się grami ze społecznością Roblox."
            ],
            "nl": [
                "Beheers de Roblox Studio interface en tools.",
                "Schrijf Lua scripts voor spel logica en interactiviteit.",
                "Ontwerp en bouw boeiende spelwerelden.",
                "Maak aangepaste karakters, items en animaties.",
                "Implementeer spelmechanieken zoals leaderboards en valutasystemen.",
                "Publiceer en deel je spellen met de Roblox community."
            ],
            "uk": [
                "Опанувати інтерфейс та інструменти Roblox Studio.",
                "Писати Lua-скрипти для ігрової логіки та інтерактивності.",
                "Проектувати та будувати захоплюючі ігрові світи.",
                "Створювати користувацьких персонажів, предмети та анімації.",
                "Реалізовувати ігрову механіку, таку як таблиці лідерів та валютні системи.",
                "Публікувати та ділитися своїми іграми зі спільнотою Roblox."
            ],
            "es": [
                "Dominar la interfaz y herramientas de Roblox Studio.",
                "Escribir scripts de Lua para lógica de juego e interactividad.",
                "Diseñar y construir mundos de juego atractivos.",
                "Crear personajes personalizados, objetos y animaciones.",
                "Implementar mecánicas de juego como tablas de clasificación y sistemas de moneda.",
                "Publicar y compartir tus juegos con la comunidad de Roblox."
            ],
            "it": [
                "Padroneggiare l'interfaccia e gli strumenti di Roblox Studio.",
                "Scrivere script Lua per la logica di gioco e l'interattività.",
                "Progettare e costruire mondi di gioco coinvolgenti.",
                "Creare personaggi personalizzati, oggetti e animazioni.",
                "Implementare meccaniche di gioco come classifiche e sistemi di valuta.",
                "Pubblicare e condividere i tuoi giochi con la comunità Roblox."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: Roblox Studio & Lua Basics",
                    "ru": "Модуль 1-2: Roblox Studio и основы Lua",
                    "de": "Modul 1-2: Roblox Studio & Lua Grundlagen",
                    "he": "מודול 1-2: Roblox Studio ויסודות Lua",
                    "pl": "Moduł 1-2: Roblox Studio i podstawy Lua",
                    "nl": "Module 1-2: Roblox Studio & Lua Basics",
                    "uk": "Модуль 1-2: Roblox Studio та основи Lua",
                    "es": "Módulo 1-2: Roblox Studio y Fundamentos de Lua",
                    "it": "Modulo 1-2: Roblox Studio e Fondamenti di Lua"
                },
                "description": {
                    "en": "Introduction to Roblox Studio, understanding the workspace, basic Lua syntax, variables, conditions, and events. Creating your first interactive objects.",
                    "ru": "Введение в Roblox Studio, понимание рабочего пространства, базовый синтаксис Lua, переменные, условия и события. Создание первых интерактивных объектов.",
                    "de": "Einführung in Roblox Studio, Verständnis des Arbeitsbereichs, grundlegende Lua-Syntax, Variablen, Bedingungen und Ereignisse. Erstellen Ihrer ersten interaktiven Objekte.",
                    "he": "מבוא ל-Roblox Studio, הבנת סביבת העבודה, תחביר Lua בסיסי, משתנים, תנאים ואירועים. יצירת האובייקטים האינטראקטיביים הראשונים שלכם.",
                    "pl": "Wprowadzenie do Roblox Studio, zrozumienie obszaru roboczego, podstawowa składnia Lua, zmienne, warunki i zdarzenia. Tworzenie pierwszych interaktywnych obiektów.",
                    "nl": "Introductie tot Roblox Studio, begrijpen van de werkruimte, basis Lua syntaxis, variabelen, voorwaarden en events. Je eerste interactieve objecten maken.",
                    "uk": "Введення в Roblox Studio, розуміння робочого простору, базовий синтаксис Lua, змінні, умови та події. Створення перших інтерактивних об'єктів.",
                    "es": "Introducción a Roblox Studio, comprensión del espacio de trabajo, sintaxis básica de Lua, variables, condiciones y eventos. Creando tus primeros objetos interactivos.",
                    "it": "Introduzione a Roblox Studio, comprensione dell'area di lavoro, sintassi base di Lua, variabili, condizioni ed eventi. Creare i tuoi primi oggetti interattivi."
                }
            }
        ]
    },
    "junior": {
        "visible": true,
        "order": 4,
        "name": {
            "en": "Junior Start",
            "ru": "Младший старт",
            "de": "Junior Start",
            "he": "Junior Start",
            "pl": "Junior Start",
            "nl": "Junior Start",
            "uk": "Junior Start",
            "es": "Junior Start",
            "it": "Junior Start"
        },
        "description": {
            "en": "An adapted course for the youngest students using simple visual tools like Scratch Jr and Tinkercad.",
            "ru": "Адаптированный курс для самых маленьких студентов, использующий простые визуальные инструменты, такие как Scratch Jr и Tinkercad.",
            "de": "Ein angepasster Kurs für die jüngsten Studenten mit einfachen visuellen Tools wie Scratch Jr und Tinkercad.",
            "he": "קורס מותאם לסטודנטים הצעירים ביותר באמצעות כלים ויזואליים פשוטים כמו Scratch Jr ו-Tinkercad.",
            "pl": "Dostosowany kurs dla najmłodszych studentów używający prostych narzędzi wizualnych jak Scratch Jr i Tinkercad.",
            "nl": "Een aangepaste cursus voor de jongste studenten met eenvoudige visuele tools zoals Scratch Jr en Tinkercad.",
            "uk": "Адаптований курс для наймолодших студентів, що використовує прості візуальні інструменти, такі як Scratch Jr та Tinkercad.",
            "es": "Un curso adaptado para los estudiantes más jóvenes usando herramientas visuales simples como Scratch Jr y Tinkercad.",
            "it": "Un corso adattato per gli studenti più giovani usando strumenti visivi semplici come Scratch Jr e Tinkercad."
        },
        "age": {
            "en": "5-7 years",
            "ru": "5-7 лет",
            "de": "5-7 Jahre",
            "he": "5-7 שנים",
            "pl": "5-7 lat",
            "nl": "5-7 jaar",
            "uk": "5-7 років",
            "es": "5-7 años",
            "it": "5-7 anni"
        },
        "duration": {
            "en": "2-3 Months",
            "ru": "2-3 месяца",
            "de": "2-3 Monate",
            "he": "2-3 חודשים",
            "pl": "2-3 miesiące",
            "nl": "2-3 maanden",
            "uk": "2-3 місяці",
            "es": "2-3 meses",
            "it": "2-3 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Scratch Jr",
            "Tinkercad",
            "Pixilart"
        ],
        "defaultDuration": 25,
        "whatYouLearn": {
            "en": [
                "Develop early computational thinking skills.",
                "Create simple animations and interactive stories.",
                "Understand sequencing and cause-and-effect.",
                "Learn basic 3D modeling concepts (Tinkercad).",
                "Express creativity through digital art (Pixilart).",
                "Improve fine motor skills and digital literacy."
            ],
            "ru": [
                "Развивать ранние навыки вычислительного мышления.",
                "Создавать простые анимации и интерактивные истории.",
                "Понимать последовательность и причинно-следственные связи.",
                "Изучать базовые концепции 3D-моделирования (Tinkercad).",
                "Выражать креативность через цифровое искусство (Pixilart).",
                "Улучшать мелкую моторику и цифровую грамотность."
            ],
            "de": [
                "Frühe computational thinking Fähigkeiten entwickeln.",
                "Einfache Animationen und interaktive Geschichten erstellen.",
                "Sequenzierung und Ursache-Wirkung verstehen.",
                "Grundlegende 3D-Modellierungskonzepte lernen (Tinkercad).",
                "Kreativität durch digitale Kunst ausdrücken (Pixilart).",
                "Feinmotorik und digitale Kompetenz verbessern."
            ],
            "he": [
                "פיתוח כישורי חשיבה חישובית מוקדמת.",
                "יצירת אנימציות פשוטות וסיפורים אינטראקטיביים.",
                "הבנת רצף וסיבה ותוצאה.",
                "למידת מושגי מודלינג תלת-ממדי בסיסיים (Tinkercad).",
                "ביטוי יצירתיות דרך אמנות דיגיטלית (Pixilart).",
                "שיפור כישורי מוטוריקה עדינה ואוריינות דיגיטלית."
            ],
            "pl": [
                "Rozwijanie wczesnych umiejętności myślenia obliczeniowego.",
                "Tworzenie prostych animacji i interaktywnych historii.",
                "Rozumienie sekwencji i związku przyczynowo-skutkowego.",
                "Nauka podstawowych koncepcji modelowania 3D (Tinkercad).",
                "Wyrażanie kreatywności przez sztukę cyfrową (Pixilart).",
                "Poprawa umiejętności motorycznych i alfabetyzacji cyfrowej."
            ],
            "nl": [
                "Vroege computationele denkvaardigheden ontwikkelen.",
                "Eenvoudige animaties en interactieve verhalen maken.",
                "Sequencing en oorzaak-en-gevolg begrijpen.",
                "Basis 3D-modelleringsconcepten leren (Tinkercad).",
                "Creativiteit uitdrukken door digitale kunst (Pixilart).",
                "Fijne motoriek en digitale geletterdheid verbeteren."
            ],
            "uk": [
                "Розвивати ранні навички обчислювального мислення.",
                "Створювати прості анімації та інтерактивні історії.",
                "Розуміти послідовність та причинно-наслідкові зв'язки.",
                "Вивчати базові концепції 3D-моделювання (Tinkercad).",
                "Виражати креативність через цифрове мистецтво (Pixilart).",
                "Покращувати дрібну моторику та цифрову грамотність."
            ],
            "es": [
                "Desarrollar habilidades tempranas de pensamiento computacional.",
                "Crear animaciones simples e historias interactivas.",
                "Entender secuenciación y causa y efecto.",
                "Aprender conceptos básicos de modelado 3D (Tinkercad).",
                "Expresar creatividad a través del arte digital (Pixilart).",
                "Mejorar habilidades motoras finas y alfabetización digital."
            ],
            "it": [
                "Sviluppare abilità di pensiero computazionale precoci.",
                "Creare animazioni semplici e storie interattive.",
                "Comprendere sequenziamento e causa-effetto.",
                "Imparare concetti base di modellazione 3D (Tinkercad).",
                "Esprimere creatività attraverso l'arte digitale (Pixilart).",
                "Migliorare abilità motorie fini e alfabetizzazione digitale."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: First Steps with Scratch Jr",
                    "ru": "Модуль 1-2: Первые шаги с Scratch Jr",
                    "de": "Modul 1-2: Erste Schritte mit Scratch Jr",
                    "he": "מודול 1-2: צעדים ראשונים עם Scratch Jr",
                    "pl": "Moduł 1-2: Pierwsze kroki z Scratch Jr",
                    "nl": "Module 1-2: Eerste stappen met Scratch Jr",
                    "uk": "Модуль 1-2: Перші кроки з Scratch Jr",
                    "es": "Módulo 1-2: Primeros pasos con Scratch Jr",
                    "it": "Modulo 1-2: Primi passi con Scratch Jr"
                },
                "description": {
                    "en": "Introduction to Scratch Jr, understanding the interface and basic block movements. Creating simple scenes and making characters move and interact.",
                    "ru": "Введение в Scratch Jr, понимание интерфейса и базовых движений блоков. Создание простых сцен и заставка персонажей двигаться и взаимодействовать.",
                    "de": "Einführung in Scratch Jr, Verständnis der Oberfläche und grundlegender Blockbewegungen. Erstellen einfacher Szenen und Charaktere zum Bewegen und Interagieren bringen.",
                    "he": "מבוא ל-Scratch Jr, הבנת הממשק ותנועות בלוקים בסיסיות. יצירת סצנות פשוטות והנעת דמויות לאינטראקציה.",
                    "pl": "Wprowadzenie do Scratch Jr, zrozumienie interfejsu i podstawowych ruchów bloków. Tworzenie prostych scen i sprawianie, że postacie się poruszają i wchodzą w interakcję.",
                    "nl": "Introductie tot Scratch Jr, begrijpen van de interface en basis blokbewegingen. Eenvoudige scènes maken en karakters laten bewegen en interacteren.",
                    "uk": "Введення в Scratch Jr, розуміння інтерфейсу та базових рухів блоків. Створення простих сцен та заставка персонажів рухатися та взаємодіяти.",
                    "es": "Introducción a Scratch Jr, comprensión de la interfaz y movimientos básicos de bloques. Creando escenas simples y haciendo que los personajes se muevan e interactúen.",
                    "it": "Introduzione a Scratch Jr, comprensione dell'interfaccia e movimenti base dei blocchi. Creare scene semplici e far muovere e interagire i personaggi."
                }
            }
        ]
    },
    "minecraft": {
        "visible": true,
        "order": 5,
        "name": {
            "en": "Minecraft Modding",
            "ru": "Модинг Minecraft",
            "de": "Minecraft Modding",
            "he": "Minecraft Modding",
            "pl": "Minecraft Modding",
            "nl": "Minecraft Modding",
            "uk": "Minecraft Modding",
            "es": "Minecraft Modding",
            "it": "Minecraft Modding"
        },
        "description": {
            "en": "Learn programming by creating unique mods and automating tasks within the Minecraft universe.",
            "ru": "Изучайте программирование, создавая уникальные моды и автоматизируя задачи в мире Minecraft.",
            "de": "Lernen Sie Programmieren, indem Sie einzigartige Mods erstellen und Aufgaben im Minecraft-Universum automatisieren.",
            "he": "למדו תכנות על ידי יצירת מודים ייחודיים ואוטומציה של משימות בעולם Minecraft.",
            "pl": "Naucz się programowania tworząc unikalne mody i automatyzując zadania w świecie Minecraft.",
            "nl": "Leer programmeren door unieke mods te maken en taken te automatiseren in het Minecraft universum.",
            "uk": "Вивчайте програмування, створюючи унікальні моди та автоматизуючи завдання у світі Minecraft.",
            "es": "Aprende programación creando mods únicos y automatizando tareas dentro del universo de Minecraft.",
            "it": "Impara a programmare creando mod unici e automatizzando compiti nell'universo di Minecraft."
        },
        "age": {
            "en": "8-12 years",
            "ru": "8-12 лет",
            "de": "8-12 Jahre",
            "he": "8-12 שנים",
            "pl": "8-12 lat",
            "nl": "8-12 jaar",
            "uk": "8-12 років",
            "es": "8-12 años",
            "it": "8-12 anni"
        },
        "duration": {
            "en": "4-8 Months",
            "ru": "4-8 месяцев",
            "de": "4-8 Monate",
            "he": "4-8 חודשים",
            "pl": "4-8 miesięcy",
            "nl": "4-8 maanden",
            "uk": "4-8 місяців",
            "es": "4-8 meses",
            "it": "4-8 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Minecraft",
            "ComputerCraft",
            "Lua"
        ],
        "defaultDuration": 50,
        "whatYouLearn": {
            "en": [
                "Understand programming concepts in a game context.",
                "Create custom items, blocks, and recipes.",
                "Develop automated systems and machines.",
                "Program robots within Minecraft using Lua (ComputerCraft).",
                "Design and build unique game mechanics.",
                "Apply logical thinking to in-game challenges."
            ],
            "ru": [
                "Понимать концепции программирования в игровом контексте.",
                "Создавать пользовательские предметы, блоки и рецепты.",
                "Разрабатывать автоматизированные системы и машины.",
                "Программировать роботов в Minecraft используя Lua (ComputerCraft).",
                "Проектировать и строить уникальную игровую механику.",
                "Применять логическое мышление к внутриигровым вызовам."
            ],
            "de": [
                "Programmierkonzepte im Spielkontext verstehen.",
                "Benutzerdefinierte Items, Blöcke und Rezepte erstellen.",
                "Automatisierte Systeme und Maschinen entwickeln.",
                "Roboter in Minecraft mit Lua programmieren (ComputerCraft).",
                "Einzigartige Spielmechaniken entwerfen und bauen.",
                "Logisches Denken auf Spielherausforderungen anwenden."
            ],
            "he": [
                "הבנת מושגי תכנות בהקשר משחק.",
                "יצירת פריטים, בלוקים ומתכונים מותאמים אישית.",
                "פיתוח מערכות ומכונות אוטומטיות.",
                "תכנות רובוטים ב-Minecraft באמצעות Lua (ComputerCraft).",
                "עיצוב ובניית מכניקות משחק ייחודיות.",
                "יישום חשיבה לוגית על אתגרים במשחק."
            ],
            "pl": [
                "Rozumienie koncepcji programowania w kontekście gry.",
                "Tworzenie niestandardowych przedmiotów, bloków i przepisów.",
                "Rozwijanie zautomatyzowanych systemów i maszyn.",
                "Programowanie robotów w Minecraft używając Lua (ComputerCraft).",
                "Projektowanie i budowanie unikalnych mechanik gry.",
                "Stosowanie logicznego myślenia do wyzwań w grze."
            ],
            "nl": [
                "Programmeerconcepten begrijpen in een spelcontext.",
                "Aangepaste items, blokken en recepten maken.",
                "Geautomatiseerde systemen en machines ontwikkelen.",
                "Robots programmeren binnen Minecraft met Lua (ComputerCraft).",
                "Unieke spelmechanieken ontwerpen en bouwen.",
                "Logisch denken toepassen op in-game uitdagingen."
            ],
            "uk": [
                "Розуміти концепції програмування в ігровому контексті.",
                "Створювати користувацькі предмети, блоки та рецепти.",
                "Розробляти автоматизовані системи та машини.",
                "Програмувати роботів у Minecraft використовуючи Lua (ComputerCraft).",
                "Проектувати та будувати унікальну ігрову механіку.",
                "Застосовувати логічне мислення до внутрішньоігрових викликів."
            ],
            "es": [
                "Entender conceptos de programación en un contexto de juego.",
                "Crear objetos, bloques y recetas personalizados.",
                "Desarrollar sistemas y máquinas automatizadas.",
                "Programar robots dentro de Minecraft usando Lua (ComputerCraft).",
                "Diseñar y construir mecánicas de juego únicas.",
                "Aplicar pensamiento lógico a desafíos del juego."
            ],
            "it": [
                "Comprendere i concetti di programmazione in un contesto di gioco.",
                "Creare oggetti, blocchi e ricette personalizzati.",
                "Sviluppare sistemi e macchine automatizzati.",
                "Programmare robot all'interno di Minecraft usando Lua (ComputerCraft).",
                "Progettare e costruire meccaniche di gioco uniche.",
                "Applicare il pensiero logico alle sfide di gioco."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: Intro to Minecraft Modding & Automation",
                    "ru": "Модуль 1-2: Введение в модинг и автоматизацию Minecraft",
                    "de": "Modul 1-2: Einführung in Minecraft Modding & Automatisierung",
                    "he": "מודול 1-2: מבוא ל-Minecraft Modding ואוטומציה",
                    "pl": "Moduł 1-2: Wprowadzenie do Minecraft Modding i automatyzacji",
                    "nl": "Module 1-2: Introductie tot Minecraft Modding & Automatisering",
                    "uk": "Модуль 1-2: Введення в модинг та автоматизацію Minecraft",
                    "es": "Módulo 1-2: Introducción a Minecraft Modding y Automatización",
                    "it": "Modulo 1-2: Introduzione a Minecraft Modding e Automazione"
                },
                "description": {
                    "en": "Introduction to ComputerCraft and Lua scripting. Learning to program simple robots (turtles) to perform basic tasks like mining and building.",
                    "ru": "Введение в ComputerCraft и скриптинг на Lua. Обучение программированию простых роботов (черепах) для выполнения базовых задач, таких как добыча и строительство.",
                    "de": "Einführung in ComputerCraft und Lua-Skripting. Lernen, einfache Roboter (Schildkröten) zu programmieren, um grundlegende Aufgaben wie Bergbau und Bauen zu erledigen.",
                    "he": "מבוא ל-ComputerCraft וסקריפטינג Lua. למידה לתכנת רובוטים פשוטים (צבים) לביצוע משימות בסיסיות כמו כרייה ובנייה.",
                    "pl": "Wprowadzenie do ComputerCraft i skryptowania Lua. Nauka programowania prostych robotów (żółwi) do wykonywania podstawowych zadań jak wydobycie i budowanie.",
                    "nl": "Introductie tot ComputerCraft en Lua scripting. Leren om eenvoudige robots (schildpadden) te programmeren voor basis taken zoals mijnen en bouwen.",
                    "uk": "Введення в ComputerCraft та скриптинг на Lua. Навчання програмуванню простих роботів (черепах) для виконання базових завдань, таких як видобуток та будівництво.",
                    "es": "Introducción a ComputerCraft y scripting Lua. Aprender a programar robots simples (tortugas) para realizar tareas básicas como minería y construcción.",
                    "it": "Introduzione a ComputerCraft e scripting Lua. Imparare a programmare robot semplici (tartarughe) per eseguire compiti base come estrazione e costruzione."
                }
            }
        ]
    },
    "3ddesigner": {
        "visible": true,
        "order": 6,
        "name": {
            "en": "3D Designer",
            "ru": "3D Дизайнер",
            "de": "3D Designer",
            "he": "מעצב תלת מימד",
            "pl": "Projektant 3D",
            "nl": "3D Ontwerper",
            "uk": "3D Дизайнер",
            "es": "Diseñador 3D",
            "it": "Designer 3D"
        },
        "description": {
            "en": "Learn the fundamentals of 3D modeling, create realistic textures, and build game environments. Master Blender, Substance Painter, and Unreal Engine.",
            "ru": "Изучите основы 3D-моделирования, создавайте реалистичные текстуры и стройте игровые среды. Освойте Blender, Substance Painter и Unreal Engine.",
            "de": "Lernen Sie die Grundlagen des 3D-Modellierens, erstellen Sie realistische Texturen und bauen Sie Spielumgebungen. Meistern Sie Blender, Substance Painter und Unreal Engine.",
            "he": "למדו את יסודות המודלינג התלת-ממדי, צרו טקסטורות ריאליסטיות ובנו סביבות משחק. שלוטו ב-Blender, Substance Painter ו-Unreal Engine.",
            "pl": "Naucz się podstaw modelowania 3D, twórz realistyczne tekstury i buduj środowiska gier. Opanuj Blender, Substance Painter i Unreal Engine.",
            "nl": "Leer de fundamenten van 3D modelleren, maak realistische texturen en bouw game omgevingen. Beheers Blender, Substance Painter en Unreal Engine.",
            "uk": "Вивчіть основи 3D-моделювання, створюйте реалістичні текстури та будьте ігрові середовища. Опануйте Blender, Substance Painter та Unreal Engine.",
            "es": "Aprende los fundamentos del modelado 3D, crea texturas realistas y construye entornos de juego. Domina Blender, Substance Painter y Unreal Engine.",
            "it": "Impara i fondamenti della modellazione 3D, crea texture realistiche e costruisci ambienti di gioco. Padroneggia Blender, Substance Painter e Unreal Engine."
        },
        "age": {
            "en": "12+ years",
            "ru": "12+ лет",
            "de": "12+ Jahre",
            "he": "12+ שנים",
            "pl": "12+ lat",
            "nl": "12+ jaar",
            "uk": "12+ років",
            "es": "12+ años",
            "it": "12+ anni"
        },
        "duration": {
            "en": "6-12 Months",
            "ru": "6-12 месяцев",
            "de": "6-12 Monate",
            "he": "6-12 חודשים",
            "pl": "6-12 miesięcy",
            "nl": "6-12 maanden",
            "uk": "6-12 місяців",
            "es": "6-12 meses",
            "it": "6-12 mesi"
        },
        "format": {
            "en": "Online, 1-on-1",
            "ru": "Онлайн, 1-на-1",
            "de": "Online, 1-zu-1",
            "he": "אונליין, אחד על אחד",
            "pl": "Online, 1-na-1",
            "nl": "Online, 1-op-1",
            "uk": "Онлайн, 1-на-1",
            "es": "En línea, 1-a-1",
            "it": "Online, 1-a-1"
        },
        "tools": [
            "Blender",
            "Substance Painter",
            "Unreal Engine",
            "3D Modeling Tools"
        ],
        "defaultDuration": 50,
        "whatYouLearn": {
            "en": [
                "Master 3D modeling fundamentals in Blender.",
                "Create low and high-polygon models for games.",
                "Design realistic textures using Substance Painter.",
                "Build immersive game environments in Unreal Engine.",
                "Understand 3D modeling workflows and best practices.",
                "Develop skills in game asset creation and optimization."
            ],
            "ru": [
                "Освоить основы 3D-моделирования в Blender.",
                "Создавать низкополигональные и высокополигональные модели для игр.",
                "Проектировать реалистичные текстуры используя Substance Painter.",
                "Строить захватывающие игровые среды в Unreal Engine.",
                "Понимать рабочие процессы 3D-моделирования и лучшие практики.",
                "Развивать навыки создания и оптимизации игровых ресурсов."
            ],
            "de": [
                "3D-Modellierungsgrundlagen in Blender beherrschen.",
                "Niedrig- und hochpolygonale Modelle für Spiele erstellen.",
                "Realistische Texturen mit Substance Painter entwerfen.",
                "Immersive Spielumgebungen in Unreal Engine bauen.",
                "3D-Modellierungsworkflows und Best Practices verstehen.",
                "Fähigkeiten in der Erstellung und Optimierung von Spielressourcen entwickeln."
            ],
            "he": [
                "שליטה ביסודות המודלינג התלת-ממדי ב-Blender.",
                "יצירת מודלים נמוכי פוליגון וגבוהי פוליגון למשחקים.",
                "עיצוב טקסטורות ריאליסטיות באמצעות Substance Painter.",
                "בניית סביבות משחק מרתקות ב-Unreal Engine.",
                "הבנת תהליכי עבודה של מודלינג תלת-ממדי ופרקטיקות מומלצות.",
                "פיתוח כישורים ביצירת ואופטימיזציה של נכסי משחק."
            ],
            "pl": [
                "Opanowanie podstaw modelowania 3D w Blenderze.",
                "Tworzenie modeli niskopoligonowych i wysokopoligonowych do gier.",
                "Projektowanie realistycznych tekstur używając Substance Painter.",
                "Budowanie wciągających środowisk gier w Unreal Engine.",
                "Rozumienie procesów modelowania 3D i najlepszych praktyk.",
                "Rozwijanie umiejętności tworzenia i optymalizacji zasobów gier."
            ],
            "nl": [
                "3D modelleringsfundamenten beheersen in Blender.",
                "Lage en hoge polygoon modellen maken voor spellen.",
                "Realistische texturen ontwerpen met Substance Painter.",
                "Immersieve spelomgevingen bouwen in Unreal Engine.",
                "3D modelleringsworkflows en best practices begrijpen.",
                "Vaardigheden ontwikkelen in game asset creatie en optimalisatie."
            ],
            "uk": [
                "Опанувати основи 3D-моделювання в Blender.",
                "Створювати низькополігональні та високополігональні моделі для ігор.",
                "Проектувати реалістичні текстури використовуючи Substance Painter.",
                "Будувати захоплюючі ігрові середовища в Unreal Engine.",
                "Розуміти робочі процеси 3D-моделювання та найкращі практики.",
                "Розвивати навички створення та оптимізації ігрових ресурсів."
            ],
            "es": [
                "Dominar los fundamentos del modelado 3D en Blender.",
                "Crear modelos de bajo y alto polígono para juegos.",
                "Diseñar texturas realistas usando Substance Painter.",
                "Construir entornos de juego inmersivos en Unreal Engine.",
                "Entender flujos de trabajo de modelado 3D y mejores prácticas.",
                "Desarrollar habilidades en creación y optimización de assets de juego."
            ],
            "it": [
                "Padroneggiare i fondamenti della modellazione 3D in Blender.",
                "Creare modelli a basso e alto poligono per giochi.",
                "Progettare texture realistiche usando Substance Painter.",
                "Costruire ambienti di gioco immersivi in Unreal Engine.",
                "Comprendere i flussi di lavoro di modellazione 3D e le migliori pratiche.",
                "Sviluppare abilità nella creazione e ottimizzazione di asset di gioco."
            ]
        },
        "modules": [
            {
                "title": {
                    "en": "Module 1-2: Blender Fundamentals",
                    "ru": "Модуль 1-2: Основы Blender",
                    "de": "Modul 1-2: Blender Grundlagen",
                    "he": "מודול 1-2: יסודות Blender",
                    "pl": "Moduł 1-2: Podstawy Blendera",
                    "nl": "Module 1-2: Blender Fundamentals",
                    "uk": "Модуль 1-2: Основи Blender",
                    "es": "Módulo 1-2: Fundamentos de Blender",
                    "it": "Modulo 1-2: Fondamenti di Blender"
                },
                "description": {
                    "en": "Introduction to Blender interface, basic 3D modeling techniques, working with meshes, vertices, edges, and faces. Creating your first 3D objects and understanding the 3D workspace.",
                    "ru": "Введение в интерфейс Blender, базовые техники 3D-моделирования, работа с сетками, вершинами, рёбрами и гранями. Создание первых 3D-объектов и понимание 3D-рабочего пространства.",
                    "de": "Einführung in die Blender-Oberfläche, grundlegende 3D-Modellierungstechniken, Arbeiten mit Meshes, Vertices, Kanten und Flächen. Erstellen Ihrer ersten 3D-Objekte und Verstehen des 3D-Arbeitsbereichs.",
                    "he": "מבוא לממשק Blender, טכניקות מודלינג תלת-ממדי בסיסיות, עבודה עם רשתות, קודקודים, קצוות ופנים. יצירת האובייקטים התלת-ממדיים הראשונים והבנת סביבת העבודה התלת-ממדית.",
                    "pl": "Wprowadzenie do interfejsu Blendera, podstawowe techniki modelowania 3D, praca z siatkami, wierzchołkami, krawędziami i ścianami. Tworzenie pierwszych obiektów 3D i zrozumienie przestrzeni roboczej 3D.",
                    "nl": "Introductie tot Blender interface, basis 3D modelleringstechnieken, werken met meshes, vertices, edges en faces. Je eerste 3D objecten maken en de 3D werkruimte begrijpen.",
                    "uk": "Введення в інтерфейс Blender, базові техніки 3D-моделювання, робота з сітками, вершинами, ребрами та гранями. Створення перших 3D-об'єктів та розуміння 3D-робочого простору.",
                    "es": "Introducción a la interfaz de Blender, técnicas básicas de modelado 3D, trabajar con mallas, vértices, aristas y caras. Creando tus primeros objetos 3D y entendiendo el espacio de trabajo 3D.",
                    "it": "Introduzione all'interfaccia di Blender, tecniche base di modellazione 3D, lavorare con mesh, vertici, bordi e facce. Creare i tuoi primi oggetti 3D e comprendere lo spazio di lavoro 3D."
                }
            }
        ]
    }
};

module.exports = courses;