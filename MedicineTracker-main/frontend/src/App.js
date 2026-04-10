import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';
import Home from './pages/Home';
import AddMedicine from './pages/AddMedicine';
import TakeMedicine from './pages/TakeMedicine';
import ScanMedicine from './pages/ScanMedicine';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-medicine" element={<AddMedicine />} />
          <Route path="/take-medicine" element={<TakeMedicine />} />
          <Route path="/scan-medicine" element={<ScanMedicine />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
