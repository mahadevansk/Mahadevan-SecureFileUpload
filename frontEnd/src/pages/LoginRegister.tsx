import React, { useState } from 'react';
import { Paper, TextField, Button, Box, Typography, Alert, Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const LoginRegister: React.FC = () => {
  const { login, register } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    (async () => {
      const ok = await login(username, password);
      if (ok) {
        setSuccess(`Logged in as ${username}`);
        setUsername('');
        setPassword('');
      } else {
        setError('Invalid credentials');
      }
    })();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    (async () => {
      const ok = await register(username, password);
      if (ok) {
        setSuccess(`Registered and logged in as ${username}`);
        setUsername('');
        setPassword('');
      } else {
        setError('Registration failed');
      }
    })();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 2
    }}>
      <Paper elevation={6} sx={{ 
        p: 6, 
        maxWidth: 500, 
        width: '100%',
        borderRadius: 2
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
            Secure File Upload
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your files securely in the cloud
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="auth tabs"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
              },
            }}
          >
            <Tab 
              label="LOGIN" 
              id="auth-tab-0" 
              aria-controls="auth-tabpanel-0"
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
            <Tab 
              label="REGISTER" 
              id="auth-tab-1" 
              aria-controls="auth-tabpanel-1"
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter your username"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Enter your password"
              size="medium"
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Login
            </Button>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              Don't have an account? Click the Register tab above.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Choose a username"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Choose a password"
              size="medium"
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Register & Login
            </Button>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1,
              borderLeft: '4px solid #667eea'
            }}>
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                <strong>Demo Mode</strong> 
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center' }}>
            🔒 Your files are stored securely. Version 1.0
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
