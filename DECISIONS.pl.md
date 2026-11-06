# Dziennik decyzji

[🇬🇧 English](DECISIONS.md) | 🇵🇱 Polski

Krótkie notatki o tym, co zdecydowałem i dlaczego. Powrót do [README](README.pl.md).

---

## Oba warianty

- **Bez frameworka i bundlera.** Zwykłe skrypty ładowane po kolei, z których każdy wystawia małą zmienną globalną (`Game`, `Intro`, `Sync`, ...). Reklamy są małe i szybko się ładują, a żeby je uruchomić, nie trzeba niczego konfigurować.
- **SCSS z BEM, skompilowany CSS w repozytorium.** Partiale SCSS porządkują style, a zmienne (i `px2x()` w wariancie A) pozwalają śledzić liczby aż do designu; skompilowany `css/style.css` jest w repo, więc reklamę można otworzyć bez budowania. `npm run build:css` generuje go ponownie.
- **Assety 2x w 50%.** Każda warstwa stoi w zmierzonej pozycji w pikselach CSS (piksel designu ÷ 2); niczego nie rysowałem od nowa ani nie podmieniałem.
- **Click tag zgodnie z zadaniem.** `window.clickTag || 'https://example.com/landing'`, otwierany w nowej karcie z `noopener`.
- **Animuję tylko `transform` i `opacity`.** Właściwości układu nigdy nie są animowane. `will-change` daję tylko warstwom, które naprawdę się ruszają, bo promowanie wszystkiego rozmywało tekst na endcardach.
- **`prefers-reduced-motion`** jest respektowane w obu reklamach (GSAP `matchMedia` w A, od razu stan końcowy w B).
- **Pauza, gdy ukryte.** Obie reklamy zatrzymują się przy `visibilitychange` i wracają od tego samego miejsca.
- **Waga.** Wariant A wysyła 1,45 MB, a wariant B 0,50 / 0,55 / 0,83 MB na część (limit 3 MB każda). `design/`, `tools/`, `scss/` i `node_modules/` nie są wskazywane przez żadną reklamę, więc się nie liczą.
- **Tryby debug** (`?debug=1`) są w obu reklamach i nic nie robią, dopóki parametru nie ma w adresie.
- **Bez komentarzy w kodzie** (poza nagłówkiem licencji GSAP, który musi zostać). Starałem się, żeby nazwy i małe funkcje tłumaczyły kod; powody są spisane tutaj.
- **Git.** Jeden branch na krok, wcielany do `develop` merge commitami i jeden squash do `main`, więc historia pokazuje pracę krok po kroku.

---

## Wariant A: Gut Run

**DOM i transformacje CSS zamiast canvas.**
Assety to warstwowe PNG-i, a endcardy składają się z wielu animowanych sprite'ów, które GSAP dobrze obsługuje na elementach DOM. Przewijany świat (jelito i przeszkody) to jeden kontener poruszany jednym `translate3d`, więc klatka kosztuje jedną transformację zamiast 15 osobnych. Canvas oznaczałby ponowne rysowanie i implementowanie tekstu, obszarów kliknięcia oraz animacji endcardów bez widocznej korzyści.

