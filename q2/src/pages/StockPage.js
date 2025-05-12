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
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

function StockPage() {
  const [timeInterval, setTimeInterval] = useState(5);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      try {
        const data = await api.getStockPrices(timeInterval);
        setStockData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch stock data');
        console.error('Error fetching stock data:', err);
      }
      setLoading(false);
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [timeInterval]);

  const handleTimeIntervalChange = (event) => {
    setTimeInterval(event.target.value);
  };

  if (loading && stockData.length === 0) {
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
        <Typography variant="h4">Stock Price Chart</Typography>
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
        <Box height={500}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stockData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1976d2"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#dc004e"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}

export default StockPage; 