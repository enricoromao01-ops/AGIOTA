import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Save, X, User, MapPin, Phone, Calendar, DollarSign, Percent, AlertCircle } from 'lucide-react';

interface ClientFormProps {
  client?: Client; // If present, we are in EDIT mode. Otherwise, ADD mode.
  onSave: (clientData: Omit<Client, 'id' | 'payments'> & { id?: string }) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [initialLoan, setInitialLoan] = useState<number>(1000);
  const [interestRate, setInterestRate] = useState<number>(10);
  const [interestPeriod, setInterestPeriod] = useState<'mensal' | 'semanal' | 'diario'>('mensal');
  const [interestPaidStatus, setInterestPaidStatus] = useState<'pago' | 'pendente' | 'atrasado'>('pendente');
  const [manualInterestPaidTotal, setManualInterestPaidTotal] = useState<number>(0);
  const [manualOutstandingBalance, setManualOutstandingBalance] = useState<number>(1000);
  const [notes, setNotes] = useState('');

  // If we are editing, pre-populate state with the client data
  useEffect(() => {
    if (client) {
      setName(client.name);
      setAddress(client.address);
      setPhone(client.phone);
      setStartDate(client.startDate);
      setInitialLoan(client.initialLoan);
      setInterestRate(client.interestRate);
      setInterestPeriod(client.interestPeriod);
      setInterestPaidStatus(client.interestPaidStatus);
      setManualInterestPaidTotal(client.manualInterestPaidTotal);
      setManualOutstandingBalance(client.manualOutstandingBalance);
      setNotes(client.notes);
    }
  }, [client]);

  // Assist: when initialLoan changes and we are creating, automatically update outstanding balance to save time, but let the user change it manually
  const handleInitialLoanChange = (val: number) => {
    setInitialLoan(val);
    if (!client) {
      setManualOutstandingBalance(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: client?.id,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      startDate,
      initialLoan: Number(initialLoan),
      interestRate: Number(interestRate),
      interestPeriod,
      interestPaidStatus,
      manualInterestPaidTotal: Number(manualInterestPaidTotal),
      manualOutstandingBalance: Number(manualOutstandingBalance),
      notes: notes.trim(),
    });
  };

  return (
    <form id="client-form" onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {client ? '✏️ Alterar Cadastro de Cliente' : '👤 Novo Cadastro de Cliente'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-605 transition-colors p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome do Cliente */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nome Completo</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Ex: Carlos Albuquerque"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Telefone / Contato */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Telefone / Contato</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ex: (11) 99999-8888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Endereço Completo</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rua, Número, Bairro, Cidade/Estado"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Data do Empréstimo */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Data de Início</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Taxa de Juros (%) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Taxa de Juros (%)</label>
          <div className="relative">
            <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <div className="flex gap-2 font-mono">
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <select
                value={interestPeriod}
                onChange={(e) => setInterestPeriod(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="diario">Diário</option>
              </select>
            </div>
          </div>
        </div>

        {/* Capital Inicial Emprestado */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Capital Inicial Emprestado (R$)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="number"
              min="0"
              step="any"
              required
              value={initialLoan}
              onChange={(e) => handleInitialLoanChange(Math.max(0, Number(e.target.value)))}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Status do Juros Atual */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status do Juros Atual</label>
          <select
            value={interestPaidStatus}
            onChange={(e) => setInterestPaidStatus(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pago">💚 Quitado / Pago</option>
            <option value="pendente">💛 Pendente (Aguardando)</option>
            <option value="atrasado">💔 Atrasado (Inadimplente)</option>
          </select>
        </div>
      </div>

      {/* MANUAL OVERRIDES DIRECT SECTION (IMPORTANT FOR USER REQUESTS!) */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span>Controle Manual Direto (Editar Valores Atuais)</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Você pode ajustar ou zerar os valores abaixo livremente a qualquer momento. Eles representam o estado atual consolidado do cliente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
            <label className="text-[11px] text-slate-500 font-bold tracking-wide block">
              Total de Juros Já Pagos (R$)
            </label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                step="any"
                value={manualInterestPaidTotal}
                onChange={(e) => setManualInterestPaidTotal(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-sm text-emerald-600 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Quanto o cliente já enviou apenas de juros para o seu bolso.
            </p>
          </div>

          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
            <label className="text-[11px] text-slate-500 font-bold tracking-wide block">
              Saldo Devedor Atual (R$)
            </label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                step="any"
                value={manualOutstandingBalance}
                onChange={(e) => setManualOutstandingBalance(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Soma restante que o devedor precisa pagar para quitar a dívida principal.
            </p>
          </div>
        </div>

        {client && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                // Calculate from payments history
                const calculatedInterest = client.payments
                  .filter((p) => p.type === 'juros' || p.type === 'ambos' || p.type === 'outro')
                  .reduce((acc, p) => {
                    if (p.type === 'juros') return acc + p.amount;
                    // If combined, usually they might specify in description, but we take full or partial. Let's make an approximation or count full.
                    return acc + p.amount;
                  }, 0);
                
                const calculatedPrincipalPaid = client.payments
                  .filter((p) => p.type === 'principal' || p.type === 'ambos')
                  .reduce((acc, p) => {
                    // Let's assume for amortizacao they paid amount
                    return acc + p.amount;
                  }, 0);

                setManualInterestPaidTotal(calculatedInterest);
                // Balance is Initial Loan minus Principal payments
                const newBalance = Math.max(0, client.initialLoan - calculatedPrincipalPaid);
                setManualOutstandingBalance(newBalance);
              }}
              className="text-[11px] bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded px-2.5 py-1.5 transition-colors cursor-pointer shadow-sm"
            >
              🔄 Recalcular Baseado no Histórico
            </button>
          </div>
        )}
      </div>

      {/* Notas / Observações */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Observações do Caso</label>
        <textarea
          placeholder="Anotações adicionais como garantias dadas (carro, relógio, notas promissórias), fiador, combinado de recebimentos..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white hover:bg-slate-150 border border-slate-250 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  );
}
