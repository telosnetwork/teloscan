// Mocking UserStore -----------------------------------

const UserStore = {
    fiatLocale: 'en-US',
    fiatCurrency: 'USD',
};

export const useUserStore = () => UserStore;
