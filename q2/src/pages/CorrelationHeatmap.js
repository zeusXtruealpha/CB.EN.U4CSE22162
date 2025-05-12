import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip as MuiTooltip,
} from '@mui/material';
import api from '../services/api';

function CorrelationHeatmap() {
  const [timeInterval, setTimeInterval] = useState(5);
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const fetchCorrelationData = async () => {
      setLoading(true);
      try {
        const data = await api.getCorrelation(timeInterval);
        setCorrelationData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch correlation data');
        console.error('Error fetching correlation data:', err);
      }
      setLoading(false);
    };

    fetchCorrelationData();
    const interval = setInterval(fetchCorrelationData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [timeInterval]);

  const handleTimeIntervalChange = (event) => {
    setTimeInterval(event.target.value);
  };

  const getColor = (value) => {
    const hue = value > 0 ? 240 : 0; // Blue for positive, Red for negative
    const saturation = Math.abs(value) * 100;
    return `hsl(${hue}, ${saturation}%, 50%)`;
  };

  if (loading && correlationData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Correlation Heatmap</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Interval</InputLabel>
          <Select
            value={timeInterval}
            label="Time Interval"
            onChange={handleTimeIntervalChange}
          >
            <MenuItem value={5}>5 minutes</MenuItem>
            <MenuItem value={15}>15 minutes</MenuItem>
            <MenuItem value={30}>30 minutes</MenuItem>
            <MenuItem value={60}>1 hour</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(auto-fit, minmax(60px, 1fr))',
            gap: 1,
            overflowX: 'auto',
          }}
        >
          {/* Header row */}
          <Box sx={{ width: 100 }}></Box>
          {correlationData[0]?.stocks.map((stock) => (
            <Typography
              key={stock}
              sx={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                textAlign: 'center',
                p: 1,
              }}
            >
              {stock}
            </Typography>
          ))}

          {/* Data rows */}
          {correlationData.map((row, i) => (
            <React.Fragment key={row.stocks[i]}>
              <Typography sx={{ p: 1 }}>{row.stocks[i]}</Typography>
              {row.correlations.map((correlation, j) => (
                <MuiTooltip
                  key={`${i}-${j}`}
                  title={`${row.stocks[i]} vs ${row.stocks[j]}: ${correlation.toFixed(2)}`}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: 40,
                      bgcolor: getColor(correlation),
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                    onMouseEnter={() => setHoveredCell({ i, j, correlation })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                </MuiTooltip>
              ))}
            </React.Fragment>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography>Correlation:</Typography>
          <Box
            sx={{
              width: 200,
              height: 20,
              background: 'linear-gradient(to right, red, white, blue)',
              borderRadius: 1,
            }}
          />
          <Typography>-1</Typography>
          <Typography>0</Typography>
          <Typography>1</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default CorrelationHeatmap; 