**Skalowanie do ekranu.**
Gra jest projektowana w 360×640 i skalowana do dopasowania („contain") rozmiarem visual viewport (`100dvh` jako zapas), więc paski przeglądarki mobilnej niczego nie obcinają. Przeskalowana scena jest przyciągana do pełnych pikseli urządzenia, co usunęło cienką szparę, która pojawiała się na wysokich ekranach. Na ekranach węższych niż 9:16 wolny obszar wypełnia gradient pasujący do dołu grafiki, a na endcardach przełącza się na tło endcardu.

**Symulacja ze stałym krokiem.**
Fizyka działa co 1/120 s z akumulatorem, a render interpoluje między dwoma ostatnimi stanami. Wysokość skoku i prędkość opadania są więc takie same na telefonach 60 Hz i 120 Hz, a gubiona klatka nie zmienia wyniku skoku. Wartości: grawitacja 1300, prędkość skoku −380, prędkość pierwszego skoku −220, maksymalna prędkość opadania 620 (jednostki px/s projektu 360×640).

**Kolizje.**
- Hitboxy generuje z maski alfa każdego sprite'a `tools/gen-hitboxes.py`: nieprzezroczysty kształt jest pokryty małym zestawem prostokątów (gracz też), zapisanym w `js/hitboxes.js`. Unika to problemu „umarłem, a niczego nie dotknąłem" pełnego prostokąta i sprowadza kolizję do kilku porównań liczb całkowitych.
- Uczciwość sprawdziłem na prawdziwych pikselach: na 108 000 pozycji gracza żadna śmierć nie nastąpiła dalej niż 2 px od widocznego dotknięcia. To sprawdzenie pokazało, że przeszkody tekstowe były zbyt hojne, i je zacieśniłem.
- Pętle kolizji nie alokują pamięci (pętle indeksowane, wstępnie policzone prostokąty), żeby uniknąć przestojów garbage collectora; w trace zmniejszyło to pracę GC o ok. 76%.

**Trasa przeszkód.**
15 przeszkód jest ułożonych stałą listą w `js/config.js`. `tools/check-course.py` dowodzi fizyką samej gry, że każdą lukę da się przejść, dzięki czemu trasa jest powtarzalna i uczciwa. Losowa trasa wymagałaby tego samego dowodu w czasie działania.

**Get ready i trudność.**
Pierwsze dotknięcie wywołuje krótkie przewinięcie jelita do tyłu, żeby gracz miał chwilę przed pierwszą przeszkodą. Prędkość przewijania delikatnie rośnie od 100 do 130 px/s w trakcie rundy.

**Audio.**
- Web Audio API: kontekst jest tworzony zawieszony i wznawiany synchronicznie w pierwszym geście użytkownika (`pointerdown`, `pointerup`, `touchend`, `keydown`), jak wymaga iOS. Dla odblokowania odtwarzany jest cichy bufor, a ustawienie `navigator.audioSession.type = 'playback'` sprawia, że dźwięk nie jest wyciszany przełącznikiem dzwonka.
- Okno pętli muzyki jest liczone z zdekodowanego bufora, żeby pętla nie zostawiała słyszalnej luki, którą dawało zwykłe `loop = true`.
- Pojedyncze dźwięki są śledzone i zatrzymywane przy resecie, więc replay nigdy nie nakłada głosów.
- Wyciszenie to master gain plus `localStorage` (opakowany, żeby tryb prywatny nie psuł reklamy).
- Efekty dźwiękowe są ponownie zakodowane w 96 kbps; muzyka (720 KB) jest największym pojedynczym assetem.

**Endcardy.**
Animacje wejścia są budowane osobno dla każdej karty w GSAP i cofane przez `gsap.matchMedia`, gdy użytkownik woli ograniczony ruch albo gdy gra jest resetowana, więc replay startuje z czystego stanu. Do własnej warstwy kompozytora promowana jest tylko warstwa, która się rusza.

**Wydajność na telefonie.**
Testy na telefonie z Androidem ze średniej półki pokazały sporadyczne gubienie klatek. Poprawki to usunięcie alokacji w każdej klatce, unikanie przeliczania stylów całego świata (jedna transformacja na kontenerze) i ograniczenie pracy rasteryzacji na endcardach (ok. 92% mniej). Końcowy bieg na telefonie: 60 fps, najgorsza klatka 17 ms.

**Ograniczenia, które przyjąłem.**
Celem są telefony w pionie; w poziomie gra zachowuje kształt 9:16 z granatowymi bokami. Zdecydowałem, żeby nie dodawać podpowiedzi o obrocie ani nie rozciągać tekstury, bo zadanie dotyczy reklamy na telefon w pionie.

---

## Wariant B: Fireplace

**Trzy dokumenty i podgląd.**
Każda część to osobny plik HTML, bo są dostarczane jako trzy reklamy. W tym repozytorium dzielą jeden arkusz stylów i kilka skryptów tylko dla wygody. `preview.html` osadza je w iframe'ach z 4 px odstępu, pustym środkiem na stronę i przyciskiem **Replay intro**; scena skaluje się do okna.

**Układ.**
Każda warstwa (`bg`, panel, copy, logo) to obraz pełnego rozmiaru 640×1950 (skyscraper) lub 2064×500 (top), ustawiony w 0,0 i pokazywany w 50%, więc nakładają się bez osobnych przesunięć. Pozycji wymagało tylko CTA (73,75, 837,5 px). Wynik sprawdziłem względem `layout.png`, renderując podgląd i porównując różnicę; nakładka debug (`?debug=1`) pozwala każdemu powtórzyć tę kontrolę.

**Tło: pre-cut `bg.jpg` plus paski na szwach, a nie samo `bg-big.jpg`.**
Zadanie każe wybrać i uzasadnić. Co zmierzyłem:
- Zszycie trzech pre-cutów tła pokazuje widoczny szew (mech się nie kontynuuje, szczególnie między banerem top a prawym skyscraperem).
- `bg-big.jpg` to jedna ciągła powierzchnia, ale jego produkty różnią się od designu (inna poza i niebieski artefakt nad lewym pudełkiem), a produkt jest wypalony w obrazie, więc nie mogłem użyć go do skyscraperów bez złamania wymogu „co do piksela".
- Dlatego wygląd designu dają pre-cuty, a cztery cienkie paski (64×250 px) wycięte z `bg-big.jpg` są wtapiane na szwach maską CSS. W miejscu styku obie strony pokazują te same piksele tego samego źródła, więc na styku nie ma widocznego skoku. Paski ważą razem ok. 83 KB (`tools/slice-seams.py`).
- 4 px odstępu między częściami to założenie z szerokości `bg-big.jpg` (1680 = 320 + 4 + 1032 + 4 + 320).

**Dlaczego paski szwów nie zoomują.**
Zoom wokół jednego wspólnego punktu utrzymałby części spójnie, ale skalowanie wokół punktu poza częścią odsłania jej krawędź, bo pre-cuty nie mają zapasowych pikseli. Każda część zoomuje więc swoje tło wokół własnego środka, a paski stoją w miejscu: strefa wtapiania ukrywa różnicę, która przy 4% zoomu przez 30 s jest poniżej piksela na sekundę.

**Dostarczone pliki PNG-8 straciły przezroczystość.**
`box.png`, `cta.png` i oba `hl.png` skyscraperów nie miały chunku przezroczystości, więc zakrywały tło pełną czernią. `tools/fix-alpha.py` ją przywraca: indeks czerni staje się przezroczysty, copy dostaje rampę alfa odtworzoną z palety, a panel krycie 0,8 dopasowane do designu. Naprawa plików, zamiast `mix-blend-mode`, pozwala uniknąć dodatkowej kompozycji, której wymagają tryby mieszania.

**Animacja.**
- Intro ok. 4,6 s: zoom tła 1,1 → 1 z `power2.out`, logo z małym przestrzałem (`back.out`), panel z `expo.out`, na końcu copy i CTA, a dwa skyscrapery przesunięte o 0,12 s, żeby nie wyglądały mechanicznie.
- Produkt jest częścią obrazu tła, więc nie może wjechać sam. Zamiast tego intro opiera się na zoomie i pojawianiu się tła.
- Nagłówek na topie to trzy kopie jednego obrazu, każda przycięta do jednej linii (`clip-path: inset`), więc linie mogą budować się po kolei bez dodatkowych assetów.
- Po intro tło dryfuje do 1,04, a CTA delikatnie pulsuje; wszystko kończy się po 30 s. Wtedy ticker GSAP jest usypiany, więc reklama przestaje zużywać klatki animacji.

**Start trzech dokumentów razem.**
`preview.html` ładuje każdą część z `?sync=1`. Część dekoduje obrazy, wysyła do rodzica `fireplace:ready` i startuje po otrzymaniu `fireplace:start`, które podgląd wysyła, gdy wszystkie trzy są gotowe (z zabezpieczeniem startu po 5 s). Bez `?sync=1`, jak w produkcji, część po prostu startuje, gdy jest gotowa. Wiadomości są sprawdzane względem prawdziwego okna rodzica.

**Reduced motion i pauza.**
Z `prefers-reduced-motion: reduce` oś czasu przeskakuje na koniec intro, a ticker idzie spać. Gdy karta jest ukryta, oś czasu się zatrzymuje i wraca od tego samego miejsca.

**Nakładka debug.**
`?debug=1` rysuje `design/layout.png` na 50% krycia na każdej części. Skala (0,975) i przesunięcia zostały dopasowane przez minimalizację różnicy z moim renderem, więc dobrze nadaje się do sprawdzania dopasowania, ale nie jest dokładnym pomiarem oryginalnego pliku designu.

**Podgląd na małych ekranach.**
Scena podglądu to stałe 1680×975 skalowane `transform` do okna (nigdy powyżej 100%). Same reklamy zachowują dostarczone rozmiary.

**Znana luka w dostarczonych assetach.**
`top/hl.png` nie zawiera słowa „NATÜRLICH", które jest w `layout.png`, a linie druga i trzecia są ułożone inaczej. Użyłem assetu w takiej formie, jak go dostałem, i zanotowałem to zamiast rysować tekst od nowa.
