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

// ── State ─────────────────────────────────────────────────
const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
let speedIdx = 3 // 1×
let scrubbing = false

// ── Open file ─────────────────────────────────────────────
async function openFile() {
  const filePath = await ipcRenderer.invoke('open-file-dialog')
  if (!filePath) return
  loadVideo(filePath)
}

function loadVideo(filePath) {
  // Convert Windows path to file URL
  const fileUrl = 'file:///' + filePath.replace(/\\/g, '/')
  video.src = fileUrl
  video.load()
  video.play()
  filenameLabel.textContent = path.basename(filePath)
  emptyState.style.display = 'none'
  playerWrap.style.display = 'flex'
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
  if (video.paused) { video.play() } else { video.pause() }
  flashIcon()
}

function flashIcon() {
  playFlash.textContent = video.paused ? '⏸' : '▶'
  playFlash.classList.add('show')
  clearTimeout(playFlash._timer)
  playFlash._timer = setTimeout(() => playFlash.classList.remove('show'), 600)
}

video.addEventListener('play',  () => { btnPlayPause.textContent = '⏸' })
video.addEventListener('pause', () => { btnPlayPause.textContent = '▶' })

// ── Stop ──────────────────────────────────────────────────
btnStop.addEventListener('click', () => {
  video.pause()
  video.currentTime = 0
})

// ── Progress bar ──────────────────────────────────────────
video.addEventListener('timeupdate', () => {
  if (!scrubbing && video.duration) {
    const pct = (video.currentTime / video.duration) * 100
    updateProgress(pct)
    timeCurrent.textContent = formatTime(video.currentTime)
  }
})

video.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(video.duration)
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
  }
}

// ── Volume ────────────────────────────────────────────────
volumeSlider.addEventListener('input', () => {
  video.volume = volumeSlider.value
  video.muted = video.volume === 0
  updateMuteIcon()
})

btnMute.addEventListener('click', () => {
  video.muted = !video.muted
  if (!video.muted) volumeSlider.value = video.volume || 0.5
  updateMuteIcon()
})

function updateMuteIcon() {
  if (video.muted || video.volume === 0) {
    btnMute.textContent = '🔇'
  } else if (video.volume < 0.5) {
    btnMute.textContent = '🔉'
  } else {
    btnMute.textContent = '🔊'
  }
}

// ── Playback speed ────────────────────────────────────────
btnSpeed.addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % speeds.length
  video.playbackRate = speeds[speedIdx]
  const label = speeds[speedIdx] === 1 ? '1×' : speeds[speedIdx] + '×'
  btnSpeed.textContent = label
})

// ── Fullscreen ────────────────────────────────────────────
btnFullscreen.addEventListener('click', toggleFullscreen)
videoOverlay.addEventListener('dblclick', toggleFullscreen)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerWrap.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

document.addEventListener('fullscreenchange', () => {
  btnFullscreen.textContent = document.fullscreenElement ? '⛶' : '⛶'
})

// Show controls on mouse move in fullscreen
let hideCtrlTimer
document.addEventListener('mousemove', () => {
  playerWrap.classList.add('show-ctrl')
  clearTimeout(hideCtrlTimer)
  hideCtrlTimer = setTimeout(() => playerWrap.classList.remove('show-ctrl'), 2500)
})

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!video.src) return
  switch (e.code) {
    case 'Space':         e.preventDefault(); togglePlay(); break
    case 'ArrowRight':    e.preventDefault(); video.currentTime += 5; break
    case 'ArrowLeft':     e.preventDefault(); video.currentTime -= 5; break
    case 'ArrowUp':       e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'ArrowDown':     e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeSlider.value = video.volume; updateMuteIcon(); break
    case 'KeyM':          btnMute.click(); break
    case 'KeyF':          toggleFullscreen(); break
    case 'KeyO':          openFile(); break
  }
})

// ── Helpers ───────────────────────────────────────────────
function formatTime(s) {
  if (isNaN(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec}`
  return `${m}:${sec}`
}
