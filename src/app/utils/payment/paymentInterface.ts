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
  status: 'pending' | 'pago' | 'vencido' | 'cancelado';
  estado: string;
  contato: string;
  secretario: string;
  socio_id: string;
  valor: number;
  createdAt: Date;
  updatedAt: Date;
  vencimento: string;
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
