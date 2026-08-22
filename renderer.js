const { ipcRenderer } = require('electron')
const path = require('path')

// ── Licensing state ───────────────────────────────────────
let isPro = false

// ── Translations / i18n ──────────────────────────────────
let currentAppLang = localStorage.getItem('fv_app_lang') || 'en';

const appTranslations = {
  pt: {
    "empty-title": "Sem vídeo carregado",
    "empty-desc": "Abre um ficheiro de vídeo para começar",
    "empty-btn": "Abrir Vídeo",
    "empty-formats": "MP4 • MKV • AVI • MOV • WMV • WebM e mais",
    "dp-tools": "Ferramentas",
    "dp-color": "Cor",
    "dp-width": "Espessura",
    "dp-duration": "Duração",
    "dp-undo": "↺ Desfazer",
    "dp-redo": "↻ Refazer",
    "dp-clear": "Limpar",
    "filename-empty": "—",
    "modal-title": "Licenciamento FieldVision",
    "modal-status": "Estado: ",
    "status-free": "Versão de Teste (Free)",
    "status-pro": "Pro Ativa",
    "modal-inst-free": "Introduz a tua chave Pro enviada pelo Lemon Squeezy para remover marcas de água e desbloquear anotações e IA ilimitadas.",
    "modal-inst-pro": "A tua licença Pro está ativa e validada neste computador. Obrigado pelo teu suporte!",
    "btn-activate": "Ativar FieldVision Pro",
    "btn-deactivate": "Desativar Licença",
    "modal-buy-text": "Ainda não tens chave? ",
    "modal-buy-link": "Comprar Licença Pro (€29/ano)",
    "toast-tracker-select": "Clica e arrasta no canvas para desenhar uma caixa à volta do jogador a rastrear.",
    "toast-tracker-active": "IA a rastrear o jogador... Pressiona qualquer tecla para parar.",
    
    // Titles (tooltips)
    "title-activate": "Ativar FieldVision Pro",
    "title-minimize": "Minimizar",
    "title-maximize": "Maximizar",
    "title-close": "Fechar",
    "title-pencil": "Lápis",
    "title-line": "Linha",
    "title-dashed": "Tracejado",
    "title-arrow": "Seta",
    "title-circle": "Círculo",
    "title-rect": "Retângulo",
    "title-track": "Rastrear Jogador (IA/OpenCV)",
    "title-open": "Abrir ficheiro",
    "title-play": "Play / Pause",
    "title-stop": "Parar",
    "title-mute": "Mudo / Som",
    "title-speed": "Velocidade",
    "title-clipin": "Marcar início do corte (I)",
    "title-clipout": "Marcar fim do corte (O)",
    "title-cut": "Cortar e guardar (X)",
    "title-edit": "Modo de desenho (E)",
    "title-fs": "Ecrã inteiro",
    
    // License states
    "license-badge-free": "Ativar Pro ⚡",
    "license-badge-pro": "PRO ATIVO ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
    
    // Toasts
    "toast-license-input": "⚠️ Introduz uma chave de licença!",
    "toast-license-checking": "⏳ A verificar chave...",
    "toast-license-activated": "✅ FieldVision Pro ativado com sucesso!",
    "toast-license-deactivating": "⏳ A remover licença...",
    "toast-license-deactivated": "✅ Licença desativada.",
    "toast-license-error": "❌ Erro: {0}",
    "toast-load-success": "📂 {0} anotação(ões) carregada(s)",
    "toast-limit-export": "⚠️ Limite Free: Atingiste o limite de 3 exportações mensais. Compra o Pro para exportações ilimitadas!",
    "toast-select-duration": "❌ Seleciona pelo menos 0.5 segundos",
    "toast-export-success": "✅ {0}{1}",
    "toast-export-error": "❌ Erro: {0}",
    "toast-limit-track": "⚠️ Limite Trial: Já utilizou o rastreio automático 5 vezes. Adquira a licença Pro para uso ilimitado!",
    "toast-track-free-limit": "⚠️ Rastreio Free limitado a 2 segundos de clipe...",
    "toast-track-analyzing": "🎯 A analisar e fixar movimento no jogador...",
    "toast-track-success-trial": "🎉 Rastreio concluído (Teste {0} de 5). Adquire o Pro!",
    "toast-track-success-pro": "✅ Rastreio concluído: {0} pontos gravados!",
    "toast-track-error": "❌ Falha no rastreio: {0}",
    "toast-limit-annotations": "⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido. Adquire o Pro para anotações ilimitadas!",
    "toast-limit-annotations-short": "⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido.",
    "toast-link-players": "🔗 Linha curva elástica ligada aos 2 jogadores!",
    "toast-attach-player": "🚗 Anotação presa ao jogador! Vai de boleia!",
    "toast-open-folder": "Abrir pasta"
  },
  en: {
    "empty-title": "No video loaded",
    "empty-desc": "Open a video file to get started",
    "empty-btn": "Open Video",
    "empty-formats": "MP4 • MKV • AVI • MOV • WMV • WebM and more",
    "dp-tools": "Tools",
    "dp-color": "Color",
    "dp-width": "Width",
    "dp-duration": "Duration",
    "dp-undo": "↺ Undo",
    "dp-redo": "↻ Redo",
    "dp-clear": "Clear",
    "filename-empty": "—",
    "modal-title": "FieldVision Licensing",
    "modal-status": "Status: ",
    "status-free": "Free Trial Version",
    "status-pro": "Pro Active",
    "modal-inst-free": "Enter your Pro key sent by Lemon Squeezy to remove watermarks and unlock unlimited annotations and AI tracking.",
    "modal-inst-pro": "Your Pro licence is active and validated on this computer. Thank you for your support!",
    "btn-activate": "Activate FieldVision Pro",
    "btn-deactivate": "Deactivate Licence",
    "modal-buy-text": "Don't have a key yet? ",
    "modal-buy-link": "Buy Pro Licence (€29/year)",
    "toast-tracker-select": "Click and drag on the canvas to draw a box around the player to track.",
    "toast-tracker-active": "AI tracking player... Press any key to stop.",
    
    // Titles
    "title-activate": "Activate FieldVision Pro",
    "title-minimize": "Minimize",
    "title-maximize": "Maximize",
    "title-close": "Close",
    "title-pencil": "Pencil",
    "title-line": "Line",
    "title-dashed": "Dashed Line",
    "title-arrow": "Arrow",
    "title-circle": "Circle",
    "title-rect": "Rectangle",
    "title-track": "Track Player (AI/OpenCV)",
    "title-open": "Open file",
    "title-play": "Play / Pause",
    "title-stop": "Stop",
    "title-mute": "Mute / Unmute",
    "title-speed": "Speed",
    "title-clipin": "Mark clip start (I)",
    "title-clipout": "Mark clip end (O)",
    "title-cut": "Cut and save (X)",
    "title-edit": "Draw mode (E)",
    "title-fs": "Fullscreen",
    
    // License states
    "license-badge-free": "Activate Pro ⚡",
    "license-badge-pro": "PRO ACTIVE ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
    
    // Toasts
    "toast-license-input": "⚠️ Please enter a licence key!",
    "toast-license-checking": "⏳ Checking key...",
    "toast-license-activated": "✅ FieldVision Pro activated successfully!",
    "toast-license-deactivating": "⏳ Removing licence...",
    "toast-license-deactivated": "✅ Licence deactivated.",
    "toast-license-error": "❌ Error: {0}",
    "toast-load-success": "📂 {0} annotation(s) loaded",
    "toast-limit-export": "⚠️ Free Limit: You have reached the monthly limit of 3 exports. Buy Pro for unlimited exports!",
    "toast-select-duration": "❌ Select at least 0.5 seconds",
    "toast-export-success": "✅ {0}{1}",
    "toast-export-error": "❌ Error: {0}",
    "toast-limit-track": "⚠️ Trial Limit: You have already used AI tracking 5 times. Buy Pro for unlimited usage!",
    "toast-track-free-limit": "⚠️ Free tracking limited to 2 seconds of clip...",
    "toast-track-analyzing": "🎯 Analyzing and locking motion on player...",
    "toast-track-success-trial": "🎉 Tracking complete (Trial {0} of 5). Buy Pro!",
    "toast-track-success-pro": "✅ Tracking complete: {0} points recorded!",
    "toast-track-error": "❌ Tracking failed: {0}",
    "toast-limit-annotations": "⚠️ Free Limit: Maximum of 3 annotations per video reached. Buy Pro for unlimited annotations!",
    "toast-limit-annotations-short": "⚠️ Free Limit: Maximum of 3 annotations per video reached.",
    "toast-link-players": "🔗 Elastic link line attached to both players!",
    "toast-attach-player": "🚗 Annotation attached to player! Hitching a ride!",
    "toast-open-folder": "Open folder"
  },
  es: {
    "empty-title": "Sin video cargado",
    "empty-desc": "Abre un archivo de video para comenzar",
    "empty-btn": "Abrir Video",
    "empty-formats": "MP4 • MKV • AVI • MOV • WMV • WebM y más",
    "dp-tools": "Herramientas",
    "dp-color": "Color",
    "dp-width": "Grosor",
    "dp-duration": "Duración",
    "dp-undo": "↺ Deshacer",
    "dp-redo": "↻ Rehacer",
    "dp-clear": "Limpiar",
    "filename-empty": "—",
    "modal-title": "Licencia de FieldVision",
    "modal-status": "Estado: ",
    "status-free": "Versión de Prueba (Free)",
    "status-pro": "Pro Activa",
    "modal-inst-free": "Introduce tu clave Pro enviada por Lemon Squeezy para eliminar marcas de agua y desbloquear anotaciones e IA ilimitadas.",
    "modal-inst-pro": "Tu licencia Pro está activa y validada en este ordenador. ¡Gracias por tu apoyo!",
    "btn-activate": "Activar FieldVision Pro",
    "btn-deactivate": "Desactivar Licencia",
    "modal-buy-text": "¿Aún no tienes clave? ",
    "modal-buy-link": "Comprar Licencia Pro (€29/año)",
    "toast-tracker-select": "Haz clic y arrastra en el lienzo para dibujar un cuadro alrededor del jugador a rastrear.",
    "toast-tracker-active": "IA rastreando al jugador... Presiona cualquier tecla para detener.",
    
    // Titles
    "title-activate": "Activar FieldVision Pro",
    "title-minimize": "Minimizar",
    "title-maximize": "Maximizar",
    "title-close": "Cerrar",
    "title-pencil": "Lápiz",
    "title-line": "Línea",
    "title-dashed": "Línea discontinua",
    "title-arrow": "Flecha",
    "title-circle": "Círculo",
    "title-rect": "Rectángulo",
    "title-track": "Rastrear Jugador (IA/OpenCV)",
    "title-open": "Abrir archivo",
    "title-play": "Reproducir / Pausa",
    "title-stop": "Detener",
    "title-mute": "Silenciar / Sonido",
    "title-speed": "Velocidad",
    "title-clipin": "Marcar inicio del corte (I)",
    "title-clipout": "Marcar fin del corte (O)",
    "title-cut": "Cortar y guardar (X)",
    "title-edit": "Modo dibujo (E)",
    "title-fs": "Pantalla completa",
    
    // License states
    "license-badge-free": "Activar Pro ⚡",
    "license-badge-pro": "PRO ACTIVO ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
    
    // Toasts
    "toast-license-input": "⚠️ ¡Por favor, introduce una clave de licencia!",
    "toast-license-checking": "⏳ Verificando clave...",
    "toast-license-activated": "✅ ¡FieldVision Pro activado con éxito!",
    "toast-license-deactivating": "⏳ Eliminando licencia...",
    "toast-license-deactivated": "✅ Licencia desactivada.",
    "toast-license-error": "❌ Error: {0}",
    "toast-load-success": "📂 {0} anotación(es) cargada(s)",
    "toast-limit-export": "⚠️ Límite Free: Has alcanzado el límite mensual de 3 exportaciones. ¡Compra Pro para exportaciones ilimitadas!",
    "toast-select-duration": "❌ Selecciona al menos 0.5 segundos",
    "toast-export-success": "✅ {0}{1}",
    "toast-export-error": "❌ Error: {0}",
    "toast-limit-track": "⚠️ Límite Trial: Ya has usado el rastreo automático 5 veces. ¡Compra Pro para uso ilimitado!",
    "toast-track-free-limit": "⚠️ Rastreo Free limitado a 2 segundos de clip...",
    "toast-track-analyzing": "🎯 Analizando y fijando el movimiento en el jugador...",
    "toast-track-success-trial": "🎉 Rastreo completado (Prueba {0} de 5). ¡Compra Pro!",
    "toast-track-success-pro": "✅ Rastreo completado: ¡{0} puntos grabados!",
    "toast-track-error": "❌ Fallo en el rastreo: {0}",
    "toast-limit-annotations": "⚠️ Límite Free: Máximo de 3 anotaciones por video alcanzado. ¡Compra Pro para anotaciones ilimitadas!",
    "toast-limit-annotations-short": "⚠️ Límite Free: Máximo de 3 anotaciones por video alcanzado.",
    "toast-link-players": "🔗 ¡Línea de enlace elástico conectada a ambos jugadores!",
    "toast-attach-player": "🚗 ¡Anotación fijada al jugador! ¡Se va de paseo!",
    "toast-open-folder": "Abrir carpeta"
  },
  fr: {
    "empty-title": "Aucune vidéo chargée",
    "empty-desc": "Ouvrez un fichier vidéo pour commencer",
    "empty-btn": "Ouvrir Vidéo",
    "empty-formats": "MP4 • MKV • AVI • MOV • WMV • WebM et plus",
    "dp-tools": "Outils",
    "dp-color": "Couleur",
    "dp-width": "Épaisseur",
    "dp-duration": "Durée",
    "dp-undo": "↺ Annuler",
    "dp-redo": "↻ Rétablir",
    "dp-clear": "Effacer",
    "filename-empty": "—",
    "modal-title": "Licence FieldVision",
    "modal-status": "Statut: ",
    "status-free": "Version d'essai (Free)",
    "status-pro": "Pro Active",
    "modal-inst-free": "Entrez votre clé Pro envoyée par Lemon Squeezy pour supprimer les filigranes et débloquer les annotations et le suivi IA illimités.",
    "modal-inst-pro": "Votre licence Pro est active et validée sur cet ordinateur. Merci pour votre soutien !",
    "btn-activate": "Activer FieldVision Pro",
    "btn-deactivate": "Désactiver la licence",
    "modal-buy-text": "Vous n'avez pas encore de clé ? ",
    "modal-buy-link": "Acheter une licence Pro (€29/an)",
    "toast-tracker-select": "Cliquez et glissez sur le canevas pour dessiner une boîte autour du joueur à suivre.",
    "toast-tracker-active": "IA en train de suivre le joueur... Appuyez sur n'importe quelle touche pour arrêter.",
    
    // Titles
    "title-activate": "Activer FieldVision Pro",
    "title-minimize": "Réduire",
    "title-maximize": "Agrandir",
    "title-close": "Fermer",
    "title-pencil": "Crayon",
    "title-line": "Ligne",
    "title-dashed": "Ligne pointillée",
    "title-arrow": "Flèche",
    "title-circle": "Cercle",
    "title-rect": "Rectangle",
    "title-track": "Suivre le joueur (IA/OpenCV)",
    "title-open": "Ouvrir un fichier",
    "title-play": "Lecture / Pause",
    "title-stop": "Arrêter",
    "title-mute": "Muet / Activer le son",
    "title-speed": "Vitesse",
    "title-clipin": "Marcar le début du clip (I)",
    "title-clipout": "Marcar la fin du clip (O)",
    "title-cut": "Couper et sauvegarder (X)",
    "title-edit": "Mode dessin (E)",
    "title-fs": "Plein écran",
    
    // License states
    "license-badge-free": "Activer Pro ⚡",
    "license-badge-pro": "PRO ACTIF ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
    
    // Toasts
    "toast-license-input": "⚠️ Veuillez saisir une clé de licence !",
    "toast-license-checking": "⏳ Vérification de la clé...",
    "toast-license-activated": "✅ FieldVision Pro activé avec succès !",
    "toast-license-deactivating": "⏳ Désactivation de la licence...",
    "toast-license-deactivated": "✅ Licence désactivée.",
    "toast-license-error": "❌ Échec : {0}",
    "toast-load-success": "📂 {0} annotation(s) chargée(s)",
    "toast-limit-export": "⚠️ Limite Free : Vous avez atteint la limite mensuelle de 3 exportations. Achetez Pro pour des exportations illimitées !",
    "toast-select-duration": "❌ Sélectionnez au moins 0.5 seconde",
    "toast-export-success": "✅ {0}{1}",
    "toast-export-error": "❌ Échec : {0}",
    "toast-limit-track": "⚠️ Limite d'essai : Vous avez déjà utilisé le suivi automatique 5 fois. Achetez Pro pour un usage illimité !",
    "toast-track-free-limit": "⚠️ Suivi Free limité à 2 secondes de clip...",
    "toast-track-analyzing": "🎯 Analyse et verrouillage du mouvement sur le joueur...",
    "toast-track-success-trial": "🎉 Suivi terminé (Essai {0} sur 5). Achetez Pro !",
    "toast-track-success-pro": "✅ Suivi terminé : {0} points enregistrés !",
    "toast-track-error": "❌ Échec du suivi : {0}",
    "toast-limit-annotations": "⚠️ Limite Free : Maximum de 3 annotations par vidéo atteint. Achetez Pro pour des annotations illimitées !",
    "toast-limit-annotations-short": "⚠️ Limite Free : Maximum de 3 annotations par vidéo atteint.",
    "toast-link-players": "🔗 Ligne de liaison élastique connectée aux deux joueurs !",
    "toast-attach-player": "🚗 Annotation attachée au joueur ! En route !",
    "toast-open-folder": "Ouvrir le dossier"
  },
  de: {
    "empty-title": "Keine Videodatei geladen",
    "empty-desc": "Öffnen Sie ein Video, um zu beginnen",
    "empty-btn": "Video Öffnen",
    "empty-formats": "MP4 • MKV • AVI • MOV • WMV • WebM und mehr",
    "dp-tools": "Werkzeuge",
    "dp-color": "Farbe",
    "dp-width": "Stärke",
    "dp-duration": "Dauer",
    "dp-undo": "↺ Rückgängig",
    "dp-redo": "↻ Wiederholen",
    "dp-clear": "Löschen",
    "filename-empty": "—",
    "modal-title": "FieldVision Lizenzierung",
    "modal-status": "Status: ",
    "status-free": "Testversion (Free)",
    "status-pro": "Pro Aktiv",
    "modal-inst-free": "Geben Sie Ihren Pro-Schlüssel ein, der von Lemon Squeezy gesendet wurde, um Wasserzeichen zu entfernen und unbegrenzte Anmerkungen sowie KI-Tracking freizuschalten.",
    "modal-inst-pro": "Ihre Pro-Lizenz ist auf diesem Computer aktiv und validiert. Vielen Dank für Ihre Unterstützung!",
    "btn-activate": "FieldVision Pro Aktivieren",
    "btn-deactivate": "Lizenz Deaktivieren",
    "modal-buy-text": "Haben Sie noch keinen Schlüssel? ",
    "modal-buy-link": "Pro-Lizenz kaufen (€29/Jahr)",
    "toast-tracker-select": "Klicken und ziehen Sie auf der Leinwand, um ein Kästchen um den zu verfolgenden Spieler zu zeichnen.",
    "toast-tracker-active": "KI verfolgt Spieler... Drücken Sie eine beliebige Taste, um zu stoppen.",
    
    // Titles
    "title-activate": "FieldVision Pro Aktivieren",
    "title-minimize": "Minimieren",
    "title-maximize": "Maximieren",
    "title-close": "Schließen",
    "title-pencil": "Stift",
    "title-line": "Linie",
    "title-dashed": "Gestrichelte Linie",
    "title-arrow": "Pfeil",
    "title-circle": "Kreis",
    "title-rect": "Rechteck",
    "title-track": "Spieler verfolgen (KI/OpenCV)",
    "title-open": "Datei öffnen",
    "title-play": "Wiedergabe / Pause",
    "title-stop": "Stoppen",
    "title-mute": "Stumm / Ton",
    "title-speed": "Geschwindigkeit",
    "title-clipin": "Clip-Anfang markieren (I)",
    "title-clipout": "Clip-Ende markieren (O)",
    "title-cut": "Schneiden und speichern (X)",
    "title-edit": "Zeichenmodus (E)",
    "title-fs": "Vollbild",
    
    // License states
    "license-badge-free": "Pro Aktivieren ⚡",
    "license-badge-pro": "PRO AKTIV ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
    
    // Toasts
    "toast-license-input": "⚠️ Bitte geben Sie einen Lizenzschlüssel ein!",
    "toast-license-checking": "⏳ Schlüssel wird überprüft...",
    "toast-license-activated": "✅ FieldVision Pro erfolgreich aktiviert!",
    "toast-license-deactivating": "⏳ Lizenz wird deaktiviert...",
    "toast-license-deactivated": "✅ Lizenz deaktiviert.",
    "toast-license-error": "❌ Fehler: {0}",
    "toast-load-success": "📂 {0} Anmerkung(en) geladen",
    "toast-limit-export": "⚠️ Free-Limit: Sie haben das monatliche Limit von 3 Exporten erreicht. Kaufen Sie Pro für unbegrenzte Exporte!",
    "toast-select-duration": "❌ Wählen Sie mindestens 0.5 Sekunden aus",
    "toast-export-success": "✅ {0}{1}",
    "toast-export-error": "❌ Fehler: {0}",
    "toast-limit-track": "⚠️ Test-Limit: Sie haben das automatische Tracking bereits 5 Mal verwendet. Kaufen Sie Pro für unbegrenzte Nutzung!",
    "toast-track-free-limit": "⚠️ Free-Tracking auf 2 Sekunden Clip begrenzt...",
    "toast-track-analyzing": "🎯 Spielerbewegung wird analysiert und fixiert...",
    "toast-track-success-trial": "🎉 Tracking abgeschlossen (Test {0} von 5). Kaufen Sie Pro!",
    "toast-track-success-pro": "✅ Tracking abgeschlossen: {0} Punkte aufgezeichnet!",
    "toast-track-error": "❌ Tracking fehlgeschlagen: {0}",
    "toast-limit-annotations": "⚠️ Free-Limit: Maximum von 3 Anmerkungen pro Video erreicht. Kaufen Sie Pro für unbegrenzte Anmerkungen!",
    "toast-limit-annotations-short": "⚠️ Free-Limit: Maximum von 3 Anmerkungen pro Video erreicht.",
    "toast-link-players": "🔗 Elastische Verbindungslinie zwischen beiden Spielern aktiv!",
    "toast-attach-player": "🚗 Anmerkung an Spieler angeheftet!",
    "toast-open-folder": "Ordner öffnen"
  }
};

