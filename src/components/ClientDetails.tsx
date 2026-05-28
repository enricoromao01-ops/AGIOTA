import React, { useState } from 'react';
import { Client, Payment, PaymentType } from '../types';
import { 
  X, Calendar, Phone, MapPin, DollarSign, Percent, Plus, Trash2, 
  CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, Calculator, Edit2,
  MessageCircle
} from 'lucide-react';

interface ClientDetailsProps {
  client: Client;
  onUpdateClient: (updated: Client) => void;
  onClose: () => void;
  onEditTrigger: () => void;
  onDeleteClient: (id: string) => void;
  onSendWhatsAppReminder?: (client: Client) => void;
}

export function ClientDetails({ 
  client, 
  onUpdateClient, 
  onClose, 
  onEditTrigger,
  onDeleteClient,
  onSendWhatsAppReminder
}: ClientDetailsProps) {
  // Local state to toggle registration of a new payment
  const [showAddPayment, setShowAddPayment] = useState(false);
  
  // State for in-line payment deletion confirmation
  const [paymentIdToConfirmDelete, setPaymentIdToConfirmDelete] = useState<string | null>(null);
  
  // Payment Form fields
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payType, setPayType] = useState<PaymentType>('juros');
  const [payNotes, setPayNotes] = useState('');
  const [autoAdjust, setAutoAdjust] = useState(true);

  // Quick manually override states on the card directly
  const [isEditingOverrides, setIsEditingOverrides] = useState(false);
  const [tempInterestPaid, setTempInterestPaid] = useState(client.manualInterestPaidTotal);
  const [tempOutstanding, setTempOutstanding] = useState(client.manualOutstandingBalance);

  // Reset temp states when client changes
  React.useEffect(() => {
    setTempInterestPaid(client.manualInterestPaidTotal);
    setTempOutstanding(client.manualOutstandingBalance);
  }, [client]);

  // Handle Quick Manuel overrides save
  const handleSaveOverrides = () => {
    onUpdateClient({
      ...client,
      manualInterestPaidTotal: Number(tempInterestPaid),
      manualOutstandingBalance: Number(tempOutstanding),
    });
    setIsEditingOverrides(false);
  };

  // Quick update interest payment status directly
  const handleUpdateStatus = (newStatus: 'pago' | 'pendente' | 'atrasado') => {
    onUpdateClient({
      ...client,
      interestPaidStatus: newStatus
    });
  };

  // Add new payment to history
  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      date: payDate,
      amount: Number(payAmount),
      type: payType,
      notes: payNotes.trim(),
    };

    const updatedPayments = [newPayment, ...client.payments];

    // Auto adjust values if checkbox is checked
    let updatedInterestPaid = client.manualInterestPaidTotal;
    let updatedOutstanding = client.manualOutstandingBalance;

    if (autoAdjust) {
      if (payType === 'juros') {
        updatedInterestPaid += Number(payAmount);
      } else if (payType === 'principal') {
        updatedOutstanding = Math.max(0, updatedOutstanding - Number(payAmount));
      } else if (payType === 'ambos') {
        // Assume split is defined by interest rate percentage or user can tweak manually later
        // Let's assume standard behavior: interest amount is up to the current expected interest rate, or we allocate everything in proportion.
        // For simplicity, let's treat half as juros and half as amortizacao, or let them specify. Let's do 50% split as a guess, or assume full interest and remainder is capital.
        const expectedInterestForCycle = client.manualOutstandingBalance * (client.interestRate / 100);
        if (payAmount >= expectedInterestForCycle) {
          updatedInterestPaid += expectedInterestForCycle;
          updatedOutstanding = Math.max(0, updatedOutstanding - (payAmount - expectedInterestForCycle));
        } else {
          updatedInterestPaid += payAmount;
        }
      } else {
        // Outro
        updatedInterestPaid += payAmount;
      }
    }

    // If new interest payment was logged, we can set interestPaidStatus to 'pago' as a convenience
    let newStatus = client.interestPaidStatus;
    if (payType === 'juros' || payType === 'ambos') {
      newStatus = 'pago';
    }

    onUpdateClient({
      ...client,
      payments: updatedPayments,
      interestPaidStatus: newStatus,
      manualInterestPaidTotal: updatedInterestPaid,
      manualOutstandingBalance: updatedOutstanding,
    });

    // Reset payment fields
    setPayAmount(0);
    setPayNotes('');
    setShowAddPayment(false);
  };

  // Delete payment from history
  const handleDeletePayment = (paymentID: string) => {
    // Find the deleted payment to subtract if user wants (we can do it simply)
    const paymentToDelete = client.payments.find(p => p.id === paymentID);
    const updatedPayments = client.payments.filter((p) => p.id !== paymentID);

    let updatedInterestPaid = client.manualInterestPaidTotal;
    let updatedOutstanding = client.manualOutstandingBalance;

    if (paymentToDelete) {
      if (paymentToDelete.type === 'juros') {
        updatedInterestPaid = Math.max(0, updatedInterestPaid - paymentToDelete.amount);
      } else if (paymentToDelete.type === 'principal') {
        updatedOutstanding = updatedOutstanding + paymentToDelete.amount;
      }
    }

    onUpdateClient({
      ...client,
      payments: updatedPayments,
      manualInterestPaidTotal: updatedInterestPaid,
      manualOutstandingBalance: updatedOutstanding
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };  const getStatusBadge = (status: 'pago' | 'pendente' | 'atrasado') => {
    switch (status) {
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Juros Pago
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" /> Juros Pendente
          </span>
        );
      case 'atrasado':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Juros Atrasado (Cobrar!)
          </span>
        );
    }
  };

  return (
    <div id={`client-details-${client.id}`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="bg-[#1e293b] px-5 py-4 border-b border-slate-700 flex justify-between items-center text-white">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Dossiê do Cliente</span>
          <h3 className="text-xl font-bold tracking-tight text-white">{client.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDeleteClient(client.id)}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg border border-red-500 transition-colors flex items-center gap-1 cursor-pointer font-bold"
            title="Excluir este devedor permanentemente do sistema"
          >
            <Trash2 className="w-3 h-3" /> Excluir Cliente
          </button>
          <button
            onClick={onEditTrigger}
            className="text-xs bg-slate-850 hover:bg-slate-750 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-750 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <Edit2 className="w-3 h-3 text-emerald-400" /> Editar Cadastro
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SPECIAL CALLOUT FOR 100% PAID ACCOUNT */}
        {client.manualOutstandingBalance === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🎉</span>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Cliente Totalmente Quitado!</h4>
                <p className="text-xs text-emerald-700 font-medium">Este devedor possui saldo devedor zerado (R$ 0,00)!</p>
              </div>
            </div>
            <button
              onClick={() => onDeleteClient(client.id)}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-emerald-100" /> Excluir Cliente Pago
            </button>
          </div>
        )}
        {/* INFO BASICA CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-xs font-bold font-sans text-slate-500 uppercase tracking-widest flex items-center gap-1 border-b border-slate-200 pb-1.5">
              📌 Dados de Contato e Local
            </h4>
            <div className="space-y-2 mt-2">
              <p className="text-sm text-slate-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400 text-[10px] uppercase font-bold block">Endereço de Cobrança:</strong>
                  {client.address || <em className="text-slate-400 text-xs">Nenhum endereço cadastrado</em>}
                </span>
              </p>
              <p className="text-sm text-slate-700 flex items-start gap-2">
                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span className="w-full">
                  <strong className="text-slate-400 text-[10px] uppercase font-bold block">Telefone de Contato:</strong>
                  <span className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-slate-900 font-medium">{client.phone || <em className="text-slate-400 text-xs">Sem telefone cadastrado</em>}</span>
                    {client.phone && onSendWhatsAppReminder && (
                      <button
                        type="button"
                        onClick={() => onSendWhatsAppReminder(client)}
                        className="text-[10px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-all cursor-pointer shadow-sm"
                        title="Enviar lembrete de cobrança no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Cobrar
                      </button>
                    )}
                  </span>
                </span>
              </p>
              <p className="text-sm text-slate-700 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400 text-[10px] uppercase font-bold block">Data do Empréstimo Inicial:</strong>
                  {new Date(client.startDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
              </p>
            </div>
          </div>

          {/* DADOS FINANCEIROS INICIAIS */}
          <div className="space-y-2 bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold font-sans text-slate-500 uppercase tracking-widest flex items-center gap-1 border-b border-slate-200 pb-1.5">
                💸 Contrato de Juros
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-450 block mb-0.5">Capital Inicial:</span>
                  <p className="text-base font-bold text-slate-900 font-sans">{formatCurrency(client.initialLoan)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-450 block mb-0.5">Taxa Combinada:</span>
                  <p className="text-base font-bold text-blue-600 font-sans">
                    {client.interestRate}% <span className="text-xs text-slate-500 font-normal">({client.interestPeriod === 'mensal' ? 'mensal' : client.interestPeriod === 'semanal' ? 'semanal' : 'diário'})</span>
                  </p>
                </div>
              </div>
            </div>
            {/* QUICK INTEREST STATUS SETTER */}
            <div className="pt-3 border-t border-slate-200 mt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Mudar Status do Juros Atual:</span>
              <div className="flex gap-1 bg-white p-0.5 border border-slate-200 rounded-lg">
                <button
                  onClick={() => handleUpdateStatus('pago')}
                  className={`text-[10px] py-1 rounded font-bold flex-1 transition-colors cursor-pointer ${
                    client.interestPaidStatus === 'pago' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Pago
                </button>
                <button
                  onClick={() => handleUpdateStatus('pendente')}
                  className={`text-[10px] py-1 rounded font-bold flex-1 transition-colors cursor-pointer ${
                    client.interestPaidStatus === 'pendente' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Pendente
                </button>
                <button
                  onClick={() => handleUpdateStatus('atrasado')}
                  className={`text-[10px] py-1 rounded font-bold flex-1 transition-colors cursor-pointer ${
                    client.interestPaidStatus === 'atrasado' 
                    ? 'bg-red-100 text-red-800' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Atrasado
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATUS FINANCEIRO CONSOLIDADO (SOB DEMANDA EDITAVEL MANUALMENTE AQUI RAPIDO!) */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Consolidação de Valores Atuais</h4>
                <p className="text-[10px] text-slate-400 font-mono">Espaço de edição manual rápida</p>
              </div>
            </div>
            {!isEditingOverrides ? (
              <button
                onClick={() => setIsEditingOverrides(true)}
                className="text-[10px] bg-white hover:bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200 flex items-center gap-1 cursor-pointer font-bold shadow-sm transition-colors"
              >
                ✏️ Ajustar Manualmente
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsEditingOverrides(false)}
                  className="text-[10px] bg-white text-slate-500 border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOverrides}
                  className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded shadow-sm cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total de Juros Recebidos */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-450 block mb-1">JUROS QUE ESSE CLIENTE JÁ ME PAGOU:</span>
              {isEditingOverrides ? (
                <div className="flex items-center mt-1 border border-blue-400 bg-white p-1 rounded">
                  <span className="text-slate-800 text-sm font-semibold mr-1">R$</span>
                  <input
                    type="number"
                    value={tempInterestPaid}
                    onChange={(e) => setTempInterestPaid(Math.max(0, Number(e.target.value)))}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none text-base w-full"
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold font-sans text-emerald-600 font-mono">
                  {formatCurrency(client.manualInterestPaidTotal)}
                </span>
              )}
              <span className="text-[10px] text-slate-400 block mt-1.5">Este montante é o seu lucro acumulado sobre este devedor.</span>
            </div>

            {/* Saldo Devedor Atual */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-450 block mb-1">SALDO DEVEDOR ATUAL (RESTANTE DO PRINCIPAL):</span>
                <span className="mb-1">{getStatusBadge(client.interestPaidStatus)}</span>
              </div>
              {isEditingOverrides ? (
                <div className="flex items-center mt-1 border border-blue-400 bg-white p-1 rounded">
                  <span className="text-slate-800 text-sm font-semibold mr-1">R$</span>
                  <input
                    type="number"
                    value={tempOutstanding}
                    onChange={(e) => setTempOutstanding(Math.max(0, Number(e.target.value)))}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none text-base w-full"
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold font-sans text-slate-900 font-mono">
                  {formatCurrency(client.manualOutstandingBalance)}
                </span>
              )}
              <span className="text-[10px] text-slate-400 block mt-1.5">
                Fórmula: {formatCurrency(client.initialLoan)} (Inicial) - Amortizações.
              </span>
            </div>
          </div>
        </div>

        {/* ESPAÇO EXCLUSIVO PARA RECEBIMENTO DE APENAS JUROS */}
        {client.manualOutstandingBalance > 0 && (
          <div id="quick-interest-box" className="bg-emerald-50/70 border border-emerald-250 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-lg shrink-0">
                  💸
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">Espaço de Recebimento de Juros (Ciclo Atual)</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    O devedor pagou <strong>apenas os juros</strong> de <strong className="font-bold text-emerald-900">{client.interestRate}%</strong> combinados, mantendo o saldo devedor principal?
                  </p>
                </div>
              </div>
              <div className="shrink-0 font-mono text-left sm:text-right text-xs bg-white/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Juros Esperados do Ciclo:</span>
                <span className="text-base font-extrabold text-emerald-700">{formatCurrency(client.manualOutstandingBalance * (client.interestRate / 100))}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-emerald-200/50">
              <button
                type="button"
                onClick={() => {
                  const targetInterest = client.manualOutstandingBalance * (client.interestRate / 100);
                  const confirmMsg = `Confirmar recebimento de JUROS no valor de ${formatCurrency(targetInterest)} para o cliente "${client.name}"?\n\n- Esse valor será somado nos juros recebidos.\n- O status atual será alterado para PAGO.\n- O saldo devedor continua em ${formatCurrency(client.manualOutstandingBalance)}.`;
                  if (!confirm(confirmMsg)) return;

                  const newPayment: Payment = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split('T')[0],
                    amount: targetInterest,
                    type: 'juros',
                    notes: `Recebeu apenas os juros do ciclo (${client.interestRate}% ${client.interestPeriod === 'mensal' ? 'mensal' : client.interestPeriod === 'semanal' ? 'semanal' : 'diário'})`,
                  };

                  onUpdateClient({
                    ...client,
                    payments: [newPayment, ...client.payments],
                    interestPaidStatus: 'pago',
                    manualInterestPaidTotal: client.manualInterestPaidTotal + targetInterest,
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.01]"
              >
                ⚡ Registrar Recebimento de {formatCurrency(client.manualOutstandingBalance * (client.interestRate / 100))} (Sem mexer no Principal)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const targetInterest = client.manualOutstandingBalance * (client.interestRate / 100);
                  setPayAmount(targetInterest);
                  setPayType('juros');
                  setPayNotes(`Pagamento referente apenas aos juros das taxas combinadas`);
                  setShowAddPayment(true);
                  setTimeout(() => {
                    document.getElementById('add-payment-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 120);
                }}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                ✏️ Outro Valor / Personalizar Data
              </button>
            </div>
          </div>
        )}

        {/* HISTÓRICO DE PAGAMENTO */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Histórico de Pagamentos Lançados
            </h4>
            <button
              onClick={() => setShowAddPayment(!showAddPayment)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Lançamento
            </button>
          </div>

          {/* NOVO PAGAMENTO FORM (POP-IN PANEL) */}
          {showAddPayment && (
            <form id="add-payment-form" onSubmit={handleAddPaymentSubmit} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold text-blue-600 block uppercase">Lançar Novo Pagamento / Amortização</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold block">Data</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-500 uppercase font-bold block">Valor Recebido (R$)</label>
                    {client.manualOutstandingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayAmount(client.manualOutstandingBalance * (client.interestRate / 100));
                          setPayType('juros');
                        }}
                        className="text-[9px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        title="Usar valor do juros atual deste ciclo"
                      >
                        Usar Juros ({formatCurrency(client.manualOutstandingBalance * (client.interestRate / 100))})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="0.00"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold block">Destinação do Pagamento</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as PaymentType)}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="juros">💵 Apenas Juros</option>
                    <option value="principal">📉 Amortização (Abater Principal)</option>
                    <option value="ambos">🔄 Ambos (Juros + Amortização)</option>
                    <option value="outro">📁 Outro / Taxas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold block">Observações / Detalhes</label>
                <input
                  type="text"
                  placeholder="Ex: Transferido via Pix pelo banco X, ou quitou juros da semana 2"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* AUTOMATIC UPDATE OPT-IN CHEXBOX */}
              <div className="flex items-center gap-2 py-1 text-xs">
                <input
                  type="checkbox"
                  id="autoAdjust"
                  checked={autoAdjust}
                  onChange={(e) => setAutoAdjust(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer bg-white"
                />
                <label htmlFor="autoAdjust" className="text-slate-600 cursor-pointer select-none">
                  Ajustar automaticamente o <strong>Saldo Devedor / Juros Pagos</strong> do cliente com este valor
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="text-[10px] bg-white border border-slate-250 text-slate-500 px-3 py-1 rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1 rounded shadow-sm cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          )}

          {/* LOG TIMELINE LIST */}
          {client.payments.length === 0 ? (
            <div className="bg-slate-50 rounded-xl py-6 px-4 border border-slate-200 text-center text-xs text-slate-400">
              Nenhum pagamento ou amortização foi lançado para este cliente ainda.
              <p className="mt-1 text-[11px] text-slate-450">Use o botão acima para cadastrar recebimentos e histórico.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 pl-4 space-y-4 ml-2">
              {client.payments.map((payment) => (
                <div key={payment.id} className="relative group">
                  {/* Point icon */}
                  <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    payment.type === 'juros' 
                    ? 'bg-amber-400' 
                    : payment.type === 'principal' 
                    ? 'bg-emerald-400' 
                    : 'bg-blue-400'
                  }`} />
                  
                  <div className="bg-white rounded-lg p-3 border border-slate-200 flex justify-between items-center gap-4 hover:border-slate-350 transition-colors shadow-sm">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {new Date(payment.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono font-bold ${
                          payment.type === 'juros'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : payment.type === 'principal'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : payment.type === 'ambos'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {payment.type === 'juros' && '💵 Só Juros'}
                          {payment.type === 'principal' && '📉 Amortização'}
                          {payment.type === 'ambos' && '🔄 Juros + Amort.'}
                          {payment.type === 'outro' && '📁 Outro'}
                        </span>
                        <span className="text-sm font-bold text-slate-900 font-sans">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      {payment.notes && (
                        <p className="text-slate-600 bg-slate-50 p-1.5 rounded text-[11px] font-mono border border-slate-100">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                    {paymentIdToConfirmDelete === payment.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-red-600 font-bold max-w-[80px] leading-tight text-right">Excluir?</span>
                        <button
                          onClick={() => {
                            handleDeletePayment(payment.id);
                            setPaymentIdToConfirmDelete(null);
                          }}
                          className="bg-red-600 hover:bg-red-750 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all shadow-sm"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setPaymentIdToConfirmDelete(null)}
                          className="bg-slate-200 hover:bg-slate-350 text-slate-700 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-all border border-slate-300"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPaymentIdToConfirmDelete(payment.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors rounded hover:bg-slate-100 opacity-100 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Deletar lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTAS GERAIS CASO */}
        {client.notes && (
          <div className="bg-amber-50/60 rounded-lg p-3.5 border border-amber-200 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Histórico de Cobrança / Garantias / Anotações do Caso:</span>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "{client.notes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
