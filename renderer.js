const { ipcRenderer } = require('electron')
const path = require('path')

// ── Licensing state ───────────────────────────────────────
let isPro = false
let shortcutKeys = {};
let activePlaylistId = null;
let playlists = [];
let taggedEvents = [];
let lastPausedTime = -1;

// ── Translations / i18n ──────────────────────────────────
let currentAppLang = localStorage.getItem('fv_app_lang') || 'en';

const appTranslations = {
  "pt": {
    "confirm-delete-events": "Tens a certeza que pretendes eliminar os {0} eventos selecionados?",
    "toast-events-added-pl": "✅ {0} eventos adicionados à playlist!",
    "toast-events-deleted": "🗑️ {0} eventos eliminados com sucesso!",
    "title-add-selected-pl": "Adicionar à Playlist",
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
    "select-all": "Selecionar Todos",
    "placeholder-playlist-name": "Nome da playlist...",
    "modal-title": "Licenciamento FieldVision",
    "modal-status": "Estado: ",
    "status-free": "Versão de Teste (Free)",
    "status-pro": "Pro Ativa",
    "modal-inst-free": "Introduz a tua chave Pro enviada pelo Lemon Squeezy para remover marcas de água e desbloquear anotações e IA ilimitadas.",
    "modal-inst-pro": "A tua licença Pro está ativa e validada neste computador. Obrigado pelo teu suporte!",
    "btn-activate": "Ativar FieldVision Pro",
    "btn-deactivate": "Desativar Licença",
    "btn-export-pl": "📥 Exportar Playlist",
    "btn-exporting": "⏳ A exportar...",
    "modal-buy-text": "Ainda não tens chave? ",
    "modal-buy-link": "Comprar Licença Pro (€29/ano)",
    "toast-tracker-select": "Clica e arrasta no canvas para desenhar uma caixa à volta do jogador a rastrear.",
    "toast-tracker-active": "IA a rastrear o jogador... Pressiona qualquer tecla para parar.",
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
    "title-track": "Rastrear Jogador (Alvo 🎯)",
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
    "title-playlist": "Playlist",
    "title-tagging": "Eventos",
    "title-create-pl": "Criar Playlist",
    "title-rename-pl": "Editar Nome",
    "title-delete-pl": "Eliminar Playlist",
    "title-delete-selected": "Eliminar Seleção",
    "title-dp-tools": "Ferramentas de Desenho",
    "title-undo": "Desfazer (Ctrl+Z)",
    "title-redo": "Refazer (Ctrl+Y)",
    "title-clear-all": "Limpar Tudo",
    "title-add-shortcut": "Adicionar Atalho",
    "title-export-csv": "Exportar Eventos em CSV (📤)",
    "title-import-metrica": "Importar Eventos em CSV (📥)",
    "title-clipin-set": "Início: {0} (I)",
    "title-clipout-set": "Fim: {0} (O)",
    "title-cut-ready": "Cortar {0} → {1} ({2}s) — X",
    "title-edit-count": "Modo de desenho (E) — {0} anotação(ões)",
    "license-badge-free": "Ativar Pro ⚡",
    "license-badge-pro": "PRO ATIVO ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
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
    "toast-attach-player": "🚗 Anotação presa ao jogador!",
    "toast-ann-removed": "🗑️ Marcação removida",
    "toast-open-folder": "Abrir pasta",
    "toast-preparing-video": "⏳ A preparar vídeo...",
    "toast-transcoding": "⏳ A converter vídeo para formato compatível ({0}%)...",
    "toast-video-loaded": "✅ Vídeo carregado com sucesso!",
    "toast-video-err": "❌ Erro ao converter vídeo: {0}",
    "toast-playback-err": "❌ Erro ao reproduzir vídeo: {0}",
    "toast-set-in-out": "❌ Define primeiro o ponto de In (I) e Out (O) na barra de tempo",
    "toast-clip-added-pl": "✅ Clip adicionado à playlist com sucesso!",
    "toast-pl-empty": "❌ A playlist está vazia.",
    "toast-pl-invalid": "❌ {0} clip(s) sem caminho de vídeo válido.",
    "toast-pl-prep": "⏳ A preparar {0} clip(s) com marcações…",
    "toast-pl-exporting": "⏳ A exportar {0} clip(s)…",
    "toast-pl-success": "✅ Playlist exportada com sucesso!",
    "toast-auto-pause": "⏸️ Pausa automática de análise",
    "toast-event-tagged": "🏷️ Evento marcado: {0}",
    "toast-event-added-pl": "✅ Evento adicionado à playlist!",
    "toast-event-already-pl": "ℹ️ Este evento já está na playlist",
    "toast-sc-min": "⚠️ Tens de ter pelo menos 1 atalho configurado",
    "toast-sc-limit": "⚠️ Limite atingido: Só podes configurar atalhos de 1 a 9",
    "toast-sc-added": "✅ Atalho (Tecla {0}) adicionado! Escreva o nome abaixo.",
    "toast-export-csv-empty": "⚠️ Não existem eventos registados para exportar!",
    "toast-export-csv-success": "✅ {0} eventos exportados com sucesso!",
    "toast-import-csv-success": "✅ {0} eventos importados com sucesso do CSV!",
    "toast-import-csv-empty": "⚠️ Ficheiro CSV vazio ou sem dados válidos.",
    "toast-import-csv-cols": "⚠️ Não foi possível reconhecer as colunas do CSV.",
    "toast-cutting-render": "✂️ A processar e gravar elementos no vídeo...",
    "toast-cutting-fast": "✂️ A cortar...",
    "sb-playlist-title": "Playlists Táticas",
    "select-playlist-prompt": "-- Escolher Playlist --",
    "sb-add-current-btn": "+ Adicionar Seleção Atual",
    "sb-clips-label": "Clips na Playlist",
    "sb-tagging-title": "Painel de Eventos",
    "sb-tag-config": "Configurar Atalhos",
    "tag-info-desc": "Pressione as teclas no teclado para marcar eventos retroativamente (5s antes a 3s depois).",
    "sb-tagged-events": "Eventos Registados",
    "tag-new-event": "Novo Evento"
  },
  "en": {
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
    "select-all": "Select All",
    "placeholder-playlist-name": "Playlist name...",
    "modal-title": "FieldVision Licensing",
    "modal-status": "Status: ",
    "status-free": "Free Trial Version",
    "status-pro": "Pro Active",
    "modal-inst-free": "Enter your Pro key sent by Lemon Squeezy to remove watermarks and unlock unlimited annotations and tracking.",
    "modal-inst-pro": "Your Pro licence is active and validated on this computer. Thank you for your support!",
    "btn-activate": "Activate FieldVision Pro",
    "btn-deactivate": "Deactivate Licence",
    "btn-export-pl": "📥 Export Playlist",
    "btn-exporting": "⏳ Exporting...",
    "modal-buy-text": "Don't have a key yet? ",
    "modal-buy-link": "Buy Pro Licence (€29/year)",
    "toast-tracker-select": "Click and drag on the canvas to draw a box around the player to track.",
    "toast-tracker-active": "Tracking player... Press any key to stop.",
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
    "title-track": "Track Player (Target 🎯)",
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
    "title-playlist": "Playlist",
    "title-tagging": "Events",
    "title-create-pl": "Create Playlist",
    "title-rename-pl": "Edit Name",
    "title-delete-pl": "Delete Playlist",
    "title-delete-selected": "Delete Selection",
    "title-dp-tools": "Drawing Tools",
    "title-undo": "Undo (Ctrl+Z)",
    "title-redo": "Redo (Ctrl+Y)",
    "title-clear-all": "Clear All",
    "title-add-shortcut": "Add Shortcut",
    "title-export-csv": "Export Events to CSV (📤)",
    "title-import-metrica": "Import Events from CSV (📥)",
    "title-clipin-set": "Start: {0} (I)",
    "title-clipout-set": "End: {0} (O)",
    "title-cut-ready": "Cut {0} → {1} ({2}s) — X",
    "title-edit-count": "Draw mode (E) — {0} annotation(s)",
    "license-badge-free": "Activate Pro ⚡",
    "license-badge-pro": "PRO ACTIVE ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
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
    "toast-limit-track": "⚠️ Trial Limit: You have already used tracking 5 times. Buy Pro for unlimited usage!",
    "toast-track-free-limit": "⚠️ Free tracking limited to 2 seconds of clip...",
    "toast-track-analyzing": "🎯 Analyzing and locking motion on player...",
    "toast-track-success-trial": "🎉 Tracking complete (Trial {0} of 5). Buy Pro!",
    "toast-track-success-pro": "✅ Tracking complete: {0} points recorded!",
    "toast-track-error": "❌ Tracking failed: {0}",
    "toast-limit-annotations": "⚠️ Free Limit: Maximum of 3 annotations per video reached. Buy Pro for unlimited annotations!",
    "toast-limit-annotations-short": "⚠️ Free Limit: Maximum of 3 annotations per video reached.",
    "toast-link-players": "🔗 Elastic link line attached to both players!",
    "toast-attach-player": "🚗 Annotation attached to player!",
    "toast-ann-removed": "🗑️ Annotation removed",
    "toast-open-folder": "Open folder",
    "toast-preparing-video": "⏳ Preparing video...",
    "toast-transcoding": "⏳ Converting video to compatible format ({0}%)...",
    "toast-video-loaded": "✅ Video loaded successfully!",
    "toast-video-err": "❌ Error converting video: {0}",
    "toast-playback-err": "❌ Playback error: {0}",
    "toast-set-in-out": "❌ Set In (I) and Out (O) points on timeline first",
    "toast-clip-added-pl": "✅ Clip added to playlist successfully!",
    "toast-pl-empty": "❌ Playlist is empty.",
    "toast-pl-invalid": "❌ {0} clip(s) with invalid video path.",
    "toast-pl-prep": "⏳ Preparing {0} clip(s) with annotations…",
    "toast-pl-exporting": "⏳ Exporting {0} clip(s)…",
    "toast-pl-success": "✅ Playlist exported successfully!",
    "toast-auto-pause": "⏸️ Analysis auto-pause",
    "toast-event-tagged": "🏷️ Event tagged: {0}",
    "toast-event-added-pl": "✅ Event added to playlist!",
    "toast-event-already-pl": "ℹ️ This event is already in the playlist",
    "toast-sc-min": "⚠️ You must have at least 1 shortcut configured",
    "toast-sc-limit": "⚠️ Limit reached: You can only configure shortcuts 1 to 9",
    "toast-sc-added": "✅ Shortcut (Key {0}) added! Enter name below.",
    "toast-export-csv-empty": "⚠️ No registered events to export!",
    "toast-export-csv-success": "✅ {0} events successfully exported!",
    "toast-import-csv-success": "✅ {0} events successfully imported from CSV!",
    "toast-import-csv-empty": "⚠️ CSV file empty or without valid data.",
    "toast-import-csv-cols": "⚠️ Could not recognize CSV columns.",
    "toast-cutting-render": "✂️ Processing and burning overlays onto video...",
    "toast-cutting-fast": "✂️ Cutting...",
    "sb-playlist-title": "Tactical Playlists",
    "select-playlist-prompt": "-- Choose Playlist --",
    "sb-add-current-btn": "+ Add Current Selection",
    "sb-clips-label": "Clips in Playlist",
    "sb-tagging-title": "Events Panel",
    "sb-tag-config": "Configure Shortcuts",
    "tag-info-desc": "Press keyboard keys to tag events retroactively (5s before to 3s after).",
    "sb-tagged-events": "Registered Events",
    "tag-new-event": "New Event"
  },
  "es": {
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
    "select-all": "Seleccionar Todos",
    "placeholder-playlist-name": "Nombre de playlist...",
    "modal-title": "Licencia de FieldVision",
    "modal-status": "Estado: ",
    "status-free": "Versión de Prueba (Free)",
    "status-pro": "Pro Activa",
    "modal-inst-free": "Introduce tu clave Pro enviada por Lemon Squeezy para eliminar marcas de agua y desbloquear anotaciones y seguimiento ilimitados.",
    "modal-inst-pro": "Tu licencia Pro está activa y validada en este ordenador. ¡Gracias por tu apoyo!",
    "btn-activate": "Activar FieldVision Pro",
    "btn-deactivate": "Desactivar Licencia",
    "btn-export-pl": "📥 Exportar Playlist",
    "btn-exporting": "⏳ Exportando...",
    "modal-buy-text": "¿Aún no tienes clave? ",
    "modal-buy-link": "Comprar Licencia Pro (€29/año)",
    "toast-tracker-select": "Haz clic y arrastra en el lienzo para dibujar un cuadro alrededor del jugador a rastrear.",
    "toast-tracker-active": "Rastreando al jugador... Presiona cualquier tecla para detener.",
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
    "title-track": "Rastrear Jugador (Alvo 🎯)",
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
    "title-playlist": "Playlist",
    "title-tagging": "Eventos",
    "title-create-pl": "Crear Playlist",
    "title-rename-pl": "Editar Nombre",
    "title-delete-pl": "Eliminar Playlist",
    "title-delete-selected": "Eliminar Selección",
    "title-dp-tools": "Herramientas de Dibujo",
    "title-undo": "Deshacer (Ctrl+Z)",
    "title-redo": "Rehacer (Ctrl+Y)",
    "title-clear-all": "Limpiar Todo",
    "title-add-shortcut": "Añadir Atajo",
    "title-export-csv": "Exportar Eventos en CSV (📤)",
    "title-import-metrica": "Importar Eventos en CSV (📥)",
    "title-clipin-set": "Inicio: {0} (I)",
    "title-clipout-set": "Fin: {0} (O)",
    "title-cut-ready": "Cortar {0} → {1} ({2}s) — X",
    "title-edit-count": "Modo dibujo (E) — {0} anotación(es)",
    "license-badge-free": "Activar Pro ⚡",
    "license-badge-pro": "PRO ACTIVO ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
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
    "toast-limit-track": "⚠️ Límite Trial: Ya has usado el rastreo 5 veces. ¡Compra Pro para uso ilimitado!",
    "toast-track-free-limit": "⚠️ Rastreo Free limitado a 2 segundos de clip...",
    "toast-track-analyzing": "🎯 Analizando y fijando el movimiento en el jugador...",
    "toast-track-success-trial": "🎉 Rastreo completado (Prueba {0} de 5). ¡Compra Pro!",
    "toast-track-success-pro": "✅ Rastreo completado: ¡{0} puntos grabados!",
    "toast-track-error": "❌ Fallo en el rastreo: {0}",
    "toast-limit-annotations": "⚠️ Límite Free: Máximo de 3 anotaciones por video alcanzado. ¡Compra Pro para anotaciones ilimitadas!",
    "toast-limit-annotations-short": "⚠️ Límite Free: Máximo de 3 anotaciones por video alcanzado.",
    "toast-link-players": "🔗 ¡Línea de enlace elástico conectada a ambos jugadores!",
    "toast-attach-player": "🚗 ¡Anotación fijada al jugador!",
    "toast-ann-removed": "🗑️ Marca eliminada",
    "toast-open-folder": "Abrir carpeta",
    "toast-preparing-video": "⏳ Preparando video...",
    "toast-transcoding": "⏳ Convirtiendo video a formato compatible ({0}%)...",
    "toast-video-loaded": "✅ ¡Video cargado con éxito!",
    "toast-video-err": "❌ Error al convertir video: {0}",
    "toast-playback-err": "❌ Error de reproducción: {0}",
    "toast-set-in-out": "❌ Define primero los puntos In (I) y Out (O) en la barra de tiempo",
    "toast-clip-added-pl": "✅ ¡Clip añadido a la playlist con éxito!",
    "toast-pl-empty": "❌ La playlist está vacía.",
    "toast-pl-invalid": "❌ {0} clip(s) sin ruta de video válida.",
    "toast-pl-prep": "⏳ Preparando {0} clip(s) con anotaciones…",
    "toast-pl-exporting": "⏳ Exportando {0} clip(s)…",
    "toast-pl-success": "✅ ¡Playlist exportada con éxito!",
    "toast-auto-pause": "⏸️ Pausa automática de análisis",
    "toast-event-tagged": "🏷️ Evento marcado: {0}",
    "toast-event-added-pl": "✅ ¡Evento añadido a la playlist!",
    "toast-event-already-pl": "ℹ️ Este evento ya está en la playlist",
    "toast-sc-min": "⚠️ Debes tener al menos 1 atajo configurado",
    "toast-sc-limit": "⚠️ Límite alcanzado: Solo puedes configurar atajos del 1 al 9",
    "toast-sc-added": "✅ ¡Atajo (Tecla {0}) añadido! Escribe el nombre abajo.",
    "toast-export-csv-empty": "⚠️ ¡No hay eventos registrados para exportar!",
    "toast-export-csv-success": "✅ ¡{0} eventos exportados con éxito!",
    "toast-import-csv-success": "✅ ¡{0} eventos importados con éxito del CSV!",
    "toast-import-csv-empty": "⚠️ Archivo CSV vacío o sin datos válidos.",
    "toast-import-csv-cols": "⚠️ No se pudieron reconocer las columnas del CSV.",
    "toast-cutting-render": "✂️ Procesando y grabando elementos en el video...",
    "toast-cutting-fast": "✂️ Cortando...",
    "sb-playlist-title": "Playlists Tácticas",
    "select-playlist-prompt": "-- Elegir Playlist --",
    "sb-add-current-btn": "+ Añadir Selección Actual",
    "sb-clips-label": "Clips en la Playlist",
    "sb-tagging-title": "Panel de Eventos",
    "sb-tag-config": "Configurar Accesos Directos",
    "tag-info-desc": "Presione las teclas en el teclado para marcar eventos retroactivamente (5s antes a 3s después).",
    "sb-tagged-events": "Eventos Registrados",
    "tag-new-event": "Nuevo Evento"
  },
  "fr": {
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
    "select-all": "Tout Sélectionner",
    "placeholder-playlist-name": "Nom de la playlist...",
    "modal-title": "Licence FieldVision",
    "modal-status": "Statut: ",
    "status-free": "Version d'essai (Free)",
    "status-pro": "Pro Active",
    "modal-inst-free": "Entrez votre clé Pro envoyée par Lemon Squeezy pour supprimer les filigranes et débloquer les annotations et le suivi illimités.",
    "modal-inst-pro": "Votre licence Pro est active et validée sur cet ordinateur. Merci pour votre soutien !",
    "btn-activate": "Activer FieldVision Pro",
    "btn-deactivate": "Désactiver la licence",
    "btn-export-pl": "📥 Exporter la Playlist",
    "btn-exporting": "⏳ Exportation...",
    "modal-buy-text": "Vous n'avez pas encore de clé ? ",
    "modal-buy-link": "Acheter une licence Pro (€29/an)",
    "toast-tracker-select": "Cliquez et glissez sur le canevas pour dessiner une boîte autour du joueur à suivre.",
    "toast-tracker-active": "Suivi du joueur en cours... Appuyez sur n'importe quelle touche pour arrêter.",
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
    "title-track": "Suivre le Joueur (Cible 🎯)",
    "title-open": "Ouvrir un fichier",
    "title-play": "Lecture / Pause",
    "title-stop": "Arrêter",
    "title-mute": "Muet / Activer le son",
    "title-speed": "Vitesse",
    "title-clipin": "Marquer le début du clip (I)",
    "title-clipout": "Marquer la fin du clip (O)",
    "title-cut": "Couper et sauvegarder (X)",
    "title-edit": "Mode dessin (E)",
    "title-fs": "Plein écran",
    "title-playlist": "Playlist",
    "title-tagging": "Événements",
    "title-create-pl": "Créer une Playlist",
    "title-rename-pl": "Modifier le Nom",
    "title-delete-pl": "Supprimer la Playlist",
    "title-delete-selected": "Supprimer la sélection",
    "title-dp-tools": "Outils de Dessin",
    "title-undo": "Annuler (Ctrl+Z)",
    "title-redo": "Refaire (Ctrl+Y)",
    "title-clear-all": "Tout Effacer",
    "title-add-shortcut": "Ajouter un Raccourci",
    "title-export-csv": "Exporter les Événements en CSV (📤)",
    "title-import-metrica": "Importer des Événements en CSV (📥)",
    "title-clipin-set": "Début: {0} (I)",
    "title-clipout-set": "Fin: {0} (O)",
    "title-cut-ready": "Couper {0} → {1} ({2}s) — X",
    "title-edit-count": "Mode dessin (E) — {0} annotation(s)",
    "license-badge-free": "Activer Pro ⚡",
    "license-badge-pro": "PRO ACTIF ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
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
    "toast-limit-track": "⚠️ Limite d'essai : Vous avez déjà utilisé le suivi 5 fois. Achetez Pro pour un usage illimité !",
    "toast-track-free-limit": "⚠️ Suivi Free limité à 2 secondes de clip...",
    "toast-track-analyzing": "🎯 Analyse et verrouillage du mouvement sur le joueur...",
    "toast-track-success-trial": "🎉 Suivi terminé (Essai {0} sur 5). Achetez Pro !",
    "toast-track-success-pro": "✅ Suivi terminé : {0} points enregistrés !",
    "toast-track-error": "❌ Échec du suivi : {0}",
    "toast-limit-annotations": "⚠️ Limite Free : Maximum de 3 annotations par vidéo atteint. Achetez Pro pour des annotations illimitées !",
    "toast-limit-annotations-short": "⚠️ Limite Free : Maximum de 3 annotations par vidéo atteint.",
    "toast-link-players": "🔗 Ligne de liaison élastique connectée aux deux joueurs !",
    "toast-attach-player": "🚗 Annotation attachée au joueur !",
    "toast-ann-removed": "🗑️ Annotation supprimée",
    "toast-open-folder": "Ouvrir le dossier",
    "toast-preparing-video": "⏳ Préparation de la vidéo...",
    "toast-transcoding": "⏳ Conversion de la vidéo au format compatible ({0}%)...",
    "toast-video-loaded": "✅ Vidéo chargée avec succès !",
    "toast-video-err": "❌ Erreur de conversion : {0}",
    "toast-playback-err": "❌ Erreur de lecture : {0}",
    "toast-set-in-out": "❌ Définissez d'abord les points In (I) et Out (O) sur la timeline",
    "toast-clip-added-pl": "✅ Clip ajouté à la playlist avec succès !",
    "toast-pl-empty": "❌ La playlist est vide.",
    "toast-pl-invalid": "❌ {0} clip(s) avec chemin vidéo invalide.",
    "toast-pl-prep": "⏳ Préparation de {0} clip(s) avec annotations…",
    "toast-pl-exporting": "⏳ Exportation de {0} clip(s)…",
    "toast-pl-success": "✅ Playlist exportée avec succès !",
    "toast-auto-pause": "⏸️ Pause automatique d'analyse",
    "toast-event-tagged": "🏷️ Événement marqué : {0}",
    "toast-event-added-pl": "✅ Événement ajouté à la playlist !",
    "toast-event-already-pl": "ℹ️ Cet événement est déjà dans la playlist",
    "toast-sc-min": "⚠️ Vous devez avoir au moins 1 raccourci configuré",
    "toast-sc-limit": "⚠️ Limite atteinte : Vous ne pouvez configurer que les raccourcis 1 à 9",
    "toast-sc-added": "✅ Raccourci (Touche {0}) ajouté ! Saisissez le nom ci-dessous.",
    "toast-export-csv-empty": "⚠️ Aucun événement enregistré à exporter !",
    "toast-export-csv-success": "✅ {0} événements exportés avec succès !",
    "toast-import-csv-success": "✅ {0} événements importés avec succès du CSV !",
    "toast-import-csv-empty": "⚠️ Fichier CSV vide ou sans données valides.",
    "toast-import-csv-cols": "⚠️ Impossible de reconnaître les colonnes du CSV.",
    "toast-cutting-render": "✂️ Traitement et incrustation des éléments sur la vidéo...",
    "toast-cutting-fast": "✂️ Découpage en cours...",
    "sb-playlist-title": "Playlists Tactiques",
    "select-playlist-prompt": "-- Choisir une Playlist --",
    "sb-add-current-btn": "+ Ajouter la Sélection Actuelle",
    "sb-clips-label": "Clips dans la Playlist",
    "sb-tagging-title": "Panneau d'Événements",
    "sb-tag-config": "Configurer les Raccourcis",
    "tag-info-desc": "Appuyez sur les touches du clavier pour marquer les événements rétroactivement (5s avant à 3s après).",
    "sb-tagged-events": "Événements Enregistrés",
    "tag-new-event": "Nouvel Événement"
  },
  "de": {
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
    "select-all": "Alle Auswählen",
    "placeholder-playlist-name": "Playlist-Name...",
    "modal-title": "FieldVision Lizenzierung",
    "modal-status": "Status: ",
    "status-free": "Testversion (Free)",
    "status-pro": "Pro Aktiv",
    "modal-inst-free": "Geben Sie Ihren Pro-Schlüssel ein, der von Lemon Squeezy gesendet wurde, um Wasserzeichen zu entfernen und unbegrenzte Anmerkungen und Tracking freizuschalten.",
    "modal-inst-pro": "Ihre Pro-Lizenz ist auf diesem Computer aktiv und validiert. Vielen Dank für Ihre Unterstützung!",
    "btn-activate": "FieldVision Pro Aktivieren",
    "btn-deactivate": "Lizenz Deaktivieren",
    "btn-export-pl": "📥 Playlist Exportieren",
    "btn-exporting": "⏳ Exportieren...",
    "modal-buy-text": "Haben Sie noch keinen Schlüssel? ",
    "modal-buy-link": "Pro-Lizenz kaufen (€29/Jahr)",
    "toast-tracker-select": "Klicken und ziehen Sie auf der Leinwand, um ein Kästchen um den zu verfolgenden Spieler zu zeichnen.",
    "toast-tracker-active": "Spieler wird verfolgt... Drücken Sie eine beliebige Taste, um zu stoppen.",
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
    "title-track": "Spieler verfolgen (Ziel 🎯)",
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
    "title-playlist": "Playlist",
    "title-tagging": "Ereignisse",
    "title-create-pl": "Playlist Erstellen",
    "title-rename-pl": "Name Bearbeiten",
    "title-delete-pl": "Playlist Löschen",
    "title-delete-selected": "Auswahl Löschen",
    "title-dp-tools": "Zeichenwerkzeuge",
    "title-undo": "Rückgängig (Ctrl+Z)",
    "title-redo": "Wiederholen (Ctrl+Y)",
    "title-clear-all": "Alles Löschen",
    "title-add-shortcut": "Tastenkürzel Hinzufügen",
    "title-export-csv": "Ereignisse als CSV Exportieren (📤)",
    "title-import-metrica": "CSV-Ereignisse Importieren (📥)",
    "title-clipin-set": "Anfang: {0} (I)",
    "title-clipout-set": "Ende: {0} (O)",
    "title-cut-ready": "Schneiden {0} → {1} ({2}s) — X",
    "title-edit-count": "Zeichenmodus (E) — {0} Anmerkung(en)",
    "license-badge-free": "Pro Aktivieren ⚡",
    "license-badge-pro": "PRO AKTIV ✓",
    "license-placeholder": "Ex: 490A40CB-B120-4993-BEA7-...",
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
    "toast-limit-track": "⚠️ Test-Limit: Sie haben das Tracking bereits 5 Mal verwendet. Kaufen Sie Pro für unbegrenzte Nutzung!",
    "toast-track-free-limit": "⚠️ Free-Tracking auf 2 Sekunden Clip begrenzt...",
    "toast-track-analyzing": "🎯 Spielerbewegung wird analysiert und fixiert...",
    "toast-track-success-trial": "🎉 Tracking abgeschlossen (Test {0} von 5). Kaufen Sie Pro!",
    "toast-track-success-pro": "✅ Tracking abgeschlossen: {0} Punkte aufgezeichnet!",
    "toast-track-error": "❌ Tracking fehlgeschlagen: {0}",
    "toast-limit-annotations": "⚠️ Free-Limit: Maximum von 3 Anmerkungen pro Video erreicht. Kaufen Sie Pro für unbegrenzte Anmerkungen!",
    "toast-limit-annotations-short": "⚠️ Free-Limit: Maximum von 3 Anmerkungen pro Video erreicht.",
    "toast-link-players": "🔗 Elastische Verbindungslinie zwischen beiden Spielern aktiv!",
    "toast-attach-player": "🚗 Anmerkung an Spieler angeheftet!",
    "toast-ann-removed": "🗑️ Markierung entfernt",
    "toast-open-folder": "Ordner öffnen",
    "toast-preparing-video": "⏳ Video wird vorbereitet...",
    "toast-transcoding": "⏳ Video wird in kompatibles Format konvertiert ({0}%)...",
    "toast-video-loaded": "✅ Video erfolgreich geladen!",
    "toast-video-err": "❌ Fehler beim Konvertieren des Videos: {0}",
    "toast-playback-err": "❌ Fehler bei der Videowiedergabe: {0}",
    "toast-set-in-out": "❌ Setzen Sie zuerst In- (I) und Out- (O) Punkte auf der Timeline",
    "toast-clip-added-pl": "✅ Clip erfolgreich zur Playlist hinzugefügt!",
    "toast-pl-empty": "❌ Die Playlist ist leer.",
    "toast-pl-invalid": "❌ {0} Clip(s) mit ungültigem Videopfad.",
    "toast-pl-prep": "⏳ {0} Clip(s) mit Anmerkungen werden vorbereitet…",
    "toast-pl-exporting": "⏳ {0} Clip(s) werden exportiert…",
    "toast-pl-success": "✅ Playlist erfolgreich exportiert!",
    "toast-auto-pause": "⏸️ Automatische Analysepause",
    "toast-event-tagged": "🏷️ Ereignis markiert: {0}",
    "toast-event-added-pl": "✅ Ereignis zur Playlist hinzugefügt!",
    "toast-event-already-pl": "ℹ️ Dieses Ereignis ist bereits in der Playlist",
    "toast-sc-min": "⚠️ Sie müssen mindestens 1 Tastenkombination konfiguriert haben",
    "toast-sc-limit": "⚠️ Limit erreicht: Sie können nur Tastenkombinationen 1 bis 9 konfigurieren",
    "toast-sc-added": "✅ Tastenkombination (Taste {0}) hinzugefügt! Namen unten eingeben.",
    "toast-export-csv-empty": "⚠️ Keine registrierten Ereignisse zum Exportieren!",
    "toast-export-csv-success": "✅ {0} Ereignisse erfolgreich exportiert!",
    "toast-import-csv-success": "✅ {0} Ereignisse erfolgreich aus CSV importiert!",
    "toast-import-csv-empty": "⚠️ CSV-Datei leer oder ohne gültige Daten.",
    "toast-import-csv-cols": "⚠️ CSV-Spalten konnten nicht erkannt werden.",
    "toast-cutting-render": "✂️ Elemente werden verarbeitet und ins Video eingebrannt...",
    "toast-cutting-fast": "✂️ Schneiden...",
    "sb-playlist-title": "Taktische Playlists",
    "select-playlist-prompt": "-- Playlist Auswählen --",
    "sb-add-current-btn": "+ Aktuelle Auswahl Hinzufügen",
    "sb-clips-label": "Clips in der Playlist",
    "sb-tagging-title": "Ereignis-Panel",
    "sb-tag-config": "Tastenkombinationen Konfigurieren",
    "tag-info-desc": "Drücken Sie die Tasten auf der Tastatur, um Ereignisse rückwirkend zu markieren (5s vor bis 3s danach).",
    "sb-tagged-events": "Registrierte Ereignisse",
    "tag-new-event": "Neues Ereignis"
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
  const oldLang = currentAppLang;
  if (!appTranslations[lang]) lang = 'en';
  currentAppLang = lang;
  localStorage.setItem('fv_app_lang', lang);
  
  if (typeof translateDefaultShortcuts === 'function') {
    translateDefaultShortcuts(oldLang, lang);
  }
  
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
  if (typeof loadPlaylists === 'function') {
    try { localStorage.removeItem('fv_playlists'); } catch(e){} loadPlaylists();
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

// ── Playlists & Tagging UI Elements ───────────────────────
const btnTogglePlaylist      = document.getElementById('btnTogglePlaylist')
const btnToggleTagging       = document.getElementById('btnToggleTagging')
const playlistSidebar        = document.getElementById('playlistSidebar')
const taggingSidebar         = document.getElementById('taggingSidebar')
const btnCreatePlaylist      = document.getElementById('btnCreatePlaylist')
const playlistSelect         = document.getElementById('playlistSelect')
const btnRenamePlaylist      = document.getElementById('btnRenamePlaylist')
const btnDeletePlaylist      = document.getElementById('btnDeletePlaylist')
const playlistRenameInput    = document.getElementById('playlistRenameInput')
const clipList               = document.getElementById('clipList')
const tagShortcutsList       = document.getElementById('tagShortcutsList')
const taggedEventsList       = document.getElementById('taggedEventsList')
const btnAddCurrentToPlaylist = document.getElementById('btnAddCurrentToPlaylist')
const btnExportPlaylist       = document.getElementById('btnExportPlaylist')
const btnAddTagShortcut       = document.getElementById('btnAddTagShortcut')

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
  
  showToast(t('toast-license-checking', '⏳ A verificar chave...'), 0);
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
    showToast(t('toast-license-deactivating', '⏳ A remover licença...'), 0);
    const res = await ipcRenderer.invoke('deactivate-license');
    if (res.success) {
      showToast(t('toast-license-deactivated', '✅ Licença desativada.'), 3000);
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

const NATIVE_FORMATS = ['.mp4', '.webm', '.mkv', '.ogg']
let currentPlaybackPath = null
let lastTranscodedTempPath = null
let isTranscoding = false

function cleanupLastTranscodedFile() {
  if (lastTranscodedTempPath) {
    try {
      const fs = require('fs')
      if (fs.existsSync(lastTranscodedTempPath)) {
        fs.unlink(lastTranscodedTempPath, (err) => {
          if (err) console.warn('Failed to delete temp video file:', err)
        })
      }
    } catch (e) {
      console.warn('Error cleaning up temp video file:', e)
    }
    lastTranscodedTempPath = null
  }
}

// ── Open file ─────────────────────────────────────────────
async function openFile() {
  const filePath = await ipcRenderer.invoke('open-file-dialog')
  if (!filePath) return
  loadVideo(filePath)
}

function loadVideo(filePath) {
  // Clean up any previous transcoded temp file
  cleanupLastTranscodedFile()

  clip.inputPath = filePath
  clip.inTime    = null
  clip.outTime   = null
  ds.annotations = []
  ds.current     = null
  taggedEvents   = []
  if (typeof renderTaggedEvents === 'function') {
    renderTaggedEvents()
  }
  resetClipUI()
  redraw()
  updateTimelineMarkers()
  updateAnnotationBadge()
  setTimeout(resizeCanvas, 100)

  // Set filename and display player
  filenameLabel.textContent = path.basename(filePath)
  emptyState.style.display  = 'none'
  playerWrap.style.display  = 'flex'

  const ext = path.extname(filePath).toLowerCase()
  if (NATIVE_FORMATS.includes(ext)) {
    currentPlaybackPath = filePath
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/')
    video.src = fileUrl
    video.load()
    video.play()
    
    // Auto-load annotations if they exist for this video
    setTimeout(() => loadAnnotations(filePath), 400)
  } else {
    startTranscoding(filePath)
  }
}

async function startTranscoding(filePath) {
  if (isTranscoding) return
  isTranscoding = true
  
  showToast(t('toast-preparing-video', '⏳ A preparar vídeo...'), 0)
  
  const progressListener = (event, { percent }) => {
    showToast(t('toast-transcoding', '⏳ A converter vídeo para formato compatível ({0}%)...', percent), 0)
  }
  ipcRenderer.on('transcode-progress', progressListener)
  
  try {
    const res = await ipcRenderer.invoke('transcode-video', { inputPath: filePath })
    ipcRenderer.removeListener('transcode-progress', progressListener)
    isTranscoding = false
    
    if (res.success) {
      currentPlaybackPath = res.outputPath
      lastTranscodedTempPath = res.outputPath
      
      const fileUrl = 'file:///' + res.outputPath.replace(/\\/g, '/')
      video.src = fileUrl
      video.load()
      video.play()
      
      showToast(t('toast-video-loaded', '✅ Vídeo carregado com sucesso!'), 3000)
      
      // Auto-load annotations
      setTimeout(() => loadAnnotations(filePath), 400)
    } else {
      showToast(t('toast-video-err', '❌ Erro ao converter vídeo: {0}', res.error), 5000)
    }
  } catch (err) {
    ipcRenderer.removeListener('transcode-progress', progressListener)
    isTranscoding = false
    showToast(t('toast-video-err', '❌ Falha na transcodificação: {0}', err.message), 5000)
  }
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
video.addEventListener('error', async () => {
  if (clip.inputPath && currentPlaybackPath === clip.inputPath && !isTranscoding) {
    console.warn("Video element failed to play original file. Falling back to transcoding.")
    await startTranscoding(clip.inputPath)
  } else {
    const err = video.error
    const msg = err ? `Código ${err.code}: ${err.message || 'Erro de descodificação'}` : 'Erro desconhecido'
    showToast(t('toast-playback-err', '❌ Erro ao reproduzir vídeo: {0}', msg), 5000)
  }
})

// ── RAF render loop ───────────────────────────────────────
let rafId = null
function startRenderLoop() {
  if (rafId) return
  function loop() {
    if (!video.paused && video.duration) {
      updateProgress((video.currentTime / video.duration) * 100)
      timeCurrent.textContent = formatTime(video.currentTime)
      checkAutoPause()
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
  // Ignorar atalhos se o utilizador estiver a escrever num campo de input/select
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
    return
  }
  if (e.code === 'KeyE' && !e.ctrlKey) { toggleEditMode(); return }
  if (e.code === 'KeyZ' && e.ctrlKey && !e.shiftKey) { undoDraw(); return }
  if ((e.code === 'KeyY' && e.ctrlKey) || (e.code === 'KeyZ' && e.ctrlKey && e.shiftKey)) { redoDraw(); return }
  if (e.code === 'KeyI' && !e.ctrlKey) { markIn(); return }
  if (e.code === 'KeyO' && !e.ctrlKey) { markOut(); return }
  if (e.code === 'KeyX' && !e.ctrlKey) { if (!btnCut.disabled) doCut(); return }
  
  if (Object.keys(shortcutKeys).includes(e.key)) {
    if (video.src) handleTagEvent(e.key)
    return
  }

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
      annotations: ds.annotations,
      taggedEvents: taggedEvents,
      shortcutKeys: shortcutKeys,
      playlists:   playlists
    })
  } catch (e) {
    console.warn('Could not save annotations:', e)
  }
}

async function loadAnnotations(videoPath) {
  try {
    const result = await ipcRenderer.invoke('load-annotations', videoPath)
    
    // Carregar eventos registados para este vídeo
    taggedEvents = result.taggedEvents || []
    if (typeof renderTaggedEvents === 'function') {
      renderTaggedEvents()
    }
    
    // Carregar atalhos de eventos para este vídeo (ou usar padrão do idioma se for novo)
    const defaultKeys = {
      pt: {
        '1': 'Remate Feito',
        '2': 'Remate Sofrido',
        '3': 'Perda de Bola',
        '4': 'Recuperação'
      },
      en: {
        '1': 'Shot Taken',
        '2': 'Shot Conceded',
        '3': 'Possession Lost',
        '4': 'Possession Recovered'
      },
      es: {
        '1': 'Tiro Realizado',
        '2': 'Tiro Concedido',
        '3': 'Posesión Perdida',
        '4': 'Recuperación'
      },
      fr: {
        '1': 'Tir Effectué',
        '2': 'Tir Concédé',
        '3': 'Ballon Perdu',
        '4': 'Ballon Récupéré'
      },
      de: {
        '1': 'Torschuss',
        '2': 'Torschuss erlitten',
        '3': 'Ballverlust',
        '4': 'Balleroberung'
      }
    };
    let lang = currentAppLang;
    if (!defaultKeys[lang]) lang = 'en';
    
    if (result.success && result.shortcutKeys && Object.keys(result.shortcutKeys).length > 0) {
      shortcutKeys = result.shortcutKeys
    } else {
      shortcutKeys = JSON.parse(JSON.stringify(defaultKeys[lang]))
      // Guardar localmente no ficheiro do vídeo o padrão inicial
      setTimeout(() => {
        saveShortcutNames()
      }, 100)
    }
    
    // Garantir que nenhum atalho fica vazio
    Object.keys(shortcutKeys).forEach(key => {
      if (!shortcutKeys[key] || shortcutKeys[key].trim() === '') {
        shortcutKeys[key] = defaultKeys[lang][key] || `Evento ${key}`;
      }
    });
    
    if (typeof renderShortcutList === 'function') {
      renderShortcutList()
    }

    // Carregar Playlists exclusivas para este vídeo
    const videoStorageKey = 'fv_playlists_' + Buffer.from(videoPath).toString('hex');
    let savedVideoPlaylists = null;
    try {
      savedVideoPlaylists = JSON.parse(localStorage.getItem(videoStorageKey));
    } catch(e){}
    
    playlists = (result.playlists && result.playlists.length > 0) 
      ? result.playlists 
      : (savedVideoPlaylists && savedVideoPlaylists.length > 0 ? savedVideoPlaylists : []);
      
    activePlaylistId = playlists.length > 0 ? playlists[0].id : null;
    loadPlaylists();
    
    if (result.success && result.annotations && result.annotations.length > 0) {
      ds.annotations = result.annotations
      redraw()
      updateTimelineMarkers()
      updateAnnotationBadge()
      showToast(t('toast-load-success', '📂 {0} anotação(ões) carregada(s)', result.annotations.length), 2500)
    } else {
      ds.annotations = []
      redraw()
      updateTimelineMarkers()
      updateAnnotationBadge()
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
  btnClipIn.title = t('title-clipin-set', `Inicio: {0} (I)`, formatTime(clip.inTime))
  updateClipUI()
}
function markOut() {
  if (!video.src) return
  clip.outTime = video.currentTime
  btnClipOut.classList.add('set-out')
  btnClipOut.title = t('title-clipout-set', `Fim: {0} (O)`, formatTime(clip.outTime))
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
    btnCut.title = t('title-cut-ready', `Cortar {0} → {1} ({2}s) — X`, formatTime(t0), formatTime(t1), (t1-t0).toFixed(1))
  }
}

function resetClipUI() {
  clip.inTime = null; clip.outTime = null
  clipZone.style.display = clipInMarker.style.display = clipOutMarker.style.display = 'none'
  btnClipIn.classList.remove('set-in'); btnClipOut.classList.remove('set-out')
  btnClipIn.title  = t('title-clipin', 'Marcar início do corte (I)')
  btnClipOut.title = t('title-clipout', 'Marcar fim do corte (O)')
  btnCut.disabled  = true; btnCut.classList.remove('ready')
  btnCut.title     = t('title-cut', 'Cortar e guardar (X)')
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

async function generateOverlaySequence(startTime, duration, annotations, isProUser, vRect) {
  const targetAnns = annotations.filter(ann => {
    if (ann.duration === -1) return true
    const annEnd = ann.timestamp + ann.duration
    return ann.timestamp <= (startTime + duration) && annEnd >= startTime
  })

  let totalOverlaysCount = targetAnns.length
  const needsProcessing = totalOverlaysCount > 0 || !isProUser

  if (!needsProcessing || !vRect) return { overlaySequencePath: null, totalOverlaysCount: 0 }

  const os = require('os')
  const fs = require('fs')

  const tempDir = path.join(os.tmpdir(), `football_editor_clip_${Date.now()}_${Math.floor(Math.random()*1000)}`)
  fs.mkdirSync(tempDir, { recursive: true })

  const overlaySequencePath = path.join(tempDir, 'frame_%04d.png')

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

    if (!isProUser) {
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
    
    if (f % 15 === 0) await new Promise(r => setTimeout(r, 0))
  }

  return { overlaySequencePath, totalOverlaysCount }
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

  // ★ Generate frame-by-frame PNG sequence of all annotations
  const vRect = getVideoVisualRect()
  const seqResult = await generateOverlaySequence(startTime, duration, ds.annotations, isPro, vRect)
  let overlaySequencePath = seqResult.overlaySequencePath
  let totalOverlaysCount = seqResult.totalOverlaysCount

  const needsProcessing = overlaySequencePath !== null

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
  btn.addEventListener('click', () => { document.querySelectorAll('.dp-tool[data-tool]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); ds.tool = btn.dataset.tool
     })
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

// Remove specific annotation at point (px, py)
function removeAnnotationAt(px, py) {
  const t = video.currentTime || 0;
  for (let i = ds.annotations.length - 1; i >= 0; i--) {
    const ann = ds.annotations[i];
    if (!isVisible(ann, t)) continue;

    if (ann.tool === 'track' && ann.trajectory) {
      const pos = getTrackCenterAtTime(ann, t);
      if (pos) {
        const hitRadius = Math.max(55, (pos.pw || 30) * 1.6);
        const dist = Math.hypot(px - pos.x, py - pos.y);
        if (dist <= hitRadius) {
          const removed = ds.annotations.splice(i, 1)[0];
          ds.redoStack.push(removed);
          redraw();
          updateTimelineMarkers();
          updateAnnotationBadge();
          scheduleAnnotationSave();
          showToast(t('toast-ann-removed', '🗑️ Marcação removida'), 2000);
          return true;
        }
      }
    } else if (ann.x1 !== undefined && ann.x2 !== undefined) {
      const minX = Math.min(ann.x1, ann.x2) - 20;
      const maxX = Math.max(ann.x1, ann.x2) + 20;
      const minY = Math.min(ann.y1, ann.y2) - 20;
      const maxY = Math.max(ann.y1, ann.y2) + 20;
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        const removed = ds.annotations.splice(i, 1)[0];
        ds.redoStack.push(removed);
        redraw();
        updateTimelineMarkers();
        updateAnnotationBadge();
        scheduleAnnotationSave();
        showToast(t('toast-ann-removed', '🗑️ Marcação removida'), 2000);
        return true;
      }
    } else if (ann.points && ann.points.length > 0) {
      for (const pt of ann.points) {
        if (Math.hypot(px - pt.x, py - pt.y) <= 25) {
          const removed = ds.annotations.splice(i, 1)[0];
          ds.redoStack.push(removed);
          redraw();
          updateTimelineMarkers();
          updateAnnotationBadge();
          scheduleAnnotationSave();
          showToast(t('toast-ann-removed', '🗑️ Marcação removida'), 2000);
          return true;
        }
      }
    }
  }
  return false;
}

// Mouse drawing & right-click deletion
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (!ds.enabled) return;
  const pos = getPos(e);
  removeAnnotationAt(pos.x, pos.y);
});

canvas.addEventListener('mousedown', e => {
  if (!ds.enabled) return;
  e.preventDefault();

  if (e.button === 2) {
    const pos = getPos(e);
    removeAnnotationAt(pos.x, pos.y);
    return;
  }

  if (e.button !== 0) return;

  ds.drawing = true;
  const pos = getPos(e);
  if (ds.tool === 'pencil') ds.current = { tool: 'pencil', color: ds.color, width: ds.width, points: [pos] };
  else ds.current = { tool: ds.tool, color: ds.color, width: ds.width, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y };
});

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
  let isTiny = ann.tool !== 'pencil' && Math.abs(ann.x2 - ann.x1) < 3 && Math.abs(ann.y2 - ann.y1) < 3

  // 1-Click Player/Ball Tracking
  if (ann.tool === 'track' && Math.abs(ann.x2 - ann.x1) < 10 && Math.abs(ann.y2 - ann.y1) < 10) {
    const vRect = getVideoVisualRect()
    if (vRect) {
      if (typeof calibrationState !== 'undefined' && calibrationState.isBallMode) {
        const bSize = Math.max(20, vRect.displayWidth * 0.02)
        ann.x1 = ann.x1 - bSize / 2
        ann.x2 = ann.x1 + bSize
        ann.y1 = ann.y1 - bSize / 2
        ann.y2 = ann.y1 + bSize
        ann.isBall = true
        ann.color = '#ffff00'
        calibrationState.isBallMode = false
        const btnBall = document.getElementById('btnToggleBallMode')
        if (btnBall) btnBall.classList.remove('active')
      } else {
        const boxW = Math.max(34, vRect.displayWidth * 0.038)
        const boxH = Math.max(62, vRect.displayHeight * 0.085)
        ann.x1 = ann.x1 - boxW / 2
        ann.x2 = ann.x1 + boxW
        ann.y1 = ann.y1 - boxH * 0.78
        ann.y2 = ann.y1 + boxH
        if (!ann.color || ann.color === '#ffffff') {
          ann.color = '#00ff88'
        }
      }
      isTiny = false
    }
  }

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
          showToast(t('toast-track-free-limit', '⚠️ Rastreio Free limitado a 2 segundos de clipe...'), 3500);
        } else {
          showToast(t('toast-track-analyzing', '🎯 A analisar e fixar movimento no jogador...'), 0);
        }

        const result = await ipcRenderer.invoke('track-player', {
          videoPath: currentPlaybackPath || clip.inputPath,
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
            showToast(t('toast-track-success-trial', '🎉 Rastreio concluído (Teste {0} de 5). Adquire o Pro!', trackingTrialCount), 5000);
          } else {
            showToast(t('toast-track-success-pro', '✅ Rastreio concluído: {0} pontos gravados!', result.totalPoints), 3500);
          }
        } else {
          showToast(t('toast-track-error', '❌ Falha no rastreio: {0}', result.error || 'Erro'), 4000)
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

  const trackColor = (!ann.color || ann.color.toLowerCase() === '#ffffff') ? '#00ff88' : ann.color

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

  // ── Draw Jersey Number Badge or Ball Emoji ──
  if (ann.isBall) {
    c.font = '12px Outfit, sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('⚽', px, py - ry - 6)
  } else if (ann.playerNum !== undefined) {
    const badgeR = 10
    const badgeY = py - ry - badgeR - 2

    // Badge Circle & Glow
    c.beginPath()
    c.arc(px, badgeY, badgeR, 0, Math.PI * 2)
    c.fillStyle = trackColor
    c.shadowColor = trackColor
    c.shadowBlur = 10
    c.fill()

    // White Border
    c.strokeStyle = '#ffffff'
    c.lineWidth = 1.5
    c.shadowBlur = 0
    c.stroke()

    // Number text
    c.fillStyle = '#ffffff'
    c.font = 'bold 10px Outfit, system-ui, sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(ann.playerNum.toString(), px, badgeY + 0.5)
  }

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

// Timeline markers (Annotations & Tagged Events)
function updateTimelineMarkers() {
  document.querySelectorAll('.tl-marker, .tl-event-marker, .tl-event-range').forEach(m => m.remove())
  if (!video.duration) return

  // 1. Drawing / Annotation markers (colored circles)
  const buckets = new Map()
  for (const ann of ds.annotations) buckets.set(Math.round(ann.timestamp * 2), ann)
  for (const [, ann] of buckets) {
    const pct = (ann.timestamp / video.duration) * 100
    const m   = document.createElement('div')
    m.className = 'tl-marker'
    m.style.left = pct + '%'
    m.style.background = ann.color || '#00ff88'
    m.style.boxShadow = `0 0 7px ${ann.color || '#00ff88'}dd, 0 0 2px ${ann.color || '#00ff88'}`
    m.title = formatTime(ann.timestamp)
    m.addEventListener('click', ev => {
      ev.stopPropagation()
      video.currentTime = ann.timestamp
      updateProgress(pct)
      timeCurrent.textContent = formatTime(ann.timestamp)
      redraw()
    })
    progressBar.appendChild(m)
  }

  // 2. Tagged Event markers (golden diamond markers)
  if (typeof taggedEvents !== 'undefined' && Array.isArray(taggedEvents)) {
    taggedEvents.forEach(ev => {
      const evPct = Math.max(0, Math.min(100, (ev.time / video.duration) * 100))
      const marker = document.createElement('div')
      marker.className = 'tl-event-marker'
      marker.style.left = evPct + '%'
      marker.title = `🏷️ ${ev.name} (${formatTime(ev.time)})`
      marker.addEventListener('click', e => {
        e.stopPropagation()
        video.currentTime = ev.inTime !== undefined ? ev.inTime : ev.time
        updateProgress((video.currentTime / video.duration) * 100)
        timeCurrent.textContent = formatTime(video.currentTime)
        redraw()
        showToast(`🏷️ Evento: ${ev.name}`, 2000)
      })
      progressBar.appendChild(marker)
    })
  }
}

function updateAnnotationBadge() {
  const count = ds.annotations.length
  if (count > 0) { btnEditMode.dataset.count = count; btnEditMode.title = t('title-edit-count', `Modo de desenho (E) — {0} anotação(ões)`, count) }
  else { delete btnEditMode.dataset.count; btnEditMode.title = t('title-edit', 'Modo de desenho (E)') }
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
    el.style.transform = 'none';
    
    // grabOffset em coordenadas relativas ao player-center
    const playerCenter = document.querySelector('.player-center');
    const pcRect = playerCenter ? playerCenter.getBoundingClientRect() : { left: 0, top: 0 };
    grabOffsetX = (e.clientX - pcRect.left) - el.offsetLeft;
    grabOffsetY = (e.clientY - pcRect.top) - el.offsetTop;
    
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    
    const playerCenter = document.querySelector('.player-center');
    if (!playerCenter) return;
    const playerRect = playerCenter.getBoundingClientRect();
    const controlsEl = document.getElementById('controls');
    if (!controlsEl) return;
    const controlsRect = controlsEl.getBoundingClientRect();
    
    // Altura útil da área do player (excluindo a barra de controlos do fundo)
    const activeHeight = controlsRect.top - playerRect.top;
    
    const snapThreshold = 80; // Pixels de distância das bordas do player-center para colar
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Converter coordenadas do cursor para o espaço local do player-center
    const localMouseX = mouseX - playerRect.left;
    const localMouseY = mouseY - playerRect.top;
    
    // Snap zones relativas ao player-center (não ao window!)
    const closeToLeft   = localMouseX < snapThreshold;
    const closeToRight  = localMouseX > playerRect.width - snapThreshold;
    const closeToTop    = localMouseY < snapThreshold;
    const closeToBottom = localMouseY > activeHeight - snapThreshold;
    
    let distLeft   = localMouseX;
    let distRight  = playerRect.width - localMouseX;
    let distTop    = localMouseY;
    let distBottom = activeHeight - localMouseY;
    
    let edges = [
      { name: 'left',   dist: distLeft,   active: closeToLeft },
      { name: 'right',  dist: distRight,  active: closeToRight },
      { name: 'top',    dist: distTop,    active: closeToTop },
      { name: 'bottom', dist: distBottom, active: closeToBottom }
    ];
    
    let activeSnaps = edges.filter(ed => ed.active).sort((a, b) => a.dist - b.dist);
    
    if (activeSnaps.length > 0) {
      const targetEdge = activeSnaps[0].name;
      dockedEdge = targetEdge;
      
      el.classList.remove('dock-left', 'dock-right', 'dock-top', 'dock-bottom');
      el.classList.add('dock-' + targetEdge);
      
      if (targetEdge === 'left') {
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
        el.style.left = '';
        el.style.right = '';
        el.style.top = '';
        el.style.bottom = '';
      }
    } else {
      // ── FLUTUAÇÃO LIVRE NO MEIO ──
      dockedEdge = 'none';
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
    
    const playerCenter = document.querySelector('.player-center');
    if (!playerCenter || document.getElementById('playerWrap')?.style.display === 'none') return;
    
    const playerRect = playerCenter.getBoundingClientRect();
    const controlsEl = document.getElementById('controls');
    if (!controlsEl) return;
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

// ── Playlists & Tagging Logic (Fase 1) ────────────────────

// 1. Alternar visualização dos painéis laterais (Sidebar toggles)
if (btnTogglePlaylist && playlistSidebar) {
  btnTogglePlaylist.addEventListener('click', () => {
    playlistSidebar.classList.toggle('collapsed');
    btnTogglePlaylist.classList.toggle('active');
    setTimeout(resizeCanvas, 250);
  });
}

if (btnToggleTagging && taggingSidebar) {
  btnToggleTagging.addEventListener('click', () => {
    taggingSidebar.classList.toggle('collapsed');
    btnToggleTagging.classList.toggle('active');
    setTimeout(resizeCanvas, 250);
  });
}

// 2. Criar e gerir Playlists (Específicas por Vídeo)
function loadPlaylists() {
  if (!playlistSelect) return;
  
  if (!clip.inputPath) {
    playlists = [];
    activePlaylistId = null;
    playlistSelect.innerHTML = '<option value="">-- ' + (appTranslations[currentAppLang] && appTranslations[currentAppLang]['select-playlist-prompt'] || 'Escolher Playlist') + ' --</option>';
    updatePlaylistButtons();
    renderClips();
    return;
  }
  
  // Limpar select e popular
  playlistSelect.innerHTML = '';
  
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = (appTranslations[currentAppLang] && appTranslations[currentAppLang]['select-playlist-prompt']) || '-- Escolher Playlist --';
  playlistSelect.appendChild(defaultOpt);
  
  // Garantir que existe pelo menos uma Playlist 1 caso a lista esteja vazia para este vídeo
  if (!playlists || playlists.length === 0) {
    playlists = [{
      id: 'playlist_' + Date.now(),
      name: 'Playlist 1',
      clips: []
    }];
    savePlaylists();
  }
  
  playlists.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.textContent = pl.name;
    playlistSelect.appendChild(opt);
  });
  
  if (!activePlaylistId || !playlists.find(p => p.id === activePlaylistId)) {
    activePlaylistId = playlists.length > 0 ? playlists[0].id : null;
  }
  
  if (activePlaylistId) {
    playlistSelect.value = activePlaylistId;
  }
  
  updatePlaylistButtons();
  renderClips();
}

function savePlaylists() {
  if (!clip.inputPath) return;
  // Guardar no ficheiro local de anotações do vídeo e no storage específico deste vídeo
  const videoStorageKey = 'fv_playlists_' + Buffer.from(clip.inputPath).toString('hex');
  localStorage.setItem(videoStorageKey, JSON.stringify(playlists));
  saveAnnotations();
}

function updatePlaylistButtons() {
  const isSelected = !!activePlaylistId;
  const currentPl = playlists.find(p => p.id === activePlaylistId);
  const hasClips = !!(currentPl && currentPl.clips && currentPl.clips.length > 0);

  if (btnAddCurrentToPlaylist) {
    btnAddCurrentToPlaylist.disabled = !isSelected;
  }
  if (btnExportPlaylist) {
    btnExportPlaylist.disabled = !hasClips;
  }
  if (btnRenamePlaylist) {
    btnRenamePlaylist.style.display = isSelected ? 'flex' : 'none';
  }
  if (btnDeletePlaylist) {
    btnDeletePlaylist.style.display = isSelected ? 'flex' : 'none';
  }
}

if (btnCreatePlaylist) {
  btnCreatePlaylist.addEventListener('click', () => {
    const plCount = playlists.length + 1;
    const defaultName = `Playlist ${plCount}`;
    
    // Evitar quebra no Electron caso o prompt não seja suportado nativamente
    let name = defaultName;
    try {
      if (typeof prompt !== 'undefined') {
        const userInput = prompt("Nome da nova playlist tática:", defaultName);
        if (userInput === null) return; // Cancelado pelo utilizador
        if (userInput.trim()) name = userInput.trim();
      }
    } catch (e) {
      console.warn("window.prompt não é suportado pelo Electron. Usando nome padrão:", defaultName);
    }
    
    const newPl = {
      id: 'playlist_' + Date.now(),
      name: name,
      clips: []
    };
    
    playlists.push(newPl);
    savePlaylists();
    activePlaylistId = newPl.id;
    loadPlaylists();
    renderClips();
  });
}

if (playlistSelect) {
  playlistSelect.addEventListener('change', (e) => {
    activePlaylistId = e.target.value;
    updatePlaylistButtons();
    renderClips();
  });
}

if (btnRenamePlaylist && playlistRenameInput && playlistSelect) {
  btnRenamePlaylist.addEventListener('click', () => {
    if (!activePlaylistId) return;
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (!currentPl) return;
    
    // Configurar o input de renomeação
    playlistRenameInput.value = currentPl.name;
    
    // Alternar visibilidades
    playlistSelect.style.display = 'none';
    btnRenamePlaylist.style.display = 'none';
    if (btnDeletePlaylist) btnDeletePlaylist.style.display = 'none';
    
    playlistRenameInput.style.display = 'block';
    playlistRenameInput.focus();
    playlistRenameInput.select();
  });

  const finishRename = () => {
    if (playlistRenameInput.style.display === 'none') return;
    
    if (activePlaylistId) {
      const currentPl = playlists.find(p => p.id === activePlaylistId);
      if (currentPl) {
        const val = playlistRenameInput.value.trim();
        if (val && val !== currentPl.name) {
          currentPl.name = val;
          savePlaylists();
          loadPlaylists();
        }
      }
    }
    
    // Restaurar visibilidades
    playlistRenameInput.style.display = 'none';
    playlistSelect.style.display = 'block';
    updatePlaylistButtons();
  };

  playlistRenameInput.addEventListener('blur', finishRename);
  playlistRenameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishRename();
    } else if (e.key === 'Escape') {
      // Cancelar renomeação sem salvar
      playlistRenameInput.style.display = 'none';
      playlistSelect.style.display = 'block';
      updatePlaylistButtons();
    }
  });
}

if (btnDeletePlaylist) {
  btnDeletePlaylist.addEventListener('click', () => {
    if (!activePlaylistId) return;
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (!currentPl) return;
    
    if (confirm(`Tens a certeza que pretendes eliminar a playlist "${currentPl.name}" e todos os seus clips?`)) {
      playlists = playlists.filter(p => p.id !== activePlaylistId);
      activePlaylistId = null;
      savePlaylists();
      loadPlaylists();
      renderClips();
    }
  });
}

// 3. Adicionar clip atual à playlist
if (btnAddCurrentToPlaylist) {
  btnAddCurrentToPlaylist.addEventListener('click', () => {
    if (!activePlaylistId || !clip.inputPath) return;
    if (clip.inTime === null || clip.outTime === null) {
      showToast(t("toast-set-in-out", "❌ Define primeiro o ponto de In (I) e Out (O) na barra de tempo"), 3000);
      return;
    }
    
    const t0 = Math.min(clip.inTime, clip.outTime);
    const t1 = Math.max(clip.inTime, clip.outTime);
    
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (!currentPl) return;
    
    const defaultTitle = "Corte " + (currentPl.clips.length + 1);
    let title = defaultTitle;
    try {
      if (typeof prompt !== 'undefined') {
        const userInput = prompt("Título para o clip tático:", defaultTitle);
        if (userInput === null) return; // Cancelado
        if (userInput.trim()) title = userInput.trim();
      }
    } catch (e) {
      console.warn("window.prompt não é suportado pelo Electron. Usando título padrão.");
    }
    
    const clipTitle = title;
    
    // Clonar e ajustar os timestamps das anotações criadas antes do início do clip
    // Filtrar anotações que foram criadas especificamente para este clip
    // (Aceitamos anotações criadas até 2 segundos antes do início do clip para dar margem)
    const overlappingAnns = ds.annotations.filter(ann => {
      return ann.timestamp >= t0 - 2 && ann.timestamp <= t1;
    });
    
    const targetClones = JSON.parse(JSON.stringify(overlappingAnns));
    targetClones.forEach(ann => {
      if (ann.timestamp < t0) {
        ann.timestamp = t0;
      }
    });
    
    currentPl.clips.push({
      id: 'clip_' + Date.now(),
      title: clipTitle,
      videoPath: clip.inputPath,
      inTime: t0,
      outTime: t1,
      annotations: targetClones // Usar as anotações com o alinhamento de início
    });
    savePlaylists();
    renderClips();
    showToast(t("toast-clip-added-pl", "✅ Clip adicionado à playlist com sucesso!"), 3000);
  });
}

// 4. Renderizar lista de clips da playlist ativa
function renderClips() {
  if (!clipList) return;
  clipList.innerHTML = '';
  if (!activePlaylistId) return;
  
  const currentPl = playlists.find(p => p.id === activePlaylistId);
  if (!currentPl || !currentPl.clips) return;
  
  let dragSrcIndex = null;

  currentPl.clips.forEach((cl, index) => {
    const li = document.createElement('li');
    li.className = 'clip-item';
    li.dataset.id = cl.id;
    li.draggable = true;

    // ── Drag handle
    const handle = document.createElement('span');
    handle.className = 'clip-drag-handle';
    handle.innerHTML = '⠿';
    handle.title = 'Arrastar para reordenar';

    // ── Info
    const info = document.createElement('div');
    info.className = 'clip-info';
    
    const title = document.createElement('span');
    title.className = 'clip-title';
    title.textContent = `${index + 1}. ${cl.title}`;

    // Double-click to rename clip
    title.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sc-name-input';
      input.value = cl.title;
      input.style.cssText = 'font-size:12px;padding:2px 6px;width:100%;';
      const save = () => {
        const v = input.value.trim();
        if (v) cl.title = v;
        savePlaylists();
        renderClips();
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', k => { if (k.key === 'Enter') save(); if (k.key === 'Escape') renderClips(); });
      info.replaceChild(input, title);
      input.focus(); input.select();
    });
    
    const time = document.createElement('span');
    time.className = 'clip-time';
    time.textContent = `${formatTime(cl.inTime)} → ${formatTime(cl.outTime)} (${(cl.outTime - cl.inTime).toFixed(1)}s)`;
    
    info.appendChild(title);
    info.appendChild(time);
    
    // ── Actions
    const actions = document.createElement('div');
    actions.className = 'clip-actions';
    
    const delBtn = document.createElement('button');
    delBtn.className = 'clip-act-btn delete';
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Remover da Playlist';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Remover "${cl.title}" da playlist?`)) {
        currentPl.clips.splice(index, 1);
        savePlaylists();
        renderClips();
        updatePlaylistButtons();
      }
    });
    
    actions.appendChild(delBtn);
    
    li.appendChild(handle);
    li.appendChild(info);
    li.appendChild(actions);
    
    // ── Drag events for reordering
    li.addEventListener('dragstart', (e) => {
      dragSrcIndex = index;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('.clip-item').forEach(el => el.classList.remove('drag-over'));
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.clip-item').forEach(el => el.classList.remove('drag-over'));
      li.classList.add('drag-over');
    });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (dragSrcIndex === null || dragSrcIndex === index) return;
      const moved = currentPl.clips.splice(dragSrcIndex, 1)[0];
      currentPl.clips.splice(index, 0, moved);
      dragSrcIndex = null;
      savePlaylists();
      renderClips();
    });

    // ── Click to play (but not when dragging or editing)
    // ── Checkbox for bulk selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'clip-checkbox';
    checkbox.dataset.id = cl.id;
    checkbox.addEventListener('click', (e) => e.stopPropagation());
    checkbox.addEventListener('change', () => {
      updateBulkActions(currentPl);
    });

    li.addEventListener('click', (e) => {
      if (e.target === handle || e.target === checkbox) return;
      if (info.querySelector('input')) return;
      document.querySelectorAll('.clip-item').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      playPlaylistClip(cl);
    });

    li.insertBefore(checkbox, handle);
    clipList.appendChild(li);
  });

  // Show/hide the clipsHeader based on whether there are clips
  const clipsHeader = document.getElementById('clipsHeader');
  const checkSelectAll = document.getElementById('checkSelectAll');
  const btnDeleteSelected = document.getElementById('btnDeleteSelected');

  if (clipsHeader) {
    clipsHeader.style.display = currentPl.clips.length > 0 ? 'flex' : 'none';
  }
  if (checkSelectAll) {
    checkSelectAll.checked = false;
    checkSelectAll.indeterminate = false;
    checkSelectAll.onchange = () => {
      const cbs = clipList.querySelectorAll('.clip-checkbox');
      cbs.forEach(cb => { cb.checked = checkSelectAll.checked; });
      updateBulkActions(currentPl);
    };
  }

  function updateBulkActions(pl) {
    const cbs = clipList.querySelectorAll('.clip-checkbox');
    const checked = [...cbs].filter(cb => cb.checked);
    if (checkSelectAll) {
      checkSelectAll.checked = checked.length === cbs.length && cbs.length > 0;
      checkSelectAll.indeterminate = checked.length > 0 && checked.length < cbs.length;
    }
    if (btnDeleteSelected) {
      btnDeleteSelected.style.display = checked.length > 0 ? 'flex' : 'none';
      btnDeleteSelected.onclick = () => {
        const selectedIds = new Set(checked.map(cb => cb.dataset.id));
        if (confirm(`Eliminar ${selectedIds.size} clip(s) selecionado(s)?`)) {
          pl.clips = pl.clips.filter(c => !selectedIds.has(c.id));
          savePlaylists();
          renderClips();
          updatePlaylistButtons();
        }
      };
    }
  }
}