function t(key, defaultValue = '', ...args) {
  const dict = appTranslations[currentAppLang];
  if (!dict || !dict[key]) {
    return formatString(defaultValue, ...args);
  }
  return formatString(dict[key], ...args);
}

function formatString(str, ...args) {
  return str.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}

function setAppLanguage(lang) {
  if (!appTranslations[lang]) lang = 'en';
  currentAppLang = lang;
  localStorage.setItem('fv_app_lang', lang);
  
  // Set dropdown value
  const select = document.getElementById('appLangSelect');
  if (select) select.value = lang;

  // Translate text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (appTranslations[lang][key]) {
      el.textContent = appTranslations[lang][key];
    }
  });

  // Translate titles (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (appTranslations[lang][key]) {
      el.setAttribute('title', appTranslations[lang][key]);
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (appTranslations[lang][key]) {
      el.setAttribute('placeholder', appTranslations[lang][key]);
    }
  });

  // Update dynamic elements
  if (licenseBadge && statusVal) {
    licenseBadge.textContent = appTranslations[lang][isPro ? 'license-badge-pro' : 'license-badge-free'];
    statusVal.textContent = appTranslations[lang][isPro ? 'status-pro' : 'status-free'];
  }
}

// Bind Lang Selector Event
const appLangSelect = document.getElementById('appLangSelect');
if (appLangSelect) {
  appLangSelect.addEventListener('change', (e) => {
    setAppLanguage(e.target.value);
  });
}

