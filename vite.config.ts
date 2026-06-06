import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'http';
import path from 'path';
import type { ViteDevServer } from 'vite';
import { defineConfig, loadEnv } from 'vite';

const CONTACT_TO_EMAIL = 'premkalyan2727@gmail.com';

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isContactPayload = (value: unknown): value is { name: string; email: string; message: string } => {
  if (!value || typeof value !== 'object') return false;

  const payload = value as Record<string, unknown>;
  return typeof payload.name === 'string' && typeof payload.email === 'string' && typeof payload.message === 'string';
};

const contactEmailPlugin = (resendApiKey: string | undefined) => ({
  name: 'contact-email-api',
  configureServer(server: ViteDevServer) {
    server.middlewares.use('/api/send-email', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      if (!resendApiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }));
        return;
      }

      try {
        const payload = await readJsonBody(req);

        if (!isContactPayload(payload)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Name, email, and message are required' }));
          return;
        }

        const name = payload.name.trim();
        const email = payload.email.trim();
        const message = payload.message.trim();

        if (!name || !email || !message) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Name, email, and message are required' }));
          return;
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PaiseFlow Contact <onboarding@resend.dev>',
            to: CONTACT_TO_EMAIL,
            reply_to: email,
            subject: `PaiseFlow contact from ${name}`,
            html: `
              <h2>New PaiseFlow contact message</h2>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(email)}</p>
              <p><strong>Message:</strong></p>
              <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            `,
          }),
        });

        const data = await resendResponse.json().catch(() => ({}));

        if (!resendResponse.ok) {
          res.statusCode = resendResponse.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Resend failed to send the email', details: data }));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Unable to send email' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), contactEmailPlugin(env.RESEND_API_KEY)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth'],
            charts: ['recharts'],
            motion: ['motion/react'],
          },
        },
      },
    },
  };
});
