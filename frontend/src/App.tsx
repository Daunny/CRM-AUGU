import { useState, useEffect } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Container, Typography, Paper, Box, CircularProgress, Alert } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'healthy' | 'error'>('loading')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    fetch('http://localhost:8080/api/health')
      .then(res => res.json())
      .then(data => {
        setApiData(data)
        setApiStatus('healthy')
      })
      .catch(err => {
        console.error('API health check failed:', err)
        setApiStatus('error')
      })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom align="center">
            CRM AUGU
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
            Customer-centric CRM Workflow Platform
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            
            {apiStatus === 'loading' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>Checking API connection...</Typography>
              </Box>
            )}
            
            {apiStatus === 'healthy' && (
              <Alert severity="success">
                API is healthy - Connected to backend at {apiData?.timestamp}
              </Alert>
            )}
            
            {apiStatus === 'error' && (
              <Alert severity="error">
                Cannot connect to API - Please ensure the backend is running on port 8080
              </Alert>
            )}
          </Paper>
          
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography>• Dashboard (Coming Soon)</Typography>
              <Typography>• Customer Management (Coming Soon)</Typography>
              <Typography>• Sales Pipeline (Coming Soon)</Typography>
              <Typography>• Project Tracking (Coming Soon)</Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App