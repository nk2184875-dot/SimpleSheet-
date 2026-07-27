/**
 * Google Drive API Integration Helpers for SimpleSheet
 */

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

let accessToken: string | null = null;

export function getStoredAccessToken(): string | null {
  if (accessToken) return accessToken;
  const stored = localStorage.getItem('simplesheet_gdrive_token');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.expiry > Date.now()) {
        accessToken = parsed.token;
        return accessToken;
      }
    } catch (e) {
      localStorage.removeItem('simplesheet_gdrive_token');
    }
  }
  return null;
}

export function setStoredAccessToken(token: string, expiresInSeconds: number = 3600) {
  accessToken = token;
  const expiry = Date.now() + (expiresInSeconds - 60) * 1000; // 1 min buffer
  localStorage.setItem('simplesheet_gdrive_token', JSON.stringify({ token, expiry }));
}

export function clearStoredAccessToken() {
  accessToken = null;
  localStorage.removeItem('simplesheet_gdrive_token');
}

/**
 * Prompts user for OAuth token via GIS or manual prompt if client ID is configured
 */
export async function requestDriveToken(): Promise<string> {
  const existing = getStoredAccessToken();
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    // Check if GIS script is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: (window as any).GOOGLE_CLIENT_ID || '', // Fallback or injected
        scope: DRIVE_SCOPE,
        callback: (response: any) => {
          if (response.access_token) {
            setStoredAccessToken(response.access_token, response.expires_in);
            resolve(response.access_token);
          } else {
            reject(new Error(response.error_description || 'Authentication failed'));
          }
        },
      });
      client.requestAccessToken();
    } else {
      // Prompt user or handle graceful token modal fallback
      reject(new Error('Google Identity Services not initialized.'));
    }
  });
}

/**
 * Uploads/Saves a file to Google Drive
 */
export async function saveFileToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'text/csv',
  token?: string
): Promise<DriveFile> {
  const authToken = token || getStoredAccessToken();
  if (!authToken) {
    throw new Error('Google Drive access token missing. Please connect to Google Drive.');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to save to Google Drive: ${errText}`);
  }

  return await response.json();
}

/**
 * Lists SimpleSheet / CSV files in user's Google Drive
 */
export async function listDriveFiles(token?: string): Promise<DriveFile[]> {
  const authToken = token || getStoredAccessToken();
  if (!authToken) {
    throw new Error('Google Drive access token missing.');
  }

  const query = "mimeType = 'text/csv' or mimeType = 'application/json' or name contains '.csv' or name contains '.json'";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Drive files: ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Reads file content from Google Drive by file ID
 */
export async function readDriveFile(fileId: string, token?: string): Promise<string> {
  const authToken = token || getStoredAccessToken();
  if (!authToken) {
    throw new Error('Google Drive access token missing.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to read file from Drive.`);
  }

  return await response.text();
}
