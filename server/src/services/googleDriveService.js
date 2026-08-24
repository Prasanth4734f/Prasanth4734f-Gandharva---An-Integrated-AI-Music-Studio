/**
 * googleDriveService.js
 * Production-ready Google Drive Service for Gandharva AI Studio.
 * Uses official Google APIs (googleapis) for OAuth token exchange,
 * folder structure initialization ('Gandharva/'), and direct file sync (.mp3, .wav, .txt).
 */

const { google } = require('googleapis');
const stream = require('stream');

// Environment Credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000/api/connected-services/drive/callback';

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Creates an OAuth2 Client instance
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Generate Google OAuth Consent Screen URL
 */
function generateDriveAuthUrl(userId = 'default-user') {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    // Return direct authorization link or fallback
    return `http://localhost:3000/api/connected-services/drive/callback?code=mock_oauth_code_gandharva&state=${userId}`;
  }

  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPES,
    state: userId,
  });
}

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
async function exchangeCodeForTokens(code) {
  if (!CLIENT_ID || !CLIENT_SECRET || code.startsWith('mock_')) {
    // Sandbox / Mock token response for testing without Google Cloud credentials
    return {
      tokens: {
        access_token: `mock_gdrive_access_${Date.now()}`,
        refresh_token: `mock_gdrive_refresh_${Date.now()}`,
        expiry_date: Date.now() + 3600 * 1000,
        token_type: 'Bearer',
        scope: DRIVE_SCOPES.join(' ')
      },
      isMock: true
    };
  }

  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return { tokens, isMock: false };
}

/**
 * Initialize Gandharva Folder Structure in User's Google Drive:
 * └── Gandharva/
 *     ├── Music/
 *     ├── Lyrics/
 *     ├── Albums/
 *     ├── Projects/
 *     └── Exports/
 */
async function initializeGandharvaFolders(authClient, isMock = false) {
  if (isMock) {
    return {
      rootFolderId: `gandharva_root_${Date.now()}`,
      subfolders: {
        music: `music_folder_${Date.now()}`,
        lyrics: `lyrics_folder_${Date.now()}`,
        albums: `albums_folder_${Date.now()}`,
        projects: `projects_folder_${Date.now()}`,
        exports: `exports_folder_${Date.now()}`
      }
    };
  }

  const drive = google.drive({ version: 'v3', auth: authClient });

  // 1. Search or Create Root 'Gandharva' Folder
  const rootSearch = await drive.files.list({
    q: "name = 'Gandharva' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  let rootFolderId;
  if (rootSearch.data.files && rootSearch.data.files.length > 0) {
    rootFolderId = rootSearch.data.files[0].id;
  } else {
    const rootMeta = await drive.files.create({
      resource: {
        name: 'Gandharva',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Gandharva AI Music Studio Cloud Library'
      },
      fields: 'id',
    });
    rootFolderId = rootMeta.data.id;
  }

  // 2. Create Required Subfolders under 'Gandharva'
  const subfolderNames = ['Music', 'Lyrics', 'Albums', 'Projects', 'Exports'];
  const subfolders = {};

  for (const name of subfolderNames) {
    const subSearch = await drive.files.list({
      q: `name = '${name}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (subSearch.data.files && subSearch.data.files.length > 0) {
      subfolders[name.toLowerCase()] = subSearch.data.files[0].id;
    } else {
      const subMeta = await drive.files.create({
        resource: {
          name: name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId]
        },
        fields: 'id',
      });
      subfolders[name.toLowerCase()] = subMeta.data.id;
    }
  }

  return { rootFolderId, subfolders };
}

/**
 * Upload a File (Buffer or Text) into a specific Google Drive Folder
 */
async function uploadFileToFolder(authClient, folderId, fileName, mimeType, fileContent, isMock = false) {
  if (isMock) {
    return {
      fileId: `drive_file_${Date.now()}`,
      name: fileName,
      folderId,
      status: 'uploaded'
    };
  }

  const drive = google.drive({ version: 'v3', auth: authClient });

  // Convert buffer/string into readable stream
  const bufferStream = new stream.PassThrough();
  if (typeof fileContent === 'string') {
    bufferStream.end(Buffer.from(fileContent, 'utf-8'));
  } else {
    bufferStream.end(fileContent);
  }

  const response = await drive.files.create({
    resource: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body: bufferStream,
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  return {
    fileId: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink,
    status: 'uploaded'
  };
}

module.exports = {
  createOAuth2Client,
  generateDriveAuthUrl,
  exchangeCodeForTokens,
  initializeGandharvaFolders,
  uploadFileToFolder,
};
