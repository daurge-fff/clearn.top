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
                              "en": "Module 1: Getting Started with Scratch",
                              "ru": "Модуль 1: Начало работы со Scratch",
                              "de": "Modul 1: Erste Schritte mit Scratch",
                              "he": "מודול 1: התחלה עם Scratch",
                              "pl": "Moduł 1: Pierwsze kroki ze Scratch",
                              "nl": "Module 1: Aan de slag met Scratch",
                              "uk": "Модуль 1: Початок роботи зі Scratch",
                              "es": "Módulo 1: Primeros pasos con Scratch",
                              "it": "Modulo 1: Primi passi con Scratch"
                    },
                    "description": {
                              "en": "Introduction to Scratch interface, creating your first sprites and backdrops. Learning basic navigation and understanding the workspace.",
                              "ru": "Введение в интерфейс Scratch, создание первых спрайтов и фонов. Изучение базовой навигации и понимание рабочего пространства.",
                              "de": "Einführung in die Scratch-Oberfläche, Erstellen Ihrer ersten Sprites und Hintergründe. Erlernen der grundlegenden Navigation und Verstehen des Arbeitsbereichs.",
                              "he": "מבוא לממשק Scratch, יצירת הספריטים והרקעים הראשונים. למידת ניווט בסיסי והבנת סביבת העבודה.",
                              "pl": "Wprowadzenie do interfejsu Scratch, tworzenie pierwszych duszków i tła. Nauka podstawowej nawigacji i zrozumienie obszaru roboczego.",
                              "nl": "Inleiding tot de Scratch-interface, het maken van je eerste sprites en achtergronden. Leren van basisnavigatie en begrijpen van de werkruimte.",
                              "uk": "Введення в інтерфейс Scratch, створення перших спрайтів і фонів. Вивчення базової навігації та розуміння робочого простору.",
                              "es": "Introducción a la interfaz de Scratch, creando tus primeros sprites y fondos. Aprendiendo navegación básica y entendiendo el espacio de trabajo.",
                              "it": "Introduzione all'interfaccia Scratch, creando i tuoi primi sprite e sfondi. Imparando la navigazione di base e comprendendo l'area di lavoro."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Basic Animation & Motion",
                              "ru": "Модуль 2: Базовая анимация и движение",
                              "de": "Modul 2: Grundlegende Animation & Bewegung",
                              "he": "מודול 2: אנימציה בסיסית ותנועה",
                              "pl": "Moduł 2: Podstawowa animacja i ruch",
                              "nl": "Module 2: Basis animatie & beweging",
                              "uk": "Модуль 2: Базова анімація та рух",
                              "es": "Módulo 2: Animación básica y movimiento",
                              "it": "Modulo 2: Animazione di base e movimento"
                    },
                    "description": {
                              "en": "Learning motion blocks, creating simple animations, understanding coordinates and movement patterns. Making characters move and interact.",
                              "ru": "Изучение блоков движения, создание простых анимаций, понимание координат и паттернов движения. Заставка персонажей двигаться и взаимодействовать.",
                              "de": "Lernen von Bewegungsblöcken, Erstellen einfacher Animationen, Verstehen von Koordinaten und Bewegungsmustern. Charaktere bewegen und interagieren lassen.",
                              "he": "למידת בלוקי תנועה, יצירת אנימציות פשוטות, הבנת קואורדינטות ודפוסי תנועה. גרימת דמויות לזוז ולתקשר.",
                              "pl": "Nauka bloków ruchu, tworzenie prostych animacji, rozumienie współrzędnych i wzorców ruchu. Sprawianie, że postacie się poruszają i wchodzą w interakcję.",
                              "nl": "Leren van bewegingsblokken, het maken van eenvoudige animaties, begrijpen van coördinaten en bewegingspatronen. Karakters laten bewegen en interacteren.",
                              "uk": "Вивчення блоків руху, створення простих анімацій, розуміння координат і патернів руху. Заставка персонажів рухатися та взаємодіяти.",
                              "es": "Aprendiendo bloques de movimiento, creando animaciones simples, entendiendo coordenadas y patrones de movimiento. Haciendo que los personajes se muevan e interactúen.",
                              "it": "Imparando i blocchi di movimento, creando animazioni semplici, comprendendo coordinate e pattern di movimento. Facendo muovere e interagire i personaggi."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Looks & Visual Effects",
                              "ru": "Модуль 3: Внешний вид и визуальные эффекты",
                              "de": "Modul 3: Aussehen & visuelle Effekte",
                              "he": "מודול 3: מראה ואפקטים ויזואליים",
                              "pl": "Moduł 3: Wygląd i efekty wizualne",
                              "nl": "Module 3: Uiterlijk & visuele effecten",
                              "uk": "Модуль 3: Зовнішній вигляд та візуальні ефекти",
                              "es": "Módulo 3: Apariencia y efectos visuales",
                              "it": "Modulo 3: Aspetto ed effetti visivi"
                    },
                    "description": {
                              "en": "Exploring looks blocks, changing costumes, adding visual effects, understanding size, color, and transparency effects.",
                              "ru": "Изучение блоков внешнего вида, смена костюмов, добавление визуальных эффектов, понимание размера, цвета и эффектов прозрачности.",
                              "de": "Erkunden von Aussehensblöcken, Ändern von Kostümen, Hinzufügen visueller Effekte, Verstehen von Größe, Farbe und Transparenzeffekten.",
                              "he": "חקירת בלוקי מראה, החלפת תלבושות, הוספת אפקטים ויזואליים, הבנת גודל, צבע ואפקטי שקיפות.",
                              "pl": "Eksplorowanie bloków wyglądu, zmiana kostiumów, dodawanie efektów wizualnych, rozumienie rozmiaru, koloru i efektów przezroczystości.",
                              "nl": "Verkennen van uiterlijkblokken, het veranderen van kostuums, het toevoegen van visuele effecten, het begrijpen van grootte, kleur en transparantie-effecten.",
                              "uk": "Дослідження блоків зовнішнього вигляду, зміна костюмів, додавання візуальних ефектів, розуміння розміру, кольору та ефектів прозорості.",
                              "es": "Explorando bloques de apariencia, cambiando disfraces, agregando efectos visuales, entendiendo tamaño, color y efectos de transparencia.",
                              "it": "Esplorando i blocchi di aspetto, cambiando costumi, aggiungendo effetti visivi, comprendendo dimensioni, colore ed effetti di trasparenza."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: Events & Interaction",
                              "ru": "Модуль 4: События и взаимодействие",
                              "de": "Modul 4: Ereignisse & Interaktion",
                              "he": "מודול 4: אירועים ואינטראקציה",
                              "pl": "Moduł 4: Zdarzenia i interakcja",
                              "nl": "Module 4: Gebeurtenissen & interactie",
                              "uk": "Модуль 4: Події та взаємодія",
                              "es": "Módulo 4: Eventos e interacción",
                              "it": "Modulo 4: Eventi e interazione"
                    },
                    "description": {
                              "en": "Learning event blocks, creating interactive projects, understanding when scripts run and how to trigger different actions.",
                              "ru": "Изучение блоков событий, создание интерактивных проектов, понимание когда запускаются скрипты и как активировать различные действия.",
                              "de": "Lernen von Ereignisblöcken, Erstellen interaktiver Projekte, Verstehen wann Skripte laufen und wie verschiedene Aktionen ausgelöst werden.",
                              "he": "למידת בלוקי אירועים, יצירת פרויקטים אינטראקטיביים, הבנה מתי סקריפטים רצים ואיך להפעיל פעולות שונות.",
                              "pl": "Nauka bloków zdarzeń, tworzenie projektów interaktywnych, rozumienie kiedy skrypty się uruchamiają i jak wyzwalać różne akcje.",
                              "nl": "Leren van gebeurtenisblokken, het maken van interactieve projecten, begrijpen wanneer scripts draaien en hoe verschillende acties te activeren.",
                              "uk": "Вивчення блоків подій, створення інтерактивних проектів, розуміння коли запускаються скрипти та як активувати різні дії.",
                              "es": "Aprendiendo bloques de eventos, creando proyectos interactivos, entendiendo cuándo se ejecutan los scripts y cómo activar diferentes acciones.",
                              "it": "Imparando i blocchi di eventi, creando progetti interattivi, comprendendo quando gli script vengono eseguiti e come attivare diverse azioni."
                    }
          },
          {
                    "title": {
                              "en": "Module 5: Control & Logic",
                              "ru": "Модуль 5: Управление и логика",
                              "de": "Modul 5: Steuerung & Logik",
                              "he": "מודול 5: בקרה ולוגיקה",
                              "pl": "Moduł 5: Kontrola i logika",
                              "nl": "Module 5: Controle & logica",
                              "uk": "Модуль 5: Управління та логіка",
                              "es": "Módulo 5: Control y lógica",
                              "it": "Modulo 5: Controllo e logica"
                    },
                    "description": {
                              "en": "Understanding loops, conditions, and control structures. Creating more complex logic and decision-making in projects.",
                              "ru": "Понимание циклов, условий и управляющих структур. Создание более сложной логики и принятия решений в проектах.",
                              "de": "Verstehen von Schleifen, Bedingungen und Steuerungsstrukturen. Erstellen komplexerer Logik und Entscheidungsfindung in Projekten.",
                              "he": "הבנת לולאות, תנאים ומבני בקרה. יצירת לוגיקה מורכבת יותר וקבלת החלטות בפרויקטים.",
                              "pl": "Rozumienie pętli, warunków i struktur kontrolnych. Tworzenie bardziej złożonej logiki i podejmowania decyzji w projektach.",
                              "nl": "Begrijpen van loops, voorwaarden en controle structuren. Het maken van complexere logica en besluitvorming in projecten.",
                              "uk": "Розуміння циклів, умов та управляючих структур. Створення більш складної логіки та прийняття рішень у проектах.",
                              "es": "Entendiendo bucles, condiciones y estructuras de control. Creando lógica más compleja y toma de decisiones en proyectos.",
                              "it": "Comprendendo loop, condizioni e strutture di controllo. Creando logica più complessa e processo decisionale nei progetti."
                    }
          },
          {
                    "title": {
                              "en": "Module 6: Sensing & Variables",
                              "ru": "Модуль 6: Сенсоры и переменные",
                              "de": "Modul 6: Sensoren & Variablen",
                              "he": "מודול 6: חיישנים ומשתנים",
                              "pl": "Moduł 6: Czujniki i zmienne",
                              "nl": "Module 6: Sensoren & variabelen",
                              "uk": "Модуль 6: Датчики та змінні",
                              "es": "Módulo 6: Sensores y variables",
                              "it": "Modulo 6: Sensori e variabili"
                    },
                    "description": {
                              "en": "Learning about sensing blocks, creating variables, tracking scores and game states. Building interactive games and simulations.",
                              "ru": "Изучение блоков сенсоров, создание переменных, отслеживание очков и состояний игры. Создание интерактивных игр и симуляций.",
                              "de": "Lernen über Sensorblöcke, Erstellen von Variablen, Verfolgen von Punkten und Spielzuständen. Erstellen interaktiver Spiele und Simulationen.",
                              "he": "למידה על בלוקי חיישנים, יצירת משתנים, מעקב אחר ניקוד ומצבי משחק. בניית משחקים אינטראקטיביים וסימולציות.",
                              "pl": "Nauka o blokach czujników, tworzenie zmiennych, śledzenie wyników i stanów gry. Tworzenie interaktywnych gier i symulacji.",
                              "nl": "Leren over sensorblokken, het maken van variabelen, het bijhouden van scores en spelstatussen. Het bouwen van interactieve spellen en simulaties.",
                              "uk": "Вивчення блоків датчиків, створення змінних, відстеження очок та станів гри. Створення інтерактивних ігор та симуляцій.",
                              "es": "Aprendiendo sobre bloques de sensores, creando variables, rastreando puntuaciones y estados del juego. Construyendo juegos interactivos y simulaciones.",
                              "it": "Imparando sui blocchi sensori, creando variabili, tracciando punteggi e stati del gioco. Costruendo giochi interattivi e simulazioni."
                    }
          },
          {
                    "title": {
                              "en": "Module 7: Sound & Music",
                              "ru": "Модуль 7: Звук и музыка",
                              "de": "Modul 7: Sound & Musik",
                              "he": "מודול 7: קול ומוזיקה",
                              "pl": "Moduł 7: Dźwięk i muzyka",
                              "nl": "Module 7: Geluid & muziek",
                              "uk": "Модуль 7: Звук та музика",
                              "es": "Módulo 7: Sonido y música",
                              "it": "Modulo 7: Suono e musica"
                    },
                    "description": {
                              "en": "Adding sound effects and music to projects, understanding sound blocks, creating audio-visual experiences.",
                              "ru": "Добавление звуковых эффектов и музыки в проекты, понимание звуковых блоков, создание аудио-визуальных впечатлений.",
                              "de": "Hinzufügen von Soundeffekten und Musik zu Projekten, Verstehen von Soundblöcken, Erstellen von Audio-Visual-Erlebnissen.",
                              "he": "הוספת אפקטי קול ומוזיקה לפרויקטים, הבנת בלוקי קול, יצירת חוויות אודיו-ויזואליות.",
                              "pl": "Dodawanie efektów dźwiękowych i muzyki do projektów, rozumienie bloków dźwiękowych, tworzenie doświadczeń audio-wizualnych.",
                              "nl": "Het toevoegen van geluidseffecten en muziek aan projecten, het begrijpen van geluidsblokken, het creëren van audio-visuele ervaringen.",
                              "uk": "Додавання звукових ефектів та музики до проектів, розуміння звукових блоків, створення аудіо-візуальних вражень.",
                              "es": "Agregando efectos de sonido y música a proyectos, entendiendo bloques de sonido, creando experiencias audio-visuales.",
                              "it": "Aggiungendo effetti sonori e musica ai progetti, comprendendo i blocchi sonori, creando esperienze audio-visive."
                    }
          },
          {
                    "title": {
                              "en": "Module 8: Advanced Projects & Sharing",
                              "ru": "Модуль 8: Продвинутые проекты и обмен",
                              "de": "Modul 8: Erweiterte Projekte & Teilen",
                              "he": "מודול 8: פרויקטים מתקדמים ושיתוף",
                              "pl": "Moduł 8: Zaawansowane projekty i udostępnianie",
                              "nl": "Module 8: Geavanceerde projecten & delen",
                              "uk": "Модуль 8: Розширені проекти та обмін",
                              "es": "Módulo 8: Proyectos avanzados y compartir",
                              "it": "Modulo 8: Progetti avanzati e condivisione"
                    },
                    "description": {
                              "en": "Creating complex projects combining all learned skills, debugging techniques, and sharing projects with the Scratch community.",
                              "ru": "Создание сложных проектов, объединяющих все изученные навыки, техники отладки и обмен проектами с сообществом Scratch.",
                              "de": "Erstellen komplexer Projekte, die alle erlernten Fähigkeiten kombinieren, Debugging-Techniken und Teilen von Projekten mit der Scratch-Community.",
                              "he": "יצירת פרויקטים מורכבים המשלבים את כל המיומנויות הנלמדות, טכניקות דיבוג ושיתוף פרויקטים עם קהילת Scratch.",
                              "pl": "Tworzenie złożonych projektów łączących wszystkie wyuczone umiejętności, techniki debugowania i dzielenie się projektami ze społecznością Scratch.",
                              "nl": "Het maken van complexe projecten die alle geleerde vaardigheden combineren, debugging technieken en het delen van projecten met de Scratch gemeenschap.",
                              "uk": "Створення складних проектів, що поєднують всі вивчені навички, техніки налагодження та обмін проектами зі спільнотою Scratch.",
                              "es": "Creando proyectos complejos que combinan todas las habilidades aprendidas, técnicas de depuración y compartiendo proyectos con la comunidad Scratch.",
                              "it": "Creando progetti complessi che combinano tutte le abilità apprese, tecniche di debug e condividendo progetti con la comunità Scratch."
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
                              "en": "Module 1: Python Fundamentals",
                              "ru": "Модуль 1: Основы Python",
                              "de": "Modul 1: Python Grundlagen",
                              "he": "מודול 1: יסודות Python",
                              "pl": "Moduł 1: Podstawy Pythona",
                              "nl": "Module 1: Python Fundamentals",
                              "uk": "Модуль 1: Основи Python",
                              "es": "Módulo 1: Fundamentos de Python",
                              "it": "Modulo 1: Fondamenti di Python"
                    },
                    "description": {
                              "en": "Introduction to Python syntax, data types, variables, and basic operations. Understanding the Python interpreter and writing your first programs.",
                              "ru": "Введение в синтаксис Python, типы данных, переменные и базовые операции. Понимание интерпретатора Python и написание первых программ.",
                              "de": "Einführung in Python-Syntax, Datentypen, Variablen und grundlegende Operationen. Verstehen des Python-Interpreters und Schreiben Ihrer ersten Programme.",
                              "he": "מבוא לתחביר Python, סוגי נתונים, משתנים ופעולות בסיסיות. הבנת המפרש Python וכתיבת התוכניות הראשונות.",
                              "pl": "Wprowadzenie do składni Pythona, typów danych, zmiennych i podstawowych operacji. Zrozumienie interpretera Pythona i pisanie pierwszych programów.",
                              "nl": "Inleiding tot Python-syntax, gegevenstypen, variabelen en basisoperaties. Begrijpen van de Python-interpreter en het schrijven van je eerste programma's.",
                              "uk": "Введення в синтаксис Python, типи даних, змінні та базові операції. Розуміння інтерпретатора Python та написання перших програм.",
                              "es": "Introducción a la sintaxis de Python, tipos de datos, variables y operaciones básicas. Entendiendo el intérprete de Python y escribiendo tus primeros programas.",
                              "it": "Introduzione alla sintassi Python, tipi di dati, variabili e operazioni di base. Comprendendo l'interprete Python e scrivendo i tuoi primi programmi."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Control Structures & Functions",
                              "ru": "Модуль 2: Управляющие структуры и функции",
                              "de": "Modul 2: Steuerungsstrukturen & Funktionen",
                              "he": "מודול 2: מבני בקרה ופונקציות",
                              "pl": "Moduł 2: Struktury kontrolne i funkcje",
                              "nl": "Module 2: Controle structuren & functies",
                              "uk": "Модуль 2: Керуючі структури та функції",
                              "es": "Módulo 2: Estructuras de control y funciones",
                              "it": "Modulo 2: Strutture di controllo e funzioni"
                    },
                    "description": {
                              "en": "Learning loops, conditionals, and functions. Creating reusable code blocks and understanding scope and parameters.",
                              "ru": "Изучение циклов, условий и функций. Создание переиспользуемых блоков кода и понимание области видимости и параметров.",
                              "de": "Lernen von Schleifen, Bedingungen und Funktionen. Erstellen wiederverwendbarer Codeblöcke und Verstehen von Gültigkeitsbereich und Parametern.",
                              "he": "למידת לולאות, תנאים ופונקציות. יצירת בלוקי קוד לשימוש חוזר והבנת היקף ופרמטרים.",
                              "pl": "Nauka pętli, warunków i funkcji. Tworzenie wielokrotnego użytku bloków kodu i rozumienie zakresu i parametrów.",
                              "nl": "Leren van loops, voorwaarden en functies. Het maken van herbruikbare codeblokken en het begrijpen van scope en parameters.",
                              "uk": "Вивчення циклів, умов та функцій. Створення багаторазових блоків коду та розуміння області видимості та параметрів.",
                              "es": "Aprendiendo bucles, condicionales y funciones. Creando bloques de código reutilizables y entendiendo alcance y parámetros.",
                              "it": "Imparando loop, condizionali e funzioni. Creando blocchi di codice riutilizzabili e comprendendo scope e parametri."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Data Structures & Algorithms",
                              "ru": "Модуль 3: Структуры данных и алгоритмы",
                              "de": "Modul 3: Datenstrukturen & Algorithmen",
                              "he": "מודול 3: מבני נתונים ואלגוריתמים",
                              "pl": "Moduł 3: Struktury danych i algorytmy",
                              "nl": "Module 3: Gegevensstructuren & algoritmen",
                              "uk": "Модуль 3: Структури даних та алгоритми",
                              "es": "Módulo 3: Estructuras de datos y algoritmos",
                              "it": "Modulo 3: Strutture dati e algoritmi"
                    },
                    "description": {
                              "en": "Working with lists, dictionaries, tuples, and sets. Implementing sorting and searching algorithms, understanding time complexity.",
                              "ru": "Работа со списками, словарями, кортежами и множествами. Реализация алгоритмов сортировки и поиска, понимание временной сложности.",
                              "de": "Arbeiten mit Listen, Wörterbüchern, Tupeln und Mengen. Implementierung von Sortier- und Suchalgorithmen, Verstehen der Zeitkomplexität.",
                              "he": "עבודה עם רשימות, מילונים, tuples וקבוצות. יישום אלגוריתמי מיון וחיפוש, הבנת מורכבות זמן.",
                              "pl": "Praca z listami, słownikami, krotkami i zbiorami. Implementacja algorytmów sortowania i wyszukiwania, rozumienie złożoności czasowej.",
                              "nl": "Werken met lijsten, woordenboeken, tuples en sets. Het implementeren van sorteeralgoritmen en zoekalgoritmen, het begrijpen van tijdcomplexiteit.",
                              "uk": "Робота зі списками, словниками, кортежами та множинами. Реалізація алгоритмів сортування та пошуку, розуміння часової складності.",
                              "es": "Trabajando con listas, diccionarios, tuplas y conjuntos. Implementando algoritmos de ordenamiento y búsqueda, entendiendo la complejidad temporal.",
                              "it": "Lavorando con liste, dizionari, tuple e set. Implementando algoritmi di ordinamento e ricerca, comprendendo la complessità temporale."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: File Handling & Error Management",
                              "ru": "Модуль 4: Работа с файлами и обработка ошибок",
                              "de": "Modul 4: Dateiverarbeitung & Fehlerbehandlung",
                              "he": "מודול 4: טיפול בקבצים וניהול שגיאות",
                              "pl": "Moduł 4: Obsługa plików i zarządzanie błędami",
                              "nl": "Module 4: Bestandsverwerking & foutafhandeling",
                              "uk": "Модуль 4: Робота з файлами та обробка помилок",
                              "es": "Módulo 4: Manejo de archivos y gestión de errores",
                              "it": "Modulo 4: Gestione file e gestione errori"
                    },
                    "description": {
                              "en": "Reading and writing files, handling exceptions, working with CSV and JSON data. Implementing robust error handling strategies.",
                              "ru": "Чтение и запись файлов, обработка исключений, работа с данными CSV и JSON. Реализация надежных стратегий обработки ошибок.",
                              "de": "Lesen und Schreiben von Dateien, Behandeln von Ausnahmen, Arbeiten mit CSV- und JSON-Daten. Implementierung robuster Fehlerbehandlungsstrategien.",
                              "he": "קריאה וכתיבה של קבצים, טיפול בחריגות, עבודה עם נתוני CSV ו-JSON. יישום אסטרטגיות טיפול בשגיאות חזקות.",
                              "pl": "Odczytywanie i zapisywanie plików, obsługa wyjątków, praca z danymi CSV i JSON. Implementacja solidnych strategii obsługi błędów.",
                              "nl": "Lezen en schrijven van bestanden, afhandelen van uitzonderingen, werken met CSV- en JSON-gegevens. Het implementeren van robuuste foutafhandelingsstrategieën.",
                              "uk": "Читання та запис файлів, обробка винятків, робота з даними CSV та JSON. Реалізація надійних стратегій обробки помилок.",
                              "es": "Leyendo y escribiendo archivos, manejando excepciones, trabajando con datos CSV y JSON. Implementando estrategias robustas de manejo de errores.",
                              "it": "Leggendo e scrivendo file, gestendo eccezioni, lavorando con dati CSV e JSON. Implementando strategie robuste di gestione degli errori."
                    }
          },
          {
                    "title": {
                              "en": "Module 5: Object-Oriented Programming",
                              "ru": "Модуль 5: Объектно-ориентированное программирование",
                              "de": "Modul 5: Objektorientierte Programmierung",
                              "he": "מודול 5: תכנות מונחה עצמים",
                              "pl": "Moduł 5: Programowanie obiektowe",
                              "nl": "Module 5: Objectgeoriënteerd programmeren",
                              "uk": "Модуль 5: Об'єктно-орієнтоване програмування",
                              "es": "Módulo 5: Programación orientada a objetos",
                              "it": "Modulo 5: Programmazione orientata agli oggetti"
                    },
                    "description": {
                              "en": "Understanding classes, objects, inheritance, and polymorphism. Creating reusable code with OOP principles and design patterns.",
                              "ru": "Понимание классов, объектов, наследования и полиморфизма. Создание переиспользуемого кода с принципами ООП и паттернами проектирования.",
                              "de": "Verstehen von Klassen, Objekten, Vererbung und Polymorphismus. Erstellen wiederverwendbaren Codes mit OOP-Prinzipien und Entwurfsmustern.",
                              "he": "הבנת מחלקות, אובייקטים, הורשה ופולימורפיזם. יצירת קוד לשימוש חוזר עם עקרונות OOP ודפוסי עיצוב.",
                              "pl": "Rozumienie klas, obiektów, dziedziczenia i polimorfizmu. Tworzenie wielokrotnego użytku kodu z zasadami OOP i wzorcami projektowymi.",
                              "nl": "Begrijpen van klassen, objecten, overerving en polymorfisme. Het maken van herbruikbare code met OOP-principes en ontwerppatronen.",
                              "uk": "Розуміння класів, об'єктів, наслідування та поліморфізму. Створення багаторазового коду з принципами ООП та патернами проектування.",
                              "es": "Entendiendo clases, objetos, herencia y polimorfismo. Creando código reutilizable con principios OOP y patrones de diseño.",
                              "it": "Comprendendo classi, oggetti, ereditarietà e polimorfismo. Creando codice riutilizzabile con principi OOP e pattern di progettazione."
                    }
          },
          {
                    "title": {
                              "en": "Module 6: Web Development with Flask",
                              "ru": "Модуль 6: Веб-разработка с Flask",
                              "de": "Modul 6: Webentwicklung mit Flask",
                              "he": "מודול 6: פיתוח אתרים עם Flask",
                              "pl": "Moduł 6: Tworzenie stron internetowych z Flask",
                              "nl": "Module 6: Webontwikkeling met Flask",
                              "uk": "Модуль 6: Веб-розробка з Flask",
                              "es": "Módulo 6: Desarrollo web con Flask",
                              "it": "Modulo 6: Sviluppo web con Flask"
                    },
                    "description": {
                              "en": "Building web applications with Flask framework, handling HTTP requests, creating APIs, and working with databases.",
                              "ru": "Создание веб-приложений с фреймворком Flask, обработка HTTP-запросов, создание API и работа с базами данных.",
                              "de": "Erstellen von Webanwendungen mit dem Flask-Framework, Behandeln von HTTP-Anfragen, Erstellen von APIs und Arbeiten mit Datenbanken.",
                              "he": "בניית אפליקציות אינטרנט עם מסגרת Flask, טיפול בבקשות HTTP, יצירת API ועבודה עם מסדי נתונים.",
                              "pl": "Tworzenie aplikacji internetowych z frameworkiem Flask, obsługa żądań HTTP, tworzenie API i praca z bazami danych.",
                              "nl": "Het bouwen van webapplicaties met het Flask-framework, het afhandelen van HTTP-verzoeken, het maken van API's en het werken met databases.",
                              "uk": "Створення веб-додатків з фреймворком Flask, обробка HTTP-запитів, створення API та робота з базами даних.",
                              "es": "Construyendo aplicaciones web con el framework Flask, manejando peticiones HTTP, creando APIs y trabajando con bases de datos.",
                              "it": "Costruendo applicazioni web con il framework Flask, gestendo richieste HTTP, creando API e lavorando con database."
                    }
          },
          {
                    "title": {
                              "en": "Module 7: Data Science & Machine Learning",
                              "ru": "Модуль 7: Наука о данных и машинное обучение",
                              "de": "Modul 7: Datenwissenschaft & maschinelles Lernen",
                              "he": "מודול 7: מדע נתונים ולמידת מכונה",
                              "pl": "Moduł 7: Nauka o danych i uczenie maszynowe",
                              "nl": "Module 7: Datawetenschap & machine learning",
                              "uk": "Модуль 7: Наука про дані та машинне навчання",
                              "es": "Módulo 7: Ciencia de datos y aprendizaje automático",
                              "it": "Modulo 7: Scienza dei dati e machine learning"
                    },
                    "description": {
                              "en": "Introduction to data analysis with pandas, numpy, and matplotlib. Building basic machine learning models with scikit-learn and TensorFlow.",
                              "ru": "Введение в анализ данных с pandas, numpy и matplotlib. Создание базовых моделей машинного обучения с scikit-learn и TensorFlow.",
                              "de": "Einführung in die Datenanalyse mit pandas, numpy und matplotlib. Erstellen grundlegender Machine-Learning-Modelle mit scikit-learn und TensorFlow.",
                              "he": "מבוא לניתוח נתונים עם pandas, numpy ו-matplotlib. בניית מודלי למידת מכונה בסיסיים עם scikit-learn ו-TensorFlow.",
                              "pl": "Wprowadzenie do analizy danych z pandas, numpy i matplotlib. Tworzenie podstawowych modeli uczenia maszynowego z scikit-learn i TensorFlow.",
                              "nl": "Inleiding tot data-analyse met pandas, numpy en matplotlib. Het bouwen van basis machine learning modellen met scikit-learn en TensorFlow.",
                              "uk": "Введення в аналіз даних з pandas, numpy та matplotlib. Створення базових моделей машинного навчання з scikit-learn та TensorFlow.",
                              "es": "Introducción al análisis de datos con pandas, numpy y matplotlib. Construyendo modelos básicos de aprendizaje automático con scikit-learn y TensorFlow.",
                              "it": "Introduzione all'analisi dei dati con pandas, numpy e matplotlib. Costruendo modelli di machine learning di base con scikit-learn e TensorFlow."
                    }
          },
          {
                    "title": {
                              "en": "Module 8: Advanced Python & Project Development",
                              "ru": "Модуль 8: Продвинутый Python и разработка проектов",
                              "de": "Modul 8: Erweiterte Python & Projektentwicklung",
                              "he": "מודול 8: Python מתקדם ופיתוח פרויקטים",
                              "pl": "Moduł 8: Zaawansowany Python i rozwój projektów",
                              "nl": "Module 8: Geavanceerde Python & projectontwikkeling",
                              "uk": "Модуль 8: Розширений Python та розробка проектів",
                              "es": "Módulo 8: Python avanzado y desarrollo de proyectos",
                              "it": "Modulo 8: Python avanzato e sviluppo di progetti"
                    },
                    "description": {
                              "en": "Advanced Python concepts, decorators, generators, and async programming. Building complete projects and deploying applications.",
                              "ru": "Продвинутые концепции Python, декораторы, генераторы и асинхронное программирование. Создание полных проектов и развертывание приложений.",
                              "de": "Erweiterte Python-Konzepte, Dekoratoren, Generatoren und asynchrones Programmieren. Erstellen vollständiger Projekte und Bereitstellen von Anwendungen.",
                              "he": "מושגי Python מתקדמים, מעצבים, גנרטורים ותכנות אסינכרוני. בניית פרויקטים מלאים ופריסת אפליקציות.",
                              "pl": "Zaawansowane koncepcje Pythona, dekoratory, generatory i programowanie asynchroniczne. Tworzenie kompletnych projektów i wdrażanie aplikacji.",
                              "nl": "Geavanceerde Python-concepten, decorators, generators en asynchroon programmeren. Het bouwen van complete projecten en het implementeren van applicaties.",
                              "uk": "Розширені концепції Python, декоратори, генератори та асинхронне програмування. Створення повних проектів та розгортання додатків.",
                              "es": "Conceptos avanzados de Python, decoradores, generadores y programación asíncrona. Construyendo proyectos completos y desplegando aplicaciones.",
                              "it": "Concetti avanzati di Python, decoratori, generatori e programmazione asincrona. Costruendo progetti completi e distribuendo applicazioni."
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
                              "en": "Module 1: Roblox Studio & Lua Basics",
                              "ru": "Модуль 1: Roblox Studio и основы Lua",
                              "de": "Modul 1: Roblox Studio & Lua Grundlagen",
                              "he": "מודול 1: Roblox Studio ויסודות Lua",
                              "pl": "Moduł 1: Roblox Studio i podstawy Lua",
                              "nl": "Module 1: Roblox Studio & Lua basis",
                              "uk": "Модуль 1: Roblox Studio та основи Lua",
                              "es": "Módulo 1: Roblox Studio y conceptos básicos de Lua",
                              "it": "Modulo 1: Roblox Studio e basi di Lua"
                    },
                    "description": {
                              "en": "Introduction to Roblox Studio interface, understanding the workspace, basic Lua syntax, variables, conditions, and events. Creating your first interactive objects.",
                              "ru": "Введение в интерфейс Roblox Studio, понимание рабочего пространства, базовый синтаксис Lua, переменные, условия и события. Создание первых интерактивных объектов.",
                              "de": "Einführung in die Roblox Studio-Oberfläche, Verstehen des Arbeitsbereichs, grundlegende Lua-Syntax, Variablen, Bedingungen und Ereignisse. Erstellen Ihrer ersten interaktiven Objekte.",
                              "he": "מבוא לממשק Roblox Studio, הבנת סביבת העבודה, תחביר Lua בסיסי, משתנים, תנאים ואירועים. יצירת האובייקטים האינטראקטיביים הראשונים שלכם.",
                              "pl": "Wprowadzenie do interfejsu Roblox Studio, zrozumienie obszaru roboczego, podstawowa składnia Lua, zmienne, warunki i zdarzenia. Tworzenie pierwszych interaktywnych obiektów.",
                              "nl": "Inleiding tot de Roblox Studio-interface, begrijpen van de werkruimte, basis Lua-syntax, variabelen, voorwaarden en gebeurtenissen. Het maken van je eerste interactieve objecten.",
                              "uk": "Введення в інтерфейс Roblox Studio, розуміння робочого простору, базовий синтаксис Lua, змінні, умови та події. Створення перших інтерактивних об'єктів.",
                              "es": "Introducción a la interfaz de Roblox Studio, entendiendo el espacio de trabajo, sintaxis básica de Lua, variables, condiciones y eventos. Creando tus primeros objetos interactivos.",
                              "it": "Introduzione all'interfaccia Roblox Studio, comprendendo l'area di lavoro, sintassi base di Lua, variabili, condizioni ed eventi. Creando i tuoi primi oggetti interattivi."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Game Mechanics & UI",
                              "ru": "Модуль 2: Игровая механика и UI",
                              "de": "Modul 2: Spielmechaniken & UI",
                              "he": "מודול 2: מכניקת משחק וממשק משתמש",
                              "pl": "Moduł 2: Mechanika gry i UI",
                              "nl": "Module 2: Spelmechanica & UI",
                              "uk": "Модуль 2: Ігрова механіка та UI",
                              "es": "Módulo 2: Mecánicas de juego y UI",
                              "it": "Modulo 2: Meccaniche di gioco e UI"
                    },
                    "description": {
                              "en": "Developing core game mechanics such as player movement, scoring systems, and interactive elements. Designing user interfaces with ScreenGuis.",
                              "ru": "Разработка основных игровых механик, таких как движение игрока, системы подсчета очков и интерактивные элементы. Проектирование пользовательских интерфейсов с ScreenGuis.",
                              "de": "Entwicklung von Kerngameplay-Mechaniken wie Spielerbewegung, Punktesysteme und interaktive Elemente. Gestaltung von Benutzeroberflächen mit ScreenGuis.",
                              "he": "פיתוח מכניקות משחק ליבה כמו תנועת שחקן, מערכות ניקוד ואלמנטים אינטראקטיביים. עיצוב ממשקי משתמש עם ScreenGuis.",
                              "pl": "Rozwijanie podstawowych mechanik gry, takich jak ruch gracza, systemy punktacji i elementy interaktywne. Projektowanie interfejsów użytkownika z ScreenGuis.",
                              "nl": "Ontwikkelen van kernspelmechanieken zoals spelerbeweging, scoresystemen en interactieve elementen. Ontwerpen van gebruikersinterfaces met ScreenGuis.",
                              "uk": "Розробка основних ігрових механік, таких як рух гравця, системи підрахунку очок та інтерактивні елементи. Проектування користувацьких інтерфейсів з ScreenGuis.",
                              "es": "Desarrollando mecánicas de juego centrales como movimiento del jugador, sistemas de puntuación y elementos interactivos. Diseñando interfaces de usuario con ScreenGuis.",
                              "it": "Sviluppando meccaniche di gioco centrali come movimento del giocatore, sistemi di punteggio ed elementi interattivi. Progettando interfacce utente con ScreenGuis."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Advanced Scripting & World Building",
                              "ru": "Модуль 3: Продвинутый скриптинг и создание мира",
                              "de": "Modul 3: Erweiterte Skripterstellung & Weltbau",
                              "he": "מודול 3: סקריפטינג מתקדם ובניית עולם",
                              "pl": "Moduł 3: Zaawansowane skrypty i budowanie świata",
                              "nl": "Module 3: Geavanceerd scripten & wereldbouw",
                              "uk": "Модуль 3: Розширений скриптинг та створення світу",
                              "es": "Módulo 3: Scripting avanzado y construcción de mundos",
                              "it": "Modulo 3: Scripting avanzato e costruzione del mondo"
                    },
                    "description": {
                              "en": "Implementing complex game logic, working with data stores, creating custom tools and weapons. Enhancing game environments with terrain and lighting.",
                              "ru": "Реализация сложной игровой логики, работа с хранилищами данных, создание пользовательских инструментов и оружия. Улучшение игровых сред с помощью рельефа и освещения.",
                              "de": "Implementierung komplexer Spiellogik, Arbeit mit Datenspeichern, Erstellen benutzerdefinierter Tools und Waffen. Verbesserung der Spielumgebungen mit Terrain und Beleuchtung.",
                              "he": "יישום לוגיקת משחק מורכבת, עבודה עם מאגרי נתונים, יצירת כלים ונשקים מותאמים אישית. שיפור סביבות משחק עם טריטוריה ותאורה.",
                              "pl": "Implementowanie złożonej logiki gry, praca z magazynami danych, tworzenie niestandardowych narzędzi i broni. Ulepszanie środowisk gry z terenem i oświetleniem.",
                              "nl": "Implementeren van complexe spellogica, werken met datastores, het maken van aangepaste tools en wapens. Verbeteren van spelomgevingen met terrein en verlichting.",
                              "uk": "Реалізація складної ігрової логіки, робота з сховищами даних, створення користувацьких інструментів та зброї. Покращення ігрових середовищ за допомогою рельєфу та освітлення.",
                              "es": "Implementando lógica de juego compleja, trabajando con almacenes de datos, creando herramientas y armas personalizadas. Mejorando entornos de juego con terreno e iluminación.",
                              "it": "Implementando logica di gioco complessa, lavorando con data store, creando strumenti e armi personalizzati. Migliorando gli ambienti di gioco con terreno e illuminazione."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: Game Publishing & Monetization",
                              "ru": "Модуль 4: Публикация игры и монетизация",
                              "de": "Modul 4: Spielveröffentlichung & Monetarisierung",
                              "he": "מודול 4: פרסום משחק ומונטיזציה",
                              "pl": "Moduł 4: Publikacja gry i monetyzacja",
                              "nl": "Module 4: Spelpublicatie & monetisering",
                              "uk": "Модуль 4: Публікація гри та монетизація",
                              "es": "Módulo 4: Publicación de juegos y monetización",
                              "it": "Modulo 4: Pubblicazione del gioco e monetizzazione"
                    },
                    "description": {
                              "en": "Optimizing games for performance, debugging, and publishing to Roblox. Introduction to monetization strategies like Game Passes and Developer Products.",
                              "ru": "Оптимизация игр для производительности, отладка и публикация в Roblox. Введение в стратегии монетизации, такие как Game Passes и Developer Products.",
                              "de": "Optimierung von Spielen für Leistung, Debugging und Veröffentlichung auf Roblox. Einführung in Monetarisierungsstrategien wie Game Passes und Developer Products.",
                              "he": "אופטימיזציה של משחקים לביצועים, דיבוג ופרסום ב-Roblox. מבוא לאסטרטגיות מונטיזציה כמו Game Passes ו-Developer Products.",
                              "pl": "Optymalizacja gier pod kątem wydajności, debugowanie i publikacja w Roblox. Wprowadzenie do strategii monetyzacji, takich jak Game Passes i Developer Products.",
                              "nl": "Optimaliseren van spellen voor prestaties, debuggen en publiceren op Roblox. Inleiding tot monetisatiestrategieën zoals Game Passes en Developer Products.",
                              "uk": "Оптимізація ігор для продуктивності, налагодження та публікація в Roblox. Введення в стратегії монетизації, такі як Game Passes та Developer Products.",
                              "es": "Optimizando juegos para rendimiento, depuración y publicación en Roblox. Introducción a estrategias de monetización como Game Passes y Developer Products.",
                              "it": "Ottimizzando giochi per le prestazioni, debug e pubblicazione su Roblox. Introduzione alle strategie di monetizzazione come Game Passes e Developer Products."
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
                              "en": "Module 1: First Steps with Scratch Jr",
                              "ru": "Модуль 1: Первые шаги с Scratch Jr",
                              "de": "Modul 1: Erste Schritte mit Scratch Jr",
                              "he": "מודול 1: צעדים ראשונים עם Scratch Jr",
                              "pl": "Moduł 1: Pierwsze kroki ze Scratch Jr",
                              "nl": "Module 1: Eerste stappen met Scratch Jr",
                              "uk": "Модуль 1: Перші кроки зі Scratch Jr",
                              "es": "Módulo 1: Primeros pasos con Scratch Jr",
                              "it": "Modulo 1: Primi passi con Scratch Jr"
                    },
                    "description": {
                              "en": "Introduction to Scratch Jr, understanding the interface and basic block movements. Creating simple scenes and making characters move and interact.",
                              "ru": "Введение в Scratch Jr, понимание интерфейса и базовых движений блоков. Создание простых сцен и заставка персонажей двигаться и взаимодействовать.",
                              "de": "Einführung in Scratch Jr, Verstehen der Oberfläche und grundlegender Blockbewegungen. Erstellen einfacher Szenen und Charaktere bewegen und interagieren lassen.",
                              "he": "מבוא ל-Scratch Jr, הבנת הממשק ותנועות בלוקים בסיסיות. יצירת סצנות פשוטות והנעת דמויות לתקשר.",
                              "pl": "Wprowadzenie do Scratch Jr, zrozumienie interfejsu i podstawowych ruchów bloków. Tworzenie prostych scen i sprawianie, że postacie się poruszają i wchodzą w interakcję.",
                              "nl": "Inleiding tot Scratch Jr, begrijpen van de interface en basis blokbewegingen. Het maken van eenvoudige scènes en karakters laten bewegen en interacteren.",
                              "uk": "Введення в Scratch Jr, розуміння інтерфейсу та базових рухів блоків. Створення простих сцен та заставка персонажів рухатися та взаємодіяти.",
                              "es": "Introducción a Scratch Jr, entendiendo la interfaz y movimientos básicos de bloques. Creando escenas simples y haciendo que los personajes se muevan e interactúen.",
                              "it": "Introduzione a Scratch Jr, comprendendo l'interfaccia e i movimenti base dei blocchi. Creando scene semplici e facendo muovere e interagire i personaggi."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Storytelling & Problem Solving",
                              "ru": "Модуль 2: Рассказывание историй и решение проблем",
                              "de": "Modul 2: Geschichtenerzählen & Problemlösung",
                              "he": "מודול 2: סיפור סיפורים ופתרון בעיות",
                              "pl": "Moduł 2: Opowiadanie historii i rozwiązywanie problemów",
                              "nl": "Module 2: Verhalen vertellen & probleemoplossing",
                              "uk": "Модуль 2: Розповідання історій та вирішення проблем",
                              "es": "Módulo 2: Narración de historias y resolución de problemas",
                              "it": "Modulo 2: Raccontare storie e risoluzione dei problemi"
                    },
                    "description": {
                              "en": "Building short animated stories with multiple characters and backgrounds. Introducing simple problem-solving through challenges and interactive sequences.",
                              "ru": "Создание коротких анимированных историй с несколькими персонажами и фонами. Введение простого решения проблем через вызовы и интерактивные последовательности.",
                              "de": "Erstellen kurzer animierter Geschichten mit mehreren Charakteren und Hintergründen. Einführung einfacher Problemlösung durch Herausforderungen und interaktive Sequenzen.",
                              "he": "בניית סיפורים אנימציה קצרים עם דמויות ורקעים מרובים. הצגת פתרון בעיות פשוט דרך אתגרים ורצפים אינטראקטיביים.",
                              "pl": "Tworzenie krótkich animowanych historii z wieloma postaciami i tłem. Wprowadzenie prostego rozwiązywania problemów przez wyzwania i interaktywne sekwencje.",
                              "nl": "Het bouwen van korte geanimeerde verhalen met meerdere karakters en achtergronden. Het introduceren van eenvoudige probleemoplossing door uitdagingen en interactieve sequenties.",
                              "uk": "Створення коротких анімованих історій з кількома персонажами та фонами. Введення простого вирішення проблем через виклики та інтерактивні послідовності.",
                              "es": "Construyendo historias animadas cortas con múltiples personajes y fondos. Introduciendo resolución simple de problemas a través de desafíos y secuencias interactivas.",
                              "it": "Costruendo storie animate brevi con più personaggi e sfondi. Introducendo la risoluzione semplice dei problemi attraverso sfide e sequenze interattive."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Introduction to 3D Design",
                              "ru": "Модуль 3: Введение в 3D дизайн",
                              "de": "Modul 3: Einführung in 3D-Design",
                              "he": "מודול 3: מבוא לעיצוב תלת מימד",
                              "pl": "Moduł 3: Wprowadzenie do projektowania 3D",
                              "nl": "Module 3: Inleiding tot 3D-ontwerp",
                              "uk": "Модуль 3: Введення в 3D дизайн",
                              "es": "Módulo 3: Introducción al diseño 3D",
                              "it": "Modulo 3: Introduzione al design 3D"
                    },
                    "description": {
                              "en": "Exploring Tinkercad to create basic 3D shapes and combine them into simple models. Learning about spatial reasoning and design.",
                              "ru": "Изучение Tinkercad для создания базовых 3D-форм и их объединения в простые модели. Изучение пространственного мышления и дизайна.",
                              "de": "Erkunden von Tinkercad zur Erstellung grundlegender 3D-Formen und deren Kombination zu einfachen Modellen. Lernen über räumliches Denken und Design.",
                              "he": "חקירת Tinkercad ליצירת צורות תלת מימד בסיסיות ושילובן למודלים פשוטים. למידה על חשיבה מרחבית ועיצוב.",
                              "pl": "Eksplorowanie Tinkercad do tworzenia podstawowych kształtów 3D i łączenia ich w proste modele. Nauka o rozumowaniu przestrzennym i projektowaniu.",
                              "nl": "Verkennen van Tinkercad om basis 3D-vormen te maken en ze te combineren tot eenvoudige modellen. Leren over ruimtelijk redeneren en ontwerp.",
                              "uk": "Дослідження Tinkercad для створення базових 3D-форм та їх об'єднання в прості моделі. Вивчення просторового мислення та дизайну.",
                              "es": "Explorando Tinkercad para crear formas 3D básicas y combinarlas en modelos simples. Aprendiendo sobre razonamiento espacial y diseño.",
                              "it": "Esplorando Tinkercad per creare forme 3D di base e combinarle in modelli semplici. Imparando sul ragionamento spaziale e il design."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: Digital Art & Creative Projects",
                              "ru": "Модуль 4: Цифровое искусство и творческие проекты",
                              "de": "Modul 4: Digitale Kunst & kreative Projekte",
                              "he": "מודול 4: אמנות דיגיטלית ופרויקטים יצירתיים",
                              "pl": "Moduł 4: Sztuka cyfrowa i projekty kreatywne",
                              "nl": "Module 4: Digitale kunst & creatieve projecten",
                              "uk": "Модуль 4: Цифрове мистецтво та творчі проекти",
                              "es": "Módulo 4: Arte digital y proyectos creativos",
                              "it": "Modulo 4: Arte digitale e progetti creativi"
                    },
                    "description": {
                              "en": "Using Pixilart for pixel art creation and integrating art into Scratch Jr projects. Combining all learned skills for a final creative project.",
                              "ru": "Использование Pixilart для создания пиксельного искусства и интеграции искусства в проекты Scratch Jr. Объединение всех изученных навыков для финального творческого проекта.",
                              "de": "Verwendung von Pixilart für Pixel-Art-Erstellung und Integration von Kunst in Scratch Jr-Projekte. Kombinieren aller erlernten Fähigkeiten für ein finales kreatives Projekt.",
                              "he": "שימוש ב-Pixilart ליצירת אמנות פיקסלים ושילוב אמנות בפרויקטי Scratch Jr. שילוב כל המיומנויות הנלמדות לפרויקט יצירתי סופי.",
                              "pl": "Używanie Pixilart do tworzenia sztuki pikselowej i integracji sztuki w projekty Scratch Jr. Łączenie wszystkich wyuczonych umiejętności dla finalnego projektu kreatywnego.",
                              "nl": "Gebruik van Pixilart voor pixel art creatie en het integreren van kunst in Scratch Jr projecten. Het combineren van alle geleerde vaardigheden voor een final creatief project.",
                              "uk": "Використання Pixilart для створення піксельного мистецтва та інтеграції мистецтва в проекти Scratch Jr. Поєднання всіх вивчених навичок для фінального творчого проекту.",
                              "es": "Usando Pixilart para la creación de arte pixel y integrando arte en proyectos de Scratch Jr. Combinando todas las habilidades aprendidas para un proyecto creativo final.",
                              "it": "Usando Pixilart per la creazione di arte pixel e integrando arte nei progetti Scratch Jr. Combinando tutte le abilità apprese per un progetto creativo finale."
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
                              "en": "Module 1: Intro to Minecraft Modding & Automation",
                              "ru": "Модуль 1: Введение в модинг и автоматизацию Minecraft",
                              "de": "Modul 1: Einführung in Minecraft Modding & Automatisierung",
                              "he": "מודול 1: מבוא למודינג ואוטומציה של Minecraft",
                              "pl": "Moduł 1: Wprowadzenie do modowania i automatyzacji Minecraft",
                              "nl": "Module 1: Inleiding tot Minecraft modding & automatisering",
                              "uk": "Модуль 1: Введення в модінг та автоматизацію Minecraft",
                              "es": "Módulo 1: Introducción al modding y automatización de Minecraft",
                              "it": "Modulo 1: Introduzione al modding e automazione di Minecraft"
                    },
                    "description": {
                              "en": "Introduction to ComputerCraft and Lua scripting. Learning to program simple robots (turtles) to perform basic tasks like mining and building.",
                              "ru": "Введение в ComputerCraft и скриптинг на Lua. Обучение программированию простых роботов (черепах) для выполнения базовых задач, таких как добыча и строительство.",
                              "de": "Einführung in ComputerCraft und Lua-Skripting. Lernen, einfache Roboter (Schildkröten) zu programmieren, um grundlegende Aufgaben wie Bergbau und Bauen zu erfüllen.",
                              "he": "מבוא ל-ComputerCraft וסקריפטינג Lua. למידה לתכנת רובוטים פשוטים (צבים) לביצוע משימות בסיסיות כמו כרייה ובנייה.",
                              "pl": "Wprowadzenie do ComputerCraft i skryptowania Lua. Nauka programowania prostych robotów (żółwi) do wykonywania podstawowych zadań, takich jak wydobycie i budowanie.",
                              "nl": "Inleiding tot ComputerCraft en Lua scripten. Leren om eenvoudige robots (schildpadden) te programmeren om basis taken uit te voeren zoals mijnen en bouwen.",
                              "uk": "Введення в ComputerCraft та скриптинг на Lua. Навчання програмуванню простих роботів (черепах) для виконання базових завдань, таких як видобуток та будівництво.",
                              "es": "Introducción a ComputerCraft y scripting de Lua. Aprendiendo a programar robots simples (tortugas) para realizar tareas básicas como minería y construcción.",
                              "it": "Introduzione a ComputerCraft e scripting Lua. Imparando a programmare robot semplici (tartarughe) per eseguire compiti di base come estrazione e costruzione."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Advanced Turtle Programming & Redstone",
                              "ru": "Модуль 2: Продвинутое программирование черепах и редстоун",
                              "de": "Modul 2: Erweiterte Schildkröten-Programmierung & Redstone",
                              "he": "מודול 2: תכנות צבים מתקדם ו-Redstone",
                              "pl": "Moduł 2: Zaawansowane programowanie żółwi i Redstone",
                              "nl": "Module 2: Geavanceerde schildpad programmering & Redstone",
                              "uk": "Модуль 2: Розширене програмування черепах та Redstone",
                              "es": "Módulo 2: Programación avanzada de tortugas y Redstone",
                              "it": "Modulo 2: Programmazione avanzata delle tartarughe e Redstone"
                    },
                    "description": {
                              "en": "Developing more complex algorithms for turtles, including pathfinding and inventory management. Integrating with Minecraft's Redstone mechanics for automated systems.",
                              "ru": "Разработка более сложных алгоритмов для черепах, включая поиск пути и управление инвентарем. Интеграция с механикой Redstone Minecraft для автоматизированных систем.",
                              "de": "Entwicklung komplexerer Algorithmen für Schildkröten, einschließlich Pfadfindung und Inventarverwaltung. Integration mit Minecrafts Redstone-Mechanik für automatisierte Systeme.",
                              "he": "פיתוח אלגוריתמים מורכבים יותר לצבים, כולל מציאת נתיב וניהול מלאי. אינטגרציה עם מכניקת Redstone של Minecraft למערכות אוטומטיות.",
                              "pl": "Rozwijanie bardziej złożonych algorytmów dla żółwi, w tym znajdowanie ścieżek i zarządzanie inwentarzem. Integracja z mechaniką Redstone Minecraft dla systemów zautomatyzowanych.",
                              "nl": "Ontwikkelen van complexere algoritmes voor schildpadden, inclusief padfinding en inventarisbeheer. Integratie met Minecraft's Redstone mechanica voor geautomatiseerde systemen.",
                              "uk": "Розробка більш складних алгоритмів для черепах, включаючи пошук шляху та управління інвентарем. Інтеграція з механікою Redstone Minecraft для автоматизованих систем.",
                              "es": "Desarrollando algoritmos más complejos para tortugas, incluyendo búsqueda de rutas y gestión de inventario. Integrando con la mecánica de Redstone de Minecraft para sistemas automatizados.",
                              "it": "Sviluppando algoritmi più complessi per le tartarughe, inclusi pathfinding e gestione dell'inventario. Integrando con la meccanica Redstone di Minecraft per sistemi automatizzati."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Custom Block & Item Creation",
                              "ru": "Модуль 3: Создание пользовательских блоков и предметов",
                              "de": "Modul 3: Benutzerdefinierte Block- & Item-Erstellung",
                              "he": "מודול 3: יצירת בלוקים ופריטים מותאמים אישית",
                              "pl": "Moduł 3: Tworzenie niestandardowych bloków i przedmiotów",
                              "nl": "Module 3: Aangepaste blok & item creatie",
                              "uk": "Модуль 3: Створення користувацьких блоків та предметів",
                              "es": "Módulo 3: Creación de bloques y objetos personalizados",
                              "it": "Modulo 3: Creazione di blocchi e oggetti personalizzati"
                    },
                    "description": {
                              "en": "Exploring tools to create new blocks, items, and crafting recipes within Minecraft. Understanding NBT data and in-game events.",
                              "ru": "Изучение инструментов для создания новых блоков, предметов и рецептов крафта в Minecraft. Понимание данных NBT и внутриигровых событий.",
                              "de": "Erkunden von Tools zur Erstellung neuer Blöcke, Items und Crafting-Rezepte in Minecraft. Verstehen von NBT-Daten und In-Game-Ereignissen.",
                              "he": "חקירת כלים ליצירת בלוקים, פריטים ומתכוני יצירה חדשים ב-Minecraft. הבנת נתוני NBT ואירועי משחק.",
                              "pl": "Eksplorowanie narzędzi do tworzenia nowych bloków, przedmiotów i przepisów rzemieślniczych w Minecraft. Zrozumienie danych NBT i wydarzeń w grze.",
                              "nl": "Verkennen van tools om nieuwe blokken, items en craft recepten te maken binnen Minecraft. Begrijpen van NBT data en in-game gebeurtenissen.",
                              "uk": "Дослідження інструментів для створення нових блоків, предметів та рецептів крафту в Minecraft. Розуміння даних NBT та внутрішньоігрових подій.",
                              "es": "Explorando herramientas para crear nuevos bloques, objetos y recetas de crafteo dentro de Minecraft. Entendiendo datos NBT y eventos del juego.",
                              "it": "Esplorando strumenti per creare nuovi blocchi, oggetti e ricette di crafting all'interno di Minecraft. Comprendendo i dati NBT e gli eventi in-game."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: Mini-Game Development & Project Showcase",
                              "ru": "Модуль 4: Разработка мини-игр и демонстрация проектов",
                              "de": "Modul 4: Mini-Spiel-Entwicklung & Projekt-Präsentation",
                              "he": "מודול 4: פיתוח מיני-משחקים והצגת פרויקטים",
                              "pl": "Moduł 4: Rozwój mini-gier i prezentacja projektów",
                              "nl": "Module 4: Mini-game ontwikkeling & project showcase",
                              "uk": "Модуль 4: Розробка міні-ігор та демонстрація проектів",
                              "es": "Módulo 4: Desarrollo de mini-juegos y exhibición de proyectos",
                              "it": "Modulo 4: Sviluppo di mini-giochi e showcase del progetto"
                    },
                    "description": {
                              "en": "Designing and implementing a mini-game or complex automated farm within Minecraft. Debugging and showcasing your creations.",
                              "ru": "Проектирование и реализация мини-игры или сложной автоматизированной фермы в Minecraft. Отладка и демонстрация ваших творений.",
                              "de": "Entwerfen und Implementieren eines Mini-Spiels oder einer komplexen automatisierten Farm in Minecraft. Debugging und Präsentation Ihrer Kreationen.",
                              "he": "עיצוב ויישום מיני-משחק או חווה אוטומטית מורכבת ב-Minecraft. דיבוג והצגת היצירות שלכם.",
                              "pl": "Projektowanie i implementacja mini-gry lub złożonej zautomatyzowanej farmy w Minecraft. Debugowanie i prezentacja swoich dzieł.",
                              "nl": "Ontwerpen en implementeren van een mini-game of complexe geautomatiseerde boerderij binnen Minecraft. Debuggen en tonen van je creaties.",
                              "uk": "Проектування та реалізація міні-гри або складної автоматизованої ферми в Minecraft. Налагодження та демонстрація ваших творінь.",
                              "es": "Diseñando e implementando un mini-juego o granja automatizada compleja dentro de Minecraft. Depuración y exhibición de tus creaciones.",
                              "it": "Progettando e implementando un mini-gioco o fattoria automatizzata complessa all'interno di Minecraft. Debug e showcase delle tue creazioni."
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
                              "en": "Module 1: Blender Fundamentals",
                              "ru": "Модуль 1: Основы Blender",
                              "de": "Modul 1: Blender Grundlagen",
                              "he": "מודול 1: יסודות Blender",
                              "pl": "Moduł 1: Podstawy Blender",
                              "nl": "Module 1: Blender fundamenten",
                              "uk": "Модуль 1: Основи Blender",
                              "es": "Módulo 1: Fundamentos de Blender",
                              "it": "Modulo 1: Fondamenti di Blender"
                    },
                    "description": {
                              "en": "Introduction to Blender interface, basic 3D modeling techniques, working with meshes, vertices, edges, and faces. Creating your first 3D objects and understanding the 3D workspace.",
                              "ru": "Введение в интерфейс Blender, базовые техники 3D-моделирования, работа с сетками, вершинами, рёбрами и гранями. Создание первых 3D-объектов и понимание 3D-рабочего пространства.",
                              "de": "Einführung in die Blender-Oberfläche, grundlegende 3D-Modellierungstechniken, Arbeit mit Netzen, Scheitelpunkten, Kanten und Flächen. Erstellen Ihrer ersten 3D-Objekte und Verstehen des 3D-Arbeitsbereichs.",
                              "he": "מבוא לממשק Blender, טכניקות מודלינג תלת מימד בסיסיות, עבודה עם רשתות, קודקודים, קצוות ופנים. יצירת האובייקטים התלת מימדיים הראשונים שלכם והבנת סביבת העבודה התלת מימדית.",
                              "pl": "Wprowadzenie do interfejsu Blender, podstawowe techniki modelowania 3D, praca z siatkami, wierzchołkami, krawędziami i ścianami. Tworzenie pierwszych obiektów 3D i zrozumienie przestrzeni roboczej 3D.",
                              "nl": "Inleiding tot de Blender-interface, basis 3D-modelleringstechnieken, werken met meshes, vertices, edges en faces. Het maken van je eerste 3D-objecten en begrijpen van de 3D-werkruimte.",
                              "uk": "Введення в інтерфейс Blender, базові техніки 3D-моделювання, робота з сітками, вершинами, ребрами та гранями. Створення перших 3D-об'єктів та розуміння 3D-робочого простору.",
                              "es": "Introducción a la interfaz de Blender, técnicas básicas de modelado 3D, trabajando con mallas, vértices, aristas y caras. Creando tus primeros objetos 3D y entendiendo el espacio de trabajo 3D.",
                              "it": "Introduzione all'interfaccia Blender, tecniche base di modellazione 3D, lavorando con mesh, vertici, bordi e facce. Creando i tuoi primi oggetti 3D e comprendendo lo spazio di lavoro 3D."
                    }
          },
          {
                    "title": {
                              "en": "Module 2: Advanced Modeling & Texturing",
                              "ru": "Модуль 2: Продвинутое моделирование и текстурирование",
                              "de": "Modul 2: Erweiterte Modellierung & Texturierung",
                              "he": "מודול 2: מודלינג מתקדם וטקסטור",
                              "pl": "Moduł 2: Zaawansowane modelowanie i teksturowanie",
                              "nl": "Module 2: Geavanceerde modellering & texturering",
                              "uk": "Модуль 2: Розширене моделювання та текстурування",
                              "es": "Módulo 2: Modelado avanzado y texturizado",
                              "it": "Modulo 2: Modellazione avanzata e texturing"
                    },
                    "description": {
                              "en": "Learning low-poly and high-poly modeling techniques, UV mapping, and basic texturing. Introduction to Substance Painter for creating realistic materials and textures.",
                              "ru": "Изучение техник низкополигонального и высокополигонального моделирования, UV-маппинга и базового текстурирования. Введение в Substance Painter для создания реалистичных материалов и текстур.",
                              "de": "Lernen von Low-Poly- und High-Poly-Modellierungstechniken, UV-Mapping und grundlegender Texturierung. Einführung in Substance Painter zur Erstellung realistischer Materialien und Texturen.",
                              "he": "למידת טכניקות מודלינג נמוך פוליגון וגבוה פוליגון, מיפוי UV וטקסטור בסיסי. מבוא ל-Substance Painter ליצירת חומרים וטקסטורות ריאליסטיות.",
                              "pl": "Nauka technik modelowania low-poly i high-poly, mapowania UV i podstawowego teksturowania. Wprowadzenie do Substance Painter do tworzenia realistycznych materiałów i tekstur.",
                              "nl": "Leren van low-poly en high-poly modelleringstechnieken, UV-mapping en basis texturering. Introductie tot Substance Painter voor het maken van realistische materialen en texturen.",
                              "uk": "Вивчення технік низькополігонального та високополігонального моделювання, UV-маппінгу та базового текстурування. Введення в Substance Painter для створення реалістичних матеріалів та текстур.",
                              "es": "Aprendiendo técnicas de modelado low-poly y high-poly, mapeo UV y texturizado básico. Introducción a Substance Painter para crear materiales y texturas realistas.",
                              "it": "Imparando tecniche di modellazione low-poly e high-poly, mappatura UV e texturing di base. Introduzione a Substance Painter per creare materiali e texture realistiche."
                    }
          },
          {
                    "title": {
                              "en": "Module 3: Game Asset Creation",
                              "ru": "Модуль 3: Создание игровых ресурсов",
                              "de": "Modul 3: Spiel-Asset-Erstellung",
                              "he": "מודול 3: יצירת נכסי משחק",
                              "pl": "Moduл 3: Tworzenie zasobów gier",
                              "nl": "Module 3: Game asset creatie",
                              "uk": "Модуль 3: Створення ігрових ресурсів",
                              "es": "Módulo 3: Creación de assets de juego",
                              "it": "Modulo 3: Creazione di asset di gioco"
                    },
                    "description": {
                              "en": "Creating game-ready assets, optimizing models for real-time rendering, understanding polygon budgets, and preparing assets for game engines.",
                              "ru": "Создание готовых к игре ресурсов, оптимизация моделей для рендеринга в реальном времени, понимание полигональных бюджетов и подготовка ресурсов для игровых движков.",
                              "de": "Erstellen spielbereiter Assets, Optimieren von Modellen für Echtzeit-Rendering, Verstehen von Polygon-Budgets und Vorbereiten von Assets für Spiel-Engines.",
                              "he": "יצירת נכסים מוכנים למשחק, אופטימיזציה של מודלים לעיבוד בזמן אמת, הבנת תקציבי פוליגון והכנת נכסים למנועי משחק.",
                              "pl": "Tworzenie zasobów gotowych do gry, optymalizacja modeli do renderowania w czasie rzeczywistym, zrozumienie budżetów poligonów i przygotowanie zasobów do silników gier.",
                              "nl": "Het maken van game-klare assets, het optimaliseren van modellen voor real-time rendering, het begrijpen van polygon budgetten en het voorbereiden van assets voor game engines.",
                              "uk": "Створення готових до гри ресурсів, оптимізація моделей для рендерингу в реальному часі, розуміння полігональних бюджетів та підготовка ресурсів для ігрових рушіїв.",
                              "es": "Creando assets listos para juegos, optimizando modelos para renderizado en tiempo real, entendiendo presupuestos de polígonos y preparando assets para motores de juego.",
                              "it": "Creando asset pronti per il gioco, ottimizzando modelli per il rendering in tempo reale, comprendendo i budget dei poligoni e preparando asset per i motori di gioco."
                    }
          },
          {
                    "title": {
                              "en": "Module 4: Unreal Engine Integration",
                              "ru": "Модуль 4: Интеграция с Unreal Engine",
                              "de": "Modul 4: Unreal Engine Integration",
                              "he": "מודול 4: אינטגרציה עם Unreal Engine",
                              "pl": "Moduł 4: Integracja z Unreal Engine",
                              "nl": "Module 4: Unreal Engine integratie",
                              "uk": "Модуль 4: Інтеграція з Unreal Engine",
                              "es": "Módulo 4: Integración con Unreal Engine",
                              "it": "Modulo 4: Integrazione con Unreal Engine"
                    },
                    "description": {
                              "en": "Importing assets into Unreal Engine, setting up materials and lighting, creating basic game environments, and understanding the game development pipeline.",
                              "ru": "Импорт ресурсов в Unreal Engine, настройка материалов и освещения, создание базовых игровых сред и понимание пайплайна разработки игр.",
                              "de": "Importieren von Assets in Unreal Engine, Einrichten von Materialien und Beleuchtung, Erstellen grundlegender Spielumgebungen und Verstehen der Spielentwicklungspipeline.",
                              "he": "ייבוא נכסים ל-Unreal Engine, הגדרת חומרים ותאורה, יצירת סביבות משחק בסיסיות והבנת צינור פיתוח המשחק.",
                              "pl": "Importowanie zasobów do Unreal Engine, konfiguracja materiałów i oświetlenia, tworzenie podstawowych środowisk gier i zrozumienie potoku rozwoju gier.",
                              "nl": "Het importeren van assets in Unreal Engine, het opzetten van materialen en verlichting, het creëren van basis game-omgevingen en het begrijpen van de game development pipeline.",
                              "uk": "Імпорт ресурсів в Unreal Engine, налаштування матеріалів та освітлення, створення базових ігрових середовищ та розуміння пайплайну розробки ігор.",
                              "es": "Importando assets a Unreal Engine, configurando materiales e iluminación, creando entornos de juego básicos y entendiendo el pipeline de desarrollo de juegos.",
                              "it": "Importando asset in Unreal Engine, configurando materiali e illuminazione, creando ambienti di gioco di base e comprendendo la pipeline di sviluppo del gioco."
                    }
          },
          {
                    "title": {
                              "en": "Module 5: Advanced Texturing & Materials",
                              "ru": "Модуль 5: Продвинутое текстурирование и материалы",
                              "de": "Modul 5: Erweiterte Texturierung & Materialien",
                              "he": "מודול 5: טקסטור מתקדם וחומרים",
                              "pl": "Moduł 5: Zaawansowane teksturowanie i materiały",
                              "nl": "Module 5: Geavanceerde texturering & materialen",
                              "uk": "Модуль 5: Розширене текстурування та матеріали",
                              "es": "Módulo 5: Texturizado avanzado y materiales",
                              "it": "Modulo 5: Texturing avanzato e materiali"
                    },
                    "description": {
                              "en": "Mastering Substance Painter workflows, creating complex materials, understanding PBR (Physically Based Rendering), and advanced texturing techniques.",
                              "ru": "Освоение рабочих процессов Substance Painter, создание сложных материалов, понимание PBR (физически корректного рендеринга) и продвинутых техник текстурирования.",
                              "de": "Meistern von Substance Painter-Workflows, Erstellen komplexer Materialien, Verstehen von PBR (Physically Based Rendering) und erweiterten Texturierungstechniken.",
                              "he": "שליטה בתהליכי עבודה של Substance Painter, יצירת חומרים מורכבים, הבנת PBR (רינדור מבוסס פיזיקה) וטכניקות טקסטור מתקדמות.",
                              "pl": "Opanowanie przepływów pracy Substance Painter, tworzenie złożonych materiałów, zrozumienie PBR (Physically Based Rendering) i zaawansowanych technik teksturowania.",
                              "nl": "Het beheersen van Substance Painter workflows, het maken van complexe materialen, het begrijpen van PBR (Physically Based Rendering) en geavanceerde textureringstechnieken.",
                              "uk": "Опанування робочих процесів Substance Painter, створення складних матеріалів, розуміння PBR (фізично коректного рендерингу) та розширених технік текстурування.",
                              "es": "Dominando flujos de trabajo de Substance Painter, creando materiales complejos, entendiendo PBR (Physically Based Rendering) y técnicas avanzadas de texturizado.",
                              "it": "Padroneggiando i flussi di lavoro di Substance Painter, creando materiali complessi, comprendendo PBR (Physically Based Rendering) e tecniche avanzate di texturing."
                    }
          },
          {
                    "title": {
                              "en": "Module 6: Lighting & Rendering",
                              "ru": "Модуль 6: Освещение и рендеринг",
                              "de": "Modul 6: Beleuchtung & Rendering",
                              "he": "מודול 6: תאורה ורינדור",
                              "pl": "Moduł 6: Oświetlenie i renderowanie",
                              "nl": "Module 6: Verlichting & rendering",
                              "uk": "Модуль 6: Освітлення та рендеринг",
                              "es": "Módulo 6: Iluminación y renderizado",
                              "it": "Modulo 6: Illuminazione e rendering"
                    },
                    "description": {
                              "en": "Understanding lighting principles, setting up realistic lighting in Unreal Engine, mastering different lighting techniques, and optimizing for performance.",
                              "ru": "Понимание принципов освещения, настройка реалистичного освещения в Unreal Engine, освоение различных техник освещения и оптимизация для производительности.",
                              "de": "Verstehen von Beleuchtungsprinzipien, Einrichten realistischer Beleuchtung in Unreal Engine, Meistern verschiedener Beleuchtungstechniken und Optimierung für Leistung.",
                              "he": "הבנת עקרונות תאורה, הגדרת תאורה ריאליסטית ב-Unreal Engine, שליטה בטכניקות תאורה שונות ואופטימיזציה לביצועים.",
                              "pl": "Zrozumienie zasad oświetlenia, konfiguracja realistycznego oświetlenia w Unreal Engine, opanowanie różnych technik oświetlenia i optymalizacja wydajności.",
                              "nl": "Het begrijpen van verlichtingsprincipes, het opzetten van realistische verlichting in Unreal Engine, het beheersen van verschillende verlichtingstechnieken en optimalisatie voor prestaties.",
                              "uk": "Розуміння принципів освітлення, налаштування реалістичного освітлення в Unreal Engine, опанування різних технік освітлення та оптимізація для продуктивності.",
                              "es": "Entendiendo principios de iluminación, configurando iluminación realista en Unreal Engine, dominando diferentes técnicas de iluminación y optimizando para rendimiento.",
                              "it": "Comprendendo i principi dell'illuminazione, configurando l'illuminazione realistica in Unreal Engine, padroneggiando diverse tecniche di illuminazione e ottimizzando per le prestazioni."
                    }
          },
          {
                    "title": {
                              "en": "Module 7: Animation & Rigging",
                              "ru": "Модуль 7: Анимация и риггинг",
                              "de": "Modul 7: Animation & Rigging",
                              "he": "מודול 7: אנימציה וריגינג",
                              "pl": "Moduł 7: Animacja i rigging",
                              "nl": "Module 7: Animatie & rigging",
                              "uk": "Модуль 7: Анімація та риггінг",
                              "es": "Módulo 7: Animación y rigging",
                              "it": "Modulo 7: Animazione e rigging"
                    },
                    "description": {
                              "en": "Introduction to 3D animation, basic rigging techniques, creating simple animations, and understanding animation principles for game development.",
                              "ru": "Введение в 3D-анимацию, базовые техники риггинга, создание простых анимаций и понимание принципов анимации для разработки игр.",
                              "de": "Einführung in 3D-Animation, grundlegende Rigging-Techniken, Erstellen einfacher Animationen und Verstehen von Animationsprinzipien für die Spielentwicklung.",
                              "he": "מבוא לאנימציה תלת מימדית, טכניקות ריגינג בסיסיות, יצירת אנימציות פשוטות והבנת עקרונות אנימציה לפיתוח משחקים.",
                              "pl": "Wprowadzenie do animacji 3D, podstawowe techniki riggingu, tworzenie prostych animacji i zrozumienie zasad animacji dla rozwoju gier.",
                              "nl": "Inleiding tot 3D-animatie, basis rigging technieken, het maken van eenvoudige animaties en het begrijpen van animatieprincipes voor game development.",
                              "uk": "Введення в 3D-анімацію, базові техніки риггінгу, створення простих анімацій та розуміння принципів анімації для розробки ігор.",
                              "es": "Introducción a la animación 3D, técnicas básicas de rigging, creando animaciones simples y entendiendo principios de animación para el desarrollo de juegos.",
                              "it": "Introduzione all'animazione 3D, tecniche base di rigging, creando animazioni semplici e comprendendo i principi dell'animazione per lo sviluppo di giochi."
                    }
          },
          {
                    "title": {
                              "en": "Module 8: Portfolio & Career Development",
                              "ru": "Модуль 8: Портфолио и развитие карьеры",
                              "de": "Modul 8: Portfolio & Karriereentwicklung",
                              "he": "מודול 8: תיק עבודות ופיתוח קריירה",
                              "pl": "Moduł 8: Portfolio i rozwój kariery",
                              "nl": "Module 8: Portfolio & carrièreontwikkeling",
                              "uk": "Модуль 8: Портфоліо та розвиток кар'єри",
                              "es": "Módulo 8: Portfolio y desarrollo de carrera",
                              "it": "Modulo 8: Portfolio e sviluppo della carriera"
                    },
                    "description": {
                              "en": "Creating a professional 3D portfolio, understanding industry standards, networking in the 3D community, and preparing for career opportunities in game development and 3D design.",
                              "ru": "Создание профессионального 3D-портфолио, понимание отраслевых стандартов, нетворкинг в 3D-сообществе и подготовка к карьерным возможностям в разработке игр и 3D-дизайне.",
                              "de": "Erstellen eines professionellen 3D-Portfolios, Verstehen von Branchenstandards, Networking in der 3D-Community und Vorbereitung auf Karrieremöglichkeiten in der Spielentwicklung und im 3D-Design.",
                              "he": "יצירת תיק עבודות תלת מימדי מקצועי, הבנת סטנדרטים תעשייתיים, נטוורקינג בקהילת התלת מימד והכנה להזדמנויות קריירה בפיתוח משחקים ועיצוב תלת מימדי.",
                              "pl": "Tworzenie profesjonalnego portfolio 3D, zrozumienie standardów branżowych, networking w społeczności 3D i przygotowanie do możliwości kariery w rozwoju gier i projektowaniu 3D.",
                              "nl": "Het maken van een professioneel 3D-portfolio, het begrijpen van industristandaarden, netwerken in de 3D-gemeenschap en voorbereiding op carrièremogelijkheden in game development en 3D-design.",
                              "uk": "Створення професійного 3D-портфоліо, розуміння галузевих стандартів, нетворкінг в 3D-спільноті та підготовка до кар'єрних можливостей у розробці ігор та 3D-дизайні.",
                              "es": "Creando un portfolio 3D profesional, entendiendo estándares de la industria, networking en la comunidad 3D y preparándose para oportunidades de carrera en desarrollo de juegos y diseño 3D.",
                              "it": "Creando un portfolio 3D professionale, comprendendo gli standard del settore, networking nella comunità 3D e preparandosi per le opportunità di carriera nello sviluppo di giochi e design 3D."
                    }
          }
]
    }
};

module.exports = courses;