// (round 47: a circuit's laps timed as a racing sim times them, and the map on the website from the artifact)
{ const K = ['Lap', 'Last', 'Best', 'Total', 'Record', 'Finished', 'Leader', 'Gap', 'Personal best', 'Fastest lap', 'Lap {0}', 'Best lap {0}', 'Laps: {0}.', '{0} (best)',
    'Make a course on the map (opens the game’s website)', 'The map can’t open inside Claude: courses are made on the game’s website, and played here from a course file or with the game’s own courses.', 'The map’s servers are slow just now. Try again in a moment, or put the points closer together.'];
  const L = {
    ko: ['랩', '직전', '베스트', '전체', '기록', '완주', '선두', '차이', '개인 최고', '최고 랩', '{0}랩', '베스트 랩 {0}', '랩 타임: {0}.', '{0} (베스트)',
      '지도에서 코스 만들기 (게임 웹사이트가 열립니다)', 'Claude 안에서는 지도를 열 수 없습니다. 코스는 게임 웹사이트에서 만들고, 여기서는 코스 파일이나 게임 기본 코스로 달릴 수 있습니다.', '지도 서버가 지금 느립니다. 잠시 후 다시 시도하거나 지점을 더 가깝게 놓아 주세요.'],
    ja: ['ラップ', '前周', 'ベスト', '合計', '記録', 'フィニッシュ', 'トップ', '差', '自己ベスト', 'ファステストラップ', '{0}周目', 'ベストラップ {0}', 'ラップタイム: {0}。', '{0}(ベスト)',
      '地図でコースを作る(ゲームのウェブサイトが開きます)', 'Claude の中では地図を開けません。コースはゲームのウェブサイトで作り、ここではコースファイルかゲームのコースで走れます。', '地図のサーバーが今は遅くなっています。少し待ってからもう一度試すか、地点を近づけてください。'],
    zh: ['圈', '上圈', '最佳', '总计', '纪录', '完赛', '领先', '差距', '个人最佳', '最快圈', '第{0}圈', '最佳圈 {0}', '各圈用时：{0}。', '{0}（最佳）',
      '在地图上制作赛道（打开游戏网站）', '在 Claude 中无法打开地图：赛道在游戏网站上制作，在这里可用赛道文件或游戏自带的赛道来跑。', '地图服务器现在很慢。请稍后再试，或把各点放得更近一些。'],
    es: ['Vuelta', 'Última', 'Mejor', 'Total', 'Récord', 'Terminado', 'Líder', 'Dif.', 'Mejor personal', 'Vuelta rápida', 'Vuelta {0}', 'Mejor vuelta {0}', 'Vueltas: {0}.', '{0} (mejor)',
      'Crear un recorrido en el mapa (abre la web del juego)', 'El mapa no se puede abrir dentro de Claude: los recorridos se crean en la web del juego y aquí se corren con un archivo de recorrido o con los recorridos del juego.', 'Los servidores del mapa van lentos ahora mismo. Inténtalo de nuevo en un momento o pon los puntos más cerca.'],
    fr: ['Tour', 'Dernier', 'Meilleur', 'Total', 'Record', 'Terminé', 'En tête', 'Écart', 'Record perso', 'Meilleur tour', 'Tour {0}', 'Meilleur tour {0}', 'Tours : {0}.', '{0} (meilleur)',
      'Créer un parcours sur la carte (ouvre le site du jeu)', 'La carte ne s’ouvre pas dans Claude : les parcours se créent sur le site du jeu et se courent ici avec un fichier de parcours ou les parcours du jeu.', 'Les serveurs de la carte sont lents en ce moment. Réessayez dans un instant, ou rapprochez les points.'],
    de: ['Runde', 'Letzte', 'Beste', 'Gesamt', 'Rekord', 'Im Ziel', 'Führend', 'Abstand', 'Persönliche Bestzeit', 'Schnellste Runde', 'Runde {0}', 'Beste Runde {0}', 'Runden: {0}.', '{0} (beste)',
      'Eine Strecke auf der Karte bauen (öffnet die Website des Spiels)', 'In Claude lässt sich die Karte nicht öffnen: Strecken entstehen auf der Website des Spiels und werden hier mit einer Streckendatei oder den Strecken des Spiels gefahren.', 'Die Kartenserver sind gerade langsam. Versuche es gleich noch einmal oder setze die Punkte näher zusammen.'] };
  if (typeof I18N_MORE !== 'undefined' && I18N_MORE && I18N_MORE.k) { const n0 = I18N_MORE.k.length; I18N_MORE.k.push(...K);
    for (const l in I18N_MORE) { if (l === 'k' || !Array.isArray(I18N_MORE[l])) continue; const A = I18N_MORE[l]; while (A.length < n0) A.push(''); A.push(...(L[l] && L[l].length === K.length ? L[l] : K)); } } }
