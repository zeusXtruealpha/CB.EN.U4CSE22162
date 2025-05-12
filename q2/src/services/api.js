import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDY1OTA5LCJpYXQiOjE3NDcwNjU2MDksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImQ5YTAzYmVkLTJjNmYtNGVjMi05ZDJiLTVkOTg0ZmMyNjUxOCIsInN1YiI6Im5pcmFuamFuLmdhbGxhLjdAZ21haWwuY29tIn0sImVtYWlsIjoibmlyYW5qYW4uZ2FsbGEuN0BnbWFpbC5jb20iLCJuYW1lIjoiZ2FsbGEgbmlyYW5qYW4iLCJyb2xsTm8iOiJjYi5lbi51NGNzZTIyMTYyIiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiZDlhMDNiZWQtMmM2Zi00ZWMyLTlkMmItNWQ5ODRmYzI2NTE4IiwiY2xpZW50U2VjcmV0IjoiYnJka0JNa3loS0tkeVJyWiJ9.mdLMeu5ylIQxBXhyYHpERd-Tbjnr-JJr_RtbgzL73DE'; 

const api = {
  // Stock price endpoints
  getStockPrices: async (minutes) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stockcorrelation`, {
        params: { ticker: ['MSFT', 'AMZN'], minutes },
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value.map(v => `${key}=${v}`).join('&');
              }
              return `${key}=${value}`;
            })
            .join('&');
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      throw error;
    }
  },

  // Correlation endpoints
  getCorrelation: async (minutes) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/correlation`, {
        params: { minutes },
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      throw error;
    }
  },

  // Stock statistics endpoints
  getStockStats: async (minutes) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`, {
        params: { minutes },
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock statistics:', error);
      throw error;
    }
  }
};

export default api; 