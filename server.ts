import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/parse-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing imageBase64' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API not configured' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = imageBase64.replace(/^data:(.*,)?/, '');

      let attempt = 0;
      let response;
      while (attempt < 3) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: "Analyze this receipt. Extract the following information and return it strictly as JSON: {\"description\": \"<store name>\", \"amount\": <total numeric amount>, \"date\": \"<YYYY-MM-DD>\", \"category\": \"<Food|Transport|Accommodation|Activities|Other>\"}. If you cannot determine a field, return null for it."
                  },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          break; // success
        } catch (error: any) {
          attempt++;
          if (attempt >= 3 || (error?.status !== 503 && !error?.message?.includes('503') && error?.status !== 429 && !error?.message?.includes('429'))) {
            throw error;
          }
          // If 429, no need to retry 3 times since it's quota, let's just break
          if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
               throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // exponential backoff 1s, 2s
        }
      }

      if (!response) {
        throw new Error("Failed to get response from Gemini after retries.");
      }

      const text = response.text || "{}";
      const data = JSON.parse(text);
      res.json(data);
    } catch (e: any) {
      console.error("Gemini Vision API error:", e?.message || e);
      let errMsg = 'Failed to parse receipt';
      let errorStr = e?.message || '';
      
      if (e?.status === 503 || errorStr.includes("503")) {
        errMsg = 'The AI model is currently experiencing high demand. Please try again in a few moments.';
      } else if (e?.status === 429 || errorStr.includes("429") || errorStr.includes("quota") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        errMsg = 'AI model quota exceeded. Please check your API usage limits or try again later.';
      } else if (errorStr) {
        errMsg = errorStr;
      }
      res.status(500).json({ error: errMsg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // SPA fallback route for development
    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/') || req.originalUrl.includes('.')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, indexHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mani Traveler Server running on http://localhost:${PORT}`);
  });
}

startServer();
