const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const STOCK_EXCHANGE_API = 'http://20.244.56.144/evaluation-service';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDY1OTA5LCJpYXQiOjE3NDcwNjU2MDksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImQ5YTAzYmVkLTJjNmYtNGVjMi05ZDJiLTVkOTg0ZmMyNjUxOCIsInN1YiI6Im5pcmFuamFuLmdhbGxhLjdAZ21haWwuY29tIn0sImVtYWlsIjoibmlyYW5qYW4uZ2FsbGEuN0BnbWFpbC5jb20iLCJuYW1lIjoiZ2FsbGEgbmlyYW5qYW4iLCJyb2xsTm8iOiJjYi5lbi51NGNzZTIyMTYyIiwiYWNjZXNzQ29kZSI6IlN3dXVLRSIsImNsaWVudElEIjoiZDlhMDNiZWQtMmM2Zi00ZWMyLTlkMmItNWQ5ODRmYzI2NTE4IiwiY2xpZW50U2VjcmV0IjoiYnJka0JNa3loS0tkeVJyWiJ9.mdLMeu5ylIQxBXhyYHpERd-Tbjnr-JJr_RtbgzL73DE';

let stockListings = null;
let lastStockListingsUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; 

async function getStockListings() {
    const now = Date.now();
    if (stockListings && lastStockListingsUpdate && (now - lastStockListingsUpdate < CACHE_DURATION)) {
        return stockListings;
    }

    try {
        console.log('Using token:', ACCESS_TOKEN); 
        const response = await axios.get(`${STOCK_EXCHANGE_API}/stocks`, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        console.log('API Response:', response.data); 
        stockListings = response.data; 
        lastStockListingsUpdate = now;
        return stockListings;
    } catch (error) {
        console.error('Error fetching stock listings:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

// Helper function to get stock price history
async function getStockPriceHistory(ticker, minutes) {
    try {
        const url = minutes 
            ? `${STOCK_EXCHANGE_API}/stocks/${ticker}?minutes=${minutes}`
            : `${STOCK_EXCHANGE_API}/stocks/${ticker}`;
        console.log('Fetching from URL:', url);
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
        });
        console.log('Response data:', response.data);
        
      
        if (!Array.isArray(response.data) || response.data.length < 2) {
            throw new Error(`Not enough data points for ${ticker}. Need at least 2 points.`);
        }
        
        return response.data;
    } catch (error) {
        console.error(`Error fetching price history for ${ticker}:`, error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}


app.get('/stocks', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const company = req.query.company?.toUpperCase();
        const exchange = req.query.exchange?.toUpperCase();
        
        const stocksObj = await getStockListings();
        
    
        let stocksArray = [];
        if (stocksObj && typeof stocksObj.stocks === 'object' && !Array.isArray(stocksObj.stocks)) {
            stocksArray = Object.entries(stocksObj.stocks).map(([name, ticker]) => ({ name, ticker }));
        } else {
            return res.status(500).json({ 
                error: 'Invalid response from stock service',
                details: 'Expected an object with a stocks property mapping company names to tickers'
            });
        }
        
       
        if (company) {
            stocksArray = stocksArray.filter(stock => 
                stock.name.toUpperCase().includes(company) || 
                stock.ticker.toUpperCase().includes(company)
            );
        }
        
        if (exchange) {
          
            const exchangePatterns = {
                'NYSE': /^[A-Z]{1,4}$/,  
                'NASDAQ': /^[A-Z]{4}$/,  
                'AMEX': /^[A-Z]{1,5}$/  
            };
            
            const pattern = exchangePatterns[exchange];
            if (pattern) {
                stocksArray = stocksArray.filter(stock => pattern.test(stock.ticker));
            } else {
                
                stocksArray = [];
            }
        }
        
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const paginatedStocks = stocksArray.slice(startIndex, endIndex);
        
        res.json({
            stocks: paginatedStocks,
            currentPage: page,
            totalPages: Math.ceil(stocksArray.length / limit),
            totalStocks: stocksArray.length
        });
    } catch (error) {
        console.error('Error in /stocks endpoint:', error);
        res.status(500).json({ 
            error: 'Error fetching stocks', 
            details: error.message 
        });
    }
});


app.get('/stocks/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const { minutes, aggregation } = req.query;
        console.log('Received request for ticker:', ticker, 'minutes:', minutes, 'aggregation:', aggregation);

        if (!minutes || !aggregation || aggregation !== 'average') {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const priceHistory = await getStockPriceHistory(ticker, minutes);
        console.log('Price history:', priceHistory);

        if (!Array.isArray(priceHistory)) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        if (priceHistory.length === 0) {
            return res.status(404).json({ error: 'No price data available for the specified time range' });
        }

        
        const averagePrice = priceHistory.reduce((sum, price) => sum + price.price, 0) / priceHistory.length;

        const response = {
            averageStockPrice: parseFloat(averagePrice.toFixed(6)),
            priceHistory: priceHistory
        };
        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error in /stocks/:ticker endpoint:', error);
        res.status(500).json({ error: 'Error fetching stock data', details: error.message });
    }
});


function interpolateDataPoints(data1, data2) {
 
    const allTimestamps = new Set([
        ...data1.map(d => d.lastUpdatedAt),
        ...data2.map(d => d.lastUpdatedAt)
    ]);
    
    
    const sortedTimestamps = Array.from(allTimestamps).sort();
    
   
    const map1 = new Map(data1.map(d => [d.lastUpdatedAt, d.price]));
    const map2 = new Map(data2.map(d => [d.lastUpdatedAt, d.price]));
    

    const interpolated1 = [];
    const interpolated2 = [];
    
    for (let i = 0; i < sortedTimestamps.length; i++) {
        const ts = sortedTimestamps[i];
        let price1 = map1.get(ts);
        let price2 = map2.get(ts);
        
     
        if (price1 === undefined) {
            const prevTs = sortedTimestamps.slice(0, i).reverse().find(t => map1.has(t));
            const nextTs = sortedTimestamps.slice(i + 1).find(t => map1.has(t));
            
            if (prevTs && nextTs) {
                const prevPrice = map1.get(prevTs);
                const nextPrice = map1.get(nextTs);
                const prevTime = new Date(prevTs).getTime();
                const nextTime = new Date(nextTs).getTime();
                const currentTime = new Date(ts).getTime();
                
                price1 = prevPrice + (nextPrice - prevPrice) * 
                    (currentTime - prevTime) / (nextTime - prevTime);
            }
        }
        
        if (price2 === undefined) {
            const prevTs = sortedTimestamps.slice(0, i).reverse().find(t => map2.has(t));
            const nextTs = sortedTimestamps.slice(i + 1).find(t => map2.has(t));
            
            if (prevTs && nextTs) {
                const prevPrice = map2.get(prevTs);
                const nextPrice = map2.get(nextTs);
                const prevTime = new Date(prevTs).getTime();
                const nextTime = new Date(nextTs).getTime();
                const currentTime = new Date(ts).getTime();
                
                price2 = prevPrice + (nextPrice - prevPrice) * 
                    (currentTime - prevTime) / (nextTime - prevTime);
            }
        }
        
        if (price1 !== undefined && price2 !== undefined) {
            interpolated1.push({ price: price1, lastUpdatedAt: ts });
            interpolated2.push({ price: price2, lastUpdatedAt: ts });
        }
    }
    
    return [interpolated1, interpolated2];
}


app.get('/stockcorrelation', async (req, res) => {
    try {
        const { minutes } = req.query;
        let tickers = req.query.ticker;

        if (!minutes || !tickers) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        if (!Array.isArray(tickers)) tickers = [tickers];
        if (tickers.length !== 2) {
            return res.status(400).json({ error: 'Exactly two tickers required' });
        }

        const [ticker1, ticker2] = tickers;

        // Get price history for both tickers
        const [ph1, ph2] = await Promise.all([
            getStockPriceHistory(ticker1, minutes),
            getStockPriceHistory(ticker2, minutes)
        ]);

        if (!Array.isArray(ph1) || !Array.isArray(ph2)) {
            return res.status(404).json({ error: 'One or both stocks not found' });
        }

        // Interpolate missing data points
        const [interpolated1, interpolated2] = interpolateDataPoints(ph1, ph2);

        if (interpolated1.length < 2 || interpolated2.length < 2) {
            return res.status(400).json({ 
                error: 'Not enough data points for correlation after interpolation',
                details: {
                    ticker1: {
                        originalPoints: ph1.length,
                        interpolatedPoints: interpolated1.length
                    },
                    ticker2: {
                        originalPoints: ph2.length,
                        interpolatedPoints: interpolated2.length
                    }
                }
            });
        }

       
        const correlation = pearsonCorrelation(
            interpolated1.map(p => p.price),
            interpolated2.map(p => p.price)
        );

       
        const avg1 = interpolated1.reduce((a, b) => a + b.price, 0) / interpolated1.length;
        const avg2 = interpolated2.reduce((a, b) => a + b.price, 0) / interpolated2.length;

        res.json({
            correlation: parseFloat(correlation.toFixed(4)),
            stocks: {
                [ticker1]: {
                    averagePrice: parseFloat(avg1.toFixed(6)),
                    priceHistory: interpolated1
                },
                [ticker2]: {
                    averagePrice: parseFloat(avg2.toFixed(6)),
                    priceHistory: interpolated2
                }
            },
            metadata: {
                totalPoints: interpolated1.length,
                timeRange: {
                    start: interpolated1[0].lastUpdatedAt,
                    end: interpolated1[interpolated1.length - 1].lastUpdatedAt
                },
                originalPoints: {
                    [ticker1]: ph1.length,
                    [ticker2]: ph2.length
                }
            }
        });
    } catch (error) {
        console.error('Error in /stockcorrelation endpoint:', error);
        res.status(500).json({ 
            error: 'Error calculating correlation', 
            details: error.message 
        });
    }
});


function pearsonCorrelation(x, y) {
    const n = x.length;
    if (n < 2) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, denomX = 0, denomY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        num += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
    }
    if (denomX === 0 || denomY === 0) return 0;
    return num / Math.sqrt(denomX * denomY);
}


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 
