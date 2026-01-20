// import { BadRequestException, Injectable, Logger } from '@nestjs/common';
// import axios from 'axios';
// import * as crypto from 'crypto';
// import { cResponseData } from 'src/common/cResponse';

// @Injectable()
// export class BankService {
//   private readonly logger = new Logger(BankService.name);

 
//   private clientId =
//     process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
//   private clientSecret =
//     process.env.TINK_CLIENT_SECRET || '8e7c162045fa44738ca5ab88b1164f7a';
//   private redirectUri = process.env.TINK_REDIRECT_URI || 'http://localhost:5000/bank/tink/callback'; // must match Tink Console exactly

//   // Scopes for app token
//   private appScopes = ['authorization:grant', 'user:create'];
//   // Scopes for user consent
//   private consentScopes = [
//     'accounts:read',
//     'transactions:read',
//     'user:read',
//     'credentials:read',
//     'account-verification-reports:read',
//   ];

//   constructor() {
//     this.logger.log('BankService initialized');
//     this.logger.debug(`Client ID configured: ${this.clientId.substring(0, 8)}...`);
//     this.logger.debug(`Redirect URI: ${this.redirectUri}`);
//   }

 
//   // async getAppToken(): Promise<any> {
//   //   try {
//   //     this.logger.log('Requesting app token from Tink API');
//   //     this.logger.debug(`Scopes requested: ${this.appScopes.join(', ')}`);

//   //     const body = new URLSearchParams({
//   //       grant_type: 'client_credentials',
//   //       client_id: this.clientId,
//   //       client_secret: this.clientSecret,
//   //       scope: this.appScopes.join(' '),
//   //     }).toString();

//   //     const res = await axios.post(
//   //       'https://api.tink.com/api/v1/oauth/token',
//   //       body,
//   //       {
//   //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//   //       },
//   //     );

//   //     this.logger.log('App token obtained successfully');
//   //     this.logger.debug(`Token expires in: ${res.data.expires_in} seconds`);

//   //     return res.data;
//   //   } catch (error) {
//   //     this.logger.error('Failed to get app token from Tink API', error.stack);
//   //     throw new BadRequestException('Failed to authenticate with Tink API');
//   //   }
//   // }

 
//   // async createUser() {
//   //   try {
//   //     this.logger.log('Starting Tink user creation process');

//   //     // a) App token
//   //     const appTokenResp = await this.getAppToken();
//   //     const appToken = appTokenResp.access_token;

//   //     // b) Create Tink user (use NL locale for Netherlands)
//   //     this.logger.log('Creating Tink user with NL market and locale');
//   //     const userRes = await axios.post(
//   //       'https://api.tink.com/api/v1/user/create',
//   //       { market: 'NL', locale: 'nl_NL' },
//   //       {
//   //         headers: {
//   //           Authorization: `Bearer ${appToken}`,
//   //           'Content-Type': 'application/json',
//   //         },
//   //       },
//   //     );

//   //     const userId = userRes.data.user_id;
//   //     this.logger.log(`Tink user created successfully: ${userId}`);

//   //     // c) Create authorization-grant
//   //     this.logger.log('Creating authorization grant for user');
//   //     this.logger.debug(`Consent scopes: ${this.consentScopes.join(', ')}`);

//   //     const grantBody = new URLSearchParams({
//   //       user_id: userId,
//   //       scope: this.consentScopes.join(' '),
//   //       redirect_uri: this.redirectUri,
//   //     }).toString();

//   //     const consentRes = await axios.post(
//   //       'https://api.tink.com/api/v1/oauth/authorization-grant',
//   //       grantBody,
//   //       {
//   //         headers: {
//   //           Authorization: `Bearer ${appToken}`,
//   //           'Content-Type': 'application/x-www-form-urlencoded',
//   //         },
//   //       },
//   //     );

//   //     const grantData = consentRes.data;
//   //     this.logger.debug(`Authorization grant response: ${JSON.stringify(grantData)}`);

//   //     const grantCode = grantData?.code;
//   //     if (!grantCode) {
//   //       this.logger.warn('No grant code received, checking for provided URL');

