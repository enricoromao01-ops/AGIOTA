/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Client } from './types';
import { INITIAL_CLIENTS } from './mockData';
import { DashboardStats } from './components/DashboardStats';
import { ClientForm } from './components/ClientForm';
import { ClientDetails } from './components/ClientDetails';
import { 
  Search, Plus, UserPlus, Filter, ShieldCheck, Download, Upload, 
  RefreshCw, TrendingUp, HelpCircle, DollarSign, Calculator, Percent,
  MessageCircle, Bell, X, Check, Trash2, AlertTriangle, Lock, LogOut, Key
} from 'lucide-react';

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pago' | 'pendente' | 'atrasado'>('todos');
  const [sortBy, setSortBy] = useState<'name' | 'outstanding' | 'rate'>('name');
  
  // Modes: 'view' | 'add' | 'edit'
  const [panelMode, setPanelMode] = useState<'view' | 'add' | 'edit'>('view');

  // Quick Loan Simulator State for idle screen
  const [simLoan, setSimLoan] = useState<number>(1000);
  const [simRate, setSimRate] = useState<number>(10);
  const [simTime, setSimTime] = useState<number>(3); // original cycles

  // WhatsApp integration state
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);
  const [myWhatsapp, setMyWhatsapp] = useState(() => {
    return localStorage.getItem('agiota_my_whatsapp') || '';
  });
  const [defaultMessageTemplate, setDefaultMessageTemplate] = useState(() => {
    return localStorage.getItem('agiota_msg_template') || 
      'Olá *{nome}*, passando para lembrar do juro pactuado de *{taxa}%* ({periodo}) referente ao empréstimo com saldo devedor atual de *{saldo_devedor}*. O valor devido do ciclo de juros atual é de *{valor_ciclo_juros}*. Você pode nos transferir por Pix. Obrigado!';
  });

  // Authenticated Session State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('agiota_logged_in') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom system username/password stored in localStorage
  const [systemUser, setSystemUser] = useState(() => {
    return localStorage.getItem('system_auth_user') || 'admin';
  });
  const [systemPass, setSystemPass] = useState(() => {
    return localStorage.getItem('system_auth_pass') || 'admin';
  });

  // Password alteration states
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [newSystemUser, setNewSystemUser] = useState(systemUser);
  const [newSystemPass, setNewSystemPass] = useState(systemPass);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');

  // Custom Confirmation Modals states
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string } | null>(null);

  // State utility for currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Load clients from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('agiota_clients_v1');
    if (cached) {
      try {
        setClients(JSON.parse(cached));
      } catch (e) {
        setClients(INITIAL_CLIENTS);
      }
    } else {
      setClients(INITIAL_CLIENTS);
      localStorage.setItem('agiota_clients_v1', JSON.stringify(INITIAL_CLIENTS));
    }
  }, []);

  // Sync clients to localStorage when edited
  const saveAndSyncClients = (updatedList: Client[]) => {
    setClients(updatedList);
    localStorage.setItem('agiota_clients_v1', JSON.stringify(updatedList));
  };

  // Create or Update Client
  const handleSaveClient = (clientData: Omit<Client, 'id' | 'payments'> & { id?: string }) => {
    if (clientData.id) {
      // Edit mode
      const updated = clients.map((c) => {
        if (c.id === clientData.id) {
          return {
            ...c,
            ...clientData,
          };
        }
        return c;
      });
      saveAndSyncClients(updated);
      setSelectedClientId(clientData.id);
    } else {
      // Create mode
      const newClient: Client = {
        ...clientData,
        id: Math.random().toString(36).substr(2, 9),
        payments: [],
      };
      const updated = [newClient, ...clients];
      saveAndSyncClients(updated);
      setSelectedClientId(newClient.id);
    }
    setPanelMode('view');
  };

  // Send WhatsApp Reminder Link URL
  const handleSendWhatsAppReminder = (client: Client) => {
    const rawNumber = client.phone ? client.phone.replace(/\D/g, '') : '';
    if (!rawNumber) {
      setCustomAlert({
        title: 'Número Ausente',
        message: `⚠️ Erro: O devedor "${client.name}" não possui um número de telefone celular cadastrado no perfil.`
      });
      return;
    }
    
    // Auto calculate interest due for the cycle
    const cycleInterest = client.manualOutstandingBalance * (client.interestRate / 100);
    const cycleInterestFormatted = formatCurrency(cycleInterest);
    const outstandingFormatted = formatCurrency(client.manualOutstandingBalance);
    const initialLoanFormatted = formatCurrency(client.initialLoan);

    const message = defaultMessageTemplate
      .replace(/{nome}/g, client.name)
      .replace(/{taxa}/g, String(client.interestRate))
      .replace(/{periodo}/g, client.interestPeriod)
      .replace(/{saldo_devedor}/g, outstandingFormatted)
      .replace(/{valor_ciclo_juros}/g, cycleInterestFormatted)
      .replace(/{emprestimo_inicial}/g, initialLoanFormatted);

    const cleanPhone = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
    const uri = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(uri, '_blank');
  };

  // Delete client
  const handleDeleteClient = (id: string) => {
    const target = clients.find((c) => c.id === id);
    if (!target) return;
    setClientToDelete(target);
  };

  const confirmDeleteClient = (id: string) => {
    const updated = clients.filter((c) => c.id !== id);
    saveAndSyncClients(updated);
    if (selectedClientId === id) {
      setSelectedClientId(null);
    }
    setClientToDelete(null);
  };

  // Quick utility to clear database or load defaults
  const handleRestoreDefaults = () => {
    setShowRestoreConfirm(true);
  };

  // Auth & Security Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser.trim().toLowerCase() === systemUser.trim().toLowerCase() && loginPass === systemPass) {
      setIsLoggedIn(true);
      sessionStorage.setItem('agiota_logged_in', 'true');
      setLoginError('');
      setLoginUser('');
      setLoginPass('');
    } else {
      setLoginError('❌ Usuário ou senha incorretos. Verifique os dados inseridos e tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('agiota_logged_in');
  };

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSystemUser.trim() || !newSystemPass.trim()) {
      setCustomAlert({
        title: 'Campos Vazios',
        message: 'O usuário e a senha de acesso não podem ficar em branco.'
      });
      return;
    }
    setSystemUser(newSystemUser.trim());
    setSystemPass(newSystemPass);
    localStorage.setItem('system_auth_user', newSystemUser.trim());
    localStorage.setItem('system_auth_pass', newSystemPass);
    setSecuritySuccessMsg('Credenciais de acesso atualizadas com sucesso!');
    setTimeout(() => {
      setSecuritySuccessMsg('');
      setIsSecurityModalOpen(false);
    }, 1800);
  };

  // Export current list to a JSON file (essential for manual control backup)
  const handleExportData = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = `agiota_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
  };

  // Import JSON list from a backup file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsedData)) {
          saveAndSyncClients(parsedData);
          setSelectedClientId(null);
          setPanelMode('view');
          setCustomAlert({
            title: 'Backup Importado',
            message: 'Sua lista de clientes foi restaurada com sucesso a partir do arquivo!'
          });
        } else {
          setCustomAlert({
            title: 'Backup Inválido',
            message: '⚠️ Arquivo de backup inválido. O arquivo deve conter uma lista JSON de clientes válida.'
          });
        }
      } catch (err) {
        setCustomAlert({
          title: 'Erro de Leitura',
          message: '⚠️ Não foi possível ler o arquivo JSON de backup fornecido.'
        });
      }
    };
    fileReader.readAsText(targetFile);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Filtering Logic
  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      statusFilter === 'todos' || 
      client.interestPaidStatus === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // Sorting Logic
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'outstanding') {
      return b.manualOutstandingBalance - a.manualOutstandingBalance;
    }
    if (sortBy === 'rate') {
      return b.interestRate - a.interestRate;
    }
    return 0;
  });

  // formatCurrency is defined at the top of the component to support hoisting

  // simulator calculations
  const simInterestEarned = simLoan * (simRate / 100) * simTime;
  const simTotalReturn = simLoan + simInterestEarned;

  // If not logged in, render the login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Ambient background glow elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full z-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex w-16 h-16 bg-slate-800 rounded-2xl items-center justify-center border border-slate-700 shadow-xl text-emerald-400">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">GESTÃO DE CARTEIRA</h2>
              <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">Painel de Controle Financeiro</p>
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-200">Acesso Restrito</h3>
              <p className="text-xs text-slate-400">Insira suas credenciais para gerenciar devedores e cobranças.</p>
            </div>

            {loginError && (
              <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-xs p-3.5 rounded-xl font-medium tracking-wide leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Usuário</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Seu usuário"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 cursor-pointer font-bold focus:outline-none text-right"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Key className="w-4 h-4" /> Entrar no Sistema
              </button>
            </form>
          </div>

          {/* Callout box showing default credentials safely to avoid blocking */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">💡 Credenciais Padrão do Sistema</p>
            <p className="font-mono text-[11px]">
              Usuário: <span className="text-emerald-400 font-bold">admin</span> | Senha: <span className="text-emerald-400 font-bold">admin</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Você pode alterar essas credenciais a qualquer momento no painel de controle após realizar o acesso.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 pb-12">
      {/* HEADER DECK */}
      <header className="bg-[#1e293b] text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
              $
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                SISTEMA DE GESTÃO DE CARTEIRA <span className="text-emerald-400 text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700">V.2.4 VIP</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">Controle de Empréstimos, Juros e Amortização de Clientes</p>
            </div>
          </div>

          {/* BACKUP & UTILITIES SECTION */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsWhatsappOpen(true)}
              title="Cadastrar meu WhatsApp e disparar lembretes"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded border border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer font-bold shadow-sm"
              id="btn-whatsapp-cobrar"
            >
              <MessageCircle className="w-3.5 h-3.5 text-white" /> Lembretes WhatsApp
            </button>
            <button
              onClick={handleExportData}
              title="Baixar backup no computador"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 rounded border border-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Dados
            </button>
            <label
              title="Carregar backup existente"
              className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-750 rounded border border-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" /> Importar Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            <button
              onClick={handleRestoreDefaults}
              title="Carregar devedores demonstrativos"
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-400 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setNewSystemUser(systemUser);
                setNewSystemPass(systemPass);
                setSecuritySuccessMsg('');
                setIsSecurityModalOpen(true);
              }}
              title="Configurar credenciais de segurança do sistema"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-500 rounded transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <Lock className="w-3.5 h-3.5" /> Senha
            </button>
            <button
              onClick={handleLogout}
              title="Sair do sistema com segurança"
              className="px-2.5 py-1.5 bg-red-650 hover:bg-red-700 border border-red-600 text-white rounded transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* BODY WORKSPACE */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <DashboardStats clients={clients} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CLIENT LISTING (5 / 12 width) */}
          <section className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Clientes Cadastrados ({sortedClients.length})
                </h2>
                <button
                  id="btn-novo-cliente"
                  onClick={() => {
                    setSelectedClientId(null);
                    setPanelMode('add');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
                </button>
              </div>

              {/* SEARCH FIELD */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* TABS FILTROS DE STATUS DE JUROS */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Filtro de Juros Cobrados:</span>
                <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setStatusFilter('todos')}
                    className={`text-[10px] py-1 px-1 rounded transition-colors text-center cursor-pointer font-medium ${
                      statusFilter === 'todos' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setStatusFilter('pago')}
                    className={`text-[10px] py-1 px-1 rounded transition-colors text-center cursor-pointer font-medium ${
                      statusFilter === 'pago' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    Pagos
                  </button>
                  <button
                    onClick={() => setStatusFilter('pendente')}
                    className={`text-[10px] py-1 px-1 rounded transition-colors text-center cursor-pointer font-medium ${
                      statusFilter === 'pendente' ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200' : 'text-slate-500 hover:text-amber-700'
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    onClick={() => setStatusFilter('atrasado')}
                    className={`text-[10px] py-1 px-1 rounded transition-colors text-center cursor-pointer font-medium ${
                      statusFilter === 'atrasado' ? 'bg-red-100 text-red-800 font-bold border border-red-200' : 'text-slate-500 hover:text-red-700'
                    }`}
                  >
                    Atrasados
                  </button>
                </div>
              </div>

              {/* SORT CONTROLS */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono font-bold">
                <span>ORDENAÇÃO:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('name')}
                    className={`hover:text-blue-600 cursor-pointer ${sortBy === 'name' ? 'text-blue-600 font-bold underline' : ''}`}
                  >
                    Alfabética
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSortBy('outstanding')}
                    className={`hover:text-blue-600 cursor-pointer ${sortBy === 'outstanding' ? 'text-blue-600 font-bold underline' : ''}`}
                  >
                    Maior Dívida
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSortBy('rate')}
                    className={`hover:text-blue-600 cursor-pointer ${sortBy === 'rate' ? 'text-blue-600 font-bold underline' : ''}`}
                  >
                    Taxa (%)
                  </button>
                </div>
              </div>
            </div>

            {/* LIST OF CLIENTS CARDS */}
            {sortedClients.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm shadow-sm">
                Nenhum cliente encontrado com os filtros selecionados.
                <p className="text-xs text-slate-400 mt-2">Clique em "Novo Cliente" para cadastrar um empréstimo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedClients.map((client) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setPanelMode('view');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected 
                        ? 'bg-blue-50/80 border-l-4 border-blue-600 border-y-slate-200 border-r-slate-200 shadow-sm' 
                        : 'bg-white border-slate-200 hover:bg-slate-50/50 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {client.name}
                            {client.phone && <span className="text-[10px] text-slate-500 font-normal font-mono">{client.phone}</span>}
                          </h4>
                          {client.address && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              📍 {client.address}
                            </p>
                          )}
                        </div>
                        
                        {/* Status label badges */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          client.interestPaidStatus === 'pago'
                          ? 'bg-emerald-100 text-emerald-800'
                          : client.interestPaidStatus === 'pendente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {client.interestPaidStatus === 'pago' && 'EM DIA'}
                          {client.interestPaidStatus === 'pendente' && 'PENDENTE'}
                          {client.interestPaidStatus === 'atrasado' && 'EM ATRASO'}
                        </span>
                      </div>

                      {/* Financial info preview summary */}
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Saldo Devedor:</span>
                          <p className="font-bold text-slate-900 font-mono mt-0.5">{formatCurrency(client.manualOutstandingBalance)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Juros Já Pagos:</span>
                          <p className="font-bold text-emerald-600 font-mono mt-0.5">{formatCurrency(client.manualInterestPaidTotal)}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Taxa Pacto:</span>
                          <p className="font-bold text-slate-700 mt-0.5">
                            {client.interestRate}% <span className="text-[9px] text-slate-400 font-normal">({client.interestPeriod === 'mensal' ? 'M' : client.interestPeriod === 'semanal' ? 'S' : 'D'})</span>
                          </p>
                        </div>
                      </div>

                      {/* QUICK DELETE / WHATSAPP REMINDER ACTIONS */}
                      <div className="mt-2.5 flex justify-between items-center text-[10px] font-mono text-slate-450 border-t border-slate-100/60 pt-1.5 opacity-80 hover:opacity-100 transition-opacity">
                        <span>Empréstimo: {formatCurrency(client.initialLoan)}</span>
                        <div className="flex gap-2">
                          {(client.interestPaidStatus === 'pendente' || client.interestPaidStatus === 'atrasado') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsAppReminder(client);
                              }}
                              className="text-emerald-700 hover:underline transition-colors cursor-pointer font-bold flex items-center gap-0.5"
                              title="Disparar lembrete de juros no WhatsApp do devedor"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Cobrar {client.interestPaidStatus === 'atrasado' ? 'Atraso' : 'Juro'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(client.id);
                            }}
                            className="text-red-600 hover:underline transition-colors cursor-pointer font-semibold"
                          >
                            Remover Ficha
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: ACTION PANEL (7 / 12 width) */}
          <section className="lg:col-span-7">
            {panelMode === 'add' && (
              <ClientForm 
                onSave={handleSaveClient} 
                onCancel={() => setPanelMode('view')} 
              />
            )}

            {panelMode === 'edit' && selectedClient && (
              <ClientForm 
                client={selectedClient} 
                onSave={handleSaveClient} 
                onCancel={() => setPanelMode('view')} 
              />
            )}

            {panelMode === 'view' && selectedClient && (
              <ClientDetails 
                client={selectedClient} 
                onUpdateClient={(updated) => {
                  const updatedList = clients.map((c) => c.id === updated.id ? updated : c);
                  saveAndSyncClients(updatedList);
                }}
                onClose={() => setSelectedClientId(null)}
                onEditTrigger={() => setPanelMode('edit')}
                onDeleteClient={handleDeleteClient}
                onSendWhatsAppReminder={handleSendWhatsAppReminder}
              />
            )}

            {panelMode === 'view' && !selectedClient && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 text-slate-700 shadow-sm">
                <div className="text-center space-y-2">
                  <div className="inline-block bg-slate-100 p-4 rounded-full border border-slate-200 text-slate-700">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Manual e Painel de Operações</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Selecione uma ficha de devedor na lista à esquerda para analisar suas cobranças, amortizar valores, mudar o status de juros pagos ou inserir anotações.
                  </p>
                </div>

                {/* HELP CARD INSTRUCTIONS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Dicas de Cobrança e Funcionamento:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                    <li>
                      <strong className="text-slate-800">Ajuste Manual Livre:</strong> Ao abrir qualquer ficha, clique em "✏️ Ajustar Manualmente" nas caixas de valores atuais se quiser forçar qualquer montante direto.
                    </li>
                    <li>
                      <strong className="text-slate-800">Log de Amortização:</strong> Use o botão "Novo Lançamento" para cadastrar pagamentos de juros ou abates parciais do principal. O sistema autocalcula se habilitada a caixinha correspondente!
                    </li>
                    <li>
                      <strong className="text-slate-800">Backup Semanal:</strong> Salve sua base de dados clicando no botão <span className="text-emerald-600 font-bold">Exportar Dados</span> acima para segurança.
                    </li>
                  </ul>
                </div>

                {/* INTEREST QUICK SIMULATOR */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-250">
                  <h4 className="text-xs font-mono text-blue-600 uppercase tracking-wider block mb-3 font-bold flex items-center gap-1">
                    <Calculator className="w-4 h-4" /> Simulador Rápido de Empréstimos:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono block">Capital (R$)</label>
                      <input
                        type="number"
                        value={simLoan}
                        onChange={(e) => setSimLoan(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono block">Juros (%)</label>
                      <input
                        type="number"
                        value={simRate}
                        onChange={(e) => setSimRate(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-550 uppercase font-mono block">Ciclos / Meses</label>
                      <input
                        type="number"
                        value={simTime}
                        onChange={(e) => setSimTime(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="bg-white border border-slate-200 p-2 rounded">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Rendimento de Juros:</span>
                      <p className="font-bold text-slate-900 font-mono text-sm">{formatCurrency(simInterestEarned)}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-2 rounded">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Total a Receber:</span>
                      <p className="font-bold text-emerald-600 font-mono text-sm">{formatCurrency(simTotalReturn)}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </section>

        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="max-w-7xl mx-auto px-6 mt-8 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <div>CONEXÃO CRIPTOGRAFADA LOCAL</div>
        <div className="flex gap-4">
          <span>BACKUP: ATIVO</span>
          <span className="text-emerald-600 font-bold">● SISTEMA ONLINE</span>
        </div>
      </footer>

      {isWhatsappOpen && (
        <div id="modal-whatsapp" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#1e293b] text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-lg">Central de Cobrança WhatsApp</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Configure suas mensagens e lembretes de inadimplemento</p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsappOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                title="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              
              {/* MEU CELULAR SETTINGS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5 col-span-1 border-r-0 md:border-r border-slate-200/80 pr-0 md:pr-4">
                  <label className="text-xs font-bold text-slate-600 block">Meu Número WhatsApp (Cobrador)</label>
                  <input
                    type="text"
                    placeholder="Ex: 11999998888"
                    value={myWhatsapp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMyWhatsapp(val);
                      localStorage.setItem('agiota_my_whatsapp', val);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Insira somente números (DDD + celular). Salvo automaticamente.</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 col-span-1 h-fit">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">Canal de Origem Configurado</h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {myWhatsapp ? `+55 (${myWhatsapp.substring(0,2)}) ${myWhatsapp.substring(2)}` : 'Nenhum número cadastrado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* MESSAGE TEMPLATE */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 block">Modelo de Lembrete / Mensagem Padrão</label>
                  <button
                    type="button"
                    onClick={() => {
                      const def = 'Olá *{nome}*, passando para lembrar do juro pactuado de *{taxa}%* ({periodo}) referente ao empréstimo com saldo devedor atual de *{saldo_devedor}*. O valor devido do ciclo de juros atual é de *{valor_ciclo_juros}*. Você pode nos transferir por Pix. Obrigado!';
                      setDefaultMessageTemplate(def);
                      localStorage.setItem('agiota_msg_template', def);
                    }}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold"
                  >
                    Restaurar Padrão
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={defaultMessageTemplate}
                  onChange={(e) => {
                    setDefaultMessageTemplate(e.target.value);
                    localStorage.setItem('agiota_msg_template', e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-serif focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Placeholder legend */}
                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-1.5 text-[11px] text-indigo-900">
                  <span className="font-bold block text-[10px] text-indigo-950 uppercase tracking-wider">🏷️ Etiquetas de Atributos do Devedor:</span>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-1 font-mono text-[10px]">
                    <div><strong className="text-indigo-700">{`{nome}`}</strong>: Nome do devedor</div>
                    <div><strong className="text-indigo-700">{`{taxa}`}</strong>: Taxa (%)</div>
                    <div><strong className="text-indigo-700">{`{periodo}`}</strong>: mensal/semanal</div>
                    <div><strong className="text-indigo-700">{`{saldo_devedor}`}</strong>: Saldo devedor</div>
                    <div><strong className="text-indigo-700">{`{valor_ciclo_juros}`}</strong>: Juro estimado</div>
                    <div><strong className="text-indigo-700">{`{emprestimo_inicial}`}</strong>: Capital inicial</div>
                  </div>
                </div>
              </div>

              {/* ACTIVE DEBTORS ALERTS LIST (Me Lembrar de Cobrar) */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Bell className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-750">
                    Sua Lista de Lembrança de Cobrança ({clients.filter(c => c.interestPaidStatus !== 'pago').length} devedores)
                  </h4>
                </div>

                <p className="text-[11px] text-slate-500">
                  Os devedores abaixo estão com o status de juros marcado como <strong>Pendente</strong> ou <strong>Atrasado</strong>. Clique no botão de WhatsApp para disparar o texto customizado instantaneamente para eles.
                </p>

                {clients.filter(c => c.interestPaidStatus !== 'pago').length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-250 rounded-xl text-xs text-emerald-700 font-bold">
                    🎉 Excelente! Todos os clientes cadastrados encontram-se com os juros pagos (EM DIA)!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {clients.filter(c => c.interestPaidStatus !== 'pago').map((client) => {
                      const cycleInterest = client.manualOutstandingBalance * (client.interestRate / 100);
                      return (
                        <div key={client.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 gap-3 shadow-sm transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{client.name}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                client.interestPaidStatus === 'atrasado' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {client.interestPaidStatus === 'atrasado' ? 'ATRASADO (Cobrar!)' : 'PENDENTE'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-450 grid grid-cols-2 md:grid-cols-3 gap-x-2 font-mono">
                              <div>Juro Ciclo: <strong className="text-slate-700">{formatCurrency(cycleInterest)}</strong></div>
                              <div>Saldo Devedor: <strong className="text-slate-700">{formatCurrency(client.manualOutstandingBalance)}</strong></div>
                              {client.phone ? (
                                <div className="text-indigo-600 font-bold">📞 {client.phone}</div>
                              ) : (
                                <div className="text-red-500 font-semibold">[Sem Telefone]</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                handleSendWhatsAppReminder(client);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:scale-[1.02]"
                              title="Gerar e abrir envio de mensagem de cobrança no celular/web"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Enviar Cobrança
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsWhatsappOpen(false)}
                className="bg-slate-800 hover:bg-slate-950 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Fechar / Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLIENT DELETION CONFIRMATION */}
      {clientToDelete && (
        <div id="modal-confirm-delete" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-650 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Excluir Cliente</h3>
                <p className="text-xs text-slate-500 font-mono">Esta é uma ação irreversível</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-sm text-slate-700">
                Tem certeza que deseja apagar permanentemente todas as informações e o histórico de cobrança de <strong className="text-slate-950 font-bold">{clientToDelete.name}</strong>?
              </p>

              {clientToDelete.manualOutstandingBalance > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block text-amber-950 uppercase tracking-wide">⚠️ SALDO ATIVO PERMANECE:</span>
                  <p>
                    Este devedor possui um <strong>SALDO DEVEDOR ATRIBUÍDO</strong> de <strong className="font-bold underline">{formatCurrency(clientToDelete.manualOutstandingBalance)}</strong>!
                  </p>
                  <p className="mt-1 text-[11px] text-amber-805 leading-snug">
                    Ao confirmar a exclusão, todos os registros relacionados a esta dívida serão perdidos definitivamente.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-250 rounded-lg p-3 text-xs text-emerald-900 flex items-center gap-2">
                  <span>🎉</span>
                  <p>Esta ficha encontra-se 100% quitada (Saldo devedor totalmente pago)!</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDeleteClient(clientToDelete.id);
                }}
                className="bg-red-600 hover:bg-red-750 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                Sim, Excluir Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM RESTORE DEFAULTS */}
      {showRestoreConfirm && (
        <div id="modal-confirm-restore" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col p-6 space-y-4 font-sans">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Restaurar Exemplo Inicial</h3>
                <p className="text-xs text-slate-500 font-mono">Apagar banco de dados local</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              Deseja redefinir o sistema para os <strong>3 clientes exemplos padrão</strong>? 
              <span className="block mt-2 text-xs text-red-600 font-bold font-mono uppercase bg-red-50 p-2 rounded border border-red-100">
                ⚠️ Cuidado: Isso descartará definitivamente todos os registros atuais!
              </span>
            </p>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveAndSyncClients(INITIAL_CLIENTS);
                  setSelectedClientId(null);
                  setPanelMode('view');
                  setShowRestoreConfirm(false);
                }}
                className="bg-amber-650 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                Restaurar Base Exemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR CREDENCIAIS / ALTERAR SENHA */}
      {isSecurityModalOpen && (
        <div id="modal-security-settings" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col p-6 space-y-4 font-sans">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Segurança de Acesso</h3>
                <p className="text-xs text-slate-500 font-mono">Defina suas credenciais locais de login</p>
              </div>
            </div>

            {securitySuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-3 rounded-lg font-bold">
                ✓ {securitySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveSecuritySettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuário de Acesso</label>
                <input
                  type="text"
                  required
                  value={newSystemUser}
                  onChange={(e) => setNewSystemUser(e.target.value)}
                  placeholder="Ex: admin"
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nova Senha</label>
                <input
                  type="text"
                  required
                  value={newSystemPass}
                  onChange={(e) => setNewSystemPass(e.target.value)}
                  placeholder="Ex: 123456"
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">Guarde essa senha em local seguro para não perder o acesso ao sistema.</p>
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-650 hover:bg-amber-750 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM ALERT NOTIFICATION */}
      {customAlert && (
        <div id="modal-alert-notification" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col p-6 space-y-4 font-sans">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-650" />
              </div>
              <h3 className="font-bold text-base text-slate-900">{customAlert.title}</h3>
            </div>

            <p className="text-sm text-slate-705 leading-relaxed whitespace-pre-line">
              {customAlert.message}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                OK, Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
