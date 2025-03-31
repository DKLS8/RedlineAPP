const CLIENT_ID = '45730035985-l6j2pkj8gnobo7pobeinun1i2oes9s0s.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

let gapiInitialized = false;

export async function initGoogleApi() {
  if (gapiInitialized) return;

  return new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });

        gapiInitialized = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function signIn() {
  if (!gapiInitialized) {
    await initGoogleApi();
  }
  return gapi.auth2.getAuthInstance().signIn();
}

export async function signOut() {
  if (!gapiInitialized) return;
  return gapi.auth2.getAuthInstance().signOut();
}

export function isSignedIn() {
  if (!gapiInitialized) return false;
  return gapi.auth2.getAuthInstance().isSignedIn.get();
}

export function getCurrentUser() {
  if (!gapiInitialized || !isSignedIn()) return null;
  const user = gapi.auth2.getAuthInstance().currentUser.get();
  return user.getBasicProfile();
}

export function getAccessToken() {
  if (!gapiInitialized || !isSignedIn()) return null;
  const user = gapi.auth2.getAuthInstance().currentUser.get();
  return user.getAuthResponse().access_token;
}

export function addSignInListener(callback: (isSignedIn: boolean) => void) {
  if (!gapiInitialized) return;
  gapi.auth2.getAuthInstance().isSignedIn.listen(callback);
}