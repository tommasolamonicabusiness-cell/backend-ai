import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // 1. Gestione dei CORS (Fondamentale per chiamare l'API da Carrd)
  res.setHeader('Access-Control-Allow-Origin', '*'); // In produzione, cambia '*' con l'URL del tuo sito Carrd per sicurezza
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Risposta rapida per le richieste di preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permetti solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  // 2. Validazione dell'input
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Il testo è vuoto o mancante.' });
  }

  // 3. Controllo API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERRORE: API Key di Gemini non configurata su Vercel.");
    return res.status(500).json({ error: 'Errore interno del server.' });
  }

  try {
    // 4. Inizializzazione Gemini e chiamata
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usiamo gemini-1.5-flash: è il più rapido, economico e perfetto per il text-processing
    const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro-latest',
      // Passiamo il prompt di sistema tramite le systemInstruction (best practice)
      systemInstruction: "Sei un assistente AI per l'organizzazione personale. Riceverai un testo disordinato o degli appunti. Devi restituire: 1. Un riassunto esecutivo in 3 bullet point. 2. Massimo 5 tag rilevanti. 3. Una proposta di titolo per la nota. Formatta la risposta in Markdown pulito."
    });

    const result = await model.generateContent(text);
    const responseText = result.response.text();

    // 5. Risposta al Frontend
    return res.status(200).json({ result: responseText });

  } catch (error) {
    console.error("Errore durante la chiamata a Gemini:", error);
    return res.status(500).json({ error: 'Errore durante la generazione dei contenuti.' });
  }
}
