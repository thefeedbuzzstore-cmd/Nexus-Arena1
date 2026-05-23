import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Proxy to FreeToGame API
    const response = await fetch(`https://www.freetogame.com/api/${path}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Nexus-Arena/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `FreeToGame API returned status ${response.status}` 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('[API Error]', error);
    res.status(500).json({ 
      error: 'Failed to fetch from FreeToGame API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