let trackingTrialCount = parseInt(localStorage.getItem('trackingTrialCount') || '0')

// ── Elements ──────────────────────────────────────────────
const video         = document.getElementById('video')
const emptyState    = document.getElementById('emptyState')
const playerWrap    = document.getElementById('playerWrap')
const videoOverlay  = document.getElementById('videoOverlay')
const playFlash     = document.getElementById('playFlash')
const btnPlayPause  = document.getElementById('btnPlayPause')
const btnStop       = document.getElementById('btnStop')
const btnOpen       = document.getElementById('btnOpen')
const btnOpenEmpty  = document.getElementById('btnOpenEmpty')
const btnMute       = document.getElementById('btnMute')
const btnFullscreen = document.getElementById('btnFullscreen')
const btnSpeed      = document.getElementById('btnSpeed')
const btnEditMode   = document.getElementById('btnEditMode')
const btnClipIn     = document.getElementById('btnClipIn')
const btnClipOut    = document.getElementById('btnClipOut')
const btnCut        = document.getElementById('btnCut')
const volumeSlider  = document.getElementById('volumeSlider')
const progressBar   = document.getElementById('progressBar')
const progressFill  = document.getElementById('progressFill')
const progressThumb = document.getElementById('progressThumb')
const timeCurrent   = document.getElementById('timeCurrent')
const timeTotal     = document.getElementById('timeTotal')
const filenameLabel = document.getElementById('filenameLabel')
const clipZone      = document.getElementById('clipZone')
const clipInMarker  = document.getElementById('clipInMarker')
const clipOutMarker = document.getElementById('clipOutMarker')
const toast         = document.getElementById('toast')

// License UI elements
const licenseBadge        = document.getElementById('licenseBadge')
const licenseModal        = document.getElementById('licenseModal')
const btnCloseLicense     = document.getElementById('btnCloseLicense')
const btnActivateLicense  = document.getElementById('btnActivateLicense')
const btnDeactivateLicense= document.getElementById('btnDeactivateLicense')
const licenseInput        = document.getElementById('licenseInput')
const statusVal           = document.getElementById('statusVal')
const licenseInputGroup   = document.getElementById('licenseInputGroup')
const licenseActiveGroup  = document.getElementById('licenseActiveGroup')
const activeKeyDisplay    = document.getElementById('activeKeyDisplay')
const buyLicenseLink      = document.getElementById('buyLicenseLink')

// ── Licensing Logic ───────────────────────────────────────
function updateLicenseUI(status, key) {
  isPro = (status === 'pro');
  
  if (isPro) {
    licenseBadge.textContent = appTranslations[currentAppLang]['license-badge-pro'];
    licenseBadge.className = 'license-badge pro';
    statusVal.textContent = appTranslations[currentAppLang]['status-pro'];
    statusVal.className = 'status-val pro';
    
    licenseInputGroup.style.display = 'none';
    licenseActiveGroup.style.display = 'block';
    
    const maskedKey = key ? `XXXX-XXXX-XXXX-${key.slice(-4)}` : 'Ativa';
    activeKeyDisplay.textContent = maskedKey;
  } else {
    licenseBadge.textContent = appTranslations[currentAppLang]['license-badge-free'];
    licenseBadge.className = 'license-badge free';
    statusVal.textContent = appTranslations[currentAppLang]['status-free'];
    statusVal.className = 'status-val free';
    
    licenseInputGroup.style.display = 'block';
    licenseActiveGroup.style.display = 'none';
    licenseInput.value = '';
  }
}

async function checkLicense() {
  const res = await ipcRenderer.invoke('check-license');
  updateLicenseUI(res.status, res.licenseKey);
}

// Event Listeners for License modal
licenseBadge.addEventListener('click', () => {
  checkLicense();
setAppLanguage(currentAppLang);
  licenseModal.classList.add('open');
});

btnCloseLicense.addEventListener('click', () => {
  licenseModal.classList.remove('open');
});

buyLicenseLink.addEventListener('click', (e) => {
  e.preventDefault();
  const { shell } = require('electron');
  shell.openExternal('https://joaopakina14.github.io/FieldVision/');
});

btnActivateLicense.addEventListener('click', async () => {
  const key = licenseInput.value.trim();
  if (!key) {
    showToast(t('toast-license-input', '⚠️ Introduz uma chave de licença!'), 3000);
    return;
  }
  
  showToast('🔑 A verificar chave...', 0);
  btnActivateLicense.disabled = true;
  
  const res = await ipcRenderer.invoke('activate-license', key);
  btnActivateLicense.disabled = false;
  
  if (res.success) {
    showToast(t('toast-license-activated', '✅ FieldVision Pro ativado com sucesso!'), 4000);
    checkLicense();
setAppLanguage(currentAppLang);
    licenseModal.classList.remove('open');
  } else {
    showToast(t('toast-license-error', '❌ Erro: {0}', res.error), 4000);
  }
});

btnDeactivateLicense.addEventListener('click', async () => {
  if (confirm('Tem a certeza que deseja desativar a licença neste computador?')) {
    showToast('🔒 A remover licença...', 0);
    const res = await ipcRenderer.invoke('deactivate-license');
    if (res.success) {
      showToast('ℹ️ Licença desativada.', 3000);
      checkLicense();
setAppLanguage(currentAppLang);
      licenseModal.classList.remove('open');
    } else {
      showToast(t('toast-license-error', '❌ Erro: {0}', res.error), 3000);
    }
  }
});


// Titlebar
document.getElementById('btn-minimize').addEventListener('click', () => ipcRenderer.send('window-minimize'))
document.getElementById('btn-maximize').addEventListener('click', () => ipcRenderer.send('window-maximize'))
document.getElementById('btn-close').addEventListener('click',    () => ipcRenderer.send('window-close'))

// ── Player state ──────────────────────────────────────────
const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
let speedIdx  = 3
let scrubbing = false

// ── Clip state ────────────────────────────────────────────
const clip = { inputPath: null, inTime: null, outTime: null }

// ── Open file ─────────────────────────────────────────────
async function openFile() {
  const filePath = await ipcRenderer.invoke('open-file-dialog')
  if (!filePath) return
  loadVideo(filePath)
}

