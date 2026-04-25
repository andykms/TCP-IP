import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainInvokeEvent,
  Menu,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { TcpClientService } from "./tcp-client/tcp-client.service";
import { Format } from "./features/format.model";

const tcpClientService = new TcpClientService();

let mainWindow: BrowserWindow | null = null;

const menu = Menu.buildFromTemplate([
  {
    label: "View",
    submenu: [
      {
        label: "Toggle Developer Tools",
        accelerator: "Ctrl+I",
        click: () => {
          mainWindow?.webContents.toggleDevTools();
        },
      },
    ],
  },
]);
Menu.setApplicationMenu(menu);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:4200");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/frontend/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function setupIpcHandlers() {
  ipcMain.handle(
    "tcp:connect",
    async (
      event: IpcMainInvokeEvent,
      connectionId: string,
      host: string,
      port: number
    ) => {
      const tcpConnection = await tcpClientService.connect(
        connectionId,
        host,
        port
      );
      tcpConnection.addDataListener((data) => {
        if (mainWindow) {
          mainWindow.webContents.send(
            "tcp:data",
            connectionId,
            data.toString("utf8")
          );
        }
      });

      tcpConnection.addErrorListener((err) => {
        if (mainWindow) {
          mainWindow.webContents.send("tcp:error", connectionId, err.message);
        }
      });

      tcpConnection.addCloseListener(() => {
        if (mainWindow) {
          mainWindow.webContents.send("tcp:close", connectionId);
        }
      });
      return { success: true };
    }
  );

  ipcMain.handle(
    "tcp:send",
    async (
      event: IpcMainInvokeEvent,
      connectionId: string,
      data: string,
      format: Format = Format.UTF_8
    ) => await tcpClientService.sendData(connectionId, data, format)
  );

  ipcMain.handle(
    "tcp:disconnect",
    async (event: IpcMainInvokeEvent, connectionId: string) => {
      tcpClientService.disconnect(connectionId);
    }
  );

  ipcMain.handle(
    "tcp:sendFile",
    async (event: IpcMainInvokeEvent, connectionId: string, filePath: string) =>
      await tcpClientService.sendFile(connectionId, filePath)
  );

  ipcMain.handle("dialog:openFile", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const stats = await fs.promises.stat(filePath);
        const fileName = path.basename(filePath);
        const fileSize = stats.size;

        const fileInfo = {
          name: fileName,
          size: fileSize,
          path: filePath,
        };
        return fileInfo;
      } catch (err) {
        throw err;
      }
    }
    return null;
  });
}
