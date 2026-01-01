export type ImapClient = {
  host: string;
  port: number;
  secure?: boolean | null | undefined;
  username: string;
  password: string;
};
