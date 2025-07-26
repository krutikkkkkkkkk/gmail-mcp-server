import { createServer } from 'http';
import { URL } from 'url';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
].join(' ');

const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

class OAuth2Helper {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GMAIL_CLIENT_ID || '';
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.error('Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file');
      process.exit(1);
    }
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    return response.json();
  }

  async startOAuthFlow(): Promise<void> {
    const authUrl = this.getAuthUrl();
    
    console.log('Starting OAuth flow...');
    console.log('Opening browser to:', authUrl);

    // Start local server to handle callback
    const server = createServer(async (req, res) => {
      if (!req.url) return;

      const url = new URL(req.url, `http://${req.headers.host}`);
      
      if (url.pathname === '/oauth/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error: ${error}</h1>`);
          console.error('OAuth error:', error);
          server.close();
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Error: No authorization code received</h1>');
          server.close();
          return;
        }

        try {
          console.log('Exchanging authorization code for tokens...');
          const tokens = await this.exchangeCodeForTokens(code);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Success!</h1>
            <p>You can close this window and return to the terminal.</p>
            <h2>Your tokens:</h2>
            <pre>${JSON.stringify(tokens, null, 2)}</pre>
          `);

          console.log('\n✅ OAuth flow completed successfully!');
          console.log('\n📋 Add these to your .env file:');
          console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}`);
          
          if (tokens.refresh_token) {
            console.log('\n💾 Your refresh token (save this safely):');
            console.log(tokens.refresh_token);
          } else {
            console.log('\n⚠️  No refresh token received. Make sure you set access_type=offline and prompt=consent');
          }

          server.close();
        } catch (error) {
          console.error('Error exchanging code:', error);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error: ${error}</h1>`);
          server.close();
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(3000, () => {
      console.log('Local server started on http://localhost:3000');
      
      // Try to open browser automatically
      const command = process.platform === 'win32' ? 'start' : 
                     process.platform === 'darwin' ? 'open' : 'xdg-open';
      
      exec(`${command} "${authUrl}"`, (error) => {
        if (error) {
          console.log('\nCould not open browser automatically.');
          console.log('Please manually open this URL in your browser:');
          console.log(authUrl);
        }
      });

      console.log('\nWaiting for OAuth callback...');
      console.log('If the browser doesn\'t open automatically, copy and paste this URL:');
      console.log(authUrl);
    });
  }
}

// Run the OAuth flow
const oauth = new OAuth2Helper();
oauth.startOAuthFlow().catch(console.error);