//   //       const providedUrl =
//   //         grantData?.url ||
//   //         grantData?.redirect_url ||
//   //         grantData?.link_url ||
//   //         null;

//   //       if (providedUrl) {
//   //         const state = crypto.randomBytes(16).toString('hex');
//   //         this.logger.log('Using provided consent URL from Tink');
//   //         this.logger.debug(`State generated: ${state}`);
//   //         return { userId, consentUrl: providedUrl, state, grantData };
//   //       }

//   //       this.logger.error('Authorization grant did not return grant code or link URL');
//   //       throw new Error(
//   //         'authorization-grant did not return a grant code or link URL',
//   //       );
//   //     }

//   //     const state = crypto.randomBytes(16).toString('hex');
//   //     const consentUrl = `https://link.tink.com/1.0/account-check/?client_id=${encodeURIComponent(
//   //       this.clientId,
//   //     )}&redirect_uri=${encodeURIComponent(`${this.redirectUri}?code=${encodeURIComponent(grantCode)}`)}&code=${encodeURIComponent(grantCode)}&market=NL&locale=nl_NL&state=${encodeURIComponent(
//   //       state,
//   //     )}`;

//   //     this.logger.log('Consent URL constructed successfully');
//   //     this.logger.debug(`Consent URL: ${consentUrl.substring(0, 100)}...`);
//   //     this.logger.debug(`State: ${state}`);

//   //     return { userId, consentUrl, state, grantData };
//   //   } catch (error: any) {
//   //     this.logger.error(
//   //       `Error creating Tink user or consent session: ${error.message}`,
//   //       error.stack,
//   //     );
//   //     throw new BadRequestException(
//   //       'Error creating Tink user or consent session',
//   //     );
//   //   }
//   // }

//   // async getUserAccessToken(authCode: string): Promise<any> {
//   //   try {
//   //     this.logger.log('Exchanging authorization code for user access token');
//   //     this.logger.debug(`Auth code: ${authCode.substring(0, 10)}...`);

//   //     const body = new URLSearchParams({
//   //       client_id: this.clientId,
//   //       client_secret: this.clientSecret,
//   //       grant_type: 'authorization_code',
//   //       code: authCode,
//   //       redirect_uri: this.redirectUri,
//   //     }).toString();

//   //     const res = await axios.post(
//   //       'https://api.tink.com/api/v1/oauth/token',
//   //       body,
//   //       {
//   //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//   //       },
//   //     );

//   //     this.logger.log('User access token obtained successfully');
//   //     this.logger.debug(`Token type: ${res.data.token_type}`);
//   //     this.logger.debug(`Expires in: ${res.data.expires_in} seconds`);

//   //     return res.data;
//   //   } catch (error) {
//   //     this.logger.error(
//   //       `Failed to exchange authorization code: ${error.message}`,
//   //       error.stack,
//   //     );
//   //     throw new BadRequestException('Failed to obtain user access token');
//   //   }
//   // }

//   // async getUserAccountsWithToken(userAccessToken: string) {
//   //   const url = 'https://api.tink.com/data/v2/transactions';

//   //   try {
//   //     this.logger.log('Fetching user transactions from Tink API');
//   //     this.logger.debug(`API endpoint: ${url}`);

//   //     const res = await axios.get(url, {
//   //       headers: { Authorization: `Bearer ${userAccessToken}` },
//   //     });

//   //     this.logger.log('Transactions fetched successfully');
//   //     this.logger.debug(`Response data keys: ${Object.keys(res.data).join(', ')}`);

//   //     if (Array.isArray(res.data.transactions)) {
//   //       this.logger.log(`Total transactions retrieved: ${res.data.transactions.length}`);
//   //     }

//   //     return cResponseData(res.data);
//   //   } catch (err: any) {
//   //     const errorMessage = err.response?.data || err.message;
//   //     this.logger.error(
//   //       `Failed to fetch user transactions: ${errorMessage}`,
//   //       err.stack,
//   //     );
//   //     throw new BadRequestException('Failed to fetch user accounts and transactions');
//   //   }
//   // }
// }
