/**
 * Google Drive Upload via Google Identity Services + Drive API v3
 *
 * Requires two env vars (prefixed NEXT_PUBLIC_ for client-side access):
 *   NEXT_PUBLIC_GOOGLE_CLIENT_ID  — OAuth 2.0 Client ID
 *   NEXT_PUBLIC_GOOGLE_API_KEY    — API Key
 *
 * Setup:
 *   1. Go to https://console.cloud.google.com
 *   2. Create a project (or use existing)
 *   3. Enable "Google Drive API" and "Google Picker API"
 *   4. Create OAuth 2.0 Client ID (Web application)
 *      - Add http://localhost:3000 to authorized JavaScript origins
 *      - Add your production domain too
 *   5. Create an API Key
 *   6. Add both to .env.local
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

// Dynamically load Google Identity Services script
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("Not in browser");
    if (document.getElementById("gis-script")) return resolve();
    const script = document.createElement("script");
    script.id = "gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load Google Identity Services");
    document.head.appendChild(script);
  });
}

// Get OAuth access token (prompts user consent)
function getAccessToken(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    if (accessToken) return resolve(accessToken);

    await loadGisScript();

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(response.error);
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

/**
 * Upload a file to Google Drive
 * Returns the Google Drive file URL on success
 */
export async function uploadToGoogleDrive(
  file: File,
  folderName?: string
): Promise<string> {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error(
      "Google Drive credentials not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to .env.local"
    );
  }

  const token = await getAccessToken();

  // Optional: Create or find a folder
  let folderId: string | undefined;
  if (folderName) {
    // Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id)&key=${API_KEY}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder
      const createRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          }),
        }
      );
      const createData = await createRes.json();
      folderId = createData.id;
    }
  }

  // Upload file using multipart upload
  const metadata: Record<string, unknown> = {
    name: file.name,
    mimeType: file.type,
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&key=${API_KEY}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Upload failed with status ${uploadRes.status}`
    );
  }

  const data = await uploadRes.json();
  return data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
}

/**
 * Revoke the access token (sign out)
 */
export function revokeGoogleDriveAccess() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => { });
    accessToken = null;
  }
}
