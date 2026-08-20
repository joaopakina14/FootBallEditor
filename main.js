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

  // ── Cut video with FFmpeg (-c copy, fast) ──────────────────
  ipcMain.handle('cut-video', async (event, { inputPath, startTime, duration, outputPath }) => {
    return new Promise((resolve) => {
      ffmpeg(inputPath)
        .setFfmpegPath(ffmpegStatic)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions(['-c copy', '-avoid_negative_ts make_zero'])
        .output(outputPath)
        .on('start', cmd => console.log('FFmpeg started:', cmd))
        .on('end', () => resolve({ success: true, outputPath }))
        .on('error', err => resolve({ success: false, error: err.message }))
        .run()
    })
  })

  // Open folder in Explorer and highlight the file
  ipcMain.handle('show-in-folder', (event, filePath) => {
    shell.showItemInFolder(filePath)
    return true
  })

  // ── Save annotations JSON alongside the video ──────────────
  ipcMain.handle('save-annotations', (event, { videoPath, annotations }) => {
    try {
      const annPath = videoPath + '.ann.json'
      fs.writeFileSync(annPath, JSON.stringify({ version: 1, annotations }, null, 2), 'utf8')
      return { success: true }
    } catch (err) {
      console.error('save-annotations error:', err)
      return { success: false, error: err.message }
    }
  })

  // ── Load annotations JSON for a video ──────────────────────
  ipcMain.handle('load-annotations', (event, videoPath) => {
    try {
      const annPath = videoPath + '.ann.json'
      if (!fs.existsSync(annPath)) return { success: false, annotations: [] }
      const data = JSON.parse(fs.readFileSync(annPath, 'utf8'))
      return { success: true, annotations: data.annotations || [] }
    } catch (err) {
      console.error('load-annotations error:', err)
      return { success: false, annotations: [] }
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
