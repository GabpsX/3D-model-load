const { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog} = require('electron'); // Importe ipcMain aqui
const path = require('path');
const fs = require('fs');
const $ = require('jquery'); // Importar o jQuery

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minHeight: 600,
    minWidth: 1180,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nativeWindowOpen: true,
      enableRemoteModule: true,
      sandbox:false,
      nodeIntegrationInSubFrames:true,
      webviewTag:true,
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  globalShortcut.register('F12', () => {
    console.log(globalShortcut);
    mainWindow.webContents.openDevTools();
  });

  
  mainWindow.on('closed', () => {
    // Desregistrar o atalho F12 quando a janela for fechada
    globalShortcut.unregister('F12');
  });
  

  
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

// Ouça mensagens do WebView
ipcMain.on('executarCodigoNoWebView', (event) => {
  const appPath = path.join(__dirname, '..', 'resources', 'app');
  const parentDirectoryPath = path.dirname(appPath);

  // Envie o resultado de volta para o WebView
  event.sender.send('codigoExecutadoNoWebView', parentDirectoryPath);
});

 ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
  }).then((result) => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      event.sender.send('selected-file', filePath);
    }
  });
});



  ipcMain.on('list-model-folder', (event) => {

    const appPath = path.join(__dirname, '..', 'resources');
    const get_path = path.dirname(appPath);
    let parentDirectoryPath = get_path.replace(/\\app\.asar$/, '');
    
    const appPath1 = path.join(parentDirectoryPath, 'modelos');

    try {
      // List
      const modelFiles = fs.readdirSync(appPath1);
      // send 
      event.reply('model-folder-content', modelFiles);
    } catch (error) {
      // error
      event.reply('model-folder-error', error.message);
    }
  });
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});




