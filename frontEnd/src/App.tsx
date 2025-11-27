import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import { LoginRegister } from './pages/LoginRegister';
import { Dashboard } from './pages/Dashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const { isAuthenticated } = useAuth();

  // AuthContext keeps the API client token in sync; nothing to do here.

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthenticated ? <Dashboard /> : <LoginRegister />}
    </ThemeProvider>
  );
}

export default App;
