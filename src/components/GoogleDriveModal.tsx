import React, { useState, useEffect } from 'react';
import { HardDrive, X, Upload, Download, RefreshCw, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import {
  DriveFile,
  getStoredAccessToken,
  listDriveFiles,
  readDriveFile,
  saveFileToDrive,
  setStoredAccessToken,
  clearStoredAccessToken
} from '../utils/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToDrive: (fileName: string) => Promise<void>;
  onLoadFromDrive: (fileContent: string, fileName: string) => void;
  currentDocumentName: string;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onSaveToDrive,
  onLoadFromDrive,
  currentDocumentName
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'open'>('save');
  const [token, setToken] = useState<string | null>(null);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [saveFileName, setSaveFileName] = useState(currentDocumentName || 'MySpreadsheet');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredAccessToken();
      setToken(stored);
      setSaveFileName(currentDocumentName || 'MySpreadsheet');
      if (stored && activeTab === 'open') {
        fetchFiles(stored);
      }
    }
  }, [isOpen, activeTab, currentDocumentName]);

  const handleConnectToken = () => {
    if (manualTokenInput.trim()) {
      setStoredAccessToken(manualTokenInput.trim(), 3600);
      setToken(manualTokenInput.trim());
      setStatusMsg({ type: 'success', text: 'Connected to Google Drive successfully!' });
      if (activeTab === 'open') {
        fetchFiles(manualTokenInput.trim());
      }
    }
  };

  const fetchFiles = async (authToken: string) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const driveFiles = await listDriveFiles(authToken);
      setFiles(driveFiles);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to list Google Drive files.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      setStatusMsg({ type: 'error', text: 'Please enter your Google OAuth access token first.' });
      return;
    }
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const finalName = saveFileName.endsWith('.csv') ? saveFileName : `${saveFileName}.csv`;
      await onSaveToDrive(finalName);
      setStatusMsg({ type: 'success', text: `Saved "${finalName}" to Google Drive successfully!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving file to Google Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFile = async (file: DriveFile) => {
    if (!token) return;
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const content = await readDriveFile(file.id, token);
      onLoadFromDrive(content, file.name.replace(/\.(csv|json)$/i, ''));
      setStatusMsg({ type: 'success', text: `Loaded "${file.name}" into SimpleSheet!` });
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to read file from Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Google Drive Storage</h2>
              <p className="text-xs text-slate-400">Save sheets directly or open existing CSV/JSON files</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OAuth Access Token Box */}
        {!token ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Connect Google Drive</span>
            </div>
            <p className="text-slate-400">
              Enter an OAuth access token with Google Drive scope to save and load your files seamlessly.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Paste Google OAuth Access Token..."
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="flex-1 bg-slate-900 text-slate-100 px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 text-xs"
              />
              <button
                onClick={handleConnectToken}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-medium transition cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-blue-950/30 border border-blue-500/30 px-3 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Drive Access Granted</span>
            </div>
            <button
              onClick={() => {
                clearStoredAccessToken();
                setToken(null);
              }}
              className="text-slate-400 hover:text-rose-400 underline text-[11px]"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Tabs: Save vs Open */}
        <div className="flex border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('save')}
            className={`pb-2 px-4 transition border-b-2 cursor-pointer ${
              activeTab === 'save'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Save to Drive
          </button>
          <button
            onClick={() => {
              setActiveTab('open');
              if (token) fetchFiles(token);
            }}
            className={`pb-2 px-4 transition border-b-2 cursor-pointer ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Open from Drive
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'save' ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium mb-1 block">FILE NAME</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={saveFileName}
                  onChange={(e) => setSaveFileName(e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 text-xs font-mono"
                />
                <span className="text-slate-500 font-mono">.csv</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || !token}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Save File to Drive</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">RECENT SPREADSHEETS ON DRIVE</span>
              <button
                onClick={() => token && fetchFiles(token)}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="Refresh file list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {files.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No CSV or spreadsheet files found on Google Drive.
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleOpenFile(file)}
                    className="flex items-center justify-between p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-slate-200 group-hover:text-blue-300 font-medium truncate">
                        {file.name}
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/30'
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};
