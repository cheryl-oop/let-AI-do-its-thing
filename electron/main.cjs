const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron')
const path = require('node:path')
const { spawn } = require('node:child_process')

const DEV_URL = process.env.VITE_DEV_SERVER_URL || ''
const isWindows = process.platform === 'win32'

let mainWindow = null
let watcher = null
let watcherRestart = null
let quitting = false
let lastPayload = null

/**
 * A tiny persistent PowerShell loop that reports the foreground window's
 * process name and title once every ~700ms. Using one long-lived process
 * avoids the cost of spawning a new one on every poll, and avoids any native
 * node module (active-win etc.) that would need a compiler on the user's box.
 */
const PS_SCRIPT = String.raw`
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class TomodoroForeground {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
'@
while ($true) {
  $hwnd = [TomodoroForeground]::GetForegroundWindow()
  $targetPid = 0
  [void][TomodoroForeground]::GetWindowThreadProcessId($hwnd, [ref]$targetPid)
  $buffer = New-Object System.Text.StringBuilder 1024
  [void][TomodoroForeground]::GetWindowText($hwnd, $buffer, 1024)
  $procName = 'unknown'
  try {
    $proc = Get-Process -Id $targetPid -ErrorAction Stop
    $procName = $proc.ProcessName
  } catch {
    $procName = 'unknown'
  }
  $payload = [ordered]@{
    processName = $procName
    windowTitle = $buffer.ToString()
    pid = $targetPid
  }
  $payload | ConvertTo-Json -Compress
  Start-Sleep -Milliseconds 700
}
`

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function startWatcher() {
  if (!isWindows || watcher) return

  const encoded = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64')
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  watcher = child
  let pending = ''

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk) => {
    pending += chunk
    let newlineIndex
    while ((newlineIndex = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, newlineIndex).trim()
      pending = pending.slice(newlineIndex + 1)
      if (!line.startsWith('{')) continue
      try {
        const parsed = JSON.parse(line)
        lastPayload = parsed
        sendToRenderer('activity:update', parsed)
      } catch {
        /* partial or malformed line — ignore */
      }
    }
  })

  child.stderr.on('data', (chunk) => {
    const text = String(chunk)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#< CLIXML'))
      .join(' ')
    if (text) console.log('[tomodoro/watcher]', text)
  })

  child.on('exit', () => {
    watcher = null
    if (!quitting) {
      watcherRestart = setTimeout(startWatcher, 2500)
    }
  })
}

function stopWatcher() {
  if (watcherRestart) {
    clearTimeout(watcherRestart)
    watcherRestart = null
  }
  if (watcher) {
    const child = watcher
    watcher = null
    try {
      child.kill()
    } catch {
      /* already gone */
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 840,
    minWidth: 1000,
    minHeight: 720,
    title: 'Tomodoro',
    backgroundColor: '#ffe1ea',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.on('focus', () => sendToRenderer('app:focus', true))
  mainWindow.on('blur', () => sendToRenderer('app:focus', false))
  mainWindow.webContents.on('did-finish-load', () => {
    sendToRenderer('app:focus', mainWindow ? mainWindow.isFocused() : true)
    if (lastPayload) sendToRenderer('activity:update', lastPayload)
  })

  if (DEV_URL) {
    mainWindow.loadURL(DEV_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.on('activity:start', () => startWatcher())
ipcMain.on('activity:stop', () => stopWatcher())

ipcMain.handle('activity:idle', () => {
  try {
    return powerMonitor.getSystemIdleTime()
  } catch {
    return 0
  }
})

ipcMain.handle('activity:last', () => lastPayload)

ipcMain.handle('app:pin', (_event, pinned) => {
  if (!mainWindow) return false
  mainWindow.setAlwaysOnTop(Boolean(pinned), 'floating')
  return mainWindow.isAlwaysOnTop()
})

ipcMain.handle('app:platform', () => process.platform)

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  quitting = true
  stopWatcher()
})

app.on('window-all-closed', () => {
  app.quit()
})
