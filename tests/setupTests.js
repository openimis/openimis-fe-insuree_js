// Import des extensions de matchers personnalisés
import '@testing-library/jest-dom';

// Configuration de fetch mock si nécessaire
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// Mock global de react-intl pour Jest
jest.mock('react-intl', () => ({
    IntlProvider: ({ children }) => children,
    useIntl: () => ({
        formatMessage: ({ defaultMessage }) => defaultMessage,
    }),
    FormattedMessage: ({ defaultMessage }) => defaultMessage,
}));

// Configuration de Redux si nécessaire
import { configure } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from './reducers';

// Configuration globale pour les tests
configure({ testIdAttribute: 'data-testid' });

// Configuration de react-intl pour les tests
const TestProvider = ({ children }) => (
  <IntlProvider locale="en" messages={messages}>
    {children}
  </IntlProvider>
);

// Configuration de Redux pour les tests
const renderWithRedux = (
  component,
  { initialState, store = createStore(rootReducer, initialState) } = {}
) => {
  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
};

// Export des utilitaires pour les tests
export * from '@testing-library/react';
export { renderWithRedux, TestProvider };