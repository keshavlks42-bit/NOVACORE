import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MachineSentry AI Condition Monitoring API',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/explain-alert', async (req, res) => {
    try {
      const {
        machineName,
        machineCategory,
        anomalyScore,
        threshold,
        alertLevel,
        featureDeviations,
        baselineCount
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          provider: 'rule-based',
          summary: `Alert triggered for ${machineName} (${machineCategory}). Computed anomaly score is ${anomalyScore} against baseline threshold ${threshold}.`,
          acousticInsight: 'Observed significant deviations in energy and spectral characteristics compared to calibrated normal operating baseline.',
          inspectionChecklist: [
            'Inspect machine mounting bolts and anchor integrity for looseness.',
            'Check bearing housing temperature using an infrared thermometer.',
            'Verify lubrication levels and inspect for grease discoloration or leakage.',
            'Examine drive belt tension and alignment or coupling condition.'
          ],
          disclaimer: 'MachineSentry identifies unusual operating patterns. An alert is not proof of mechanical failure. Follow site safety procedures.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a certified industrial predictive maintenance engineer analyzing acoustic anomaly signals from MachineSentry AI.
Translate the following factual anomaly detection results into an evidence-based, actionable inspection brief for a factory technician.

RULES:
- Do NOT fabricate or declare specific component failures (do not say "the bearing is broken" or "the motor burned out"). Frame them as inspection hypotheses.
- Explain what the physical acoustic features (RMS energy, spectral centroid, zero-crossing rate, MFCCs) signify regarding equipment dynamics.
- Provide a clear, prioritized 3-4 step mechanical inspection checklist.
- Keep the explanation grounded strictly in the provided data.

DATA:
- Machine Name: ${machineName}
- Machine Category: ${machineCategory}
- Anomaly Score: ${anomalyScore} (Threshold: ${threshold})
- Alert Severity Level: ${alertLevel}
- Number of Baseline Observations: ${baselineCount}
- Measured Feature Deviations:
${JSON.stringify(featureDeviations || [], null, 2)}

Return valid JSON with the following structure:
{
  "summary": "1-2 sentence technician executive summary",
  "acousticInsight": "Clear physical explanation of what high RMS or spectral centroid shifts imply",
  "inspectionChecklist": [
    "Step 1",
    "Step 2",
    "Step 3",
    "Step 4"
  ],
  "disclaimer": "Standard cautionary note"
}`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI explanation timed out')), 4000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);

      return res.json({
        provider: 'gemini-3.8-flash',
        ...parsed
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error generating AI explanation:', errorMsg);
      // Fallback cleanly so user experience never breaks
      return res.json({
        provider: 'deterministic-fallback',
        summary: `Anomaly flagged: Score ${req.body.anomalyScore} exceeds threshold ${req.body.threshold}.`,
        acousticInsight: 'Deviations from normal baseline indicate mechanical condition changes requiring prompt physical inspection.',
        inspectionChecklist: [
          'Verify mechanical mounting and look for loose fasteners.',
          'Check lubrication level and contamination status.',
          'Verify operating temperature and thermal profile.',
          'Check for foreign debris or mechanical rubbing.'
        ],
        disclaimer: 'MachineSentry identifies unusual operating patterns. An alert is not proof of mechanical failure.'
      });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MachineSentry AI server active on port ${PORT}`);
  });
}

startServer();
