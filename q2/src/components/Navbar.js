import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HeatPumpIcon from '@mui/icons-material/HeatPump';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Stock Price Aggregation
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<ShowChartIcon />}
          >
            Stock Chart
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/correlation"
            startIcon={<HeatPumpIcon />}
          >
            Correlation Heatmap
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 