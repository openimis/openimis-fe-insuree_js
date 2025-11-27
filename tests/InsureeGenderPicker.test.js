import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import InsureeGenderPicker from '../InsureeGenderPicker';

// Mock des dépendances
jest.mock('@openimis/fe-core', () => ({
  ...jest.requireActual('@openimis/fe-core'),
  formatMessage: jest.fn((intl, module, key) => {
    const messages = {
      'InsureeGender.M': 'Male',
      'InsureeGender.F': 'Female',
      'InsureeGender.O': 'Other',
      'InsureeGender.null': 'Not specified',
      'InsureeGenderPicker.label': 'Gender'
    };
    return messages[key] || key;
  }),
  SelectInput: jest.fn(({ label, options, value, onChange, required }) => (
    <div>
      <label>{label}</label>
      <select 
        data-testid="gender-select"
        value={value}
        onChange={(e) => onChange(e, { value: e.target.value })}
        required={required}
      >
        {options.map(option => (
          <option key={option.value || 'null'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ))
}));

// Mock du store Redux
const mockStore = createStore(() => ({
  insuree: {
    insureeGenders: ['M', 'F', 'O'],
    fetching: false,
    fetched: true
  }
}));

// Wrapper pour fournir le contexte nécessaire
export const renderWithIntl = (ui, { locale = 'en', ...renderOptions } = {}) => {
  const Wrapper = ({ children }) => (
    <Provider store={mockStore}>
      <IntlProvider locale={locale}>
        {children}
      </IntlProvider>
    </Provider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

describe('InsureeGenderPicker', () => {
  const onChangeMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithIntl(
      <InsureeGenderPicker 
        onChange={onChangeMock}
        intl={{ formatMessage: jest.fn() }}
      />
    );
    
    expect(screen.getByText('Gender')).toBeInTheDocument();
    const select = screen.getByTestId('gender-select');
    expect(select).toBeInTheDocument();
    
    // Vérifier que les options sont présentes
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('calls onChange when a gender is selected', () => {
    renderWithIntl(
      <InsureeGenderPicker 
        onChange={onChangeMock}
        intl={{ formatMessage: jest.fn() }}
      />
    );
    
    const select = screen.getByTestId('gender-select');
    fireEvent.change(select, { target: { value: 'F' } });
    
    expect(onChangeMock).toHaveBeenCalledWith('F', 'Female');
  });

  it('shows the null option when withNull is true', () => {
    renderWithIntl(
      <InsureeGenderPicker 
        onChange={onChangeMock}
        withNull={true}
        intl={{ formatMessage: jest.fn() }}
      />
    );
    
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('displays the selected value', () => {
    renderWithIntl(
      <InsureeGenderPicker 
        onChange={onChangeMock}
        value="M"
        intl={{ formatMessage: jest.fn() }}
      />
    );
    
    const select = screen.getByTestId('gender-select');
    expect(select.value).toBe('M');
  });
});