function loadVideo(filePath) {
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/')
  video.src = fileUrl
  video.load()
  video.play()
  filenameLabel.textContent = path.basename(filePath)
  emptyState.style.display  = 'none'
  playerWrap.style.display  = 'flex'

  clip.inputPath = filePath
  clip.inTime    = null
  clip.outTime   = null
  ds.annotations = []
  ds.current     = null
  resetClipUI()
  redraw()
  updateTimelineMarkers()
  updateAnnotationBadge()
  setTimeout(resizeCanvas, 100)
  // Auto-load annotations if they exist for this video
  setTimeout(() => loadAnnotations(filePath), 400)
}

btnOpen.addEventListener('click', openFile)
btnOpenEmpty.addEventListener('click', openFile)

// Drag & Drop
document.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation() })
document.addEventListener('drop', e => {
  e.preventDefault()
  const file = e.dataTransfer.files[0]
  if (file) loadVideo(file.path)
})

// ── Play / Pause ──────────────────────────────────────────
videoOverlay.addEventListener('click', togglePlay)
btnPlayPause.addEventListener('click', togglePlay)

function togglePlay() {
  if (video.paused) video.play(); else video.pause()
  flashIcon()
}
function flashIcon() {
  playFlash.textContent = video.paused ? '\u23F8' : '\u25B6'
  playFlash.classList.add('show')
  clearTimeout(playFlash._timer)
  playFlash._timer = setTimeout(() => playFlash.classList.remove('show'), 600)
}
video.addEventListener('play',  () => { btnPlayPause.textContent = '\u23F8'; startRenderLoop() })
video.addEventListener('pause', () => { btnPlayPause.textContent = '\u25B6'; stopRenderLoop() })
video.addEventListener('ended', stopRenderLoop)

// ── RAF render loop ───────────────────────────────────────
let rafId = null
function startRenderLoop() {
  if (rafId) return
  function loop() {
    if (!video.paused && video.duration) {
      updateProgress((video.currentTime / video.duration) * 100)
      timeCurrent.textContent = formatTime(video.currentTime)
    }
    redraw()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}
function stopRenderLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  redraw()
}

// ── Stop ──────────────────────────────────────────────────
btnStop.addEventListener('click', () => {
  video.pause(); video.currentTime = 0
  updateProgress(0); timeCurrent.textContent = '0:00'; redraw()
})

// ── Progress bar ──────────────────────────────────────────
video.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(video.duration)
  updateTimelineMarkers(); resizeCanvas()
})
video.addEventListener('timeupdate', () => {
  if (video.paused && video.duration) {
    updateProgress((video.currentTime / video.duration) * 100)
    timeCurrent.textContent = formatTime(video.currentTime)
    redraw()
  }
})
function updateProgress(pct) {
  pct = Math.max(0, Math.min(100, pct))
  progressFill.style.width = pct + '%'
  progressThumb.style.left = pct + '%'
}
progressBar.addEventListener('mousedown', e => {
  scrubbing = true; seek(e)
  document.addEventListener('mousemove', seek)
  document.addEventListener('mouseup', () => { scrubbing = false; document.removeEventListener('mousemove', seek) }, { once: true })
})
function seek(e) {
  const rect = progressBar.getBoundingClientRect()
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  updateProgress(pct * 100)
  if (video.duration) { video.currentTime = pct * video.duration; timeCurrent.textContent = formatTime(video.currentTime); redraw() }
}

// ── Volume ────────────────────────────────────────────────
volumeSlider.addEventListener('input', () => { video.volume = volumeSlider.value; video.muted = video.volume === 0; updateMuteIcon() })
btnMute.addEventListener('click', () => { video.muted = !video.muted; if (!video.muted) volumeSlider.value = video.volume || 0.5; updateMuteIcon() })
function updateMuteIcon() {
  if (video.muted || video.volume === 0) btnMute.textContent = '\uD83D\uDD07'
  else if (video.volume < 0.5)           btnMute.textContent = '\uD83D\uDD09'
  else                                   btnMute.textContent = '\uD83D\uDD0A'
}

// ── Speed ─────────────────────────────────────────────────
btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % speeds.length
  video.playbackRate = speeds[speedIdx]
  btnSpeed.textContent = speeds[speedIdx] === 1 ? '1x' : speeds[speedIdx] + 'x'
})

// ── Fullscreen ────────────────────────────────────────────
btnFullscreen.addEventListener('click', toggleFullscreen)
videoOverlay.addEventListener('dblclick', toggleFullscreen)
function toggleFullscreen() {
  if (!document.fullscreenElement) playerWrap.requestFullscreen(); else document.exitFullscreen()
}
document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 100))
let hideCtrlTimer
document.addEventListener('mousemove', () => {
  playerWrap.classList.add('show-ctrl'); clearTimeout(hideCtrlTimer)
  hideCtrlTimer = setTimeout(() => playerWrap.classList.remove('show-ctrl'), 2500)
})

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'KeyE' && !e.ctrlKey) { toggleEditMode(); return }
  if (e.code === 'KeyZ' && e.ctrlKey && !e.shiftKey) { undoDraw(); return }
  if ((e.code === 'KeyY' && e.ctrlKey) || (e.code === 'KeyZ' && e.ctrlKey && e.shiftKey)) { redoDraw(); return }
  if (e.code === 'KeyI' && !e.ctrlKey) { markIn(); return }
  if (e.code === 'KeyO' && !e.ctrlKey) { markOut(); return }
  if (e.code === 'KeyX' && !e.ctrlKey) { if (!btnCut.disabled) doCut(); return }
  if (!video.src) return
  switch (e.code) {
    case 'Space':      e.preventDefault(); togglePlay(); break
    case 'ArrowRight': e.preventDefault(); video.currentTime += 5; redraw(); break
    case 'ArrowLeft':  e.preventDefault(); video.currentTime -= 5; redraw(); break
    case 'ArrowUp':    e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'ArrowDown':  e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'KeyM':       btnMute.click(); break
    case 'KeyF':       toggleFullscreen(); break
  }
})

// ── Helpers ───────────────────────────────────────────────
function formatTime(s) {
  if (isNaN(s) || s == null) return '0:00'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec}` : `${m}:${sec}`
}
function formatTimeFile(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m.toString().padStart(2,'0')}m${sec.toString().padStart(2,'0')}s`
}

// ══════════════════════════════════════════════════════════
//   ANNOTATION PERSISTENCE
// ══════════════════════════════════════════════════════════

let saveAnnTimer = null

// Debounced auto-save (600ms after last change)
function scheduleAnnotationSave() {
  if (!clip.inputPath) return
  clearTimeout(saveAnnTimer)
  saveAnnTimer = setTimeout(saveAnnotations, 600)
}

async function saveAnnotations() {
  if (!clip.inputPath) return
  try {
    await ipcRenderer.invoke('save-annotations', {
      videoPath:   clip.inputPath,
      annotations: ds.annotations
    })
  } catch (e) {
    console.warn('Could not save annotations:', e)
  }
}

async function loadAnnotations(videoPath) {
  try {
    const result = await ipcRenderer.invoke('load-annotations', videoPath)
    if (result.success && result.annotations && result.annotations.length > 0) {
      ds.annotations = result.annotations
      redraw()
      updateTimelineMarkers()
      updateAnnotationBadge()
      showToast(t('toast-load-success', '📂 {0} anotação(ões) carregada(s)', result.annotations.length), 2500)
    }
  } catch (e) {
    console.warn('Could not load annotations:', e)
  }
}

// ══════════════════════════════════════════════════════════
//   CLIP / CUT MODULE
// ══════════════════════════════════════════════════════════

function markIn() {
  if (!video.src) return
  clip.inTime = video.currentTime
  btnClipIn.classList.add('set-in')
  btnClipIn.title = `Inicio: ${formatTime(clip.inTime)} (I)`
  updateClipUI()
}
function markOut() {
  if (!video.src) return
  clip.outTime = video.currentTime
  btnClipOut.classList.add('set-out')
  btnClipOut.title = `Fim: ${formatTime(clip.outTime)} (O)`
  updateClipUI()
}

btnClipIn.addEventListener('click',  markIn)
btnClipOut.addEventListener('click', markOut)

function updateClipUI() {
  if (!video.duration) return
  if (clip.inTime !== null) {
    clipInMarker.style.left    = (clip.inTime  / video.duration * 100) + '%'
    clipInMarker.style.display = 'block'
  }
  if (clip.outTime !== null) {
    clipOutMarker.style.left    = (clip.outTime / video.duration * 100) + '%'
    clipOutMarker.style.display = 'block'
  }
  if (clip.inTime !== null && clip.outTime !== null) {
    const t0 = Math.min(clip.inTime, clip.outTime)
    const t1 = Math.max(clip.inTime, clip.outTime)
    const p0 = t0 / video.duration * 100
    const p1 = t1 / video.duration * 100
    clipZone.style.left    = p0 + '%'
    clipZone.style.width   = (p1 - p0) + '%'
    clipZone.style.display = 'block'
    btnCut.disabled = false
    btnCut.classList.add('ready')
    btnCut.title = `Cortar ${formatTime(t0)} \u2192 ${formatTime(t1)} (${(t1-t0).toFixed(1)}s) \u2014 X`
  }
}

function resetClipUI() {
  clip.inTime = null; clip.outTime = null
  clipZone.style.display = clipInMarker.style.display = clipOutMarker.style.display = 'none'
  btnClipIn.classList.remove('set-in'); btnClipOut.classList.remove('set-out')
  btnClipIn.title  = 'Marcar inicio do corte (I)'
  btnClipOut.title = 'Marcar fim do corte (O)'
  btnCut.disabled  = true; btnCut.classList.remove('ready')
  btnCut.title     = 'Cortar e guardar (X)'
}

btnCut.addEventListener('click', doCut)

// Helper to get exact visible video rect inside the container (accounting for letterbox/pillarbox)
function getVideoVisualRect() {
  if (!video.videoWidth || !video.videoHeight) return null
  const rect = video.getBoundingClientRect()
  const videoAspect = video.videoWidth / video.videoHeight
  const containerAspect = rect.width / rect.height

  let displayWidth, displayHeight, offsetX, offsetY

  if (containerAspect > videoAspect) {
    // Pillarbox (black bars on left and right)
    displayHeight = rect.height
    displayWidth = rect.height * videoAspect
    offsetX = (rect.width - displayWidth) / 2
    offsetY = 0
  } else {
    // Letterbox (black bars on top and bottom)
    displayWidth = rect.width
    displayHeight = rect.width / videoAspect
    offsetX = 0
    offsetY = (rect.height - displayHeight) / 2
  }

  return {
    containerWidth: rect.width,
    containerHeight: rect.height,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    displayWidth,
    displayHeight,
    offsetX,
    offsetY
  }
}

