import { Client } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'José Roberto da Silva',
    address: 'Rua das Laranjeiras, 123 - Centro, São Paulo - SP',
    phone: '(11) 98765-4321',
    startDate: '2026-01-10',
    initialLoan: 5000,
    interestRate: 15,
    interestPeriod: 'mensal',
    interestPaidStatus: 'pago',
    manualInterestPaidTotal: 1500,
    manualOutstandingBalance: 4500,
    notes: 'Cliente antigo. Costuma pagar sempre no dia 10. Amortizou R$ 500 do principal no último mês.',
    payments: [
      {
        id: '1-1',
        date: '2026-02-10',
        amount: 750,
        type: 'juros',
        notes: 'Pagamento dos juros referentes a Janeiro (15% de R$ 5000)'
      },
      {
        id: '1-2',
        date: '2026-03-10',
        amount: 1250,
        type: 'ambos',
        notes: 'R$ 750 de juros + R$ 500 para amortizar o saldo devedor'
      }
    ]
  },
  {
    id: '2',
    name: 'Maria Madalena de Souza',
    address: 'Av. Brasil, 987 - Apto 4B - Bairro Novo, Curitiba - PR',
    phone: '(41) 99888-1122',
    startDate: '2026-03-15',
    initialLoan: 2000,
    interestRate: 20,
    interestPeriod: 'mensal',
    interestPaidStatus: 'pendente',
    manualInterestPaidTotal: 400,
    manualOutstandingBalance: 2000,
    notes: 'Combinou de pagar todo dia 15. Trabalha com comércio de roupas e precisa de capital de giro constante.',
    payments: [
      {
        id: '2-1',
        date: '2026-04-15',
        amount: 400,
        type: 'juros',
        notes: 'Juros referente ao primeiro mês (20% de R$ 2000)'
      }
    ]
  },
  {
    id: '3',
    name: 'Carlos Eduardo "Dudu"',
    address: 'Rua Francisco de Assis, Beco 4, Casa 12 - Rio de Janeiro - RJ',
    phone: '(21) 97111-2233',
    startDate: '2026-02-05',
    initialLoan: 10000,
    interestRate: 10,
    interestPeriod: 'mensal',
    interestPaidStatus: 'atrasado',
    manualInterestPaidTotal: 1000,
    manualOutstandingBalance: 10000,
    notes: 'Está atrasado com a parcela de juros do mês de Abril e Maio. Cobrar na próxima semana.',
    payments: [
      {
        id: '3-1',
        date: '2026-03-05',
        amount: 1000,
        type: 'juros',
        notes: 'Primeiro pagamento de juros recebido com atraso de 3 dias.'
      }
    ]
  }
];
