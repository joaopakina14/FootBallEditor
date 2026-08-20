const { ipcRenderer } = require('electron')
const path = require('path')

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
  if (e.code === 'KeyZ' && e.ctrlKey)  { undoDraw(); return }
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

async function doCut() {
  if (!clip.inputPath || clip.inTime === null || clip.outTime === null) return

  const startTime = Math.min(clip.inTime, clip.outTime)
  const endTime   = Math.max(clip.inTime, clip.outTime)
  const duration  = endTime - startTime

  if (duration < 0.5) { showToast('\u274C Seleciona pelo menos 0.5 segundos', 3000); return }

  // Build output path
  const dir      = path.dirname(clip.inputPath)
  const ext      = path.extname(clip.inputPath)
  const base     = path.basename(clip.inputPath, ext)
  const outputPath = path.join(dir, `${base}_clip_${formatTimeFile(startTime)}-${formatTimeFile(endTime)}${ext}`)

  // ★ Filter annotations overlapping with [startTime, endTime] and adjust timestamps
  const clipAnnotations = ds.annotations
    .filter(ann => {
      if (ann.duration === -1) return true // Always visible annotations stay
      const annEnd = ann.timestamp + ann.duration
      // Checks if annotation overlaps with [startTime, endTime]
      return ann.timestamp <= endTime && annEnd >= startTime
    })
    .map(ann => {
      const newTimestamp = Math.max(0, ann.timestamp - startTime)
      return {
        ...ann,
        timestamp: +newTimestamp.toFixed(3)
      }
    })

  btnCut.disabled = true; btnCut.classList.remove('ready')
  showToast('\u2702\uFE0F A cortar...', 0)

  const result = await ipcRenderer.invoke('cut-video', {
    inputPath: clip.inputPath, startTime, duration, outputPath
  })

  if (result.success) {
    // ★ Save adjusted annotations alongside the new clip
    if (clipAnnotations.length > 0) {
      await ipcRenderer.invoke('save-annotations', {
        videoPath:   result.outputPath,
        annotations: clipAnnotations
      })
    }
    const filename = path.basename(result.outputPath)
    const annInfo  = clipAnnotations.length > 0 ? ` + ${clipAnnotations.length} anota\u00E7\u00E3o(oes)` : ''
    showToast(`\u2705 ${filename}${annInfo}`, 5000, result.outputPath)
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
  enabled: false, tool: 'pencil', color: '#ffffff', width: 2, duration: 4,
  annotations: [], current: null, drawing: false
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

// Undo & Clear
function undoDraw() {
  if (!ds.annotations.length) return
  ds.annotations.pop(); redraw(); updateTimelineMarkers(); updateAnnotationBadge()
  scheduleAnnotationSave() // ★ persist change
}
document.getElementById('btnUndo').addEventListener('click', undoDraw)
document.getElementById('btnClearAll').addEventListener('click', () => {
  ds.annotations = []; ds.current = null; redraw(); updateTimelineMarkers(); updateAnnotationBadge()
  scheduleAnnotationSave() // ★ persist change
})

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
canvas.addEventListener('mouseup', e => {
  if (!ds.drawing || !ds.current) return; ds.drawing = false
  const ann = ds.current
  const isTiny = ann.tool !== 'pencil' && Math.abs(ann.x2-ann.x1) < 3 && Math.abs(ann.y2-ann.y1) < 3
  if (!isTiny) {
    ann.timestamp = video.currentTime || 0; ann.duration = ds.duration
    ds.annotations.push(ann); updateTimelineMarkers(); updateAnnotationBadge()
    scheduleAnnotationSave() // ★ persist
  }
  ds.current = null; redraw()
})
canvas.addEventListener('mouseleave', () => {
  if (ds.drawing && ds.current && ds.tool === 'pencil' && ds.current.points.length > 1) {
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

function renderAnn(ann) {
  ctx.save(); ctx.strokeStyle = ann.color; ctx.fillStyle = ann.color
  ctx.lineWidth = ann.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.setLineDash(ann.tool === 'dashed' ? [ann.width*4, ann.width*2.5] : [])
  switch (ann.tool) {
    case 'pencil': drawPencil(ann); break
    case 'line': case 'dashed': drawLine(ann); break
    case 'arrow':  drawArrow(ann);  break
    case 'circle': drawCircle(ann); break
    case 'rect':   drawRect(ann);   break
  }
  ctx.restore()
}

function drawPencil(ann) {
  if (!ann.points.length) return
  if (ann.points.length === 1) { ctx.beginPath(); ctx.arc(ann.points[0].x, ann.points[0].y, ann.width/2, 0, Math.PI*2); ctx.fill(); return }
  ctx.beginPath(); ctx.moveTo(ann.points[0].x, ann.points[0].y)
  for (let i = 1; i < ann.points.length-1; i++) {
    const mx=(ann.points[i].x+ann.points[i+1].x)/2, my=(ann.points[i].y+ann.points[i+1].y)/2
    ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, mx, my)
  }
  const last = ann.points[ann.points.length-1]; ctx.lineTo(last.x, last.y); ctx.stroke()
}
function drawLine(ann) { ctx.beginPath(); ctx.moveTo(ann.x1, ann.y1); ctx.lineTo(ann.x2, ann.y2); ctx.stroke() }
function drawArrow(ann) {
  const { x1,y1,x2,y2,width }=ann, dx=x2-x1, dy=y2-y1
  if (Math.sqrt(dx*dx+dy*dy)<2) return
  const hl=Math.max(14,width*4), a=Math.atan2(dy,dx), sp=Math.PI/7
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke()
  ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(x2,y2)
  ctx.lineTo(x2-hl*Math.cos(a-sp), y2-hl*Math.sin(a-sp))
  ctx.lineTo(x2-hl*Math.cos(a+sp), y2-hl*Math.sin(a+sp))
  ctx.closePath(); ctx.fill()
}
function drawCircle(ann) {
  const cx=(ann.x1+ann.x2)/2, cy=(ann.y1+ann.y2)/2
  const rx=Math.abs(ann.x2-ann.x1)/2, ry=Math.abs(ann.y2-ann.y1)/2
  if (rx<1&&ry<1) return; ctx.beginPath(); ctx.ellipse(cx,cy,Math.max(rx,1),Math.max(ry,1),0,0,Math.PI*2); ctx.stroke()
}
function drawRect(ann) {
  const x=Math.min(ann.x1,ann.x2), y=Math.min(ann.y1,ann.y2)
  const w=Math.abs(ann.x2-ann.x1), h=Math.abs(ann.y2-ann.y1)
  if (w<1||h<1) return; ctx.beginPath(); ctx.roundRect(x,y,w,h,3); ctx.stroke()
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
