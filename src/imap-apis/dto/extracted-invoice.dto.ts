export interface ExtractedInvoicePayload {
  userID: string;
  invoice: {
    invoiceNo: string;
    issueDate: string;
    dueDate?: string;
    type: 'CLIENT' | 'BUSINESS';
    currency: string;

    companyName: string;
    email: string;
    AddressAndContactInfo?: string;
    projectInformation?: string;
    projectDescription?: string;

    serviceAndItems: {
      name: string;
      quantity: number;
      unitPrice: number;
      unitPriceCurrency: string;
      total: number;
      totalCurrency: string;
    }[];

    vat: number;
    vatCurrency: string;

    subTotal: number;
    subTotalCurrency: string;

    totalAmount: number;
    totalAmountCurrency: string;

    isPaid?: boolean;
    paidAt?: string;

    additionalNote?: string;

    haveAttachment?: boolean;
    attachmentUrl?: string;

    businessDatas?: {
      label: string;
      value: string;
    }[];
    vendor: string;
  };
}
