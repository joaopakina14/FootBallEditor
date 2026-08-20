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
const volumeSlider  = document.getElementById('volumeSlider')
const progressBar   = document.getElementById('progressBar')
const progressFill  = document.getElementById('progressFill')
const progressThumb = document.getElementById('progressThumb')
const timeCurrent   = document.getElementById('timeCurrent')
const timeTotal     = document.getElementById('timeTotal')
const filenameLabel = document.getElementById('filenameLabel')

// Titlebar controls
document.getElementById('btn-minimize').addEventListener('click', () => ipcRenderer.send('window-minimize'))
document.getElementById('btn-maximize').addEventListener('click', () => ipcRenderer.send('window-maximize'))
document.getElementById('btn-close').addEventListener('click',    () => ipcRenderer.send('window-close'))

// ── Player State ──────────────────────────────────────────
const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
let speedIdx = 3
let scrubbing = false

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
  emptyState.style.display = 'none'
  playerWrap.style.display = 'flex'
  // Clear annotations for new video
  ds.annotations = []
  ds.current = null
  redraw()
  updateTimelineMarkers()
  updateAnnotationBadge()
  setTimeout(resizeCanvas, 100)
}

btnOpen.addEventListener('click', openFile)
btnOpenEmpty.addEventListener('click', openFile)

// ── Drag & Drop ───────────────────────────────────────────
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
  if (video.paused) video.play()
  else video.pause()
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
video.addEventListener('ended', () => stopRenderLoop())

// ── RAF render loop (smooth canvas during playback) ───────
let rafId = null

function startRenderLoop() {
  if (rafId) return
  function loop() {
    if (!video.paused && video.duration) {
      const pct = (video.currentTime / video.duration) * 100
      updateProgress(pct)
      timeCurrent.textContent = formatTime(video.currentTime)
    }
    redraw()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

function stopRenderLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  redraw() // final draw at stopped position
}

// ── Stop ──────────────────────────────────────────────────
btnStop.addEventListener('click', () => {
  video.pause()
  video.currentTime = 0
  updateProgress(0)
  timeCurrent.textContent = '0:00'
  redraw()
})

// ── Progress bar ──────────────────────────────────────────
video.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(video.duration)
  updateTimelineMarkers()
  resizeCanvas()
})

// timeupdate: only used when paused (RAF handles it during play)
video.addEventListener('timeupdate', () => {
  if (video.paused && video.duration) {
    const pct = (video.currentTime / video.duration) * 100
    updateProgress(pct)
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
  scrubbing = true
  seek(e)
  document.addEventListener('mousemove', seek)
  document.addEventListener('mouseup', () => {
    scrubbing = false
    document.removeEventListener('mousemove', seek)
  }, { once: true })
})

function seek(e) {
  const rect = progressBar.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  updateProgress(pct * 100)
  if (video.duration) {
    video.currentTime = pct * video.duration
    timeCurrent.textContent = formatTime(video.currentTime)
    redraw()
  }
}

// ── Volume ────────────────────────────────────────────────
volumeSlider.addEventListener('input', () => {
  video.volume = volumeSlider.value
  video.muted  = video.volume === 0
  updateMuteIcon()
})

btnMute.addEventListener('click', () => {
  video.muted = !video.muted
  if (!video.muted) volumeSlider.value = video.volume || 0.5
  updateMuteIcon()
})

function updateMuteIcon() {
  if (video.muted || video.volume === 0) btnMute.textContent = '\uD83D\uDD07'
  else if (video.volume < 0.5)           btnMute.textContent = '\uD83D\uDD09'
  else                                   btnMute.textContent = '\uD83D\uDD0A'
}

// ── Playback speed ────────────────────────────────────────
btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % speeds.length
  video.playbackRate = speeds[speedIdx]
  btnSpeed.textContent = speeds[speedIdx] === 1 ? '1x' : speeds[speedIdx] + 'x'
})