// 4b. Exportar playlist como vídeo único
if (btnExportPlaylist) {
  btnExportPlaylist.addEventListener('click', async () => {
    if (!activePlaylistId) return;
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (!currentPl || !currentPl.clips || currentPl.clips.length === 0) {
      showToast(t('toast-pl-empty', '❌ A playlist está vazia.'), 3000);
      return;
    }

    // Validate all clips have a valid videoPath
    const invalid = currentPl.clips.filter(cl => !cl.videoPath);
    if (invalid.length > 0) {
      showToast(t('toast-pl-invalid', '❌ {0} clip(s) sem caminho de vídeo válido.', invalid.length), 3000);
      return;
    }

    btnExportPlaylist.disabled = true;
    btnExportPlaylist.textContent = t('btn-exporting', '⏳ A exportar...');
    showToast(t('toast-pl-prep', '⏳ A preparar {0} clip(s) com marcações…', currentPl.clips.length), 0);

    const vRect = getVideoVisualRect();
    const exportClips = [];

    for (let i = 0; i < currentPl.clips.length; i++) {
      const cl = currentPl.clips[i];
      let seqPath = null;
      
      const startTime = Math.min(cl.inTime, cl.outTime);
      const duration = Math.abs(cl.outTime - cl.inTime);
      
      const seqResult = await generateOverlaySequence(startTime, duration, cl.annotations || [], isPro, vRect);
      seqPath = seqResult.overlaySequencePath;
      
      exportClips.push({
        videoPath: cl.videoPath,
        inTime: cl.inTime,
        outTime: cl.outTime,
        overlaySequencePath: seqPath
      });
    }

    showToast(t('toast-pl-exporting', '⏳ A exportar {0} clip(s)…', currentPl.clips.length), 0);

    const result = await ipcRenderer.invoke('export-playlist', {
      clips: exportClips
    });

    btnExportPlaylist.textContent = t('btn-export-pl', '📥 Exportar Playlist');
    updatePlaylistButtons();

    if (result.success) {
      showToast(t('toast-pl-success', '✅ Playlist exportada com sucesso!'), 6000, result.outputPath);
    } else if (result.error !== 'Cancelado') {
      showToast(t('toast-export-error', '❌ Erro: {0}', result.error), 5000);
    } else {
      toast.classList.remove('show');
    }
  });
}


