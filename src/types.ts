export type PaymentType = 'juros' | 'principal' | 'ambos' | 'outro';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  type: PaymentType;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone: string;
  startDate: string;
  initialLoan: number;              // Valor inicialmente emprestado
  interestRate: number;              // Taxa de juros em % (ex: 10%)
  interestPeriod: 'mensal' | 'semanal' | 'diario'; // Periodicidade dos juros
  interestPaidStatus: 'pago' | 'pendente' | 'atrasado'; // Status do juros atual
  manualInterestPaidTotal: number;  // Quanto já pagou de juros pra mim (editável manualmente)
  manualOutstandingBalance: number; // Saldo devedor atual (editável manualmente)
  notes: string;
  payments: Payment[];
}

export interface SystemStats {
  totalOnStreet: number;      // Total emprestado (saldo devedor ativo)
  totalInterestReceived: number; // Total de juros recebidos
  activeClientsCount: number;
  pendingInterestCount: number;
}
