import { contextBridge, ipcRenderer } from "electron";

export type TcpAPI = {
  connect: (connectionId: string, host: string, port: number) => Promise<any>;
  send: (connectionId: string, data: string) => Promise<any>;
  sendFile: (connectionId: string, filePath: string) => Promise<any>;
  disconnect: (connectionId: string) => Promise<any>;
  openFileDialog: () => Promise<void>;
  onData: (callback: (connectionId: string, data: string) => void) => void;
  onError: (callback: (connectionId: string, error: string) => void) => void;
  onClose: (callback: (connectionId: string) => void) => void;
  removeAllListeners: () => void;
}

contextBridge.exposeInMainWorld('electronAPI', {
  connect: (connectionId: string, host: string, port: number) => ipcRenderer.invoke('tcp:connect', connectionId, host, port),
  send: (connectionId: string, data: string) => ipcRenderer.invoke('tcp:send', connectionId, data),
  sendFile: (connectionId: string, filePath: string) => ipcRenderer.invoke('tcp:sendFile', connectionId, filePath),
  disconnect: (connectionId: string) => ipcRenderer.invoke('tcp:disconnect', connectionId),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  onData: (callback: (connectionId: string, data: string) => void) => ipcRenderer.on('tcp:data', (_, connectionId, data)=> callback(connectionId, data)),
  onError: (callback: (connectionId: string, error: string) => void) => ipcRenderer.on('tcp:error', (_, connectionId, error) => callback(connectionId, error)),
  onClose: (callback: (connectionId: string) => void) => ipcRenderer.on('tcp:close', (_, connectionId) => callback(connectionId)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('tcp:data');
    ipcRenderer.removeAllListeners('tcp:error');
    ipcRenderer.removeAllListeners('tcp:close');
  }
})