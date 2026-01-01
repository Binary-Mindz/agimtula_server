export type GetIntervalTimes = {
  selected: boolean;
  seleteItem: boolean;
  id: string;
  title: string;
  description: string;
};

export type ImapConfiguration = {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  userId: string;
  connect: boolean;
  sync: boolean;
  emailNotifications: boolean;
  realtimeImapCheckingId: string | null;
  created_at: Date;
  updated_at: Date;
} | null;
