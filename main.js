// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
const {ipcMain} = require('electron')  

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
	  nodeIntegration: true,
	  contextIsolation: false
	  
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
 // mainWindow.removeMenu();
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  

}
ipcMain.handle('openFile', async (event, path) => { 
   const {dialog} = require('electron') 
   const fs = require('fs') 
   return dialog.showOpenDialog(function (fileNamesd) { 
      
      // fileNames is an array that contains all the selected 
      if(fileNamesd === undefined) { 
         console.log("No file selected"); 
      
      } else { 
         return readFile(fileNamesd[0]); 
      } 
   });
   
   function readFile(filepathd) { 
      fs.readFile(filepathd, 'utf-8', (err, data) => { 
         
         if(err){ 
            alert("An error ocurred reading the file :" + err.message) 
            return 
         } 
         
         // handle the file content 
         return data 
      }) 
   } 
})  
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
process.on('uncaughtException', function (err) {
  console.log(err);
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
