interface Window {
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (config: {
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      sheets: {
        spreadsheets: {
          values: {
            get: (params: {
              spreadsheetId: string;
              range: string;
              majorDimension?: string;
            }) => Promise<{
              result: {
                values: any[][];
              };
            }>;
          };
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        signIn: () => Promise<any>;
        signOut: () => Promise<void>;
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getId: () => string;
              getName: () => string;
              getEmail: () => string;
            };
            getAuthResponse: () => {
              access_token: string;
            };
          };
        };
      };
    };
  };
}