import { Client } from '../types';
import { DollarSign, Percent, Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  clients: Client[];
}

export function DashboardStats({ clients }: DashboardStatsProps) {
  // Total Capital Emprestado Atual (Saldo Devedor Ativo)
  const totalOnStreet = clients.reduce((acc, client) => acc + client.manualOutstandingBalance, 0);

  // Total de Juros já recebidos
  const totalInterestReceived = clients.reduce((acc, client) => acc + client.manualInterestPaidTotal, 0);

  // Clientes Totais
  const activeClientsCount = clients.length;

  // Clientes com Juros Pendentes ou Atrasados
  const pendingInterestClients = clients.filter(
    (c) => c.interestPaidStatus === 'pendente' || c.interestPaidStatus === 'atrasado'
  ).length;

  // Clientes em status de Atraso Crítico
  const delayedInterestClients = clients.filter((c) => c.interestPaidStatus === 'atrasado').length;

  // Total de capital inicial emprestado
  const totalInitialLoan = clients.reduce((acc, client) => acc + client.initialLoan, 0);

  // Rendimento médio estimado de juros esperados por ciclo (ex: soma de (saldo devedor * taxa / 100))
  const expectedMonthlyRevenue = clients.reduce(
    (acc, client) => acc + (client.manualOutstandingBalance * (client.interestRate / 100)),
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CARD 1: CAPITAL ATIVO */}
      <div id="stat-capital-ativo" className="bg-white border border-slate-200 text-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capital na Rua (Saldo Devedor)</p>
            <h3 className="text-2xl font-bold font-sans mt-1 text-slate-900">
              {formatCurrency(totalOnStreet)}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-550/10 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500 gap-1.5 border-t border-slate-100 pt-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Capital Inicial original: <strong className="text-slate-700">{formatCurrency(totalInitialLoan)}</strong></span>
        </div>
      </div>

      {/* CARD 2: JUROS ARRECADADOS */}
      <div id="stat-juros-arrecadados" className="bg-white border border-slate-200 text-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Juros Recebidos (Lucro)</p>
            <h3 className="text-2xl font-bold font-sans mt-1 text-emerald-600">
              {formatCurrency(totalInterestReceived)}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-100/40 text-emerald-600 rounded-lg">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500 gap-1.5 border-t border-slate-100 pt-2.5">
          <span className="bg-emerald-550/10 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700">Lucro Garantido</span>
          <span>Soma de todos os juros quitados</span>
        </div>
      </div>

      {/* CARD 3: CLIENTES */}
      <div id="stat-clientes" className="bg-white border border-slate-200 text-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clientes Totais</p>
            <h3 className="text-2xl font-bold font-sans mt-1 text-slate-900">
              {activeClientsCount}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-100/40 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500 justify-between border-t border-slate-100 pt-2.5">
          <span>Projeção mensal de juros:</span>
          <strong className="text-blue-600">{formatCurrency(expectedMonthlyRevenue)}</strong>
        </div>
      </div>

      {/* CARD 4: COBRANÇAS EM ABERTO */}
      <div id="stat-cobrancas" className="bg-white border border-slate-200 text-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cobranças Ativas</p>
            <h3 className={`text-2xl font-bold font-sans mt-1 ${delayedInterestClients > 0 ? 'text-red-650' : 'text-slate-800'}`}>
              {pendingInterestClients} pendentes
            </h3>
          </div>
          <div className={`p-2.5 rounded-lg ${delayedInterestClients > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-slate-500 gap-1 border-t border-slate-100 pt-2.5">
          {delayedInterestClients > 0 ? (
            <span className="text-red-600 font-bold">⚠️ {delayedInterestClients} em atraso crítico!</span>
          ) : (
            <span className="text-emerald-600 font-bold">✓ Sem atrasos críticos pendentes</span>
          )}
        </div>
      </div>
    </div>
  );
}
