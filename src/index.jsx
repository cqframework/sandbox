import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { IntlProvider } from 'react-intl';

// Redux store to pass down to React app
import store from './store/store';

// Starting component for the application
import MainView from './components/MainView/main-view';
import ErrorBoundary from "./components/ErrorBoundary/error-boundary";

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <ErrorBoundary>
        <Provider store={store}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <IntlProvider locale="en" messages={{}}>
                    <MainView />
                </IntlProvider>
            </LocalizationProvider>
        </Provider>
    </ErrorBoundary>
);