// 5. Reproduzir clip selecionado da playlist
async function playPlaylistClip(cl) {
  // Se for um vídeo diferente, carregar primeiro
  if (clip.inputPath !== cl.videoPath) {
    loadVideo(cl.videoPath);
    // Aguardar carregamento
    await new Promise(resolve => {
      video.addEventListener('loadedmetadata', resolve, { once: true });
    });
  }
  
  // Posicionar timeline
  clip.inTime = cl.inTime;
  clip.outTime = cl.outTime;
  video.currentTime = cl.inTime;
  
  // Restaurar anotações guardadas especificamente para este clip
  ds.annotations = JSON.parse(JSON.stringify(cl.annotations || []));
  ds.undos = [];
  ds.redos = [];
  
  updateTimelineMarkers();
  redraw();
  
  video.play().catch(e => {});
}

// 6. Pausa Automática Inteligente
function checkAutoPause() {
  if (video.paused) return;
  
  ds.annotations.forEach(ann => {
    // Se o vídeo passar pelo início de uma anotação e não tiver sido pausado recentemente nesse frame
    if (Math.abs(video.currentTime - ann.timestamp) < 0.15 && Math.abs(video.currentTime - lastPausedTime) > 1.2) {
      video.pause();
      lastPausedTime = video.currentTime;
      showToast(t("toast-auto-pause", "⏸️ Pausa automática de análise"), 2000);
    }
  });
}

