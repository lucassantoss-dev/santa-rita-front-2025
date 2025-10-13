export interface PaymentData {
  _id: string;
  quadra: string;
  numero: string;
  complemento: string;
  titular: string;
  paymentType: 'plano' | 'avulso';
  responsavel: string;
  endereco: string;
  bairro: string;
  cidade: string;
  paymentDate?: Date;
  paymentDetails?: PaymentDetails;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  estado: string;
  contato: string;
  secretario: string;
  socio_id: string;
  valor: number;
  createdAt: Date;
  updatedAt: Date;
  vencimento: string;
}

interface PaymentDetails {
  createdAt: Date;
  paymentId: string;
  type: string;
  _id?: string;
  payload: Payload;
  paymentMethod: string;
}

interface Payload {
    id: number,
    status: string,
    status_detail: string,
    description: string,
    transaction_amount: number,
    payment_method_id: string,
    date_created: string,
    date_of_expiration: string,
    qr_code: string,
    qr_code_base64: string,
    ticket_url: string,
    barcode?: string;
    external_resource_url?: string;
    digitable_line?: string;
}

export interface PaymentPlan {
  _id: string;
  name: string;
  description: string;
  amount: number;
  installments: number;
  frequency: 'mensal' | 'bimestral' | 'trimestral' | 'anual';
  active: boolean;
}

export interface PaymentPlanCreate {
  _id?: string;
  name: string;
  id: string;
  amount: number;
  currency: string;
  interval: 'month' | 'quarter' | 'year';
  description: string;
}

export interface PaymentStats {
  totalPayments: number;
  pendingPayments: number;
  paidPayments: number;
  overduePayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}
