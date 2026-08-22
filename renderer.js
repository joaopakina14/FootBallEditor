const { ipcRenderer } = require('electron')
const path = require('path')

// ── Licensing state ───────────────────────────────────────
let isPro = false
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
    licenseBadge.textContent = 'Pro Ativo ✓';
    licenseBadge.className = 'license-badge pro';
    statusVal.textContent = 'Versão Pro (Ativa)';
    statusVal.className = 'status-val pro';
    
    licenseInputGroup.style.display = 'none';
    licenseActiveGroup.style.display = 'block';
    
    const maskedKey = key ? `XXXX-XXXX-XXXX-${key.slice(-4)}` : 'Ativa';
    activeKeyDisplay.textContent = maskedKey;
  } else {
    licenseBadge.textContent = 'Ativar Pro ⚡';
    licenseBadge.className = 'license-badge free';
    statusVal.textContent = 'Versão de Teste (Free)';
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
    showToast('⚠️ Introduz uma chave de licença!', 3000);
    return;
  }
  
  showToast('🔑 A verificar chave...', 0);
  btnActivateLicense.disabled = true;
  
  const res = await ipcRenderer.invoke('activate-license', key);
  btnActivateLicense.disabled = false;
  
  if (res.success) {
    showToast('✅ FieldVision Pro ativado com sucesso!', 4000);
    checkLicense();
    licenseModal.classList.remove('open');
  } else {
    showToast('❌ ' + res.error, 4000);
  }
});

btnDeactivateLicense.addEventListener('click', async () => {
  if (confirm('Tem a certeza que deseja desativar a licença neste computador?')) {
    showToast('🔒 A remover licença...', 0);
    const res = await ipcRenderer.invoke('deactivate-license');
    if (res.success) {
      showToast('ℹ️ Licença desativada.', 3000);
      checkLicense();
      licenseModal.classList.remove('open');
    } else {
      showToast('❌ ' + res.error, 3000);
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
      showToast(`\uD83D\uDCC2 ${result.annotations.length} anota\u00E7\u00E3o(oes) carregada(s)`, 2500)
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
      showToast('⚠️ Limite Free: Atingiste o limite de 3 exportações mensais. Compra o Pro para exportações ilimitadas!', 5500);
      return;
    }
  }

  const startTime = Math.min(clip.inTime, clip.outTime)
  const endTime   = Math.max(clip.inTime, clip.outTime)
  const duration  = endTime - startTime

  if (duration < 0.5) { showToast('\u274C Seleciona pelo menos 0.5 segundos', 3000); return }

  // Build output path
  const dir      = path.dirname(clip.inputPath)
  const ext      = path.extname(clip.inputPath)
  const base     = path.basename(clip.inputPath, ext)
  const outputPath = path.join(dir, `${base}_clip_${formatTimeFile(startTime)}-${formatTimeFile(endTime)}${ext}`)

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
    showToast(`\u2705 ${filename}${annInfo}`, 6000, result.outputPath)
    resetClipUI()
  } else {
    showToast(`\u274C Erro: ${result.error}`, 5000)
    btnCut.disabled = false; btnCut.classList.add('ready')
  }
}

// ── Toast notification ────────────────────────────────────
let toastTimer = null
function showToast(message, duration = 3000, openPath = null) {
  clearTimeout(toastTimer); toast.innerHTML = ''
  const text = document.createElement('span'); text.textContent = message; toast.appendChild(text)
  if (openPath) {
    const btn = document.createElement('button'); btn.className = 'toast-open-btn'; btn.textContent = 'Abrir pasta'
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
          showToast('⚠️ Limite Trial: Já utilizou o rastreio automático 5 vezes. Adquira a licença Pro para uso ilimitado!', 5500);
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
          showToast('\uD83C\uDFAF A analisar e fixar movimento no jogador...', 0);
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
            showToast(`\u2705 Rastreio concluído: ${result.totalPoints} pontos gravados!`, 3500);
          }
        } else {
          showToast(`\u274C Falha no rastreio: ${result.error || 'Não foi possível seguir o jogador'}`, 4000)
        }
      }
    } else {
      // Enforce max 3 annotations limit on Free version
      if (!isPro && ds.annotations.length >= 3) {
        showToast('⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido. Adquire o Pro para anotações ilimitadas!', 5500);
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

        showToast('\uD83D\uDD17 Linha curva el\u00E1stica ligada aos 2 jogadores!', 2800)
      } else if (attachStart) {
        ann.attachedTrackId = attachStart.trackId
        ann.attachOriginPos = attachStart.originPos
        const t1 = ds.annotations.find(a => a.id === attachStart.trackId)
        if (t1) { ann.timestamp = t1.timestamp; ann.duration = t1.duration }
        showToast('\uD83D\uDE97 Anota\u00E7\u00E3o presa ao jogador! Vai de boleia!', 2500)
      } else if (attachEnd) {
        ann.attachedTrackId = attachEnd.trackId
        ann.attachOriginPos = attachEnd.originPos
        const t2 = ds.annotations.find(a => a.id === attachEnd.trackId)
        if (t2) { ann.timestamp = t2.timestamp; ann.duration = t2.duration }
        showToast('\uD83D\uDE97 Anota\u00E7\u00E3o presa ao jogador! Vai de boleia!', 2500)
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
      showToast('⚠️ Limite Free: Máximo de 3 anotações por vídeo atingido.', 4500);
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

// Initial license validation check on boot
checkLicense();