// ── Fullscreen ────────────────────────────────────────────
btnFullscreen.addEventListener('click', toggleFullscreen)
videoOverlay.addEventListener('dblclick', toggleFullscreen)

function toggleFullscreen() {
  if (!document.fullscreenElement) playerWrap.requestFullscreen()
  else document.exitFullscreen()
}

document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 100))

let hideCtrlTimer
document.addEventListener('mousemove', () => {
  playerWrap.classList.add('show-ctrl')
  clearTimeout(hideCtrlTimer)
  hideCtrlTimer = setTimeout(() => playerWrap.classList.remove('show-ctrl'), 2500)
})

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'KeyE' && !e.ctrlKey) { toggleEditMode(); return }
  if (e.code === 'KeyZ' && e.ctrlKey)  { undoDraw(); return }

  if (!video.src) return
  switch (e.code) {
    case 'Space':      e.preventDefault(); togglePlay(); break
    case 'ArrowRight': e.preventDefault(); video.currentTime += 5; redraw(); break
    case 'ArrowLeft':  e.preventDefault(); video.currentTime -= 5; redraw(); break
    case 'ArrowUp':    e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'ArrowDown':  e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'KeyM':       btnMute.click(); break
    case 'KeyF':       toggleFullscreen(); break
    case 'KeyO':       openFile(); break
  }
})

