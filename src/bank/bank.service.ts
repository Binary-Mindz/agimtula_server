// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class TinkService {
//   private apiUrl = 'https://api.tink.com';

//   async exchangeToken(code: string): Promise<any> {
//     const body = new URLSearchParams({
//       code,
//       client_id: process.env.TINK_CLIENT_ID!,
//       client_secret: process.env.TINK_CLIENT_SECRET!,
//       grant_type: 'authorization_code',
//     });

//     const res = await fetch(${this.apiUrl}/api/v1/oauth/token, {
//       method: 'POST',
//       body,
//     });

//     if (!res.ok) throw new Error(Tink token error: ${res.status});
//     return res.json();
//   }

//   async getTransactions(accessToken: string): Promise<any> {
//     const res = await fetch(${this.apiUrl}/data/v2/transactions, {
//       headers: { Authorization: Bearer ${accessToken} },
//     });
//     if (!res.ok) throw new Error(Failed to fetch transactions: ${res.status});
//     return res.json();
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class BankService {
  private readonly logger = new Logger(BankService.name);

  // NOTE: move these to process.env in production and rotate if leaked.
  private clientId =
    process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
  private clientSecret =
    process.env.TINK_CLIENT_SECRET || '8e7c162045fa44738ca5ab88b1164f7a';
  private redirectUri = 'http://localhost:3000/callback'; // must match Tink Console exactly

  // Scopes for app token
  private appScopes = ['authorization:grant', 'user:create'];
  // Scopes for user consent
  private consentScopes = [
    'accounts:read',
    'transactions:read',
    'user:read',
    'credentials:read',
    'account-verification-reports:read',
  ];

  // 1️⃣ Get App Token (client_credentials)
  async getAppToken(): Promise<any> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.appScopes.join(' '),
    }).toString();

    const res = await axios.post(
      'https://api.tink.com/api/v1/oauth/token',
      body,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    return res.data;
  }

  // 2️⃣ Create User + Authorization Grant + build consent (Link) URL
  async createUser() {
    try {
      // a) App token
      const appTokenResp = await this.getAppToken();
      const appToken = appTokenResp.access_token;

      // b) Create Tink user (use NL locale for Netherlands)
      const userRes = await axios.post(
        'https://api.tink.com/api/v1/user/create',
        { market: 'NL', locale: 'nl_NL' },
        {
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const userId = userRes.data.user_id;
      this.logger.log('✅ Tink user created: ' + userId);

      // c) Create authorization-grant (this returns a grant code you must include in Link)
      const grantBody = new URLSearchParams({
        user_id: userId,
        scope: this.consentScopes.join(' '),
        redirect_uri: this.redirectUri,
      }).toString();

      const consentRes = await axios.post(
        'https://api.tink.com/api/v1/oauth/authorization-grant',
        grantBody,
        {
          headers: {
            Authorization: `Bearer ${appToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      console.log({ consentRes });
      const grantData = consentRes.data;
      this.logger.debug(
        'authorization-grant response: ' + JSON.stringify(grantData),
      );

      const grantCode = grantData?.code;
      if (!grantCode) {
        // Some responses may provide a ready-made URL instead — handle that case if needed
        const providedUrl =
          grantData?.url ||
          grantData?.redirect_url ||
          grantData?.link_url ||
          null;
        if (providedUrl) {
          // create state and return providedUrl
          const state = crypto.randomBytes(16).toString('hex');
          return { userId, consentUrl: providedUrl, state, grantData };
        }
        throw new Error(
          'authorization-grant did not return a grant code or link URL',
        );
      }

      const state = crypto.randomBytes(16).toString('hex');
      const consentUrl = `https://link.tink.com/1.0/account-check/?client_id=${encodeURIComponent(
        this.clientId,
      )}&redirect_uri=${encodeURIComponent(`${this.redirectUri}?code=${encodeURIComponent(grantCode)}`)}&code=${encodeURIComponent(grantCode)}&market=NL&locale=nl_NL&state=${encodeURIComponent(
        state,
      )}`;
      console.log(consentUrl);
      this.logger.log('🔗 Consent URL constructed');
      return { userId, consentUrl, state, grantData };
    } catch (error: any) {
      this.logger.error(
        '❌ Error creating Tink user or consent session:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getUserAccessToken(authCode: string): Promise<any> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: this.redirectUri,
    }).toString();

    const res = await axios.post(
      'https://api.tink.com/api/v1/oauth/token',
      body,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
    console.log({ res });
    return res.data;
  }
  async getUserAccountsWithToken(userAccessToken: string) {
    const url = 'https://api.tink.com/data/v2/transactions';
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });
      console.log(res);
      // res.data likely contains an array or object with accounts; inspect in dev
      return cResponseData(res.data);
    } catch (err: any) {
      this.logger.error(
        'getUserAccounts failed: ' + (err.response?.data || err.message),
      );
      throw err;
    }
  }
}