// 7. Marcação de Eventos / Tagging (Hotkeys 1, 2, 3, 4)
function handleTagEvent(key) {
  if (!video.src || !clip.inputPath) return;
  
  // Obter o input de texto associado a esta tecla
  const inputEl = document.querySelector(`.sc-name-input[data-key="${key}"]`);
  if (!inputEl) return;
  
  const eventName = inputEl.value.trim() || `Evento ${key}`;
  const now = video.currentTime;
  
  // Definir corte retroativo (5 segundos antes e 3 segundos depois)
  const t0 = Math.max(0, now - 5);
  const t1 = Math.min(video.duration, now + 3);
  
  const newEvent = {
    id: 'event_' + Date.now(),
    name: eventName,
    time: now,
    inTime: t0,
    outTime: t1
  };
  
  taggedEvents.push(newEvent);
  renderTaggedEvents();
  updateTimelineMarkers();
  saveAnnotations(); // Persistir imediatamente na base de dados local do vídeo!
  
  // Adicionar também automaticamente à playlist ativa, caso exista uma selecionada
  if (activePlaylistId) {
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (currentPl) {
      // Ajustar timestamps para que desenhos criados antes do início do clip comecem no início do clip!
      // Filtrar anotações que foram criadas especificamente para este clip
      const overlappingAnns = ds.annotations.filter(ann => {
        return ann.timestamp >= t0 - 2 && ann.timestamp <= t1;
      });
      
      const targetClones = JSON.parse(JSON.stringify(overlappingAnns));
      targetClones.forEach(ann => {
        if (ann.timestamp < t0) {
          ann.timestamp = t0;
        }
      });
      
      currentPl.clips.push({
        id: 'clip_' + Date.now(),
        title: `${eventName} (Min ${formatTime(now)})`,
        videoPath: clip.inputPath,
        inTime: t0,
        outTime: t1,
        annotations: targetClones
      });
      savePlaylists();
      renderClips();
    }
  }
  
  showToast(t('toast-event-tagged', '🏷️ Evento marcado: {0}', eventName), 3000);
}

