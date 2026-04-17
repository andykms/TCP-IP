import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainInvokeEvent,
  Menu,
} from "electron";
import * as path from "path";
import * as net from "net"; // для TCP-клиента
import * as fs from "fs";
import { pipeline } from "stream/promises";

const CONNECTION_TIMEOUT = 15000;

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

interface TcpConnection {
  socket: net.Socket;
  id: string;
}

let connections: Map<string, TcpConnection> = new Map();

function setupIpcHandlers() {
  ipcMain.handle(
    "tcp:connect",
    async (
      event: IpcMainInvokeEvent,
      connectionId: string,
      host: string,
      port: number
    ) => {
      return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        const timeout = setTimeout(() => {
          socket.destroy();
          reject(new Error("Система: время подключения истекло"));
        }, CONNECTION_TIMEOUT);

        socket.connect(port, host, () => {
          clearTimeout(timeout);
          connections.set(connectionId, { socket, id: connectionId });

          socket.on("data", (data) => {
            if (mainWindow) {
              mainWindow.webContents.send(
                "tcp:data",
                connectionId,
                data.toString("utf8")
              );
            }
          });

          socket.on("error", (err) => {
            if (mainWindow) {
              mainWindow.webContents.send(
                "tcp:error",
                connectionId,
                err.message
              );
            }
            connections.delete(connectionId);
          });

          socket.on("close", () => {
            connections.delete(connectionId);
            if (mainWindow) {
              mainWindow.webContents.send("tcp:close", connectionId);
            }
          });

          resolve({ success: true });
        });

        socket.on("error", (err) => {
          clearTimeout(timeout);
          reject(err.message);
        });
      });
    }
  );

  ipcMain.handle(
    "tcp:send",
    async (event: IpcMainInvokeEvent, connectionId: string, data: string) => {
      const connection = connections.get(connectionId);

      if (!connection) {
        throw new Error("Система: подключение не найдено");
      }
      connection.socket.write(data);
      return { success: true };
    }
  );

  ipcMain.handle(
    "tcp:disconnect",
    async (event: IpcMainInvokeEvent, connectionId: string) => {
      const connection = connections.get(connectionId);

      if (connection) {
        connection.socket.destroy();
        connections.delete(connectionId);
      }
      return { success: true };
    }
  );

  ipcMain.handle(
    "tcp:sendFile",
    async (
      event: IpcMainInvokeEvent,
      connectionId: string,
      filePath: string
    ) => {
      const connection = connections.get(connectionId);

      if (!connection) {
        throw new Error("Система: подключение не найдено");
      }

      try {
        const stats = await fs.promises.stat(filePath);
        const fileName = path.basename(filePath);
        const fileSize = stats.size;

        const header = JSON.stringify({
          type: "file",
          name: fileName,
          size: fileSize,
        });

        connection.socket.write(header);
        const readStream = fs.createReadStream(filePath);
        await pipeline(readStream, connection.socket, { end: false });
        return { success: true, fileName, fileSize };
      } catch (err) {
        throw err;
      }
    }
  );

  ipcMain.handle("dialog:openFile", async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ["openFile"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}