async function doCut() {
  if (!clip.inputPath || clip.inTime === null || clip.outTime === null) return

  // Check monthly export limit for Free users
  if (!isPro) {
    let exportsLog = [];
    try {
      exportsLog = JSON.parse(localStorage.getItem('exportsLog') || '[]');
    } catch(e){}
    
    // Filter timestamps within last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    exportsLog = exportsLog.filter(ts => ts > thirtyDaysAgo);
    
    if (exportsLog.length >= 3) {
      showToast(t('toast-limit-export', '⚠️ Limite Free: Atingiste o limite de 3 exportações mensais. Compra o Pro para exportações ilimitadas!'), 5500);
      return;
    }
  }

  const startTime = Math.min(clip.inTime, clip.outTime)
  const endTime   = Math.max(clip.inTime, clip.outTime)
  const duration  = endTime - startTime

  if (duration < 0.5) { showToast(t('toast-select-duration', '❌ Seleciona pelo menos 0.5 segundos'), 3000); return }

  // Incrementar e guardar o contador persistente de cortes para este vídeo
  const videoKey = 'cut_count_' + clip.inputPath
  let cutCount   = parseInt(localStorage.getItem(videoKey) || '0')
  cutCount++
  localStorage.setItem(videoKey, cutCount.toString())

  // Build output path: cut[N]_[original_name].[ext]
  const dir      = path.dirname(clip.inputPath)
  const ext      = path.extname(clip.inputPath)
  const base     = path.basename(clip.inputPath, ext)
  const outputPath = path.join(dir, `cut${cutCount}_${base}${ext}`)

  // ★ Filter annotations overlapping with [startTime, endTime]
  const targetAnns = ds.annotations.filter(ann => {
    if (ann.duration === -1) return true
    const annEnd = ann.timestamp + ann.duration
    return ann.timestamp <= endTime && annEnd >= startTime
  })

  // ★ Generate frame-by-frame PNG sequence of all annotations
  const vRect = getVideoVisualRect()
  let overlaySequencePath = null
  let totalOverlaysCount = targetAnns.length

  // Force image sequence generation if we need to burn watermark even if no annotations exist!
  const needsProcessing = totalOverlaysCount > 0 || !isPro

  if (needsProcessing && vRect) {
    const os = require('os')
    const fs = require('fs')

    // Create temporary directory for PNG sequence
    const tempDir = path.join(os.tmpdir(), `football_editor_clip_${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    overlaySequencePath = path.join(tempDir, 'frame_%04d.png')

    const offscreen = document.createElement('canvas')
    offscreen.width = vRect.videoWidth
    offscreen.height = vRect.videoHeight
    const offCtx = offscreen.getContext('2d')

    const scaleX = vRect.videoWidth / vRect.displayWidth
    const scaleY = vRect.videoHeight / vRect.displayHeight

    const fps = 30
    const totalFrames = Math.ceil(duration * fps)

    for (let f = 0; f < totalFrames; f++) {
      const t = startTime + (f / fps)

      offCtx.clearRect(0, 0, offscreen.width, offscreen.height)

      offCtx.save()
      offCtx.scale(scaleX, scaleY)
      offCtx.translate(-vRect.offsetX, -vRect.offsetY)

      targetAnns.forEach(ann => {
        if (isVisible(ann, t)) {
          offCtx.globalAlpha = getOpacity(ann, t)
          renderAnnToCtx(offCtx, ann, t)
        }
      })

      offCtx.restore()

      // ★ Draw watermark for Free Version (drawn relative to actual output resolution)
      if (!isPro) {
        offCtx.save()
        offCtx.fillStyle = 'rgba(255, 255, 255, 0.45)'
        offCtx.font = 'bold 20px sans-serif'
        offCtx.shadowColor = 'rgba(0,0,0,0.6)'
        offCtx.shadowBlur = 4
        offCtx.fillText('Criado com FieldVision Free', 30, offscreen.height - 30)
        offCtx.restore()
      }

      const dataUrl = offscreen.toDataURL('image/png')
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
      const framePath = path.join(tempDir, `frame_${String(f).padStart(4, '0')}.png`)
      fs.writeFileSync(framePath, base64Data, 'base64')
    }
  }

  btnCut.disabled = true; btnCut.classList.remove('ready')
  const statusMsg = needsProcessing
    ? `\u2702\uFE0F A processar e gravar elementos no vídeo...`
    : '\u2702\uFE0F A cortar...'
  showToast(statusMsg, 0)

  const result = await ipcRenderer.invoke('cut-video', {
    inputPath: clip.inputPath, startTime, duration, outputPath, overlaySequencePath
  })

  if (result.success) {
    // Log export for Free users
    if (!isPro) {
      let exportsLog = [];
      try {
        exportsLog = JSON.parse(localStorage.getItem('exportsLog') || '[]');
      } catch(e){}
      exportsLog.push(Date.now());
      localStorage.setItem('exportsLog', JSON.stringify(exportsLog));
    }

    const filename = path.basename(result.outputPath)
    const annInfo  = totalOverlaysCount > 0 ? ` + ${totalOverlaysCount} elemento(s) gravado(s)!` : ''
    showToast(t('toast-export-success', '✅ {0}{1}', filename, annInfo), 6000, result.outputPath)
    resetClipUI()
  } else {
    showToast(t('toast-export-error', '❌ Erro: {0}', result.error), 5000)
    btnCut.disabled = false; btnCut.classList.add('ready')
  }
}

// ── Toast notification ────────────────────────────────────
let toastTimer = null
function showToast(message, duration = 3000, openPath = null) {
  clearTimeout(toastTimer); toast.innerHTML = ''
  const text = document.createElement('span'); text.textContent = message; toast.appendChild(text)
  if (openPath) {
    const btn = document.createElement('button'); btn.className = 'toast-open-btn'; btn.textContent = t('toast-open-folder', 'Abrir pasta')
    btn.addEventListener('click', () => ipcRenderer.invoke('show-in-folder', openPath))
    toast.appendChild(btn)
  }
  toast.classList.add('show')
  if (duration > 0) toastTimer = setTimeout(() => toast.classList.remove('show'), duration)
}

// ══════════════════════════════════════════════════════════
//   DRAWING MODULE
// ══════════════════════════════════════════════════════════

const canvas    = document.getElementById('drawCanvas')
const ctx       = canvas.getContext('2d')
const drawPanel = document.getElementById('drawPanel')

const ds = {
  enabled:     false,
  tool:        'pencil',
  color:       '#ffffff',
  width:       2,
  duration:    4,
  annotations: [],
  redoStack:   [],
  current:     null,
  drawing:     false
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1, rect = video.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const saved = [...ds.annotations]
  canvas.width  = rect.width  * dpr; canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px'
  ctx.scale(dpr, dpr); ds.annotations = saved; redraw()
}
window.addEventListener('resize', resizeCanvas)

function isVisible(ann, t) {
  if (ann.duration === -1 || !video.duration) return true
  return t >= ann.timestamp - 0.3 && t <= ann.timestamp + ann.duration
}
function getOpacity(ann, t) {
  if (ann.duration === -1 || !video.duration) return 1
  const start = ann.timestamp - 0.3, end = ann.timestamp + ann.duration
  const fd = Math.min(0.4, ann.duration * 0.15)
  if (t < ann.timestamp) return Math.max(0, Math.min(1, (t - start) / (ann.timestamp - start + 0.001)))
  if (t > end - fd)      return Math.max(0, (end - t) / fd)
  return 1
}

// Edit mode
function toggleEditMode() {
  ds.enabled = !ds.enabled
  drawPanel.classList.toggle('visible', ds.enabled)
  canvas.classList.toggle('edit-mode', ds.enabled)
  btnEditMode.classList.toggle('active', ds.enabled)
  if (ds.enabled) { if (!video.paused) video.pause(); resizeCanvas() }
}
btnEditMode.addEventListener('click', toggleEditMode)

// Selectors
document.querySelectorAll('.dp-tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.dp-tool[data-tool]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); ds.tool = btn.dataset.tool })
})
document.querySelectorAll('.dp-color').forEach(s => {
  s.addEventListener('click', () => { document.querySelectorAll('.dp-color').forEach(x => x.classList.remove('active')); s.classList.add('active'); ds.color = s.dataset.color })
})
document.querySelectorAll('.dp-width').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.dp-width').forEach(b => b.classList.remove('active')); btn.classList.add('active'); ds.width = parseInt(btn.dataset.width) })
})
document.querySelectorAll('.dp-dur').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.dp-dur').forEach(b => b.classList.remove('active')); btn.classList.add('active'); ds.duration = parseInt(btn.dataset.dur) })
})

// Undo & Redo
function undoDraw() {
  if (!ds.annotations.length) return
  const undone = ds.annotations.pop()
  ds.redoStack.push(undone)
  redraw(); updateTimelineMarkers(); updateAnnotationBadge()
  scheduleAnnotationSave()
}

function redoDraw() {
  if (!ds.redoStack.length) return
  const redone = ds.redoStack.pop()
  ds.annotations.push(redone)
  redraw(); updateTimelineMarkers(); updateAnnotationBadge()
  scheduleAnnotationSave()
}

document.getElementById('btnUndo').addEventListener('click', undoDraw)
document.getElementById('btnRedo').addEventListener('click', redoDraw)
document.getElementById('btnClearAll').addEventListener('click', () => {
  if (ds.annotations.length > 0) {
    ds.redoStack = [...ds.annotations]
    ds.annotations = []
    ds.current = null
    redraw(); updateTimelineMarkers(); updateAnnotationBadge()
    scheduleAnnotationSave()
  }
})

// Helper: get current center position of a track annotation at time t
function getTrackCenterAtTime(trackAnn, t) {
  if (!trackAnn.trajectory || trackAnn.trajectory.length === 0) return null
  const relTime = t - trackAnn.timestamp
  if (relTime < -0.3 || relTime > trackAnn.duration) return null

  let point = trackAnn.trajectory[0]
  for (let i = 0; i < trackAnn.trajectory.length; i++) {
    if (trackAnn.trajectory[i].time <= relTime) point = trackAnn.trajectory[i]
    else break
  }

  if (!point) return null

  // ★ Off-Screen Check: If player exited camera bounds (near edges), mark as invalid/hidden
  if (point.x <= 0.015 || point.x >= 0.985 || point.y <= 0.015 || point.y >= 0.985) {
    return null
  }

  const vRect = getVideoVisualRect()
  if (!vRect) return null

  return {
    x: (point.x * vRect.displayWidth) + vRect.offsetX,
    y: (point.y * vRect.displayHeight) + vRect.offsetY,
    pw: point.w * vRect.displayWidth
  }
}

// Visibility check with Auto-Hide on camera exit / tracker end
function isVisible(ann, t) {
  if (!video.duration) return true

  // ★ If element is attached to 2 trackers, hide immediately if EITHER tracker leaves screen or ends
  if (ann.attachedTrackStartId && ann.attachedTrackEndId) {
    const trackStart = ds.annotations.find(a => a.id === ann.attachedTrackStartId)
    const trackEnd   = ds.annotations.find(a => a.id === ann.attachedTrackEndId)
    if (!trackStart || !trackEnd) return false
    const posStart = getTrackCenterAtTime(trackStart, t)
    const posEnd   = getTrackCenterAtTime(trackEnd, t)
    if (!posStart || !posEnd) return false // Hide line if ANY player left the screen!
  }

  // ★ If element is attached to 1 tracker, hide immediately if tracker leaves screen or ends
  if (ann.attachedTrackId) {
    const parentTrack = ds.annotations.find(a => a.id === ann.attachedTrackId)
    if (!parentTrack) return false
    const posParent = getTrackCenterAtTime(parentTrack, t)
    if (!posParent) return false // Hide element if player left the screen!
  }

  if (ann.duration === -1) return true
  return t >= ann.timestamp - 0.3 && t <= ann.timestamp + ann.duration
}

// Helper: check if a point (x, y) touches a track spotlight at time t
function findTouchingTrack(px, py, t) {
  for (const ann of ds.annotations) {
    if (ann.tool === 'track' && ann.trajectory) {
      const pos = getTrackCenterAtTime(ann, t)
      if (pos) {
        const radius = Math.max(35, pos.pw * 1.2)
        const dist = Math.hypot(px - pos.x, py - pos.y)
        if (dist <= radius) {
          return { trackId: ann.id, originPos: pos }
        }
      }
    }
  }
  return null
}

// Mouse drawing
canvas.addEventListener('mousedown', e => {
  if (!ds.enabled) return; e.preventDefault(); ds.drawing = true
  const pos = getPos(e)
  if (ds.tool === 'pencil') ds.current = { tool: 'pencil', color: ds.color, width: ds.width, points: [pos] }
  else ds.current = { tool: ds.tool, color: ds.color, width: ds.width, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
})

canvas.addEventListener('mousemove', e => {
  if (!ds.drawing || !ds.enabled || !ds.current) return
  const pos = getPos(e)
  if (ds.tool === 'pencil') ds.current.points.push(pos)
  else { ds.current.x2 = pos.x; ds.current.y2 = pos.y }
  redraw()
})

canvas.addEventListener('mouseup', async e => {
  if (!ds.drawing || !ds.current) return; ds.drawing = false
  const ann = ds.current
  const isTiny = ann.tool !== 'pencil' && Math.abs(ann.x2-ann.x1) < 3 && Math.abs(ann.y2-ann.y1) < 3

  if (!isTiny) {
    ann.id = 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)

    if (ann.tool === 'track') {
      // Handle Player Tracker tool via OpenCV
      const vRect = getVideoVisualRect()
      if (vRect && clip.inputPath) {
        // Enforce 5-use limit on Free version
        if (!isPro && trackingTrialCount >= 5) {
          showToast(t('toast-limit-track', '⚠️ Limite Trial: Já utilizou o rastreio automático 5 vezes. Adquira a licença Pro para uso ilimitado!'), 5500);
          ds.current = null;
          redraw();
          return;
        }

        const x1 = Math.min(ann.x1, ann.x2)
        const y1 = Math.min(ann.y1, ann.y2)
        const w  = Math.abs(ann.x2 - ann.x1)
        const h  = Math.abs(ann.y2 - ann.y1)

        const normX = (x1 - vRect.offsetX) / vRect.displayWidth
        const normY = (y1 - vRect.offsetY) / vRect.displayHeight
        const normW = w / vRect.displayWidth
        const normH = h / vRect.displayHeight

        // If infinite (duration = -1), track continuously until player exits camera or video ends
        const remainingVidTime = (video.duration || 9999) - (video.currentTime || 0)
        let trackDuration = ds.duration === -1 ? Math.max(60.0, remainingVidTime) : ds.duration

        // Enforce 2-second limit on Free version
        if (!isPro) {
          trackDuration = Math.min(trackDuration, 2.0);
          showToast('🎯 Rastreio Free limitado a 2 segundos de clipe...', 0);
        } else {
          showToast(t('toast-track-analyzing', '🎯 A analisar e fixar movimento no jogador...'), 0);
        }

        const result = await ipcRenderer.invoke('track-player', {
          videoPath: clip.inputPath,
          startTime: video.currentTime || 0,
          duration: trackDuration,
          bbox: { x: normX, y: normY, w: normW, h: normH }
        })

        if (result && result.success && result.trajectory && result.trajectory.length > 0) {
          // Increment tracking counter if Free
          if (!isPro) {
            trackingTrialCount++;
            localStorage.setItem('trackingTrialCount', trackingTrialCount.toString());
          }

          ann.timestamp  = video.currentTime || 0
          const maxValidDur = result.trajectory[result.trajectory.length - 1].time
          ann.duration   = Math.min(trackDuration, maxValidDur > 0 ? maxValidDur : trackDuration)
          ann.trajectory = result.trajectory
          ds.annotations.push(ann)
          updateTimelineMarkers()
          updateAnnotationBadge()
          scheduleAnnotationSave()
          
          if (!isPro) {
            showToast(`✅ Rastreio concluído (Teste ${trackingTrialCount} de 5). Adquire o Pro!`, 5000);
          } else {
            showToast(t('toast-track-success-pro', '✅ Rastreio concluído: {0} pontos gravados!', result.totalPoints), 3500);
          }
        } else {
          showToast(`\u274C Falha no rastreio: ${result.error || 'Não foi possível seguir o jogador'}`, 4000)
        }
      }
    } else {
      // Enforce max 3 annotations limit on Free version
      if (!isPro && ds.annotations.length >= 3) {
        showToast(t('toast-limit-annotations', '⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido. Adquire o Pro para anotações ilimitadas!'), 5500);
        ds.current = null;
        redraw();
        return;
      }

      ann.timestamp = video.currentTime || 0; ann.duration = ds.duration

      // ★ Check Dual Attachment for ANY tool (Lines, Arrows, Circles, Rects & Freehand Pencil Curves)
      const pStart = ann.tool === 'pencil' ? ann.points[0] : { x: ann.x1, y: ann.y1 }
      const pEnd   = ann.tool === 'pencil' ? ann.points[ann.points.length - 1] : { x: ann.x2, y: ann.y2 }

      const attachStart = findTouchingTrack(pStart.x, pStart.y, ann.timestamp)
      const attachEnd   = (pEnd && (pEnd.x !== pStart.x || pEnd.y !== pStart.y)) ? findTouchingTrack(pEnd.x, pEnd.y, ann.timestamp) : null

      if (attachStart && attachEnd && attachStart.trackId !== attachEnd.trackId) {
        ann.attachedTrackStartId = attachStart.trackId
        ann.attachedTrackEndId   = attachEnd.trackId
        ann.attachStartOriginPos = attachStart.originPos
        ann.attachEndOriginPos   = attachEnd.originPos
        ann.startOffset = { dx: pStart.x - attachStart.originPos.x, dy: pStart.y - attachStart.originPos.y }
        ann.endOffset   = { dx: pEnd.x - attachEnd.originPos.x,     dy: pEnd.y - attachEnd.originPos.y }

        // ★ Sync duration & timestamp with parent trackers
        const t1 = ds.annotations.find(a => a.id === attachStart.trackId)
        const t2 = ds.annotations.find(a => a.id === attachEnd.trackId)
        if (t1 && t2) {
          ann.timestamp = Math.min(t1.timestamp, t2.timestamp)
          ann.duration  = Math.max(t1.duration, t2.duration)
        }

        showToast(t('toast-link-players', '🔗 Linha curva elástica ligada aos 2 jogadores!'), 2800) 
      } else if (attachStart) {
        ann.attachedTrackId = attachStart.trackId
        ann.attachOriginPos = attachStart.originPos
        const t1 = ds.annotations.find(a => a.id === attachStart.trackId)
        if (t1) { ann.timestamp = t1.timestamp; ann.duration = t1.duration }
        showToast(t('toast-attach-player', '🚗 Anotação presa ao jogador! Vai de boleia!'), 2500)
      } else if (attachEnd) {
        ann.attachedTrackId = attachEnd.trackId
        ann.attachOriginPos = attachEnd.originPos
        const t2 = ds.annotations.find(a => a.id === attachEnd.trackId)
        if (t2) { ann.timestamp = t2.timestamp; ann.duration = t2.duration }
        showToast(t('toast-attach-player', '🚗 Anotação presa ao jogador! Vai de boleia!'), 2500)
      }

      ds.annotations.push(ann); updateTimelineMarkers(); updateAnnotationBadge()
      scheduleAnnotationSave()
    }
  }
  ds.current = null; redraw()
})
canvas.addEventListener('mouseleave', () => {
  if (ds.drawing && ds.current && ds.tool === 'pencil' && ds.current.points.length > 1) {
    // Enforce max 3 annotations limit on Free version
    if (!isPro && ds.annotations.length >= 3) {
      showToast(t('toast-limit-annotations-short', '⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido.'), 4500);
      ds.current = null;
      ds.drawing = false;
      redraw();
      return;
    }

    ds.current.timestamp = video.currentTime || 0; ds.current.duration = ds.duration
    ds.annotations.push(ds.current); ds.current = null; ds.drawing = false
    redraw(); updateTimelineMarkers(); updateAnnotationBadge()
    scheduleAnnotationSave() // ★ persist
  }
})
function getPos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }

// Redraw
function redraw() {
  const t = video.currentTime || 0
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const ann of ds.annotations) {
    if (!isVisible(ann, t)) continue
    ctx.globalAlpha = getOpacity(ann, t); renderAnn(ann)
  }
  ctx.globalAlpha = 1
  if (ds.current) renderAnn(ds.current)
}

function renderAnn(ann, t = null) {
  renderAnnToCtx(ctx, ann, t)
}

function renderAnnToCtx(targetCtx, ann, t = null) {
  targetCtx.save()
  const currentTime = t !== null ? t : (video.currentTime || 0)

  // ★ Case 1: Dual attachment (Line/Arrow/Circle/Rect/Pencil stretching between TWO tracked players)
  if (ann.attachedTrackStartId && ann.attachedTrackEndId) {
    const trackStart = ds.annotations.find(a => a.id === ann.attachedTrackStartId)
    const trackEnd   = ds.annotations.find(a => a.id === ann.attachedTrackEndId)

    if (trackStart && trackEnd) {
      const posStart = getTrackCenterAtTime(trackStart, currentTime)
      const posEnd   = getTrackCenterAtTime(trackEnd, currentTime)

      if (posStart && posEnd) {
        if (ann.tool === 'pencil' && ann.points && ann.points.length > 1 && ann.attachStartOriginPos && ann.attachEndOriginPos) {
          // Freehand pencil curve elastic morphing between 2 players
          const deltaX1 = posStart.x - ann.attachStartOriginPos.x
          const deltaY1 = posStart.y - ann.attachStartOriginPos.y
          const deltaX2 = posEnd.x - ann.attachEndOriginPos.x
          const deltaY2 = posEnd.y - ann.attachEndOriginPos.y

          const N = ann.points.length
          const dynPoints = ann.points.map((pt, idx) => {
            const w = idx / (N - 1)
            const dx = (1 - w) * deltaX1 + w * deltaX2
            const dy = (1 - w) * deltaY1 + w * deltaY2
            return { x: pt.x + dx, y: pt.y + dy }
          })

          const dynAnn = { ...ann, points: dynPoints }
          targetCtx.strokeStyle = dynAnn.color; targetCtx.fillStyle = dynAnn.color
          targetCtx.lineWidth = dynAnn.width; targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round'
          drawPencilCtx(targetCtx, dynAnn)
          targetCtx.restore()
          return
        } else if (ann.startOffset && ann.endOffset) {
          // Straight lines, arrows, circles, rects
          const dynAnn = {
            ...ann,
            x1: posStart.x + ann.startOffset.dx,
            y1: posStart.y + ann.startOffset.dy,
            x2: posEnd.x + ann.endOffset.dx,
            y2: posEnd.y + ann.endOffset.dy
          }

          targetCtx.strokeStyle = dynAnn.color; targetCtx.fillStyle = dynAnn.color
          targetCtx.lineWidth = dynAnn.width; targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round'
          targetCtx.setLineDash(dynAnn.tool === 'dashed' ? [dynAnn.width*4, dynAnn.width*2.5] : [])
          switch (dynAnn.tool) {
            case 'line': case 'dashed': drawLineCtx(targetCtx, dynAnn); break
            case 'arrow':  drawArrowCtx(targetCtx, dynAnn);  break
            case 'circle': drawElasticCircleCtx(targetCtx, dynAnn); break
            case 'rect':   drawElasticRectCtx(targetCtx, dynAnn);   break
          }
          targetCtx.restore()
          return
        }
      }
    }
  }

  // ★ Case 2: Single attachment (whole drawing translates with one player)
  if (ann.attachedTrackId && ann.attachOriginPos) {
    const parentTrack = ds.annotations.find(a => a.id === ann.attachedTrackId)
    if (parentTrack && parentTrack.trajectory) {
      const currentPos = getTrackCenterAtTime(parentTrack, currentTime)
      if (currentPos) {
        const deltaX = currentPos.x - ann.attachOriginPos.x
        const deltaY = currentPos.y - ann.attachOriginPos.y
        targetCtx.translate(deltaX, deltaY)
      }
    }
  }

  targetCtx.strokeStyle = ann.color; targetCtx.fillStyle = ann.color
  targetCtx.lineWidth = ann.width; targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round'
  targetCtx.setLineDash(ann.tool === 'dashed' ? [ann.width*4, ann.width*2.5] : [])
  switch (ann.tool) {
    case 'pencil': drawPencilCtx(targetCtx, ann); break
    case 'line': case 'dashed': drawLineCtx(targetCtx, ann); break
    case 'arrow':  drawArrowCtx(targetCtx, ann);  break
    case 'circle': drawCircleCtx(targetCtx, ann); break
    case 'rect':   drawRectCtx(targetCtx, ann);   break
    case 'track':  drawTrackSpotlight(targetCtx, ann, currentTime); break
  }
  targetCtx.restore()
}

// Helper: Convert hex color to rgba string
function hexToRgba(hex, alpha = 0.4) {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`
  let c = hex.replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  const num = parseInt(c, 16) || 0xffffff
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ── Draw animated player tracking spotlight ────────────────────────
function drawTrackSpotlight(c, ann, t = null) {
  const vRect = getVideoVisualRect()
  if (!vRect) return

  const trackColor = ann.color || '#ffffff'

  // If currently drawing the bounding box rectangle
  if (!ann.trajectory) {
    c.setLineDash([4, 4])
    c.strokeStyle = trackColor
    const x = Math.min(ann.x1, ann.x2), y = Math.min(ann.y1, ann.y2)
    const w = Math.abs(ann.x2 - ann.x1), h = Math.abs(ann.y2 - ann.y1)
    c.strokeRect(x, y, w, h)
    return
  }

  // Find trajectory point corresponding to current playback time
  const currentTime = t !== null ? t : (video.currentTime || 0)
  const relTime = currentTime - ann.timestamp
  if (relTime < -0.3 || relTime > ann.duration) return

  // Find nearest point in trajectory
  let point = ann.trajectory[0]
  for (let i = 0; i < ann.trajectory.length; i++) {
    if (ann.trajectory[i].time <= relTime) point = ann.trajectory[i]
    else break
  }

  if (!point) return

  // Off-Screen Check: If player exited camera bounds (near edges), hide
  if (point.x <= 0.015 || point.x >= 0.985 || point.y <= 0.015 || point.y >= 0.985) {
    return
  }

  // Convert normalized video coords back to target context pixels
  const px = (point.x * vRect.displayWidth) + vRect.offsetX
  const py = (point.y * vRect.displayHeight) + vRect.offsetY
  const pw = (point.w * vRect.displayWidth)
  const rx = Math.max(16, pw * 0.8)
  const ry = rx * 0.45

  // Draw glowing ellipse spotlight at player feet with chosen color
  c.save()
  c.beginPath()
  c.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2)
  c.strokeStyle = trackColor
  c.lineWidth = Math.max(3, ann.width || 2)
  c.shadowColor = trackColor
  c.shadowBlur = 12
  c.stroke()

  // Inner fill gradient with custom color + same smooth opacity
  const grad = c.createRadialGradient(px, py, 2, px, py, rx)
  grad.addColorStop(0, hexToRgba(trackColor, 0.42))
  grad.addColorStop(1, hexToRgba(trackColor, 0.0))
  c.fillStyle = grad
  c.fill()
  c.restore()
}

function drawPencilCtx(c, ann) {
  if (!ann.points.length) return
  if (ann.points.length === 1) { c.beginPath(); c.arc(ann.points[0].x, ann.points[0].y, ann.width/2, 0, Math.PI*2); c.fill(); return }
  c.beginPath(); c.moveTo(ann.points[0].x, ann.points[0].y)
  for (let i = 1; i < ann.points.length-1; i++) {
    const mx=(ann.points[i].x+ann.points[i+1].x)/2, my=(ann.points[i].y+ann.points[i+1].y)/2
    c.quadraticCurveTo(ann.points[i].x, ann.points[i].y, mx, my)
  }
  const last = ann.points[ann.points.length-1]; c.lineTo(last.x, last.y); c.stroke()
}
function drawLineCtx(c, ann) { c.beginPath(); c.moveTo(ann.x1, ann.y1); c.lineTo(ann.x2, ann.y2); c.stroke() }
function drawArrowCtx(c, ann) {
  const { x1,y1,x2,y2,width }=ann, dx=x2-x1, dy=y2-y1
  if (Math.sqrt(dx*dx+dy*dy)<2) return
  const hl=Math.max(14,width*4), a=Math.atan2(dy,dx), sp=Math.PI/7
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke()
  c.setLineDash([]); c.beginPath(); c.moveTo(x2,y2)
  c.lineTo(x2-hl*Math.cos(a-sp), y2-hl*Math.sin(a-sp))
  c.lineTo(x2-hl*Math.cos(a+sp), y2-hl*Math.sin(a+sp))
  c.closePath(); c.fill()
}
function drawCircleCtx(c, ann) {
  const cx=(ann.x1+ann.x2)/2, cy=(ann.y1+ann.y2)/2
  const rx=Math.abs(ann.x2-ann.x1)/2, ry=Math.abs(ann.y2-ann.y1)/2
  if (rx<1&&ry<1) return; c.beginPath(); c.ellipse(cx,cy,Math.max(rx,1),Math.max(ry,1),0,0,Math.PI*2); c.stroke()
}
function drawRectCtx(c, ann) {
  const x=Math.min(ann.x1,ann.x2), y=Math.min(ann.y1,ann.y2)
  const w=Math.abs(ann.x2-ann.x1), h=Math.abs(ann.y2-ann.y1)
  if (w<1||h<1) return; c.beginPath(); c.roundRect(x,y,w,h,3); c.stroke()
}

function drawElasticCircleCtx(c, ann) {
  const cx = (ann.x1 + ann.x2) / 2
  const cy = (ann.y1 + ann.y2) / 2
  const dx = ann.x2 - ann.x1
  const dy = ann.y2 - ann.y1
  const dist = Math.hypot(dx, dy)
  const rx = Math.max(10, dist / 2)
  const ry = Math.max(12, rx * 0.45)
  const angle = Math.atan2(dy, dx)

  c.save()
  c.beginPath()
  c.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2)
  c.stroke()
  c.restore()
}

function drawElasticRectCtx(c, ann) {
  const cx = (ann.x1 + ann.x2) / 2
  const cy = (ann.y1 + ann.y2) / 2
  const dx = ann.x2 - ann.x1
  const dy = ann.y2 - ann.y1
  const dist = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const h = Math.max(18, dist * 0.35)

  c.save()
  c.translate(cx, cy)
  c.rotate(angle)
  c.beginPath()
  c.strokeRect(-dist / 2, -h / 2, dist, h)
  c.restore()
}

// Timeline markers
function updateTimelineMarkers() {
  document.querySelectorAll('.tl-marker').forEach(m => m.remove())
  if (!video.duration) return
  const buckets = new Map()
  for (const ann of ds.annotations) buckets.set(Math.round(ann.timestamp*2), ann)
  for (const [, ann] of buckets) {
    const pct = ann.timestamp / video.duration * 100
    const m   = document.createElement('div')
    m.className = 'tl-marker'; m.style.left = pct+'%'
    m.style.background = ann.color; m.style.boxShadow = `0 0 7px ${ann.color}dd, 0 0 2px ${ann.color}`
    m.title = formatTime(ann.timestamp)
    m.addEventListener('click', ev => {
      ev.stopPropagation(); video.currentTime = ann.timestamp
      updateProgress(pct); timeCurrent.textContent = formatTime(ann.timestamp); redraw()
    })
    progressBar.appendChild(m)
  }
}

function updateAnnotationBadge() {
  const count = ds.annotations.length
  if (count > 0) { btnEditMode.dataset.count = count; btnEditMode.title = `Modo de desenho (E) \u2014 ${count} anota\u00E7\u00E3o(oes)` }
  else { delete btnEditMode.dataset.count; btnEditMode.title = 'Modo de desenho (E)' }
}

// ── Drag & Drop Panel Logic ──────────────────────────────
function makeDraggable(el) {
  let grabOffsetX = 0;
  let grabOffsetY = 0;
  let dockedEdge = 'left'; // Mantém o estado persistente do acoplamento (left, right, top, bottom, none)
  
  el.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    // Apenas arrastar com o clique esquerdo (button 0)
    if (e.button !== 0) return;
    
    // Ignorar arrastamento se clicou em botões de ação ou seletores do painel
    if (
      e.target.closest('button') || 
      e.target.closest('.dp-color') || 
      e.target.closest('.dp-width') || 
      e.target.closest('.dp-dur') || 
      e.target.closest('.dp-action')
    ) {
      return;
    }
    
    e.preventDefault();
    
    // Ler as posições calculadas reais antes de desativar o docking CSS para o drag iniciar
    const currentLeft = el.offsetLeft;
    const currentTop = el.offsetTop;
    
    // Limpar as classes de docking do CSS temporariamente para o arrastamento livre
    el.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom');
    
    // Colocar a posição calculada atual em inline styles para evitar pulos no início do drag
    el.style.left = currentLeft + 'px';
    el.style.top = currentTop + 'px';
    el.style.bottom = 'auto';
    el.style.right = 'auto';
    
    grabOffsetX = e.clientX - el.offsetLeft;
    grabOffsetY = e.clientY - el.offsetTop;
    
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    
    const playerWrap = document.getElementById('playerWrap');
    const playerRect = playerWrap.getBoundingClientRect();
    const controlsEl = document.getElementById('controls');
    const controlsRect = controlsEl.getBoundingClientRect();
    
    // Altura útil da área do player (excluindo a barra de controlos do fundo)
    const activeHeight = controlsRect.top - playerRect.top;
    
    const snapThreshold = 100; // Pixels de distância das bordas para colar
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Converter coordenadas do cursor para o espaço local do playerWrap
    const localMouseX = mouseX - playerRect.left;
    const localMouseY = mouseY - playerRect.top;
    
    // Zonas de snap ativadas apenas pela coordenada absoluta do cursor do rato no viewport
    const closeToLeft = mouseX < snapThreshold;
    const closeToRight = mouseX > window.innerWidth - snapThreshold;
    const closeToTop = mouseY < playerRect.top + snapThreshold;
    const closeToBottom = mouseY > controlsRect.top - snapThreshold;
    
    // Distâncias do cursor do rato às margens correspondentes
    let distLeft = mouseX;
    let distRight = window.innerWidth - mouseX;
    let distTop = mouseY - playerRect.top;
    let distBottom = controlsRect.top - mouseY;
    
    let edges = [
      { name: 'left', dist: distLeft, active: closeToLeft },
      { name: 'right', dist: distRight, active: closeToRight },
      { name: 'top', dist: distTop, active: closeToTop },
      { name: 'bottom', dist: distBottom, active: closeToBottom }
    ];
    
    // Obter apenas as bordas ativas de snap e ordenar pela mais próxima do rato
    let activeSnaps = edges.filter(ed => ed.active).sort((a, b) => a.dist - b.dist);
    
    if (activeSnaps.length > 0) {
      const targetEdge = activeSnaps[0].name;
      dockedEdge = targetEdge; // Guardar estado da doca atualizado
      
      // Aplicar classes CSS e remover inline-styles concorrentes
      el.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom');
      el.classList.add('dock-' + targetEdge);
      
      if (targetEdge === 'left') {
        if (el.classList.contains('horizontal')) {
          el.classList.remove('horizontal');
          const dummy = el.offsetWidth; // Forçar reflow
          grabOffsetX = el.offsetWidth / 2;
          grabOffsetY = el.offsetHeight / 2;
        }
        el.style.left = '';
        el.style.right = '';
        el.style.bottom = '';
        let maxTop = activeHeight - el.offsetHeight;
        el.style.top = Math.max(0, Math.min(localMouseY - grabOffsetY, maxTop)) + 'px';
      } 
      else if (targetEdge === 'right') {
        if (el.classList.contains('horizontal')) {
          el.classList.remove('horizontal');
          const dummy = el.offsetWidth;
          grabOffsetX = el.offsetWidth / 2;
          grabOffsetY = el.offsetHeight / 2;
        }
        el.style.left = '';
        el.style.right = '';
        el.style.bottom = '';
        let maxTop = activeHeight - el.offsetHeight;
        el.style.top = Math.max(0, Math.min(localMouseY - grabOffsetY, maxTop)) + 'px';
      } 
      else if (targetEdge === 'top') {
        if (!el.classList.contains('horizontal')) {
          el.classList.add('horizontal');
          const dummy = el.offsetWidth;
          grabOffsetX = el.offsetWidth / 2;
          grabOffsetY = el.offsetHeight / 2;
        }
        // Limpar estilos inline: a classe CSS (.dock-top) posiciona tudo nativamente!
        el.style.left = '';
        el.style.right = '';
        el.style.top = '';
        el.style.bottom = '';
      } 
      else if (targetEdge === 'bottom') {
        if (!el.classList.contains('horizontal')) {
          el.classList.add('horizontal');
          const dummy = el.offsetHeight;
          grabOffsetX = el.offsetWidth / 2;
          grabOffsetY = el.offsetHeight / 2;
        }
        // Limpar estilos inline: a classe CSS (.dock-bottom) posiciona tudo nativamente!
        el.style.left = '';
        el.style.right = '';
        el.style.top = '';
        el.style.bottom = '';
      }
    } else {
      // ── FLUTUAÇÃO LIVRE NO MEIO ──
      dockedEdge = 'none'; // Desacoplado
      el.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom');
      
      if (el.classList.contains('horizontal')) {
        el.classList.remove('horizontal');
        const dummy = el.offsetWidth;
        grabOffsetX = el.offsetWidth / 2;
        grabOffsetY = el.offsetHeight / 2;
      }
      
      const maxLeft = playerRect.width - el.offsetWidth;
      const maxTop = activeHeight - el.offsetHeight;
      
      let targetLeft = localMouseX - grabOffsetX;
      let targetTop = localMouseY - grabOffsetY;
      
      el.style.left = Math.max(0, Math.min(targetLeft, maxLeft)) + "px";
      el.style.top = Math.max(0, Math.min(targetTop, maxTop)) + "px";
      el.style.bottom = 'auto';
      el.style.right = 'auto';
    }
    el.style.transform = "none";
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }

  // Garantir que a caixa se ajusta e se mantém colada à beira correta quando a janela muda de tamanho
  window.addEventListener('resize', () => {
    if (el.style.display === 'none') return;
    
    const playerWrap = document.getElementById('playerWrap');
    if (!playerWrap || playerWrap.style.display === 'none') return;
    
    const playerRect = playerWrap.getBoundingClientRect();
    const controlsEl = document.getElementById('controls');
    const controlsRect = controlsEl.getBoundingClientRect();
    
    const activeHeight = controlsRect.top - playerRect.top;
    
    const maxLeft = playerRect.width - el.offsetWidth;
    const maxTop = activeHeight - el.offsetHeight;
    
    el.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom');
    
    if (dockedEdge === 'left') {
      el.classList.remove('horizontal');
      el.classList.add('dock-left');
      el.style.left = '';
      el.style.right = '';
      el.style.bottom = '';
      el.style.top = Math.max(0, Math.min(el.offsetTop, maxTop)) + 'px';
    } 
    else if (dockedEdge === 'right') {
      el.classList.remove('horizontal');
      el.classList.add('dock-right');
      el.style.left = '';
      el.style.right = '';
      el.style.bottom = '';
      el.style.top = Math.max(0, Math.min(el.offsetTop, maxTop)) + 'px';
    } 
    else if (dockedEdge === 'top') {
      el.classList.add('horizontal');
      el.classList.add('dock-top');
      el.style.left = '';
      el.style.right = '';
      el.style.top = '';
      el.style.bottom = '';
    } 
    else if (dockedEdge === 'bottom') {
      el.classList.add('horizontal');
      el.classList.add('dock-bottom');
      el.style.left = '';
      el.style.right = '';
      el.style.top = '';
      el.style.bottom = '';
    } 
    else {
      // Modo flutuante: apenas manter nos limites do ecrã
      el.classList.remove('horizontal');
      el.style.left = Math.max(0, Math.min(el.offsetLeft, maxLeft)) + 'px';
      el.style.top = Math.max(0, Math.min(el.offsetTop, maxTop)) + 'px';
      el.style.bottom = 'auto';
      el.style.right = 'auto';
    }
  });
}

// Inicializar arrastamento no painel
makeDraggable(document.getElementById('drawPanel'));

// Initial license validation check on boot
checkLicense();
setAppLanguage(currentAppLang);

