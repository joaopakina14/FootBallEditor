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

  // Open folder in Explorer and highlight the file
  ipcMain.handle('show-in-folder', (event, filePath) => {
    shell.showItemInFolder(filePath)
    return true
  })

  // ── Save annotations internally (in app userData dir) ────────────────
  ipcMain.handle('save-annotations', (event, { videoPath, annotations }) => {
    try {
      const storageDir = path.join(app.getPath('userData'), 'annotations')
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
      
      const fileKey = Buffer.from(videoPath).toString('hex') + '.json'
      const annPath = path.join(storageDir, fileKey)
      
      fs.writeFileSync(annPath, JSON.stringify({ videoPath, version: 1, annotations }, null, 2), 'utf8')
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
      
      if (!fs.existsSync(annPath)) return { success: false, annotations: [] }
      const data = JSON.parse(fs.readFileSync(annPath, 'utf8'))
      return { success: true, annotations: data.annotations || [] }
    } catch (err) {
      console.error('load-annotations error:', err)
      return { success: false, annotations: [] }
    }
  })

  // ── Track player trajectory using Python + OpenCV CSRT ──────────────
  ipcMain.handle('track-player', async (event, { videoPath, startTime, duration, bbox }) => {
    return new Promise((resolve) => {
      const { execFile } = require('child_process')
      const scriptPath = path.join(__dirname, 'tracker.py')
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
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
