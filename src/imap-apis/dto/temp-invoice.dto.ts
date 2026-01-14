export interface TempInvoiceDto {
  id: string;
  userId: string;
  emailId: string;
  fromEmail: string;
  subject?: string | null;
  receivedDate?: Date | null;
  emailBody?: string | null;
  haveAttachment: boolean;
  attachmentUrl?: string | null;
  attachmentFilename?: string | null;
  isProcessed: boolean;
  processingError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}