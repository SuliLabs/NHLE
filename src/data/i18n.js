// UI translations for the whole app. Order of each entry:
//   en, ja, zh-Hant, zh-Hans, ko, fr, de, es, it, nl, ru
// langIdx is the item-CSV column (2..12); map it to a position here.
const ORDER = ['en', 'ja', 'tw', 'cn', 'ko', 'fr', 'de', 'es', 'it', 'nl', 'ru'];
const CODE_BY_IDX = { 2: 'en', 3: 'ja', 4: 'tw', 5: 'cn', 6: 'ko', 7: 'fr', 8: 'de', 9: 'es', 10: 'it', 11: 'nl', 12: 'ru' };

const S = {
  subtitleVerified: ['ACNH 3.0.3 · verified offsets only', 'ACNH 3.0.3 · 確認済みオフセットのみ', 'ACNH 3.0.3 · 僅限已驗證偏移', 'ACNH 3.0.3 · 仅限已验证偏移', 'ACNH 3.0.3 · 검증된 오프셋만', 'ACNH 3.0.3 · offsets vérifiés seulement', 'ACNH 3.0.3 · nur geprüfte Offsets', 'ACNH 3.0.3 · solo offsets verificados', 'ACNH 3.0.3 · solo offset verificati', 'ACNH 3.0.3 · alleen geverifieerde offsets', 'ACNH 3.0.3 · только проверенные смещения'],
  // ── onboarding ──
  connectTitle: ['Connect to your Switch', 'Switchに接続', '連線到你的 Switch', '连接到你的 Switch', 'Switch에 연결', 'Connexion à votre Switch', 'Mit deiner Switch verbinden', 'Conéctate a tu Switch', 'Connetti alla tua Switch', 'Verbind met je Switch', 'Подключение к Switch'],
  language:     ['Language', '言語', '語言', '语言', '언어', 'Langue', 'Sprache', 'Idioma', 'Lingua', 'Taal', 'Язык'],
  ipAddress:    ['Switch IP address', 'SwitchのIPアドレス', 'Switch IP 位址', 'Switch IP 地址', 'Switch IP 주소', 'Adresse IP de la Switch', 'IP-Adresse der Switch', 'Dirección IP de la Switch', 'Indirizzo IP della Switch', 'IP-adres van de Switch', 'IP-адрес Switch'],
  port:         ['Port', 'ポート', '連接埠', '端口', '포트', 'Port', 'Port', 'Puerto', 'Porta', 'Poort', 'Порт'],
  connect:      ['Connect', '接続', '連線', '连接', '연결', 'Connecter', 'Verbinden', 'Conectar', 'Connetti', 'Verbinden', 'Подключить'],
  connecting:   ['Connecting…', '接続中…', '連線中…', '连接中…', '연결 중…', 'Connexion…', 'Verbinde…', 'Conectando…', 'Connessione…', 'Verbinden…', 'Подключение…'],
  connected:    ['Connected', '接続済み', '已連線', '已连接', '연결됨', 'Connecté', 'Verbunden', 'Conectado', 'Connesso', 'Verbonden', 'Подключено'],
  connectedTo:  ['Connected to', '接続先', '已連線至', '已连接到', '연결됨:', 'Connecté à', 'Verbunden mit', 'Conectado a', 'Connesso a', 'Verbonden met', 'Подключено к'],
  couldNotConnect: ['Could not connect', '接続できませんでした', '無法連線', '无法连接', '연결할 수 없습니다', 'Connexion impossible', 'Verbindung fehlgeschlagen', 'No se pudo conectar', 'Impossibile connettersi', 'Kan niet verbinden', 'Не удалось подключиться'],
  sysbotHint:   ['Make sure sys-botbase is running and nothing else is connected to your Switch.', 'sys-botbaseが起動し、他に接続がないことを確認してください。', '請確認 sys-botbase 正在執行，且沒有其他程式連線到 Switch。', '请确认 sys-botbase 正在运行，且没有其他程序连接到 Switch。', 'sys-botbase가 실행 중이고 다른 연결이 없는지 확인하세요.', "Assurez-vous que sys-botbase fonctionne et qu'aucune autre connexion n'est active.", 'Stelle sicher, dass sys-botbase läuft und nichts anderes verbunden ist.', 'Asegúrate de que sys-botbase esté activo y nada más esté conectado a tu Switch.', 'Assicurati che sys-botbase sia in esecuzione e che nulla sia connesso.', 'Zorg dat sys-botbase draait en niets anders verbonden is.', 'Убедитесь, что sys-botbase запущен и нет других подключений.'],
  spritesTitle: ['Item sprites', 'アイテム画像', '物品圖示', '物品图标', '아이템 이미지', "Sprites d'objets", 'Gegenstandsbilder', 'Sprites de objetos', 'Sprite oggetti', 'Voorwerp-sprites', 'Спрайты предметов'],
  spritesBody:  ['Do you want to view items with their real images? They will be unpacked once and stored locally. Otherwise NHLE uses colour tiles.', 'アイテムを実際の画像で表示しますか？一度だけ展開してローカルに保存します。表示しない場合は色タイルを使用します。', '要以真實圖片顯示物品嗎？將解壓一次並儲存在本機。否則 NHLE 使用顏色方塊。', '要以真实图片显示物品吗？将解压一次并保存在本地。否则 NHLE 使用颜色方块。', '아이템을 실제 이미지로 표시할까요? 한 번만 압축을 풀어 로컬에 저장합니다. 아니면 색상 타일을 사용합니다.', "Voulez-vous afficher les objets avec leurs vraies images ? Elles seront décompressées une fois et stockées localement. Sinon, NHLE utilise des tuiles de couleur.", 'Möchten Sie Gegenstände mit echten Bildern anzeigen? Sie werden einmal entpackt und lokal gespeichert. Andernfalls nutzt NHLE Farbkacheln.', '¿Quieres ver los objetos con sus imágenes reales? Se descomprimen una vez y se guardan localmente. Si no, NHLE usa fichas de color.', "Vuoi vedere gli oggetti con le loro immagini reali? Verranno estratte una volta e salvate localmente. Altrimenti NHLE usa tessere colorate.", 'Wil je voorwerpen met hun echte afbeeldingen zien? Ze worden eenmaal uitgepakt en lokaal opgeslagen. Anders gebruikt NHLE kleurtegels.', 'Показывать предметы с настоящими картинками? Они будут распакованы один раз и сохранены локально. Иначе NHLE использует цветные плитки.'],
  spritesYes:   ['Yes, with images', 'はい、画像で', '是，使用圖片', '是，使用图片', '예, 이미지로', 'Oui, avec images', 'Ja, mit Bildern', 'Sí, con imágenes', 'Sì, con immagini', 'Ja, met afbeeldingen', 'Да, с картинками'],
  spritesNo:    ['No, colour tiles', 'いいえ、色タイル', '否，顏色方塊', '否，颜色方块', '아니요, 색상 타일', 'Non, tuiles de couleur', 'Nein, Farbkacheln', 'No, fichas de color', 'No, tessere colorate', 'Nee, kleurtegels', 'Нет, цветные плитки'],
  spritesUnpacking: ['Unpacking sprites…', '画像を展開中…', '正在解壓圖示…', '正在解压图标…', '이미지 압축 푸는 중…', 'Décompression des sprites…', 'Entpacke Bilder…', 'Descomprimiendo sprites…', 'Estrazione sprite…', 'Sprites uitpakken…', 'Распаковка спрайтов…'],

  // ── top navigation ──
  nav_home:      ['HOME', 'ホーム', '首頁', '首页', '홈', 'ACCUEIL', 'START', 'INICIO', 'HOME', 'START', 'ГЛАВНАЯ'],
  nav_inventory: ['INVENTORY', 'インベントリ', '物品欄', '物品栏', '인벤토리', 'INVENTAIRE', 'INVENTAR', 'INVENTARIO', 'INVENTARIO', 'INVENTARIS', 'ИНВЕНТАРЬ'],
  nav_trucos:    ['CHEATS', 'チート', '修改', '修改', '치트', 'ASTUCES', 'CHEATS', 'TRUCOS', 'TRUCCHI', 'CHEATS', 'ЧИТЫ'],
  nav_avanzado:  ['ADVANCED', '高度', '進階', '进阶', '고급', 'AVANCÉ', 'ERWEITERT', 'AVANZADO', 'AVANZATO', 'GEAVANCEERD', 'ДОПОЛНИТЕЛЬНО'],

  // ── home ──
  home_game:      ['Game', 'ゲーム', '遊戲', '游戏', '게임', 'Jeu', 'Spiel', 'Juego', 'Gioco', 'Spel', 'Игра'],
  home_island:    ['Island', '島', '島嶼', '岛屿', '섬', 'Île', 'Insel', 'Isla', 'Isola', 'Eiland', 'Остров'],
  home_character: ['Character', 'プレイヤー', '角色', '角色', '캐릭터', 'Personnage', 'Charakter', 'Personaje', 'Personaggio', 'Personage', 'Персонаж'],
  home_system:    ['System', 'システム', '系統', '系统', '시스템', 'Système', 'System', 'Sistema', 'Sistema', 'Systeem', 'Система'],
  home_version:   ['Version', 'バージョン', '版本', '版本', '버전', 'Version', 'Version', 'Versión', 'Versione', 'Versie', 'Версия'],
  home_build:     ['Build ID', 'ビルドID', '版本ID', '版本ID', '빌드 ID', 'Build ID', 'Build-ID', 'Build ID', 'Build ID', 'Build-ID', 'Build ID'],
  home_battery:   ['Battery', 'バッテリー', '電量', '电量', '배터리', 'Batterie', 'Akku', 'Batería', 'Batteria', 'Batterij', 'Батарея'],
  home_sysLang:   ['Console language', '本体の言語', '主機語言', '主机语言', '본체 언어', 'Langue console', 'Konsolensprache', 'Idioma de consola', 'Lingua console', 'Consoletaal', 'Язык консоли'],
  home_connection:['Connection', '接続', '連線', '连接', '연결', 'Connexion', 'Verbindung', 'Conexión', 'Connessione', 'Verbinding', 'Соединение'],
  home_reading:   ['Reading…', '読み込み中…', '讀取中…', '读取中…', '읽는 중…', 'Lecture…', 'Lese…', 'Leyendo…', 'Lettura…', 'Lezen…', 'Чтение…'],
  home_unverified:['not available — open the game on your island', 'ゲームを島で開いてください', '請在島上開啟遊戲', '请在岛上开启游戏', '섬에서 게임을 열어 주세요', "ouvrez le jeu sur votre île", 'Öffne das Spiel auf deiner Insel', 'abre el juego en tu isla', 'apri il gioco sulla tua isola', 'open het spel op je eiland', 'откройте игру на своём острове'],
  refreshData:    ['Refresh', '更新', '重新整理', '刷新', '새로 고침', 'Actualiser', 'Aktualisieren', 'Actualizar', 'Aggiorna', 'Vernieuwen', 'Обновить'],

  // ── advanced (RAM editor) ──
  adv_disTitle: ['Advanced — Memory Editor', '高度 — メモリエディタ', '進階 — 記憶體編輯', '进阶 — 内存编辑', '고급 — 메모리 편집기', 'Avancé — Éditeur mémoire', 'Erweitert — Speicher-Editor', 'Avanzado — Editor de memoria', 'Avanzato — Editor di memoria', 'Geavanceerd — Geheugen-editor', 'Дополнительно — Редактор памяти'],
  adv_disBody:  ['This tool reads and writes the game\'s live RAM directly. A wrong address or value can freeze or crash the game and corrupt your island. Use entirely at your own risk — the authors are not responsible for any damage to your game or save.', 'このツールはゲームのRAMを直接読み書きします。誤ったアドレスや値はクラッシュやデータ破損を招きます。すべて自己責任で。作者は一切の損害について責任を負いません。', '此工具會直接讀寫遊戲即時記憶體。錯誤的位址或數值可能使遊戲崩潰並損毀你的島嶼。風險自負——作者不負任何責任。', '此工具会直接读写游戏实时内存。错误的地址或数值可能使游戏崩溃并损坏你的岛屿。风险自负——作者不负任何责任。', '이 도구는 게임의 실시간 RAM을 직접 읽고 씁니다. 잘못된 주소나 값은 게임을 멈추거나 망가뜨릴 수 있습니다. 전적으로 본인 책임이며, 제작자는 어떠한 손해도 책임지지 않습니다.', "Cet outil lit et écrit directement la RAM du jeu. Une mauvaise adresse ou valeur peut planter le jeu et corrompre votre île. À vos risques et périls — les auteurs ne sont pas responsables.", 'Dieses Tool liest und schreibt direkt den RAM des Spiels. Falsche Adressen oder Werte können das Spiel zum Absturz bringen und deine Insel beschädigen. Nutzung auf eigene Gefahr — die Autoren haften nicht.', 'Esta herramienta lee y escribe directamente la RAM del juego. Una dirección o valor incorrecto puede congelar o cerrar el juego y dañar tu isla. Úsala bajo tu propio riesgo: los autores no se hacen responsables de ningún daño a tu juego o partida.', "Questo strumento legge e scrive direttamente la RAM del gioco. Un indirizzo o valore errato può bloccare il gioco e corrompere l'isola. Usalo a tuo rischio — gli autori non sono responsabili.", 'Deze tool leest en schrijft direct het RAM van het spel. Een verkeerd adres of waarde kan het spel laten crashen en je eiland beschadigen. Geheel op eigen risico — de makers zijn niet verantwoordelijk.', 'Этот инструмент напрямую читает и пишет в оперативную память игры. Неверный адрес или значение могут привести к сбою игры и повреждению острова. Используйте на свой страх и риск — авторы не несут ответственности.'],
  adv_accept:   ['I understand the risk — continue', 'リスクを理解しました — 続行', '我了解風險 — 繼續', '我了解风险 — 继续', '위험을 이해합니다 — 계속', "Je comprends le risque — continuer", 'Ich verstehe das Risiko — weiter', 'Entiendo el riesgo — continuar', 'Capisco il rischio — continua', 'Ik begrijp het risico — doorgaan', 'Я понимаю риск — продолжить'],
  adv_riskBadge:['AT YOUR OWN RISK', '自己責任', '風險自負', '风险自负', '본인 책임', 'À VOS RISQUES', 'AUF EIGENE GEFAHR', 'BAJO TU RIESGO', 'A TUO RISCHIO', 'OP EIGEN RISICO', 'НА СВОЙ РИСК'],
  adv_region:   ['Region', '領域', '區域', '区域', '영역', 'Région', 'Region', 'Región', 'Regione', 'Regio', 'Регион'],
  adv_address:  ['Address (hex)', 'アドレス (hex)', '位址 (hex)', '地址 (hex)', '주소 (hex)', 'Adresse (hex)', 'Adresse (hex)', 'Dirección (hex)', 'Indirizzo (hex)', 'Adres (hex)', 'Адрес (hex)'],
  adv_size:     ['Size (bytes)', 'サイズ (バイト)', '大小 (位元組)', '大小 (字节)', '크기 (바이트)', 'Taille (octets)', 'Größe (Bytes)', 'Tamaño (bytes)', 'Dimensione (byte)', 'Grootte (bytes)', 'Размер (байт)'],
  adv_read:     ['Read', '読む', '讀取', '读取', '읽기', 'Lire', 'Lesen', 'Leer', 'Leggi', 'Lezen', 'Читать'],
  adv_value:    ['Value (hex bytes)', '値 (hexバイト)', '數值 (hex)', '数值 (hex)', '값 (hex)', 'Valeur (hex)', 'Wert (hex)', 'Valor (hex)', 'Valore (hex)', 'Waarde (hex)', 'Значение (hex)'],
  adv_write:    ['Write', '書く', '寫入', '写入', '쓰기', 'Écrire', 'Schreiben', 'Escribir', 'Scrivi', 'Schrijven', 'Записать'],
  adv_result:   ['Result', '結果', '結果', '结果', '결과', 'Résultat', 'Ergebnis', 'Resultado', 'Risultato', 'Resultaat', 'Результат'],
  adv_invalid:  ['Invalid address or value', 'アドレスまたは値が不正です', '位址或數值無效', '地址或数值无效', '주소 또는 값이 잘못됨', 'Adresse ou valeur invalide', 'Ungültige Adresse oder Wert', 'Dirección o valor inválido', 'Indirizzo o valore non valido', 'Ongeldig adres of waarde', 'Неверный адрес или значение'],
  adv_writeOk:  ['Write OK', '書き込み成功', '寫入成功', '写入成功', '쓰기 완료', 'Écriture OK', 'Schreiben OK', 'Escritura OK', 'Scrittura OK', 'Schrijven OK', 'Запись OK'],

  // ── inventory / cheats helpers ──
  inv_items:    ['items', '個', '件', '件', '개', 'objets', 'Objekte', 'objetos', 'oggetti', 'voorwerpen', 'предметов'],
  trucos_more:  ['More cheats coming soon.', 'チートは今後追加予定です。', '更多修改即將推出。', '更多修改即将推出。', '더 많은 치트가 곧 추가됩니다.', "D'autres astuces bientôt.", 'Weitere Cheats folgen bald.', 'Más trucos próximamente.', 'Altri trucchi in arrivo.', 'Meer cheats binnenkort.', 'Скоро больше читов.'],

  // ── toolbar ──
  disconnect: ['Disconnect', '切断', '中斷連線', '断开连接', '연결 해제', 'Déconnecter', 'Trennen', 'Desconectar', 'Disconnetti', 'Verbreken', 'Отключить'],
  offline:    ['Offline', 'オフライン', '離線', '离线', '오프라인', 'Hors ligne', 'Offline', 'Sin conexión', 'Offline', 'Offline', 'Не в сети'],
  refresh:    ['Refresh', '更新', '重新整理', '刷新', '새로고침', 'Actualiser', 'Aktualisieren', 'Actualizar', 'Aggiorna', 'Vernieuwen', 'Обновить'],
  auto:       ['Auto', '自動', '自動', '自动', '자동', 'Auto', 'Auto', 'Auto', 'Auto', 'Auto', 'Авто'],
  search:     ['Search…', '検索…', '搜尋…', '搜索…', '검색…', 'Rechercher…', 'Suchen…', 'Buscar…', 'Cerca…', 'Zoeken…', 'Поиск…'],

  // ── left tabs ──
  tab_Inventory: ['Inventory', 'ポケット', '口袋', '口袋', '소지품', 'Inventaire', 'Inventar', 'Inventario', 'Inventario', 'Inventaris', 'Инвентарь'],
  tab_Storage:   ['Storage', '収納', '收納', '收纳', '보관함', 'Stockage', 'Lager', 'Almacén', 'Deposito', 'Opslag', 'Хранилище'],
  tab_Recycling: ['Recycling', 'リサイクル', '資源回收', '资源回收', '재활용', 'Recyclage', 'Recycling', 'Reciclaje', 'Riciclo', 'Recycling', 'Утилизация'],
  tab_Turnips:   ['Turnips', 'カブ', '大頭菜', '大头菜', '무', 'Navets', 'Rüben', 'Nabos', 'Rape', 'Knollen', 'Репа'],
  tab_Weather:   ['Weather', '天気', '天氣', '天气', '날씨', 'Météo', 'Wetter', 'Clima', 'Meteo', 'Weer', 'Погода'],
  tab_Cheats:    ['Cheats', 'チート', '修改', '修改', '치트', 'Triches', 'Cheats', 'Trucos', 'Trucchi', 'Cheats', 'Читы'],

  // ── bottom tabs ──
  bottom_Item:      ['Item', 'アイテム', '物品', '物品', '아이템', 'Objet', 'Gegenstand', 'Objeto', 'Oggetto', 'Voorwerp', 'Предмет'],
  bottom_Recipe:    ['Recipe', 'レシピ', '配方', '配方', '레시피', 'Recette', 'Rezept', 'Receta', 'Ricetta', 'Recept', 'Рецепт'],
  bottom_Variation: ['Variation', 'バリエーション', '變化', '变化', 'variation', 'Variante', 'Variante', 'Variación', 'Variante', 'Variant', 'Вариант'],

  // ── grid / item bar ──
  slots:      ['slots', 'スロット', '格', '格', '칸', 'cases', 'Plätze', 'casillas', 'caselle', 'vakken', 'ячеек'],
  gridHint:   ['click = inject · right-click = clear', 'クリック=注入・右クリック=削除', '點擊=注入・右鍵=清除', '点击=注入・右键=清除', '클릭=주입 · 우클릭=삭제', 'clic = injecter · clic droit = vider', 'Klick = einfügen · Rechtsklick = leeren', 'clic = inyectar · clic derecho = vaciar', 'clic = inietta · tasto destro = svuota', 'klik = invoegen · rechtsklik = wissen', 'клик = вставить · правый клик = очистить'],
  itemId:     ['Item ID', 'アイテムID', '物品 ID', '物品 ID', '아이템 ID', "ID d'objet", 'Gegenstand-ID', 'ID de objeto', 'ID oggetto', 'Voorwerp-ID', 'ID предмета'],
  amount:     ['Amount', '個数', '數量', '数量', '수량', 'Quantité', 'Menge', 'Cantidad', 'Quantità', 'Aantal', 'Кол-во'],
  hexMode:    ['Hex Mode', '16進モード', '十六進位', '十六进制', '16진수', 'Mode Hex', 'Hex-Modus', 'Modo Hex', 'Modalità Hex', 'Hex-modus', 'Hex-режим'],
  retainName: ['Retain Name', '名前を保持', '保留名稱', '保留名称', '이름 유지', 'Garder le nom', 'Name behalten', 'Mantener nombre', 'Mantieni nome', 'Naam behouden', 'Сохранять имя'],
  fillRemain: ['Fill Remain', '空きを埋める', '填滿空格', '填满空格', '빈칸 채우기', 'Remplir le reste', 'Rest füllen', 'Llenar vacíos', 'Riempi vuoti', 'Lege vullen', 'Заполнить пустые'],
  spawnAll:   ['Spawn All', '全部生成', '全部生成', '全部生成', '전체 생성', 'Tout générer', 'Alle erzeugen', 'Generar todo', 'Genera tutto', 'Alles vullen', 'Заполнить всё'],
  clearAll:   ['Clear All', '全部消去', '全部清除', '全部清除', '전체 삭제', 'Tout vider', 'Alle leeren', 'Vaciar todo', 'Svuota tutto', 'Alles wissen', 'Очистить всё'],
  itemName:   ['Item Name', 'アイテム名', '物品名稱', '物品名称', '아이템 이름', "Nom de l'objet", 'Gegenstandsname', 'Nombre del objeto', "Nome oggetto", 'Voorwerpnaam', 'Название предмета'],
  variation:  ['Variation', 'バリエーション', '變化', '变化', '베리에이션', 'Variante', 'Variante', 'Variación', 'Variante', 'Variant', 'Вариант'],
  wrapping:   ['Wrapping', 'ラッピング', '包裝', '包装', '포장', 'Emballage', 'Verpackung', 'Envoltorio', 'Confezione', 'Inpakken', 'Упаковка'],
  wrapNone:   ['None', 'なし', '無', '无', '없음', 'Aucun', 'Keine', 'Ninguno', 'Nessuno', 'Geen', 'Нет'],
  buried:     ['Buried', '埋める', '埋設', '埋设', '매설', 'Enterré', 'Vergraben', 'Enterrado', 'Sepolto', 'Begraven', 'Закопано'],
  durability: ['Durability', '耐久度', '耐久', '耐久', '내구도', 'Durabilité', 'Haltbarkeit', 'Durabilidad', 'Durabilità', 'Duurzaamheid', 'Прочность'],
  colName:    ['Name', '名前', '名稱', '名称', '이름', 'Nom', 'Name', 'Nombre', 'Nome', 'Naam', 'Название'],
  colImage:   ['Image', '画像', '圖示', '图标', '이미지', 'Image', 'Bild', 'Imagen', 'Immagine', 'Afbeelding', 'Картинка'],
  loadingDb:  ['Loading database…', 'データベース読込中…', '載入資料庫…', '加载数据库…', '데이터베이스 로딩…', 'Chargement…', 'Lade Datenbank…', 'Cargando base de datos…', 'Caricamento…', 'Database laden…', 'Загрузка базы…'],
  noResults:  ['No results', '結果なし', '無結果', '无结果', '결과 없음', 'Aucun résultat', 'Keine Ergebnisse', 'Sin resultados', 'Nessun risultato', 'Geen resultaten', 'Нет результатов'],
  pickItem:   ['Pick an item first', '先にアイテムを選択', '請先選擇物品', '请先选择物品', '먼저 아이템을 선택하세요', "Choisissez d'abord un objet", 'Wähle zuerst einen Gegenstand', 'Elige un objeto primero', 'Scegli prima un oggetto', 'Kies eerst een voorwerp', 'Сначала выберите предмет'],

  // ── turnips ──
  turnipPrices: ['Turnip Prices', 'カブ価', '大頭菜價格', '大头菜价格', '무 가격', 'Prix des navets', 'Rübenpreise', 'Precios de nabos', 'Prezzi rape', 'Knolprijzen', 'Цены на репу'],
  read:         ['Read', '読込', '讀取', '读取', '읽기', 'Lire', 'Lesen', 'Leer', 'Leggi', 'Lezen', 'Считать'],
  set:          ['Set', '設定', '設定', '设定', '설정', 'Définir', 'Setzen', 'Aplicar', 'Imposta', 'Instellen', 'Задать'],
  buyDaisy:     ['Buy (Daisy Mae)', '買値（ウリ）', '買價（阿獴）', '买价（大头菜阿獴）', '구입가 (무파니)', 'Achat (Porcelette)', 'Kauf (Jorna)', 'Compra (Juana)', 'Acquisto (Brì)', 'Koop (Daatje)', 'Покупка (Дейзи Мэй)'],
  sellPrices:   ['Sell prices (Mon→Sat AM/PM)', '売値（月→土 午前/午後）', '賣價（一→六 上午/下午）', '卖价（周一→周六 上午/下午）', '판매가 (월→토 오전/오후)', 'Prix de vente (lun→sam AM/PM)', 'Verkauf (Mo→Sa AM/PM)', 'Venta (lun→sáb AM/PM)', 'Vendita (lun→sab AM/PM)', 'Verkoop (ma→za AM/PM)', 'Продажа (пн→сб утро/вечер)'],
  maxAll:       ['Max All (660)', '全て最大（660）', '全部最大（660）', '全部最大（660）', '전체 최대 (660)', 'Tout au max (660)', 'Alle max (660)', 'Todo al máximo (660)', 'Tutto al massimo (660)', 'Alles max (660)', 'Все на макс (660)'],
  connectFirst: ['Connect first.', '先に接続してください。', '請先連線。', '请先连接。', '먼저 연결하세요.', "Connectez-vous d'abord.", 'Zuerst verbinden.', 'Conéctate primero.', 'Connetti prima.', 'Verbind eerst.', 'Сначала подключитесь.'],

  // ── cheats ──
  cheatsRegion:  ['[MAIN]-region · verified 3.0.3', '[MAIN]領域・3.0.3で確認済み', '[MAIN] 區域・已驗證 3.0.3', '[MAIN] 区域・已验证 3.0.3', '[MAIN] 영역 · 3.0.3 검증됨', '[MAIN] · vérifié 3.0.3', '[MAIN]-Bereich · geprüft 3.0.3', '[MAIN] · verificado 3.0.3', '[MAIN] · verificato 3.0.3', '[MAIN] · geverifieerd 3.0.3', '[MAIN] · проверено 3.0.3'],
  freezeTime:    ['Freeze Time', '時間停止', '凍結時間', '冻结时间', '시간 정지', 'Geler le temps', 'Zeit einfrieren', 'Congelar tiempo', 'Blocca tempo', 'Tijd bevriezen', 'Заморозить время'],
  freezeTimeDesc:['Stop the in-game clock', 'ゲーム内の時計を止める', '停止遊戲內時鐘', '停止游戏内时钟', '게임 내 시계를 멈춥니다', "Arrête l'horloge du jeu", 'Stoppt die Spieluhr', 'Detiene el reloj del juego', "Ferma l'orologio di gioco", 'Stopt de spelklok', 'Останавливает игровые часы'],
  moreCheats:    ['More cheats will appear here as their 3.0.3 offsets are verified.', '3.0.3のオフセットが確認され次第、チートが追加されます。', '更多修改將在驗證 3.0.3 偏移後出現。', '更多修改将在验证 3.0.3 偏移后出现。', '3.0.3 오프셋이 검증되면 더 추가됩니다.', "D'autres triches apparaîtront une fois les offsets 3.0.3 vérifiés.", 'Weitere Cheats folgen, sobald die 3.0.3-Offsets geprüft sind.', 'Más trucos aparecerán cuando se verifiquen sus offsets en 3.0.3.', 'Altri trucchi appariranno una volta verificati gli offset 3.0.3.', 'Meer cheats verschijnen zodra de 3.0.3-offsets geverifieerd zijn.', 'Больше читов появится по мере проверки смещений 3.0.3.'],
  on:  ['ON', 'オン', '開', '开', '켜기', 'ON', 'AN', 'ON', 'ON', 'AAN', 'ВКЛ'],
  off: ['OFF', 'オフ', '關', '关', '끄기', 'OFF', 'AUS', 'OFF', 'OFF', 'UIT', 'ВЫКЛ'],

  // ── weather ──
  weatherSub:   ['pick a weather → finds & writes a seed', '天気を選ぶ→シードを探して書き込む', '選擇天氣 → 尋找並寫入種子', '选择天气 → 查找并写入种子', '날씨 선택 → 시드 검색 후 적용', 'choisissez une météo → trouve et écrit une graine', 'Wetter wählen → Seed finden & schreiben', 'elige un clima → busca y escribe una semilla', 'scegli il meteo → trova e scrive un seme', 'kies weer → zoekt en schrijft een seed', 'выберите погоду → найдёт и запишет сид'],
  weatherIntro: ['The island seed determines the whole year’s weather. Choose a date and what you want — NHLE searches for a seed that produces it and writes it to your island. Forecast engine ported from MeteoNook (Treeki). Pick the hemisphere that matches your island.', '島のシードは1年の天気を決めます。日付と希望の天気を選ぶと、NHLEがそれを生むシードを探して書き込みます。予報エンジンはMeteoNook(Treeki)を移植。島と同じ半球を選んでください。', '島嶼種子決定整年的天氣。選擇日期與想要的天氣，NHLE 會尋找對應的種子並寫入你的島。預報引擎移植自 MeteoNook(Treeki)。請選擇與你島嶼相符的半球。', '岛屿种子决定整年的天气。选择日期与想要的天气，NHLE 会查找对应的种子并写入你的岛。预报引擎移植自 MeteoNook(Treeki)。请选择与你岛屿相符的半球。', '섬 시드는 한 해의 날씨를 결정합니다. 날짜와 원하는 날씨를 고르면 NHLE가 그 시드를 찾아 섬에 적용합니다. 예보 엔진은 MeteoNook(Treeki) 이식. 섬과 같은 반구를 선택하세요.', 'La graine de l’île détermine la météo de toute l’année. Choisissez une date et la météo voulue — NHLE cherche une graine qui la produit et l’écrit sur votre île. Moteur porté de MeteoNook (Treeki). Choisissez l’hémisphère de votre île.', 'Der Inselseed bestimmt das Wetter des ganzen Jahres. Wähle Datum und Wunschwetter — NHLE sucht einen passenden Seed und schreibt ihn. Engine portiert von MeteoNook (Treeki). Wähle die Hemisphäre deiner Insel.', 'La semilla de la isla determina el clima de todo el año. Elige una fecha y lo que quieres — NHLE busca una semilla que lo produzca y la escribe en tu isla. Motor portado de MeteoNook (Treeki). Elige el hemisferio de tu isla.', 'Il seme dell’isola determina il meteo di tutto l’anno. Scegli una data e cosa vuoi — NHLE cerca un seme che lo produca e lo scrive. Motore portato da MeteoNook (Treeki). Scegli l’emisfero della tua isola.', 'De eilandseed bepaalt het weer van het hele jaar. Kies een datum en gewenst weer — NHLE zoekt een seed en schrijft die naar je eiland. Engine geport van MeteoNook (Treeki). Kies het halfrond van je eiland.', 'Сид острова определяет погоду на весь год. Выберите дату и желаемую погоду — NHLE найдёт подходящий сид и запишет его. Движок портирован из MeteoNook (Treeki). Выберите полушарие вашего острова.'],
  hemisphere:  ['Hemisphere', '半球', '半球', '半球', '반구', 'Hémisphère', 'Hemisphäre', 'Hemisferio', 'Emisfero', 'Halfrond', 'Полушарие'],
  northern:    ['Northern', '北半球', '北半球', '北半球', '북반구', 'Nord', 'Nord', 'Norte', 'Nord', 'Noord', 'Северное'],
  southern:    ['Southern', '南半球', '南半球', '南半球', '남반구', 'Sud', 'Süd', 'Sur', 'Sud', 'Zuid', 'Южное'],
  year:        ['Year', '年', '年', '年', '년', 'Année', 'Jahr', 'Año', 'Anno', 'Jaar', 'Год'],
  month:       ['Month', '月', '月', '月', '월', 'Mois', 'Monat', 'Mes', 'Mese', 'Maand', 'Месяц'],
  day:         ['Day', '日', '日', '日', '일', 'Jour', 'Tag', 'Día', 'Giorno', 'Dag', 'День'],
  weatherLabel:['Weather', '天気', '天氣', '天气', '날씨', 'Météo', 'Wetter', 'Clima', 'Meteo', 'Weer', 'Погода'],
  findApply:   ['Find & apply', '検索して適用', '尋找並套用', '查找并应用', '검색 후 적용', 'Chercher & appliquer', 'Suchen & anwenden', 'Buscar y aplicar', 'Trova e applica', 'Zoek & pas toe', 'Найти и применить'],
  searching:   ['Searching…', '検索中…', '搜尋中…', '搜索中…', '검색 중…', 'Recherche…', 'Suche…', 'Buscando…', 'Ricerca…', 'Zoeken…', 'Поиск…'],
  searchingSeed:['Searching for a seed…', 'シードを検索中…', '正在尋找種子…', '正在查找种子…', '시드 검색 중…', "Recherche d'une graine…", 'Suche einen Seed…', 'Buscando una semilla…', 'Ricerca di un seme…', 'Seed zoeken…', 'Поиск сида…'],
  noSeed:      ['No seed found — try another date or weather.', 'シードが見つかりません。別の日付や天気を試してください。', '找不到種子 — 換個日期或天氣試試。', '找不到种子 — 换个日期或天气试试。', '시드를 찾지 못했습니다 — 다른 날짜나 날씨를 시도하세요.', 'Aucune graine trouvée — essayez une autre date ou météo.', 'Kein Seed gefunden — andere Datum/Wetter versuchen.', 'No se encontró semilla — prueba otra fecha o clima.', 'Nessun seme trovato — prova un’altra data o meteo.', 'Geen seed gevonden — probeer andere datum of weer.', 'Сид не найден — попробуйте другую дату или погоду.'],
  seedApplied: ['Seed applied to your island ✓', 'シードを島に適用しました ✓', '已將種子套用到你的島 ✓', '已将种子应用到你的岛 ✓', '시드를 섬에 적용했습니다 ✓', 'Graine appliquée à votre île ✓', 'Seed auf deine Insel angewandt ✓', 'Semilla aplicada a tu isla ✓', 'Seme applicato alla tua isola ✓', 'Seed toegepast op je eiland ✓', 'Сид применён к острову ✓'],
  foundConnect:['Found (connect to apply)', '見つかりました（適用するには接続）', '已找到（連線以套用）', '已找到（连接以应用）', '찾음 (적용하려면 연결)', 'Trouvé (connectez pour appliquer)', 'Gefunden (verbinden zum Anwenden)', 'Encontrada (conéctate para aplicar)', 'Trovato (connetti per applicare)', 'Gevonden (verbind om toe te passen)', 'Найдено (подключитесь, чтобы применить)'],
  currentSeed: ['Current island seed:', '現在の島シード：', '目前島嶼種子：', '当前岛屿种子：', '현재 섬 시드:', "Graine actuelle de l'île :", 'Aktueller Inselseed:', 'Semilla actual de la isla:', 'Seme attuale dell’isola:', 'Huidige eilandseed:', 'Текущий сид острова:'],
  restorePrev: ['Restore previous', '元に戻す', '還原先前', '还原之前', '이전 복원', 'Restaurer', 'Wiederherstellen', 'Restaurar anterior', 'Ripristina', 'Herstellen', 'Восстановить'],
  seed:        ['Seed', 'シード', '種子', '种子', '시드', 'Graine', 'Seed', 'Semilla', 'Seme', 'Seed', 'Сид'],
  hourlyHint:  ['Hourly weather for the selected date (00–23h).', '選択した日の時間別天気（00〜23時）。', '所選日期的每小時天氣（00–23 時）。', '所选日期的每小时天气（00–23 时）。', '선택한 날짜의 시간별 날씨 (00–23시).', 'Météo horaire pour la date choisie (00–23 h).', 'Stündliches Wetter für das gewählte Datum (00–23 Uhr).', 'Clima por hora de la fecha elegida (00–23 h).', 'Meteo orario per la data scelta (00–23).', 'Weer per uur voor de gekozen datum (00–23 u).', 'Погода по часам на выбранную дату (00–23 ч).'],
  meteorShower:['Meteor shower', '流星群', '流星雨', '流星雨', '유성우', 'Pluie de météores', 'Meteorschauer', 'Lluvia de meteoros', 'Pioggia di meteore', 'Meteorenregen', 'Метеорный поток'],
  starMinutes: ['star-minutes', '出現分', '出現分鐘', '出现分钟', '별 출현 분', 'minutes d’étoiles', 'Sternminuten', 'minutos con estrellas', 'minuti di stelle', 'sterminuten', 'минут со звёздами'],
  doubleRainbow:['Double rainbow', 'ダブルレインボー', '雙彩虹', '双彩虹', '쌍무지개', 'Arc-en-ciel double', 'Doppelter Regenbogen', 'Arcoíris doble', 'Doppio arcobaleno', 'Dubbele regenboog', 'Двойная радуга'],
  rainbowAround:['Rainbow around', '虹（およそ', '彩虹約於', '彩虹约于', '무지개 약', 'Arc-en-ciel vers', 'Regenbogen gegen', 'Arcoíris hacia', 'Arcobaleno verso', 'Regenboog rond', 'Радуга около'],
  auroraNight: ['Aurora visible after nightfall', '夜にオーロラが見えます', '入夜後可見極光', '入夜后可见极光', '해 진 뒤 오로라가 보입니다', "Aurore visible à la tombée de la nuit", 'Polarlicht nach Einbruch der Dunkelheit', 'Aurora visible al anochecer', 'Aurora visibile dopo il tramonto', 'Poollicht zichtbaar na zonsondergang', 'Полярное сияние видно после заката'],

  // weather targets
  target_shower:    ['Shooting stars', '流れ星', '流星', '流星', '별똥별', "Pluie d'étoiles", 'Sternschnuppen', 'Lluvia de estrellas', 'Stelle cadenti', 'Vallende sterren', 'Звездопад'],
  target_rainbow:   ['Rainbow', '虹', '彩虹', '彩虹', '무지개', 'Arc-en-ciel', 'Regenbogen', 'Arcoíris', 'Arcobaleno', 'Regenboog', 'Радуга'],
  target_aurora:    ['Aurora', 'オーロラ', '極光', '极光', '오로라', 'Aurore', 'Polarlicht', 'Aurora', 'Aurora', 'Poollicht', 'Полярное сияние'],
  target_sunny:     ['Sunny / clear', '晴れ', '晴天', '晴天', '맑음', 'Ensoleillé', 'Sonnig', 'Soleado', 'Sereno', 'Zonnig', 'Ясно'],
  target_cloudy:    ['Cloudy', '曇り', '多雲', '多云', '흐림', 'Nuageux', 'Bewölkt', 'Nublado', 'Nuvoloso', 'Bewolkt', 'Облачно'],
  target_rain:      ['Rain', '雨', '下雨', '下雨', '비', 'Pluie', 'Regen', 'Lluvia', 'Pioggia', 'Regen', 'Дождь'],
  target_heavyrain: ['Heavy rain', '大雨', '大雨', '大雨', '폭우', 'Forte pluie', 'Starkregen', 'Tormenta', 'Temporale', 'Zware regen', 'Ливень'],
  target_snow:      ['Snow', '雪', '下雪', '下雪', '눈', 'Neige', 'Schnee', 'Nieve', 'Neve', 'Sneeuw', 'Снег'],

  // weather names (hourly tooltip)
  w_Clear:      ['Clear', '快晴', '晴朗', '晴朗', '쾌청', 'Dégagé', 'Klar', 'Despejado', 'Sereno', 'Helder', 'Ясно'],
  w_Sunny:      ['Sunny', '晴れ', '晴', '晴', '맑음', 'Ensoleillé', 'Sonnig', 'Soleado', 'Soleggiato', 'Zonnig', 'Солнечно'],
  w_Cloudy:     ['Cloudy', '曇り', '多雲', '多云', '흐림', 'Nuageux', 'Bewölkt', 'Nublado', 'Nuvoloso', 'Bewolkt', 'Облачно'],
  w_RainClouds: ['Rain clouds', '雨雲', '雨雲', '雨云', '비구름', 'Nuages de pluie', 'Regenwolken', 'Nubes de lluvia', 'Nubi di pioggia', 'Regenwolken', 'Дождевые тучи'],
  w_Rain:       ['Rain', '雨', '雨', '雨', '비', 'Pluie', 'Regen', 'Lluvia', 'Pioggia', 'Regen', 'Дождь'],
  w_HeavyRain:  ['Heavy rain', '大雨', '大雨', '大雨', '폭우', 'Forte pluie', 'Starkregen', 'Lluvia fuerte', 'Pioggia forte', 'Zware regen', 'Ливень'],
  w_Snow:       ['Snow', '雪', '雪', '雪', '눈', 'Neige', 'Schnee', 'Nieve', 'Neve', 'Sneeuw', 'Снег'],

  // feasibility
  feas_special: ['That date is a special event day — its weather is fixed by the game and cannot be changed with the seed.', 'その日はイベント日で、天気はゲームで固定されシードでは変えられません。', '該日是特殊活動日 — 天氣由遊戲固定，無法用種子更改。', '该日是特殊活动日 — 天气由游戏固定，无法用种子更改。', '그 날짜는 특별 이벤트일이라 날씨가 고정되어 시드로 바꿀 수 없습니다.', "Cette date est un jour d'événement — la météo est fixe et non modifiable par la graine.", 'Dieser Tag ist ein Event-Tag — das Wetter ist fest und nicht per Seed änderbar.', 'Esa fecha es un día de evento — su clima es fijo y no se puede cambiar con la semilla.', 'Quella data è un giorno evento — il meteo è fisso e non modificabile col seme.', 'Die datum is een evenementdag — het weer ligt vast en is niet via de seed te wijzigen.', 'Это день события — погода фиксирована и не меняется сидом.'],
  feas_aurora:  ['Auroras only appear in deep winter on this hemisphere. Pick a winter date.', 'オーロラはこの半球では真冬のみ。冬の日付を選んでください。', '極光只在此半球的隆冬出現。請選冬季日期。', '极光只在此半球的隆冬出现。请选冬季日期。', '오로라는 이 반구의 한겨울에만 나타납니다. 겨울 날짜를 고르세요.', "Les aurores n'apparaissent qu'en plein hiver sur cet hémisphère. Choisissez une date d'hiver.", 'Polarlichter gibt es nur im tiefen Winter dieser Hemisphäre. Wähle ein Winterdatum.', 'Las auroras solo aparecen en pleno invierno en este hemisferio. Elige una fecha de invierno.', 'Le aurore appaiono solo in pieno inverno in questo emisfero. Scegli una data invernale.', 'Poollicht verschijnt alleen in de diepe winter op dit halfrond. Kies een winterdatum.', 'Полярное сияние бывает только в разгар зимы этого полушария. Выберите зимнюю дату.'],
  feas_rainbow: ['Rainbows only appear in the rainbow season on this hemisphere. Pick a spring–autumn date.', '虹はこの半球の虹の季節のみ。春〜秋の日付を選んでください。', '彩虹只在此半球的彩虹季節出現。請選春至秋的日期。', '彩虹只在此半球的彩虹季节出现。请选春至秋的日期。', '무지개는 이 반구의 무지개 시즌에만 나타납니다. 봄~가을 날짜를 고르세요.', "Les arcs-en-ciel n'apparaissent qu'en saison sur cet hémisphère. Choisissez une date printemps–automne.", 'Regenbögen gibt es nur in der Regenbogensaison dieser Hemisphäre. Wähle Frühling–Herbst.', 'Los arcoíris solo aparecen en su temporada en este hemisferio. Elige una fecha de primavera a otoño.', 'Gli arcobaleni appaiono solo nella stagione su questo emisfero. Scegli primavera–autunno.', 'Regenbogen verschijnen alleen in het regenboogseizoen op dit halfrond. Kies lente–herfst.', 'Радуга бывает только в радужный сезон этого полушария. Выберите дату весна–осень.'],
  feas_snow:    ['Snow only falls in winter on this hemisphere. Pick a winter date.', '雪はこの半球では冬のみ。冬の日付を選んでください。', '雪只在此半球的冬季降下。請選冬季日期。', '雪只在此半球的冬季降下。请选冬季日期。', '눈은 이 반구의 겨울에만 내립니다. 겨울 날짜를 고르세요.', "La neige ne tombe qu'en hiver sur cet hémisphère. Choisissez une date d'hiver.", 'Schnee fällt nur im Winter dieser Hemisphäre. Wähle ein Winterdatum.', 'La nieve solo cae en invierno en este hemisferio. Elige una fecha de invierno.', 'La neve cade solo in inverno in questo emisfero. Scegli una data invernale.', 'Sneeuw valt alleen in de winter op dit halfrond. Kies een winterdatum.', 'Снег идёт только зимой этого полушария. Выберите зимнюю дату.'],
};

export function makeT(langIdx) {
  const code = CODE_BY_IDX[langIdx] || 'en';
  const pos = ORDER.indexOf(code);
  return (key) => {
    const row = S[key];
    if (!row) return key;
    return row[pos] || row[0] || key;
  };
}

export { ORDER, CODE_BY_IDX };