// ── Helpers ───────────────────────────────────────────────
function formatTime(s) {
  if (isNaN(s) || s == null) return '0:00'
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec}` : `${m}:${sec}`
}

// ══════════════════════════════════════════════════════════
//   DRAWING MODULE — Timestamp-based annotations
// ══════════════════════════════════════════════════════════

const canvas    = document.getElementById('drawCanvas')
const ctx       = canvas.getContext('2d')
const drawPanel = document.getElementById('drawPanel')

// ── Drawing state ─────────────────────────────────────────
const ds = {
  enabled:     false,
  tool:        'pencil',
  color:       '#ffffff',
  width:       2,
  duration:    4,       // seconds visible after timestamp (-1 = always)
  annotations: [],      // committed annotations (each has .timestamp, .duration)
  current:     null,    // annotation currently being drawn
  drawing:     false
}

// ── Canvas resize ─────────────────────────────────────────
function resizeCanvas() {
  const dpr  = window.devicePixelRatio || 1
  const rect = video.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const saved = [...ds.annotations]
  canvas.width  = rect.width  * dpr
  canvas.height = rect.height * dpr
  canvas.style.width  = rect.width  + 'px'
  canvas.style.height = rect.height + 'px'
  ctx.scale(dpr, dpr)
  ds.annotations = saved
  redraw()
}
window.addEventListener('resize', resizeCanvas)

// ── Annotation visibility at time t ──────────────────────
function isVisible(ann, t) {
  if (ann.duration === -1 || !video.duration) return true   // always visible
  const start = ann.timestamp - 0.3                         // tiny grace before
  const end   = ann.timestamp + ann.duration
  return t >= start && t <= end
}

// Smooth opacity: fade-in and fade-out at edges
function getOpacity(ann, t) {
  if (ann.duration === -1 || !video.duration) return 1
  const start   = ann.timestamp - 0.3
  const end     = ann.timestamp + ann.duration
  const fadeDur = Math.min(0.4, ann.duration * 0.15)

  if (t < ann.timestamp)       return Math.max(0, Math.min(1, (t - start) / (ann.timestamp - start + 0.001)))
  if (t > end - fadeDur)       return Math.max(0, (end - t) / fadeDur)
  return 1
}

// ── Edit mode toggle ──────────────────────────────────────
function toggleEditMode() {
  ds.enabled = !ds.enabled
  drawPanel.classList.toggle('visible', ds.enabled)
  canvas.classList.toggle('edit-mode', ds.enabled)
  btnEditMode.classList.toggle('active', ds.enabled)
  if (ds.enabled) {
    if (!video.paused) video.pause()
    resizeCanvas()
    updateCanvasCursor()
  }
}
btnEditMode.addEventListener('click', toggleEditMode)

function updateCanvasCursor() {
  if (canvas.classList.contains('edit-mode')) {
    canvas.style.cursor = 'crosshair'
  }
}

// ── Tool selection ────────────────────────────────────────
document.querySelectorAll('.dp-tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dp-tool[data-tool]').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    ds.tool = btn.dataset.tool
  })
})

// ── Color selection ───────────────────────────────────────
document.querySelectorAll('.dp-color').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.dp-color').forEach(s => s.classList.remove('active'))
    swatch.classList.add('active')
    ds.color = swatch.dataset.color
  })
})

// ── Width selection ───────────────────────────────────────
document.querySelectorAll('.dp-width').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dp-width').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    ds.width = parseInt(btn.dataset.width)
  })
})

// ── Duration selection ────────────────────────────────────
document.querySelectorAll('.dp-dur').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dp-dur').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    ds.duration = parseInt(btn.dataset.dur)
  })
})

// ── Undo & Clear ──────────────────────────────────────────
function undoDraw() {
  if (ds.annotations.length === 0) return
  ds.annotations.pop()
  redraw()
  updateTimelineMarkers()
  updateAnnotationBadge()
}

document.getElementById('btnUndo').addEventListener('click', undoDraw)
document.getElementById('btnClearAll').addEventListener('click', () => {
  ds.annotations = []
  ds.current = null
  redraw()
  updateTimelineMarkers()
  updateAnnotationBadge()
})

// ── Mouse events ──────────────────────────────────────────
canvas.addEventListener('mousedown', e => {
  if (!ds.enabled) return
  e.preventDefault()
  ds.drawing = true
  const pos = getPos(e)
  if (ds.tool === 'pencil') {
    ds.current = { tool: 'pencil', color: ds.color, width: ds.width, points: [pos] }
  } else {
    ds.current = { tool: ds.tool, color: ds.color, width: ds.width, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
  }
})

canvas.addEventListener('mousemove', e => {
  if (!ds.drawing || !ds.enabled || !ds.current) return
  const pos = getPos(e)
  if (ds.tool === 'pencil') ds.current.points.push(pos)
  else { ds.current.x2 = pos.x; ds.current.y2 = pos.y }
  redraw()
})

canvas.addEventListener('mouseup', e => {
  if (!ds.drawing || !ds.current) return
  ds.drawing = false
  const ann = ds.current

  const isTiny = ann.tool !== 'pencil'
    && Math.abs(ann.x2 - ann.x1) < 3
    && Math.abs(ann.y2 - ann.y1) < 3

  if (!isTiny) {
    // ★ Stamp with current video timestamp
    ann.timestamp = video.currentTime || 0
    ann.duration  = ds.duration
    ds.annotations.push(ann)
    updateTimelineMarkers()
    updateAnnotationBadge()
  }
  ds.current = null
  redraw()
})

canvas.addEventListener('mouseleave', () => {
  if (ds.drawing && ds.current && ds.tool === 'pencil' && ds.current.points.length > 1) {
    ds.current.timestamp = video.currentTime || 0
    ds.current.duration  = ds.duration
    ds.annotations.push(ds.current)
    ds.current = null
    ds.drawing = false
    redraw()
    updateTimelineMarkers()
    updateAnnotationBadge()
  }
})

function getPos(e) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

// ── Redraw — shows only annotations visible at current time
function redraw() {
  const t = video.currentTime || 0
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const ann of ds.annotations) {
    if (!isVisible(ann, t)) continue
    ctx.globalAlpha = getOpacity(ann, t)
    renderAnn(ann)
  }
  ctx.globalAlpha = 1

  // Annotation currently being drawn — always visible
  if (ds.current) renderAnn(ds.current)
}

// ── Render a single annotation ────────────────────────────
function renderAnn(ann) {
  ctx.save()
  ctx.strokeStyle = ann.color
  ctx.fillStyle   = ann.color
  ctx.lineWidth   = ann.width
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.setLineDash(ann.tool === 'dashed' ? [ann.width * 4, ann.width * 2.5] : [])

  switch (ann.tool) {
    case 'pencil': drawPencil(ann); break
    case 'line':
    case 'dashed': drawLine(ann);   break
    case 'arrow':  drawArrow(ann);  break
    case 'circle': drawCircle(ann); break
    case 'rect':   drawRect(ann);   break
  }
  ctx.restore()
}

// ── Drawing primitives ────────────────────────────────────
function drawPencil(ann) {
  if (!ann.points.length) return
  if (ann.points.length === 1) {
    ctx.beginPath()
    ctx.arc(ann.points[0].x, ann.points[0].y, ann.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(ann.points[0].x, ann.points[0].y)
  for (let i = 1; i < ann.points.length - 1; i++) {
    const mx = (ann.points[i].x + ann.points[i + 1].x) / 2
    const my = (ann.points[i].y + ann.points[i + 1].y) / 2
    ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, mx, my)
  }
  const last = ann.points[ann.points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function drawLine(ann) {
  ctx.beginPath()
  ctx.moveTo(ann.x1, ann.y1)
  ctx.lineTo(ann.x2, ann.y2)
  ctx.stroke()
}

function drawArrow(ann) {
  const { x1, y1, x2, y2, width } = ann
  const dx = x2 - x1, dy = y2 - y1
  if (Math.sqrt(dx * dx + dy * dy) < 2) return
  const headLen = Math.max(14, width * 4)
  const angle   = Math.atan2(dy, dx)
  const spread  = Math.PI / 7

  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - spread), y2 - headLen * Math.sin(angle - spread))
  ctx.lineTo(x2 - headLen * Math.cos(angle + spread), y2 - headLen * Math.sin(angle + spread))
  ctx.closePath(); ctx.fill()
}

function drawCircle(ann) {
  const cx = (ann.x1 + ann.x2) / 2, cy = (ann.y1 + ann.y2) / 2
  const rx = Math.abs(ann.x2 - ann.x1) / 2, ry = Math.abs(ann.y2 - ann.y1) / 2
  if (rx < 1 && ry < 1) return
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawRect(ann) {
  const x = Math.min(ann.x1, ann.x2), y = Math.min(ann.y1, ann.y2)
  const w = Math.abs(ann.x2 - ann.x1), h = Math.abs(ann.y2 - ann.y1)
  if (w < 1 || h < 1) return
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.stroke()
}

// ── Timeline markers (color = annotation drawing color) ───
function updateTimelineMarkers() {
  document.querySelectorAll('.tl-marker').forEach(m => m.remove())
  if (!video.duration) return

  // Group by 0.5s bucket — last annotation in each bucket sets the color
  const buckets = new Map()
  for (const ann of ds.annotations) {
    const bucket = Math.round(ann.timestamp * 2)
    buckets.set(bucket, ann) // overwrite → last added color wins
  }

  for (const [, ann] of buckets) {
    const pct    = (ann.timestamp / video.duration) * 100
    const marker = document.createElement('div')
    marker.className       = 'tl-marker'
    marker.style.left      = pct + '%'
    marker.style.background = ann.color
    marker.style.boxShadow  = `0 0 7px ${ann.color}dd, 0 0 2px ${ann.color}`
    marker.title           = formatTime(ann.timestamp)

    // Click marker → jump to that annotation
    marker.addEventListener('click', ev => {
      ev.stopPropagation()
      video.currentTime = ann.timestamp
      updateProgress(pct)
      timeCurrent.textContent = formatTime(ann.timestamp)
      redraw()
    })
    progressBar.appendChild(marker)
  }
}


// ── Annotation count badge on edit button ─────────────────
function updateAnnotationBadge() {
  const count = ds.annotations.length
  if (count > 0) {
    btnEditMode.dataset.count = count
    btnEditMode.title = `Modo de desenho (E) — ${count} anotacao(oes)`
  } else {
    delete btnEditMode.dataset.count
    btnEditMode.title = 'Modo de desenho (E)'
  }
}