// 8. Renderizar lista de eventos registados (com seleção múltipla e Selecionar Tudo)
let selectedEventIndices = new Set();

function updateEventsHeader() {
  const eventsHeader = document.getElementById('eventsHeader');
  const checkAll = document.getElementById('checkSelectAllEvents');
  const btnDel = document.getElementById('btnDeleteSelectedEvents');
  const btnAddPl = document.getElementById('btnAddSelectedEventsToPlaylist');
  
  if (!eventsHeader) return;
  
  if (!taggedEvents || taggedEvents.length === 0) {
    eventsHeader.style.display = 'none';
    selectedEventIndices.clear();
    return;
  }
  
  eventsHeader.style.display = 'flex';
  const total = taggedEvents.length;
  const count = selectedEventIndices.size;
  
  if (checkAll) {
    checkAll.checked = count > 0 && count === total;
    checkAll.indeterminate = count > 0 && count < total;
  }
  
  if (btnDel) {
    btnDel.style.display = count > 0 ? 'inline-block' : 'none';
    if (count > 0) btnDel.textContent = `🗑️ (${count})`;
  }
  
  if (btnAddPl) {
    btnAddPl.style.display = count > 0 ? 'inline-block' : 'none';
    if (count > 0) btnAddPl.textContent = `➕ Playlist (${count})`;
  }
}

