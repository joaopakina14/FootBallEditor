const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs   = require('fs')
const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#0d0d0f',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  })

  win.loadFile('index.html')

  // Window controls
  ipcMain.on('window-minimize', () => win.minimize())
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window-close', () => win.close())

  // Open file dialog
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Vídeos',
          extensions: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpeg', 'mpg', '3gp', 'ts']
        },
        { name: 'Todos os ficheiros', extensions: ['*'] }
      ]
    })
    if (!result.canceled && result.filePaths.length > 0) return result.filePaths[0]
    return null
  })

  // ── Cut video with optional burn-in overlays (FFmpeg) ──────────────────
  ipcMain.handle('cut-video', async (event, { inputPath, startTime, duration, outputPath, overlaySequencePath }) => {
    return new Promise((resolve) => {
      let command = ffmpeg(inputPath)
        .setFfmpegPath(ffmpegStatic)
        .setStartTime(startTime)
        .setDuration(duration)

      const hasSequence = !!overlaySequencePath

      if (hasSequence) {
        command.input(overlaySequencePath)
          .inputOptions(['-framerate 30', '-f image2'])

        command
          .complexFilter('[0:v][1:v]overlay=0:0[out]', ['out'])
          .outputOptions(['-c:v libx264', '-preset ultrafast', '-c:a copy'])
      } else {
        // Fast copy if no annotations to burn
        command.outputOptions(['-c copy', '-avoid_negative_ts make_zero'])
      }

      command
        .output(outputPath)
        .on('start', cmd => console.log('FFmpeg started:', cmd))
        .on('end', () => {
          if (hasSequence) {
            const tempDir = path.dirname(overlaySequencePath)
            try {
              fs.rmSync(tempDir, { recursive: true, force: true })
            } catch (err) {
              console.error('Failed to clean up temp dir:', err)
            }
          }
          resolve({ success: true, outputPath })
        })
        .on('error', err => {
          console.error('FFmpeg error:', err)
          if (hasSequence) {
            const tempDir = path.dirname(overlaySequencePath)
            try {
              fs.rmSync(tempDir, { recursive: true, force: true })
            } catch (err) {
              console.error('Failed to clean up temp dir:', err)
            }
          }
          resolve({ success: false, error: err.message })
        })
        .run()
    })
  })

  // ── Save dialog for playlist export ────────────────────────────────────
  ipcMain.handle('show-save-dialog', async (event, { defaultName }) => {
    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName || 'playlist_export.mp4',
      filters: [
        { name: 'Vídeo MP4', extensions: ['mp4'] }
      ]
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  // ── Export playlist: concatenate clips into one video ──────────────────
  ipcMain.handle('export-playlist', async (event, { clips }) => {
    const os = require('os')
    const tmpBase = path.join(os.tmpdir(), `fv_export_${Date.now()}`)

    try {
      fs.mkdirSync(tmpBase, { recursive: true })
    } catch(e) {
      return { success: false, error: 'Falha ao criar pasta temporária: ' + e.message }
    }

    const segmentPaths = []
    let error = null

    // Step 1: cut each clip segment to a temp MP4 file (re-encode for compat)
    for (let i = 0; i < clips.length; i++) {
      const cl = clips[i]
      const segOut = path.join(tmpBase, `seg_${i}.mp4`)
      segmentPaths.push(segOut)

      const startTime = Math.min(cl.inTime, cl.outTime)
      const duration  = Math.abs(cl.outTime - cl.inTime)

      console.log(`[export-playlist] Processing clip ${i+1}/${clips.length}: ${cl.videoPath} [${startTime}s → ${startTime+duration}s]`)

      await new Promise((res) => {
        ffmpeg(cl.videoPath)
          .setFfmpegPath(ffmpegStatic)
          .setStartTime(startTime)
          .setDuration(duration)
          .outputOptions([
            '-c:v libx264',
            '-preset ultrafast',
            '-profile:v baseline',
            '-level 3.0',
            '-pix_fmt yuv420p',
            '-c:a aac',
            '-ar 44100',
            '-movflags +faststart',
            '-avoid_negative_ts make_zero'
          ])
          .output(segOut)
          .on('end', res)
          .on('error', (err) => {
            console.error('[export-playlist] Segment error:', err.message)
            error = `Clip ${i+1}: ${err.message}`
            res()
          })
          .run()
      })

      if (error) break
    }

    if (error) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }) } catch(_) {}
      return { success: false, error }
    }

    // Step 3: ask user where to save
    const saveResult = await dialog.showSaveDialog(win, {
      defaultPath: 'playlist_export.mp4',
      filters: [{ name: 'Vídeo MP4', extensions: ['mp4'] }]
    })

    if (saveResult.canceled || !saveResult.filePath) {
      try { fs.rmSync(tmpBase, { recursive: true, force: true }) } catch(_) {}
      return { success: false, error: 'Cancelado' }
    }

    const outputPath = saveResult.filePath

    // Step 2: write concat list with forward slashes (required by ffmpeg on Windows)
    const concatListPath = path.join(tmpBase, 'concat.txt')
    const concatContent = segmentPaths
      .map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "\\'")}'`)
      .join('\n')
    fs.writeFileSync(concatListPath, concatContent, 'utf8')
    console.log('[export-playlist] concat.txt:\n', concatContent)

    // Step 4: concatenate all segments
    return new Promise((resolve) => {
      ffmpeg()
        .setFfmpegPath(ffmpegStatic)
        .input(concatListPath.replace(/\\/g, '/'))
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(outputPath)
        .on('start', cmd => console.log('[export-playlist] FFmpeg concat:', cmd))
        .on('end', () => {
          try { fs.rmSync(tmpBase, { recursive: true, force: true }) } catch(_) {}
          resolve({ success: true, outputPath })
        })
        .on('error', (err) => {
          console.error('[export-playlist] Concat error:', err.message)
          try { fs.rmSync(tmpBase, { recursive: true, force: true }) } catch(_) {}
          resolve({ success: false, error: err.message })
        })
        .run()
    })
  })

  // Open folder in Explorer and highlight the file
  ipcMain.handle('show-in-folder', (event, filePath) => {
    shell.showItemInFolder(filePath)
    return true
  })

  // ── Save annotations internally (in app userData dir) ────────────────
  ipcMain.handle('save-annotations', (event, { videoPath, annotations, taggedEvents, shortcutKeys }) => {
    try {
      const storageDir = path.join(app.getPath('userData'), 'annotations')
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
      
      const fileKey = Buffer.from(videoPath).toString('hex') + '.json'
      const annPath = path.join(storageDir, fileKey)
      
      fs.writeFileSync(annPath, JSON.stringify({ videoPath, version: 1, annotations, taggedEvents, shortcutKeys }, null, 2), 'utf8')
      return { success: true }
    } catch (err) {
      console.error('save-annotations error:', err)
      return { success: false, error: err.message }
    }
  })

  // ── Load annotations internally ─────────────────────────────────────
  ipcMain.handle('load-annotations', (event, videoPath) => {
    try {
      const storageDir = path.join(app.getPath('userData'), 'annotations')
      const fileKey = Buffer.from(videoPath).toString('hex') + '.json'
      const annPath = path.join(storageDir, fileKey)
      
      if (!fs.existsSync(annPath)) return { success: false, annotations: [], taggedEvents: [], shortcutKeys: {} }
      const data = JSON.parse(fs.readFileSync(annPath, 'utf8'))
      return { 
        success: true, 
        annotations: data.annotations || [], 
        taggedEvents: data.taggedEvents || [],
        shortcutKeys: data.shortcutKeys || {}
      }
    } catch (err) {
      console.error('load-annotations error:', err)
      return { success: false, annotations: [], taggedEvents: [], shortcutKeys: {} }
    }
  })

  // ── Track player trajectory using Python + OpenCV CSRT ──────────────
  ipcMain.handle('track-player', async (event, { videoPath, startTime, duration, bbox }) => {
    return new Promise((resolve) => {
      const { execFile } = require('child_process')
      let scriptPath = path.join(__dirname, 'tracker.py')
      // Se estiver empacotado em ASAR, o Node.js child_process precisa do caminho unpacked na disk
      scriptPath = scriptPath.replace('app.asar', 'app.asar.unpacked')
      const bboxJson = JSON.stringify(bbox)

      execFile('python', [scriptPath, videoPath, startTime.toString(), duration.toString(), bboxJson], (error, stdout, stderr) => {
        if (error) {
          console.error('Python tracking error:', stderr || error.message)
          resolve({ success: false, error: stderr || error.message })
          return
        }

        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (e) {
          console.error('Failed to parse Python tracker stdout:', stdout)
          resolve({ success: false, error: 'Invalid JSON response from tracker script' })
        }
      })
    })
  })

  // ── License Management (Lemon Squeezy Integration) ──────────────────
  const licensePath = path.join(app.getPath('userData'), 'license.json')

  ipcMain.handle('check-license', async () => {
    try {
      if (!fs.existsSync(licensePath)) {
        return { status: 'free' }
      }
      const data = JSON.parse(fs.readFileSync(licensePath, 'utf8'))
      if (!data.licenseKey) {
        return { status: 'free' }
      }

      // Check online with Lemon Squeezy validation endpoint
      const res = await postJSON('https://api.lemonsqueezy.com/v1/licenses/validate', {
        license_key: data.licenseKey,
        instance_id: data.instanceId
      })

      if (res.valid && res.license_key && res.license_key.status === 'active') {
        return { status: 'pro', licenseKey: data.licenseKey }
      } else {
        // License key is no longer active/valid, remove file
        try { fs.unlinkSync(licensePath) } catch(e){}
        return { status: 'free' }
      }
    } catch (err) {
      console.warn('Licensing check offline mode fallback:', err.message)
      // Offline fallback: if server is down or no internet, trust the locally stored active license
      if (fs.existsSync(licensePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(licensePath, 'utf8'))
          if (data.licenseKey) {
            return { status: 'pro', licenseKey: data.licenseKey, offline: true }
          }
        } catch(e){}
      }
      return { status: 'free' }
    }
  })

  ipcMain.handle('activate-license', async (event, licenseKey) => {
    try {
      const os = require('os')
      const instanceName = `${os.hostname()} - ${os.platform()}`

      const res = await postJSON('https://api.lemonsqueezy.com/v1/licenses/activate', {
        license_key: licenseKey,
        instance_name: instanceName
      })

      if (res.activated) {
        fs.writeFileSync(licensePath, JSON.stringify({
          licenseKey: licenseKey,
          instanceId: res.instance.id,
          instanceName: instanceName,
          activatedAt: Date.now()
        }, null, 2), 'utf8')

        return { success: true }
      } else {
        return { success: false, error: res.error || 'Falha ao ativar a licença. Verifica se a chave está correta.' }
      }
    } catch (err) {
      console.error('activate-license error:', err)
      return { success: false, error: 'Erro de rede. Verifica a tua ligação à Internet.' }
    }
  })

  ipcMain.handle('deactivate-license', async () => {
    try {
      if (fs.existsSync(licensePath)) {
        const data = JSON.parse(fs.readFileSync(licensePath, 'utf8'))
        
        // Try deactivation online (silently ignore network errors)
        try {
          await postJSON('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
            license_key: data.licenseKey,
            instance_id: data.instanceId
          })
        } catch (e) {
          console.warn('Could not deactivate online, unlinking locally anyway:', e.message)
        }

        fs.unlinkSync(licensePath)
      }
      return { success: true }
    } catch (err) {
      console.error('deactivate-license error:', err)
      return { success: false, error: err.message }
    }
  })

  // ── Transcode unsupported video to standard MP4 (H.264/AAC) ──────────
  ipcMain.handle('transcode-video', async (event, { inputPath }) => {
    return new Promise((resolve) => {
      const tempDir = path.join(app.getPath('userData'), 'temp_videos')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      
      const fileKey = Buffer.from(inputPath).toString('hex').substring(0, 16) + '_' + Date.now() + '.mp4'
      const outputPath = path.join(tempDir, fileKey)

      let lastPercent = -1;
      ffmpeg(inputPath)
        .setFfmpegPath(ffmpegStatic)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset ultrafast',
          '-crf 23',
          '-pix_fmt yuv420p'
        ])
        .on('start', cmd => console.log('FFmpeg transcoding started:', cmd))
        .on('progress', progress => {
          if (progress.percent !== undefined) {
            const percent = Math.floor(progress.percent)
            if (percent !== lastPercent) {
              lastPercent = percent
              event.sender.send('transcode-progress', { percent })
            }
          }
        })
        .on('end', () => {
          resolve({ success: true, outputPath })
        })
        .on('error', err => {
          console.error('FFmpeg transcoding error:', err)
          resolve({ success: false, error: err.message })
        })
        .run()
    })
  })
}

// ── Native HTTPS POST Helper (JSON) ──────────────────────────────────
function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const { URL } = require('url')
    const https = require('https')
    
    const urlObj = new URL(url)
    const body = JSON.stringify(data)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let responseBody = ''
      res.on('data', (chunk) => { responseBody += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody))
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + responseBody))
        }
      })
    })

    req.on('error', (err) => { reject(err) })
    req.write(body)
    req.end()
  })
}

app.whenReady().then(() => {
  // Cleanup old temp videos on startup
  try {
    const tempDir = path.join(app.getPath('userData'), 'temp_videos')
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  } catch (err) {
    console.error('Failed to cleanup temp videos directory on startup:', err)
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

