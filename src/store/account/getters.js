export const isAuthenticated = ({ accountName }) => !!accountName;
export const accountName = ({ accountName }) => accountName;
export const loading = ({ loading }) => loading;
export const isAutoLoading = ({ autoLogin }) => autoLogin;
export const hasProfile = ({ profiles, accountName }) => profiles.hasOwnProperty(accountName);
export const myProfile = ({ profiles, accountName }) => profiles[accountName];
export const profiles = ({ profiles }) => profiles;