function renderTaggedEvents() {
  if (!taggedEventsList) return;
  taggedEventsList.innerHTML = '';
  
  // Limpar índices fora do limite
  selectedEventIndices = new Set([...selectedEventIndices].filter(i => i < taggedEvents.length));
  
  taggedEvents.forEach((ev, index) => {
    const li = document.createElement('li');
    li.className = 'event-item';
    if (selectedEventIndices.has(index)) {
      li.classList.add('selected');
    }
    
    // Checkbox de seleção individual
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'event-select-check';
    chk.checked = selectedEventIndices.has(index);
    chk.style.marginRight = '8px';
    chk.style.cursor = 'pointer';
    chk.style.flexShrink = '0';
    
    chk.addEventListener('click', (e) => {
      e.stopPropagation();
      if (chk.checked) {
        selectedEventIndices.add(index);
        li.classList.add('selected');
      } else {
        selectedEventIndices.delete(index);
        li.classList.remove('selected');
      }
      updateEventsHeader();
    });
    
    const details = document.createElement('div');
    details.className = 'event-details';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'event-name';
    nameSpan.textContent = ev.name;
    
    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = `Marcado aos ${formatTime(ev.time)} (Clip: ${formatTime(ev.inTime)} → ${formatTime(ev.outTime)})`;
    
    details.appendChild(nameSpan);
    details.appendChild(time);
    
    // Botão Lápis para Editar
    const editBtn = document.createElement('button');
    editBtn.className = 'clip-act-btn edit-event-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = "Editar Nome do Evento";
    editBtn.style.marginLeft = '8px';
    editBtn.style.cursor = 'pointer';
    
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'sc-name-input';
      input.style.fontSize = '12px';
      input.style.padding = '2px 6px';
      input.style.width = '160px';
      input.maxLength = 40;
      input.value = ev.name;
      
      const saveChange = () => {
        const oldName = ev.name;
        ev.name = input.value.trim() || ev.name;
        
        if (oldName !== ev.name) {
          playlists.forEach(pl => {
            pl.clips.forEach(cl => {
              if (cl.inTime === ev.inTime && cl.outTime === ev.outTime) {
                cl.title = `${ev.name} (Min ${formatTime(ev.time)})`;
              }
            });
          });
          
          savePlaylists();
          renderClips();
          saveAnnotations();
        }
        renderTaggedEvents();
      };
      
      input.addEventListener('blur', saveChange);
      input.addEventListener('keydown', (eKey) => {
        if (eKey.key === 'Enter') saveChange();
      });
      
      details.replaceChild(input, nameSpan);
      input.focus();
      input.select();
    });
    
    // Botão de lixeira para remover o evento
    const delBtn = document.createElement('button');
    delBtn.className = 'clip-act-btn delete-event-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.title = "Remover Evento";
    delBtn.style.marginLeft = '6px';
    delBtn.style.cursor = 'pointer';
    
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Pretendes eliminar o evento "${ev.name}" registado?`)) {
        selectedEventIndices.delete(index);
        taggedEvents.splice(index, 1);
        saveAnnotations();
        renderTaggedEvents();
        updateTimelineMarkers();
      }
    });
    
    li.appendChild(chk);
    li.appendChild(details);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    
    // Clicar no item salta para o momento do evento
    li.addEventListener('click', () => {
      if (details.querySelector('input')) return;
      
      video.currentTime = ev.inTime !== undefined ? ev.inTime : ev.time;
      if (video.paused) video.play();
      showToast(`🏷️ ${ev.name}`, 2000);
    });
    
    taggedEventsList.appendChild(li);
  });
  
  updateEventsHeader();
}

// Eventos de Selecionar Todos & Ações em Massa no Painel de Eventos
const checkSelectAllEvents = document.getElementById('checkSelectAllEvents');
if (checkSelectAllEvents) {
  checkSelectAllEvents.addEventListener('change', () => {
    if (checkSelectAllEvents.checked) {
      selectedEventIndices = new Set(taggedEvents.map((_, i) => i));
    } else {
      selectedEventIndices.clear();
    }
    renderTaggedEvents();
  });
}

const btnDeleteSelectedEvents = document.getElementById('btnDeleteSelectedEvents');
if (btnDeleteSelectedEvents) {
  btnDeleteSelectedEvents.addEventListener('click', () => {
    const count = selectedEventIndices.size;
    if (count === 0) return;
    
    const confirmMsg = t('confirm-delete-events', `Tens a certeza que pretendes eliminar os ${count} eventos selecionados?`, count);
    if (confirm(confirmMsg)) {
      taggedEvents = taggedEvents.filter((_, idx) => !selectedEventIndices.has(idx));
      selectedEventIndices.clear();
      saveAnnotations();
      renderTaggedEvents();
      updateTimelineMarkers();
      showToast(t('toast-events-deleted', '🗑️ {0} eventos eliminados com sucesso!', count), 3000);
    }
  });
}

const btnAddSelectedEventsToPlaylist = document.getElementById('btnAddSelectedEventsToPlaylist');
if (btnAddSelectedEventsToPlaylist) {
  btnAddSelectedEventsToPlaylist.addEventListener('click', () => {
    const count = selectedEventIndices.size;
    if (count === 0 || !activePlaylistId) return;
    
    const currentPl = playlists.find(p => p.id === activePlaylistId);
    if (!currentPl) return;
    
    let addedCount = 0;
    const sortedIndices = [...selectedEventIndices].sort((a, b) => a - b);
    
    sortedIndices.forEach(idx => {
      const ev = taggedEvents[idx];
      if (!ev) return;
      
      const t0 = ev.inTime !== undefined ? ev.inTime : Math.max(0, ev.time - 5);
      const t1 = ev.outTime !== undefined ? ev.outTime : Math.min(video.duration || 9999, ev.time + 3);
      
      // Filtrar anotações sobrepostas
      const overlappingAnns = ds.annotations.filter(ann => ann.timestamp >= t0 - 2 && ann.timestamp <= t1);
      const targetClones = JSON.parse(JSON.stringify(overlappingAnns));
      targetClones.forEach(ann => {
        if (ann.timestamp < t0) ann.timestamp = t0;
      });
      
      currentPl.clips.push({
        id: 'clip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: `${ev.name} (Min ${formatTime(ev.time)})`,
        videoPath: clip.inputPath,
        inTime: t0,
        outTime: t1,
        annotations: targetClones
      });
      addedCount++;
    });
    
    if (addedCount > 0) {
      savePlaylists();
      renderClips();
      showToast(t('toast-events-added-pl', '✅ {0} eventos adicionados à playlist!', addedCount), 3000);
    }
  });
}

// 9. Persistência e Geração Dinâmica dos nomes dos atalhos
function loadShortcutNames() {
  const defaultKeys = {
    pt: {
      '1': 'Remate Feito',
      '2': 'Remate Sofrido',
      '3': 'Perda de Bola',
      '4': 'Recuperação'
    },
    en: {
      '1': 'Shot Taken',
      '2': 'Shot Conceded',
      '3': 'Possession Lost',
      '4': 'Possession Recovered'
    },
    es: {
      '1': 'Tiro Realizado',
      '2': 'Tiro Concedido',
      '3': 'Posesión Perdida',
      '4': 'Recuperación'
    },
    fr: {
      '1': 'Tir Effectué',
      '2': 'Tir Concédé',
      '3': 'Ballon Perdu',
      '4': 'Ballon Récupéré'
    },
    de: {
      '1': 'Torschuss',
      '2': 'Torschuss erlitten',
      '3': 'Ballverlust',
      '4': 'Balleroberung'
    }
  };
  
  let lang = currentAppLang;
  if (!defaultKeys[lang]) lang = 'en';
  
  try {
    shortcutKeys = JSON.parse(localStorage.getItem('fv_shortcut_names') || '{}');
  } catch(e){
    shortcutKeys = {};
  }
  
  // Se estiver vazio, usar padrão conforme a língua atual
  if (Object.keys(shortcutKeys).length === 0) {
    shortcutKeys = JSON.parse(JSON.stringify(defaultKeys[lang]));
    saveShortcutNames();
  } else {
    // Garantir que nenhum atalho carregado do localStorage fica vazio
    let fixed = false;
    Object.keys(shortcutKeys).forEach(key => {
      if (!shortcutKeys[key] || shortcutKeys[key].trim() === '') {
        shortcutKeys[key] = defaultKeys[lang][key] || `Evento ${key}`;
        fixed = true;
      }
    });
    if (fixed) saveShortcutNames();
  }
  
  renderShortcutList();
}

// Tradução dinâmica dos atalhos que mantêm o valor padrão
function translateDefaultShortcuts(oldLang, newLang) {
  if (oldLang === newLang) return;
  
  const defaultKeys = {
    pt: {
      '1': 'Remate Feito',
      '2': 'Remate Sofrido',
      '3': 'Perda de Bola',
      '4': 'Recuperação'
    },
    en: {
      '1': 'Shot Taken',
      '2': 'Shot Conceded',
      '3': 'Possession Lost',
      '4': 'Possession Recovered'
    },
    es: {
      '1': 'Tiro Realizado',
      '2': 'Tiro Concedido',
      '3': 'Posesión Perdida',
      '4': 'Recuperación'
    },
    fr: {
      '1': 'Tir Effectué',
      '2': 'Tir Concédé',
      '3': 'Ballon Perdu',
      '4': 'Ballon Récupéré'
    },
    de: {
      '1': 'Torschuss',
      '2': 'Torschuss erlitten',
      '3': 'Ballverlust',
      '4': 'Balleroberung'
    }
  };
  
  let changed = false;
  
  ['1', '2', '3', '4'].forEach(key => {
    if (shortcutKeys[key]) {
      const val = shortcutKeys[key].trim();
      const oldDefault = defaultKeys[oldLang] ? defaultKeys[oldLang][key] : null;
      const newDefault = defaultKeys[newLang] ? defaultKeys[newLang][key] : null;
      
      // Se o utilizador não personalizou este atalho, traduzimos automaticamente (insensível a maiúsculas)
      if (newDefault && oldDefault && (val.toLowerCase() === oldDefault.toLowerCase() || val === '')) {
        shortcutKeys[key] = newDefault;
        changed = true;
      }
    }
  });
  
  if (changed) {
    saveShortcutNames();
    renderShortcutList();
  }
}

function saveShortcutNames() {
  localStorage.setItem('fv_shortcut_names', JSON.stringify(shortcutKeys));
  saveAnnotations(); // Persistir no ficheiro do vídeo!
}

function renderShortcutList() {
  if (!tagShortcutsList) return;
  tagShortcutsList.innerHTML = '';
  
  const defaultKeys = {
    pt: { '1': 'Remate Feito', '2': 'Remate Sofrido', '3': 'Perda de Bola', '4': 'Recuperação' },
    en: { '1': 'Shot Taken', '2': 'Shot Conceded', '3': 'Possession Lost', '4': 'Possession Recovered' },
    es: { '1': 'Tiro Realizado', '2': 'Tiro Concedido', '3': 'Posesión Perdida', '4': 'Recuperación' },
    fr: { '1': 'Tir Effectué', '2': 'Tir Concédé', '3': 'Ballon Perdu', '4': 'Ballon Récupéré' },
    de: { '1': 'Torschuss', '2': 'Torschuss erlitten', '3': 'Ballverlust', '4': 'Balleroberung' }
  };
  let lang = currentAppLang;
  if (!defaultKeys[lang]) lang = 'en';
  
  // Ordenar chaves numericamente
  const sortedKeys = Object.keys(shortcutKeys).sort((a, b) => parseInt(a) - parseInt(b));
  
  sortedKeys.forEach(key => {
    const value = shortcutKeys[key];
    const defaultValue = defaultKeys[lang][key] || `Evento ${key}`;
    
    const div = document.createElement('div');
    div.className = 'shortcut-item';
    
    const span = document.createElement('span');
    span.className = 'sc-key';
    span.textContent = key;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sc-name-input';
    input.dataset.key = key;
    input.value = value || defaultValue;
    
    input.addEventListener('change', (e) => {
      shortcutKeys[key] = e.target.value.trim() || defaultValue;
      saveShortcutNames();
    });
    
    // Botão de eliminar atalho
    const delBtn = document.createElement('button');
    delBtn.className = 'clip-act-btn delete';
    delBtn.innerHTML = '×';
    delBtn.title = "Remover Atalho";
    delBtn.style.padding = '0 6px';
    delBtn.style.fontSize = '14px';
    delBtn.style.fontWeight = 'bold';
    
    delBtn.addEventListener('click', () => {
      if (Object.keys(shortcutKeys).length <= 1) {
        showToast(t("toast-sc-min", "⚠️ Tens de ter pelo menos 1 atalho configurado"), 3000);
        return;
      }
      if (confirm(`Remover o atalho "${key}" (${value})?`)) {
        delete shortcutKeys[key];
        saveShortcutNames();
        renderShortcutList();
      }
    });
    
    div.appendChild(span);
    div.appendChild(input);
    div.appendChild(delBtn);
    tagShortcutsList.appendChild(div);
  });
}

// Ouvir clique no botão "+" para adicionar novo atalho
if (btnAddTagShortcut) {
  btnAddTagShortcut.addEventListener('click', () => {
    // Procurar o próximo número disponível de 1 a 9
    let nextKey = null;
    for (let i = 1; i <= 9; i++) {
      if (!shortcutKeys[i.toString()]) {
        nextKey = i.toString();
        break;
      }
    }
    
    if (!nextKey) {
      showToast(t("toast-sc-limit", "⚠️ Limite atingido: Só podes configurar atalhos de 1 a 9"), 4000);
      return;
    }
    
    const defaultName = `${t('tag-new-event', 'Novo Evento')} ${nextKey}`;
    
    // Adiciona diretamente com o nome padrão e foca para renomeação,
    // evitando diálogos de prompt que o Electron não suporta.
    shortcutKeys[nextKey] = defaultName;
    saveShortcutNames();
    renderShortcutList();
    
    // Focar e selecionar automaticamente o novo campo de texto para o utilizador escrever
    setTimeout(() => {
      const inputEl = document.querySelector(`.sc-name-input[data-key="${nextKey}"]`);
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }, 50);
    
    showToast(t('toast-sc-added', '✅ Atalho (Tecla {0}) adicionado!', nextKey), 3000);
  });
}

// Inicializar novas funcionalidades
loadPlaylists();
loadShortcutNames();




// Close HUD button
const btnCloseHud = document.getElementById('btnCloseHud');
if (btnCloseHud) {
  btnCloseHud.addEventListener('click', () => {
    stopCalibration();
  });
}

// Remind user of missing players when seeking/playing video
let lastCalibReminderTime = 0;
video.addEventListener('timeupdate', () => {
  if (!calibrationState.active) return;
  const now = Date.now();
  if (now - lastCalibReminderTime > 12000) { // Every 12s if still missing
    const currentPlayers = ds.annotations.filter(a => a.tool === 'track' && !a.isBall).length;
    const missing = calibrationState.targetPlayers - currentPlayers;
    if (missing > 0 && missing <= 5) {
      showToast(t('toast-calib-missing', 'Tens {0} jogadores registados. Faltam {1} para os {2}.', currentPlayers, missing, calibrationState.targetPlayers), 3000);
      lastCalibReminderTime = now;
    }
  }
});




// ══════════════════════════════════════════════════════════
//   2D TACTICAL RADAR ENGINE & PITCH MAPPING
// ══════════════════════════════════════════════════════════
const radarWidget = document.getElementById('tacticalRadarWidget');
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx    = radarCanvas ? radarCanvas.getContext('2d') : null;
const btnToggleRadar = document.getElementById('btnToggleRadar');
const btnRadarClose  = document.getElementById('btnRadarClose');
const radarCountEl   = document.getElementById('radarCount');

const radarState = {
  active: false,
  teamAColor: '#00b0ff', // Blue/Cyan
  teamBColor: '#ff5252', // Red/Coral
  ballColor:  '#ffd700', // Gold Yellow
  teamAPlayers: [],
  teamBPlayers: []
};

function toggleTacticalRadar() {
  radarState.active = !radarState.active;
  if (radarWidget) {
    radarWidget.style.display = radarState.active ? 'flex' : 'none';
  }
  if (btnToggleRadar) {
    btnToggleRadar.classList.toggle('active', radarState.active);
  }
  if (radarState.active) {
    renderRadarFrame();
    showToast(t('toast-radar-opened', '🗺️ Radar 2D Ativado! Mapeamento do campo em tempo real.'), 3000);
  }
}

if (btnToggleRadar) btnToggleRadar.addEventListener('click', toggleTacticalRadar);
if (btnRadarClose) btnRadarClose.addEventListener('click', () => {
  radarState.active = false;
  if (radarWidget) radarWidget.style.display = 'none';
  if (btnToggleRadar) btnToggleRadar.classList.remove('active');
});

// Keyboard shortcut 'M' for Map/Radar
document.addEventListener('keydown', (e) => {
  if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  });

// Make Radar Widget Draggable
if (radarWidget) {
  const rHeader = document.getElementById('radarHeader');
  if (rHeader) {
    let isDragging = false, startX, startY, initLeft, initTop;
    rHeader.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = radarWidget.getBoundingClientRect();
      initLeft = rect.left;
      initTop  = rect.top;
      radarWidget.style.bottom = 'auto';
      radarWidget.style.right = 'auto';
      radarWidget.style.left = initLeft + 'px';
      radarWidget.style.top  = initTop + 'px';

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        radarWidget.style.left = (initLeft + dx) + 'px';
        radarWidget.style.top  = (initTop + dy) + 'px';
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
}

// ── Draw 2D Soccer Pitch ──────────────────────────────────
function draw2DPitch(ctx, w, h) {
  const padX = 14, padY = 14;
  const pw = w - padX * 2;
  const ph = h - padY * 2;

  // 1. Grass background with mowing stripes
  ctx.fillStyle = '#102214';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(padX, padY, pw, ph);
  ctx.clip();

  const stripeCount = 10;
  const stripeW = pw / stripeCount;
  for (let s = 0; s < stripeCount; s++) {
    ctx.fillStyle = (s % 2 === 0) ? '#142c1b' : '#112516';
    ctx.fillRect(padX + s * stripeW, padY, stripeW, ph);
  }
  ctx.restore();

  // 2. Pitch markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

  // Outer boundary
  ctx.strokeRect(padX, padY, pw, ph);

  // Halfway line
  const midX = padX + pw / 2;
  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + ph);
  ctx.stroke();

  // Center circle (R = 9.15m -> ~15% of pitch width)
  const centerR = pw * 0.088;
  ctx.beginPath();
  ctx.arc(midX, padY + ph / 2, centerR, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(midX, padY + ph / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Left & Right Penalty Areas (16.5m)
  const penW = pw * 0.155;
  const penH = ph * 0.58;
  const penY = padY + (ph - penH) / 2;

  // Left penalty box
  ctx.strokeRect(padX, penY, penW, penH);
  // Left goal box (5.5m)
  const goalW = pw * 0.055;
  const goalH = ph * 0.32;
  const goalY = padY + (ph - goalH) / 2;
  ctx.strokeRect(padX, goalY, goalW, goalH);
  // Left penalty spot
  const leftPenSpotX = padX + pw * 0.105;
  ctx.beginPath();
  ctx.arc(leftPenSpotX, padY + ph / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  // Left penalty arc
  ctx.beginPath();
  ctx.arc(leftPenSpotX, padY + ph / 2, centerR, -0.65, 0.65);
  ctx.stroke();

  // Right penalty box
  ctx.strokeRect(padX + pw - penW, penY, penW, penH);
  // Right goal box
  ctx.strokeRect(padX + pw - goalW, goalY, goalW, goalH);
  // Right penalty spot
  const rightPenSpotX = padX + pw - pw * 0.105;
  ctx.beginPath();
  ctx.arc(rightPenSpotX, padY + ph / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  // Right penalty arc
  ctx.beginPath();
  ctx.arc(rightPenSpotX, padY + ph / 2, centerR, Math.PI - 0.65, Math.PI + 0.65);
  ctx.stroke();

  // Corner arcs
  const cornerR = 5;
  ctx.beginPath(); ctx.arc(padX, padY, cornerR, 0, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(padX, padY + ph, cornerR, -Math.PI / 2, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(padX + pw, padY, cornerR, Math.PI / 2, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.arc(padX + pw, padY + ph, cornerR, Math.PI, Math.PI * 1.5); ctx.stroke();

  return { padX, padY, pw, ph };
}

// ── Perspective Homography Mapping from Video to 2D Pitch ──
let cameraPanTimeline = [];

function getCameraPanAtTime(t) {
  if (!cameraPanTimeline || cameraPanTimeline.length === 0) return 0;
  let p = cameraPanTimeline[0];
  for (let i = 0; i < cameraPanTimeline.length; i++) {
    if (cameraPanTimeline[i].time <= t) p = cameraPanTimeline[i];
    else break;
  }
  return p ? (p.pan || 0) : 0;
}

function mapVideoToPitch(normX, normY, t = 0) {
  // Broadcast Camera Perspective Correction Model with Dynamic Pan Shift
  const sy = Math.max(0, Math.min(1, normY));
  const sx = Math.max(0, Math.min(1, normX));

  // Depth scaling from trapezoid perspective
  const depthFactor = 0.72 + (sy * 0.56);
  const centeredX   = (sx - 0.5) * depthFactor;

  // Dynamic Camera Pan Shift (0.50 = midfield)
  const panShift = getCameraPanAtTime(t);
  const camCenterX = 0.50 + panShift * 0.45; // camera center on full 105m pitch

  // Camera field of view is approximately ~35% of the total 105m pitch
  const fovWidth = 0.38;
  const rawPitchX = camCenterX + centeredX * fovWidth;

  // Normalized pitch mapping: Y in [0.16, 0.88] maps to pitch [0.03, 0.97]
  const pitchX = Math.max(0.02, Math.min(0.98, rawPitchX));
  const pitchY = Math.max(0.03, Math.min(0.97, (sy - 0.16) / 0.72));

  return { x: pitchX, y: pitchY };
}

// ── Render Radar Frame ─────────────────────────────────────
function renderRadarFrame() {
  if (!radarState.active || !radarCanvas || !radarCtx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = 340, h = 220;
  if (radarCanvas.width !== w * dpr) {
    radarCanvas.width  = w * dpr;
    radarCanvas.height = h * dpr;
    radarCtx.scale(dpr, dpr);
  }

  const bounds = draw2DPitch(radarCtx, w, h);
  const currentTime = video.currentTime || 0;

  // Filter tracked annotations
  const trackAnns = ds.annotations.filter(a => a.tool === 'track' && a.trajectory);
  if (radarCountEl) radarCountEl.textContent = trackAnns.filter(a => !a.isBall).length;

  // Draw player & ball dots
  trackAnns.forEach((ann, idx) => {
    const relTime = currentTime - ann.timestamp;
    let isVisibleNow = (relTime >= -0.3 && relTime <= ann.duration);
    let point = null;

    if (isVisibleNow && ann.trajectory) {
      point = ann.trajectory[0];
      for (let i = 0; i < ann.trajectory.length; i++) {
        if (ann.trajectory[i].time <= relTime) point = ann.trajectory[i];
        else break;
      }
    }

    let pitchCoords = null;
    if (point) {
      // Live on-screen position with dynamic camera pan time
      pitchCoords = mapVideoToPitch(point.x, point.y, currentTime);
      ann.lastPitchPos = { x: pitchCoords.x, y: pitchCoords.y, time: currentTime };
    } else if (ann.lastPitchPos) {
      // Off-screen memory retention!
      pitchCoords = { x: ann.lastPitchPos.x, y: ann.lastPitchPos.y };
    }

    if (!pitchCoords) return;

    const dotX = bounds.padX + pitchCoords.x * bounds.pw;
    const dotY = bounds.padY + pitchCoords.y * bounds.ph;

    radarCtx.save();

    if (ann.isBall) {
      // ⚽ Ball Dot
      radarCtx.beginPath();
      radarCtx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      radarCtx.fillStyle = radarState.ballColor;
      radarCtx.shadowColor = radarState.ballColor;
      radarCtx.shadowBlur = 8;
      radarCtx.fill();
    } else {
      // 👥 Player Dot (Team A vs Team B)
      const isTeamA = (idx % 2 === 0);
      const teamColor = isTeamA ? radarState.teamAColor : radarState.teamBColor;

      // Halo for off-screen indication
      if (!point) {
        radarCtx.globalAlpha = 0.55;
        radarCtx.beginPath();
        radarCtx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        radarCtx.strokeStyle = teamColor;
        radarCtx.lineWidth = 1;
        radarCtx.setLineDash([2, 2]);
        radarCtx.stroke();
      }

      const dotR = 6.5;
      radarCtx.beginPath();
      radarCtx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      radarCtx.fillStyle = teamColor;
      radarCtx.shadowColor = teamColor;
      radarCtx.shadowBlur = point ? 8 : 2;
      radarCtx.fill();

      radarCtx.strokeStyle = '#ffffff';
      radarCtx.lineWidth = 1.2;
      radarCtx.setLineDash([]);
      radarCtx.stroke();

      // Number text inside 2D radar dot
      if (ann.playerNum !== undefined) {
        radarCtx.fillStyle = '#ffffff';
        radarCtx.font = 'bold 8px Outfit, system-ui, sans-serif';
        radarCtx.textAlign = 'center';
        radarCtx.textBaseline = 'middle';
        radarCtx.shadowBlur = 0;
        radarCtx.fillText(ann.playerNum.toString(), dotX, dotY + 0.5);
      }
    }

    radarCtx.restore();
  });
}

// Hook Radar rendering into video render loop
const prevRedrawWithRadar = redraw;
redraw = function() {
  prevRedrawWithRadar();
  if (radarState.active) {
    renderRadarFrame();
  }
};


// ── Double-Click on player to edit Number / Team ─────────
canvas.addEventListener('dblclick', (e) => {
  if (!ds.enabled) return;
  const pos = getPos(e);
  const t = video.currentTime || 0;
  const match = findAnnotationAtPoint(pos.x, pos.y, t);
  if (match && match.ann && match.ann.tool === 'track' && !match.ann.isBall) {
    const curNum = match.ann.playerNum || 1;
    const curTeam = match.ann.team || 'A';
    const inputVal = prompt(`Alterar Número do Jogador (Equipa ${curTeam}):`, curNum.toString());
    if (inputVal !== null) {
      const parsed = parseInt(inputVal);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 99) {
        match.ann.playerNum = parsed;
        redraw();
        if (radarState.active) renderRadarFrame();
        scheduleAnnotationSave();
        showToast(`👕 Jogador atualizado para o número #${parsed}!`, 2000);
      }
    }
  }
});


