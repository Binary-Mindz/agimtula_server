import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BankService {
  private clientId = 'b84ee12c366a4eaf97b1c376dd25934d';
  private clientSecret = '6ee6ec20f25f4af78876fd90976713ca';
  private redirectUri = 'http://localhost:3000/consent-redirect'; // Update this for production

  // Scopes for app token
  private appScopes = ['authorization:grant', 'user:create'];
  // Scopes for user consent
  private consentScopes = [
    'accounts:read',
    'transactions:read',
    'user:read',
    'credentials:read',
  ];

  // 1️⃣ Get App Token
  async getAppToken(): Promise<string> {
    const res = await axios.post(
      'https://api.tink.com/api/v1/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: this.appScopes.join(' '),
      }),
    );
    return res.data.access_token;
  }

  // 2️⃣ Create User + Consent
  async createUser() {
    try {
      const token = await this.getAppToken();

      // ✅ Create Tink user
      const userRes = await axios.post(
        'https://api.tink.com/api/v1/user/create',
        { market: 'SE', locale: 'sv_SE' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );

      const userId = userRes.data.user_id;
      console.log('✅ Tink user created:', userRes.data);

      // 🔗 Create Consent session
      const consentRes = await axios.post(
        'https://api.tink.com/api/v1/oauth/authorization-grant',
        new URLSearchParams({
          user_id: userId,
          scope: 'accounts:read,transactions:read,user:read,credentials:read',
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // 🔗 Frontend redirect URL
      const code = consentRes.data.code;

      const consentUrl = `https://link.tink.com/1.0/account-check/?client_id=${this.clientId}&redirect_uri=https%3A%2F%2Fconsole.tink.com%2Fcallback&market=SE&locale=en_US`;


      console.log('🔗 Consent URL:', consentUrl);

      return { userId, consentUrl };

    } catch (error: any) {
      console.error(
        '❌ Error creating Tink user or consent session:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getUserAccessToken(authCode: string) {
    const res = await axios.post(
      'https://api.tink.com/api/v1/oauth/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: authCode,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    return res.data.access_token;
  }
}
