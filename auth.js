const clientId = '886688049132-ds240jmcli6rfut2ich7qeu27rq1u82p.apps.googleusercontent.com';
const scope = 'https://www.googleapis.com/auth/spreadsheets';

let googleAuthClient;

async function initializeGoogleAuth() {
  return new Promise((resolve, reject) => {
    window.onload = () => {
      google.accounts.oauth2.initClient({
        client_id: clientId,
        scope: scope,
      }).then(authClient => {
        googleAuthClient = authClient;
        console.log('Google Auth Client initialized.');
        resolve(googleAuthClient);
      }).catch(error => {
        console.error('Error initializing Google Auth Client:', error);
        reject(error);
      });
    };
  });
}

async function getAccessToken() {
  if (!googleAuthClient) {
    console.error('Google Auth Client not initialized.');
    return null;
  }

  return new Promise((resolve, reject) => {
    googleAuthClient.authorize({
      prompt: 'consent', // or 'none' for silent auth if already authorized
    }, (authResult) => {
      if (authResult && authResult.access_token) {
        resolve(authResult.access_token);
      } else {
        console.error('Error during authorization:', authResult);
        resolve(null); // Or reject(authResult) if you want to handle errors more strictly
      }
    });
  });
}

export { initializeGoogleAuth, getAccessToken };