// ══════════════════════════════════════════════════════════
//   CSV EVENT EXPORT & IMPORT MODULE
// ══════════════════════════════════════════════════════════
const btnExportEventsCSV = document.getElementById('btnExportEventsCSV');
const btnImportMetrica   = document.getElementById('btnImportMetrica');

// ── Export Tagged Events to CSV ───────────────────────────
if (btnExportEventsCSV) {
  btnExportEventsCSV.addEventListener('click', async () => {
    if (!taggedEvents || taggedEvents.length === 0) {
      showToast(t('toast-export-csv-empty', '⚠️ Não existem eventos registados para exportar!'), 3500);
      return;
    }

    const videoName = clip.inputPath ? path.basename(clip.inputPath) : 'video';
    const baseName  = path.basename(videoName, path.extname(videoName));
    const defaultCsvName = `${baseName}_eventos_${Date.now()}.csv`;

    // Build standard CSV header & rows (Compatible with Metrica, Excel, Sportscode)
    const headers = ['Id', 'Evento', 'Tempo_Segundos', 'Inicio_Segundos', 'Fim_Segundos', 'Duracao_Segundos', 'Timestamp_Formatado', 'Inicio_Formatado', 'Fim_Formatado', 'Ficheiro_Video'];
    const rows = [headers.join(',')];

    taggedEvents.forEach((ev, idx) => {
      const id = idx + 1;
      const name = `"${(ev.name || 'Evento').replace(/"/g, '""')}"`;
      const time = (ev.time || 0).toFixed(2);
      const inTime = (ev.inTime || Math.max(0, ev.time - 5)).toFixed(2);
      const outTime = (ev.outTime || Math.min(video.duration || 9999, ev.time + 3)).toFixed(2);
      const duration = (outTime - inTime).toFixed(2);
      const timeFmt = formatTime(ev.time || 0);
      const inFmt = formatTime(ev.inTime || 0);
      const outFmt = formatTime(ev.outTime || 0);
      const file = `"${videoName.replace(/"/g, '""')}"`;

      rows.push([id, name, time, inTime, outTime, duration, timeFmt, inFmt, outFmt, file].join(','));
    });

    const csvContent = rows.join('\r\n');

    try {
      const res = await ipcRenderer.invoke('export-csv', {
        defaultName: defaultCsvName,
        content: csvContent
      });

      if (res && res.success) {
        showToast(t('toast-export-csv-success', '✅ {0} eventos exportados com sucesso!', taggedEvents.length), 5000, res.filePath);
      } else if (res && !res.canceled && res.error) {
        showToast('❌ Erro ao exportar CSV: ' + res.error, 4500);
      }
    } catch (err) {
      showToast('❌ Erro: ' + err.message, 4500);
    }
  });
}

// ── Import Events from CSV ────────────────────────────────
if (btnImportMetrica) {
  btnImportMetrica.addEventListener('click', async () => {
    try {
      const res = await ipcRenderer.invoke('import-csv');
      if (!res || res.canceled || !res.content) return;

      const lines = res.content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        showToast(t('toast-import-csv-empty', '⚠️ Ficheiro CSV vazio ou sem dados válidos.'), 3500);
        return;
      }

      // Parse delimiter (comma, semicolon, tab)
      const delimiter = lines[0].includes(';') ? ';' : (lines[0].includes('\t') ? '\t' : ',');
      const headerCols = lines[0].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, '').toLowerCase());

      // Column index finder
      const nameIdx  = headerCols.findIndex(c => c.includes('event') || c.includes('evento') || c.includes('name') || c.includes('nome') || c.includes('tag'));
      const timeIdx  = headerCols.findIndex(c => c.includes('tempo') || c.includes('time') || c.includes('timestamp') || c.includes('start') || c.includes('inicio'));
      const inIdx    = headerCols.findIndex(c => c.includes('inicio') || c.includes('in') || c.includes('start'));
      const outIdx   = headerCols.findIndex(c => c.includes('fim') || c.includes('out') || c.includes('end'));

      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) continue;

        let evName = nameIdx !== -1 ? cols[nameIdx] : (cols[1] || cols[0]);
        let evTime = 0;

        // Parse time
        const rawTime = timeIdx !== -1 ? cols[timeIdx] : cols[2];
        if (rawTime) {
          if (rawTime.includes(':')) {
            const parts = rawTime.split(':').map(Number);
            evTime = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
          } else {
            evTime = parseFloat(rawTime) || 0;
          }
        }

        let inT  = inIdx !== -1 && cols[inIdx] ? parseFloat(cols[inIdx]) : Math.max(0, evTime - 5);
        let outT = outIdx !== -1 && cols[outIdx] ? parseFloat(cols[outIdx]) : Math.min(video.duration || 9999, evTime + 3);

        if (isNaN(inT)) inT = Math.max(0, evTime - 5);
        if (isNaN(outT)) outT = evTime + 3;

        taggedEvents.push({
          id: 'event_' + Date.now() + '_' + i,
          name: evName || `Evento ${i}`,
          time: evTime,
          inTime: inT,
          outTime: outT
        });
        importedCount++;
      }

      if (importedCount > 0) {
        renderTaggedEvents();
        updateTimelineMarkers();
        saveAnnotations();
        showToast(t('toast-import-csv-success', '✅ {0} eventos importados com sucesso do CSV!', importedCount), 4500);
      } else {
        showToast(t('toast-import-csv-cols', '⚠️ Não foi possível reconhecer as colunas do CSV.'), 4000);
      }
    } catch (err) {
      showToast('❌ Erro ao importar CSV: ' + err.message, 4500);
    }
  });
}
