import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, Printer, Download, Search, 
  Plus, Trash2, Edit, ShieldCheck, FileText, BarChart3, Calendar, 
  MapPin, UserCheck, RefreshCw, Check, AlertCircle, QrCode, Sparkles,
  ArrowRight, ShieldAlert, CheckSquare, Layers, HelpCircle, CreditCard, Lock, Unlock, UserCog, Radio, Activity
} from 'lucide-react';

export interface Participant {
  id: string;
  namaPenuh: string;
  noKp: string; // Nombor Kad Pengenalan (12 digit)
  email: string;
  jawatan: string;
  status: 'Hadir' | 'Belum Hadir';
  masaHadir?: string;
  nota?: string;
}

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: '1', namaPenuh: 'ALIZAH BINTI ABD SUILI', noKp: '800808125208', email: 'g-08232901@moe-dl.edu.my', jawatan: 'Guru Prasekolah (DG9)', status: 'Belum Hadir' },
  { id: '2', namaPenuh: 'ASNAH BINTI MD DANIL', noKp: '790929125478', email: 'g-78232902@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '3', namaPenuh: 'MOHD ZAHARI BIN TIBIN', noKp: '730401125977', email: 'g-77263791@moe-dl.edu.my', jawatan: 'Guru Besar (DG6)', status: 'Belum Hadir' },
  { id: '4', namaPenuh: 'NURTITAH BINTI MEMBUAI', noKp: '680807125966', email: 'g-6632911@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '5', namaPenuh: 'FAIRUZ @ SITI FAIRUZ BINTI ABD RAHMAN', noKp: '741008125106', email: 'g-06232904@moe-dl.edu.my', jawatan: 'Guru Penolong Kanan HEM (DG5)', status: 'Belum Hadir' },
  { id: '6', namaPenuh: 'DAYANG SABARIAH @ MILAH BINTI JOAS', noKp: '720817125330', email: 'g-30232903@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '7', namaPenuh: 'ROHIDAH @ NORIDAH BINTI MASLIN', noKp: '720708125366', email: 'g-6632912@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '8', namaPenuh: 'SARIPAH BINTI OMAR', noKp: '721113125046', email: 'g-46233078@moe-dl.edu.my', jawatan: 'Guru Pemulihan (DG5)', status: 'Belum Hadir' },
  { id: '9', namaPenuh: 'SITI HABIBAH BINTI TAIP', noKp: '820303125286', email: 'g-86233208@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '10', namaPenuh: 'NORADILAH BINTI RIBUT', noKp: '810929125238', email: 'g-38232909@moe-dl.edu.my', jawatan: 'Guru Pendidikan Islam (DG9)', status: 'Belum Hadir' },
  { id: '11', namaPenuh: 'NORMAWATI BINTI ISMAIL', noKp: '840406035740', email: 'g-40232910@moe-dl.edu.my', jawatan: 'Guru Pendidikan Islam (DG9)', status: 'Belum Hadir' },
  { id: '12', namaPenuh: 'SITI HAFIZAH BINTI DURAMAN', noKp: '820611125624', email: 'g-82061112@moe-dl.edu.my', jawatan: 'Pembantu Pengurusan Murid (N1)', status: 'Belum Hadir' },
  { id: '13', namaPenuh: 'KHAYSAR BIN MOHAMAD NOOR', noKp: '821124126181', email: 'g-81232906@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
  { id: '14', namaPenuh: 'MD HAFIZUDDIN BIN MADINI', noKp: '940317126657', email: 'g-94031712@moe-dl.edu.my', jawatan: 'Pembantu Khidmat Am (H1)', status: 'Belum Hadir' },
  { id: '15', namaPenuh: 'MIMI NUR SHAHERA BINTI HAMINUS', noKp: '970620016220', email: 'g-20510582@moe-dl.edu.my', jawatan: 'Guru Perpustakaan dan Media (DG9)', status: 'Belum Hadir' },
  { id: '16', namaPenuh: 'NOORLIANA ERDENAA BINTI MUSNIN', noKp: '970611125994', email: 'g-94575251@moe-dl.edu.my', jawatan: 'Guru Akademik (DG5)', status: 'Belum Hadir' },
];

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('sk_kepawa_jenazah_2026_participants_ic');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PARTICIPANTS;
  });

  // Role state: 'admin' (Mohd Zahari or Noradilah) vs 'user' (Participant / Public Scanner mode)
  const [roleMode, setRoleMode] = useState<'admin' | 'user'>(() => {
    return localStorage.getItem('sk_kepawa_role_mode') === 'user' ? 'user' : 'admin';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'live' | 'participants' | 'reports' | 'selfcheck'>(() => {
    return localStorage.getItem('sk_kepawa_role_mode') === 'user' ? 'scanner' : 'dashboard';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Hadir' | 'Belum Hadir'>('Semua');

  // Admin state: Admins are Mohd Zahari Bin Tibin & Noradilah Binti Ribut
  const [currentAdmin, setCurrentAdmin] = useState<Participant>(() => {
    const saved = localStorage.getItem('sk_kepawa_admin_ic');
    if (saved) {
      const found = participants.find(p => p.noKp === saved);
      if (found) return found;
    }
    return participants.find(p => p.noKp === '730401125977') || participants[0];
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Scanner state (IC number based)
  const [scanInput, setScanInput] = useState('');
  const [lastScanned, setLastScanned] = useState<Participant | null>(null);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    namaPenuh: '',
    noKp: '',
    jawatan: 'Guru Akademik (DG5)'
  });

  const [selectedParticipantForCard, setSelectedParticipantForCard] = useState<Participant | null>(null);

  // Cross-tab / cross-device live sync via localStorage events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sk_kepawa_jenazah_2026_participants_ic' && e.newValue) {
        try {
          setParticipants(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem('sk_kepawa_jenazah_2026_participants_ic', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('sk_kepawa_admin_ic', currentAdmin.noKp);
  }, [currentAdmin]);

  useEffect(() => {
    localStorage.setItem('sk_kepawa_role_mode', roleMode);
  }, [roleMode]);

  // Calculations
  const totalCount = participants.length;
  const hadirCount = participants.filter(p => p.status === 'Hadir').length;
  const belumHadirCount = totalCount - hadirCount;
  const attendanceRate = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 0;

  // Direct file download handler for PDF report
  const handleDownloadReportFile = () => {
    const reportHtml = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <title>Laporan Kehadiran Bengkel Pengurusan Jenazah SK Kepawa 2026</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #111; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
    h2, h3 { margin: 5px 0; }
    .stats { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 20px; text-align: center; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; }
    th { background-color: #e2e8f0; text-align: center; }
    .text-center { text-align: center; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <small><strong>JABATAN PENDIDIKAN NEGERI SABAH • SEKOLAH KEBANGSAAN KEPAWA (XBA6019)</strong></small>
    <h2>LAPORAN RASMI KEHADIRAN BENGKEL PENGURUSAN JENAZAH 2026</h2>
    <h3>Tarikh: 05 November 2026 | Tempat: Dewan Mini SK Kepawa</h3>
    <small>Tarikh Penjanaan: ${new Date().toLocaleDateString('ms-MY')}</small>
  </div>
  
  <div class="stats">
    <div><strong>Jumlah Staf:</strong> ${totalCount}</div>
    <div><strong>Hadir:</strong> ${hadirCount}</div>
    <div><strong>Peratus Kehadiran:</strong> ${attendanceRate}%</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px;">Bil</th>
        <th>No. Kad Pengenalan / Nama Penuh</th>
        <th>Jawatan (HRMIS)</th>
        <th class="text-center">Status</th>
        <th class="text-center">Masa Hadir</th>
      </tr>
    </thead>
    <tbody>
      ${participants.map((p, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${p.noKp}</strong><br>${p.namaPenuh}</td>
          <td>${p.jawatan}</td>
          <td class="text-center" style="font-weight: bold; color: ${p.status === 'Hadir' ? '#15803d' : '#b45309'};">${p.status}</td>
          <td class="text-center">${p.masaHadir || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      Disediakan Oleh:<br><br><br>
      <strong>NORADILAH BINTI RIBUT</strong><br>
      Penyelaras / Admin Bengkel SK Kepawa
    </div>
    <div>
      Disahkan Oleh:<br><br><br>
      <strong>MOHD ZAHARI BIN TIBIN</strong><br>
      Guru Besar, SK Kepawa
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kehadiran_SK_Kepawa_05_Nov_2026.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Scanner submission (by No. KP)
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toLowerCase();
    if (!query) return;

    // Search by exact No. KP, partial No. KP, or name
    const found = participants.find(p => 
      p.noKp.toLowerCase() === query || 
      p.noKp.toLowerCase().includes(query) ||
      p.namaPenuh.toLowerCase().includes(query)
    );

    if (found) {
      if (found.status === 'Hadir') {
        setScanMessage({
          type: 'warning',
          text: `⚠️ ${found.namaPenuh} (No. KP: ${found.noKp}) telah pun merekodkan kehadiran pada ${found.masaHadir}.`
        });
        setLastScanned(found);
      } else {
        const now = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const updated = participants.map(p => p.id === found.id ? { ...p, status: 'Hadir' as const, masaHadir: now } : p);
        setParticipants(updated);
        const updatedParticipant = { ...found, status: 'Hadir' as const, masaHadir: now };
        setLastScanned(updatedParticipant);
        setScanMessage({
          type: 'success',
          text: `✅ Berjaya! Kehadiran direkodkan untuk ${found.namaPenuh} (No. KP: ${found.noKp}) pada jam ${now}.`
        });
      }
    } else {
      setScanMessage({
        type: 'error',
        text: `❌ Nombor Kad Pengenalan atau nama "${scanInput}" tidak dijumpai dalam rekod HRMIS SK Kepawa 2026.`
      });
      setLastScanned(null);
    }
    setScanInput('');
  };

  // Quick toggle status
  const toggleStatus = (id: string) => {
    if (roleMode === 'user') {
      alert('Akses Terhad: Hanya Panel Admin (Mohd Zahari / Noradilah) sahaja dibenarkan menukar status secara manual.');
      return;
    }
    setParticipants(participants.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'Hadir' ? 'Belum Hadir' : 'Hadir';
        const now = newStatus === 'Hadir' ? new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : undefined;
        return { ...p, status: newStatus, masaHadir: now };
      }
      return p;
    }));
  };

  const deleteParticipant = (id: string) => {
    if (roleMode === 'user') return;
    if (confirm('Adakah anda pasti ingin memadam peserta ini?')) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const resetAllAttendance = () => {
    if (roleMode === 'user') return;
    if (confirm('⚠️ PERHATIAN: Adakah anda pasti ingin menetapkan semula SEMUA status kehadiran kepada Belum Hadir?')) {
      setParticipants(participants.map(p => ({ ...p, status: 'Belum Hadir', masaHadir: undefined })));
    }
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleMode === 'user') return;
    if (!newParticipant.namaPenuh || !newParticipant.noKp) {
      alert('Sila lengkapkan Nama Penuh dan Nombor Kad Pengenalan.');
      return;
    }
    const cleanIc = newParticipant.noKp.trim().replace(/\D/g, '');
    if (cleanIc.length < 8) {
      alert('Sila masukkan Nombor Kad Pengenalan yang sah.');
      return;
    }

    const newItem: Participant = {
      id: Date.now().toString(),
      namaPenuh: newParticipant.namaPenuh.toUpperCase(),
      noKp: cleanIc,
      email: `g-${cleanIc.substring(6)}@moe-dl.edu.my`,
      jawatan: newParticipant.jawatan,
      status: 'Belum Hadir'
    };

    setParticipants([newItem, ...participants]);
    setNewParticipant({ namaPenuh: '', noKp: '', jawatan: 'Guru Akademik (DG5)' });
    setIsAddModalOpen(false);
  };

  // Filtered participants
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.namaPenuh.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.noKp.includes(searchQuery) ||
                          p.jawatan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-emerald-900/40 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-900/30 overflow-hidden border border-emerald-500/30">
              <img 
                src="/assets/aistudio/Logo_Sekolah_Kebangsaan_Kepawa_Khaysar_Mohamad_Noor_f9b71c57.png" 
                alt="Logo SK Kepawa" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  roleMode === 'admin' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {roleMode === 'admin' ? `Admin: ${currentAdmin.namaPenuh}` : 'Mod Pengguna / Staf (Scan Sahaja)'}
                </span>
                <span className="text-slate-400 text-xs">05 Nov 2026</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Bengkel Pengurusan Jenazah Peringkat SK Kepawa 2026</span>
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Role switch toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => {
                  setRoleMode('admin');
                  setIsAdminModalOpen(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  roleMode === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Admin
              </button>
              <button
                onClick={() => {
                  setRoleMode('user');
                  setActiveTab('scanner');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  roleMode === 'user' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mod Scanner
              </button>
            </div>

            {roleMode === 'admin' && (
              <button 
                onClick={handleDownloadReportFile} 
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2">
            {[
              { id: 'dashboard', label: 'Dashboard Statistik', icon: BarChart3, adminOnly: true },
              { id: 'live', label: 'Live Monitoring 🔴', icon: Radio, adminOnly: true },
              { id: 'scanner', label: 'Scanner No. KP', icon: CreditCard, adminOnly: false },
              { id: 'participants', label: 'Senarai Peserta & Kehadiran', icon: Users, adminOnly: true },
              { id: 'selfcheck', label: 'Portal Semakan Kendiri', icon: UserCheck, adminOnly: false },
              { id: 'reports', label: 'Laporan & Cetakan PDF', icon: FileText, adminOnly: true },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = tab.adminOnly && roleMode === 'user';
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isLocked) {
                      alert('🔒 Akses Terhad: Tab ini hanya boleh diakses oleh Panel Admin (Mohd Zahari / Noradilah). Sila tukar ke Mod Panel Admin.');
                      return;
                    }
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                      : isLocked 
                      ? 'text-slate-600 cursor-not-allowed bg-slate-950/40' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-slate-500 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================== TAB: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && roleMode === 'admin' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Banner announcement */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/80 via-teal-900/60 to-slate-900 border border-emerald-700/40 p-6 sm:p-8 shadow-xl">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin: {currentAdmin.namaPenuh} ({currentAdmin.jawatan})</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Dashboard Kehadiran Dewan Mini SK Kepawa
                </h2>
                <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Pantau kehadiran warga SK Kepawa pada 05 November 2026 menggunakan No. KP rasmi mengikut pangkalan data HRMIS JPN Sabah.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setActiveTab('live')} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    Buka Live Monitoring
                  </button>
                  <button 
                    onClick={() => setActiveTab('reports')} 
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-2.5 rounded-xl text-sm transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Jana Laporan PDF Rasmi
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Staf (HRMIS)</p>
                <p className="text-3xl font-extrabold text-white mt-2">{totalCount}</p>
                <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
                  <span>Warga SK Kepawa (XBA6019)</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hadir (Checked-In)</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-2">{hadirCount}</p>
                <div className="mt-4 flex items-center text-xs text-emerald-400 font-medium">
                  <span>Selesai Imbas No. KP</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Hadir</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">{belumHadirCount}</p>
                <div className="mt-4 flex items-center text-xs text-amber-400 font-medium">
                  <span>Menunggu Ketibaan</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peratus Kehadiran</p>
                <p className="text-3xl font-extrabold text-teal-400 mt-2">{attendanceRate}%</p>
                <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Check-ins */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Workshop Info */}
              <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Maklumat Program</span>
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Calendar className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Tarikh Program</p>
                      <p className="text-slate-400 text-xs mt-0.5">05 November 2026 (Rabu)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Tempat Program</p>
                      <p className="text-slate-400 text-xs mt-0.5">Dewan Mini SK Kepawa</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <UserCog className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Pentadbir Bertugas</p>
                      <p className="text-emerald-300 text-xs mt-0.5 font-medium">{currentAdmin.namaPenuh}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">Tindakan Pantas Admin</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-medium transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Tambah Peserta Baru
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </button>
                    <button 
                      onClick={resetAllAttendance}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-red-950/30 text-red-300 border border-slate-800 hover:border-red-900/50 text-sm font-medium transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-red-400" />
                        Set Semula Kehadiran
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Checked-In List */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <span>Aktiviti Kehadiran Terkini</span>
                  </h3>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-medium border border-emerald-500/20">
                    {hadirCount} Staf Hadir
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
                  {participants.filter(p => p.status === 'Hadir').length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                      <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-300 font-medium">Tiada rekod kehadiran lagi hari ini.</p>
                      <p className="text-slate-500 text-xs mt-1">Sila gunakan Scanner No. KP untuk mula merekodkan kehadiran peserta.</p>
                    </div>
                  ) : (
                    participants
                      .filter(p => p.status === 'Hadir')
                      .sort((a, b) => (b.masaHadir || '').localeCompare(a.masaHadir || ''))
                      .map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-emerald-900/30 hover:border-emerald-700/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                              {p.namaPenuh.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{p.namaPenuh}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-xs text-emerald-400 font-mono">No. KP: {p.noKp}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-400">{p.jawatan}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              {p.masaHadir || 'Hadir'}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB: LIVE MONITORING ==================== */}
        {activeTab === 'live' && roleMode === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 animate-pulse"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-pulse">
                    <Radio className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Live Stream Kehadiran Dewan Mini</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mt-1">Pemantauan Langsung (Live Monitoring)</h2>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Status Kehadiran Semasa</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{hadirCount} / {totalCount} <span className="text-xs text-slate-400 font-normal">({attendanceRate}%)</span></p>
                </div>
              </div>

              {/* Big Screen Grid / Live Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recently Checked-In Live Stream */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Log Masuk Langsung (Real-Time Feed)</span>
                  </h3>

                  <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                    {participants.filter(p => p.status === 'Hadir').length === 0 ? (
                      <div className="text-center py-16 text-slate-500">
                        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-spin" />
                        <p className="text-slate-300 font-medium">Menunggu peserta mengesahkan kehadiran di pintu masuk...</p>
                      </div>
                    ) : (
                      participants
                        .filter(p => p.status === 'Hadir')
                        .sort((a, b) => (b.masaHadir || '').localeCompare(a.masaHadir || ''))
                        .map((p, idx) => (
                          <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            idx === 0 
                              ? 'bg-emerald-950/50 border-emerald-500/60 shadow-lg shadow-emerald-500/10 animate-bounce' 
                              : 'bg-slate-950/60 border-slate-800'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                {idx === 0 ? '🔥' : '✅'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{p.namaPenuh}</p>
                                <p className="text-xs font-mono text-emerald-400 mt-0.5">No. KP: {p.noKp} • {p.jawatan}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-mono font-bold border border-emerald-500/30">
                                {p.masaHadir}
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Staf Belum Hadir / Pending */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Staf Belum Hadir ({belumHadirCount})</span>
                  </h3>

                  <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                    {participants.filter(p => p.status === 'Belum Hadir').length === 0 ? (
                      <div className="text-center py-16 text-emerald-400 font-bold">
                        🎉 Tahniah! Semua 16 staf telah hadir!
                      </div>
                    ) : (
                      participants
                        .filter(p => p.status === 'Belum Hadir')
                        .map((p) => (
                          <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                                KP
                              </div>
                              <div>
                                <p className="font-semibold text-slate-200 text-sm">{p.namaPenuh}</p>
                                <p className="text-xs font-mono text-slate-400 mt-0.5">No. KP: {p.noKp} • {p.jawatan}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleStatus(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                            >
                              Tandakan Hadir
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SCANNER ==================== */}
        {activeTab === 'scanner' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>
              
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                <CreditCard className="w-8 h-8 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">Scanner Nombor Kad Pengenalan (No. KP)</h2>
              <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                Taip atau imbas Nombor Kad Pengenalan (12 digit, cth: <code className="text-emerald-400 font-mono">800808125208</code>) atau sebahagian nombor KP / nama untuk merekodkan kehadiran.
              </p>

              <form onSubmit={handleScanSubmit} className="mt-6 max-w-xl mx-auto">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input
                    ref={scanInputRef}
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Masukkan No. Kad Pengenalan (cth: 800808125208)..."
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-slate-500 text-base focus:outline-none shadow-inner transition-all font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Imbas</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Scan Message Alert */}
              {scanMessage && (
                <div className={`mt-6 p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  scanMessage.type === 'success' 
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200' 
                    : scanMessage.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                    : 'bg-red-950/60 border-red-700/60 text-red-200'
                }`}>
                  {scanMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {scanMessage.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                  {scanMessage.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{scanMessage.text}</p>
                  </div>
                </div>
              )}

              {/* Last Scanned Participant Preview Card */}
              {lastScanned && (
                <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {lastScanned.namaPenuh.substring(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
                        No. KP: {lastScanned.noKp}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{lastScanned.namaPenuh}</h4>
                      <p className="text-xs text-slate-400">{lastScanned.jawatan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Masa Kehadiran</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{lastScanned.masaHadir || 'Selesai'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick List of No. KP for testing in scanner */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Klik Cepat No. KP untuk Simulasi Scanner</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setScanInput(p.noKp);
                      if (scanInputRef.current) scanInputRef.current.focus();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-700/50 text-left transition-all group cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-white text-xs group-hover:text-emerald-300 transition-colors truncate max-w-[200px] sm:max-w-[220px]">{p.namaPenuh}</p>
                      <p className="text-xs font-mono text-emerald-400 mt-0.5">KP: {p.noKp}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      p.status === 'Hadir' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: PARTICIPANTS ==================== */}
        {activeTab === 'participants' && roleMode === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-xl font-bold text-white">Senarai Staf HRMIS SK Kepawa</h2>
                <p className="text-slate-400 text-sm mt-1">Urus kehadiran peserta berdasarkan Nombor Kad Pengenalan rasmi.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Peserta</span>
                </button>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, No. KP atau jawatan..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                {(['Semua', 'Hadir', 'Belum Hadir'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === status 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {status} ({status === 'Semua' ? totalCount : status === 'Hadir' ? hadirCount : belumHadirCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Participants Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-4 px-6">Bil</th>
                      <th className="py-4 px-6">No. KP / Nama Penuh</th>
                      <th className="py-4 px-6">Jawatan (HRMIS)</th>
                      <th className="py-4 px-6">Status Kehadiran</th>
                      <th className="py-4 px-6 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-500">
                          Tiada peserta dijumpai sepadan dengan carian.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-4 px-6 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-xs text-emerald-400 font-bold block">{p.noKp}</span>
                            <span className="font-semibold text-white block mt-0.5">{p.namaPenuh}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-300 text-xs">{p.jawatan}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              p.status === 'Hadir' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}>
                              {p.status === 'Hadir' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.status} {p.masaHadir && `(${p.masaHadir})`}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => toggleStatus(p.id)}
                                title={p.status === 'Hadir' ? 'Tukar kepada Belum Hadir' : 'Tukar kepada Hadir'}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                  p.status === 'Hadir'
                                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                                }`}
                              >
                                {p.status === 'Hadir' ? 'Batal Hadir' : 'Tandakan Hadir'}
                              </button>
                              <button
                                onClick={() => setSelectedParticipantForCard(p)}
                                title="Lihat Slip Pendaftaran Peserta"
                                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteParticipant(p.id)}
                                title="Padam Peserta"
                                className="p-1.5 rounded-lg bg-slate-950 text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: SELF CHECK-IN PORTAL ==================== */}
        {activeTab === 'selfcheck' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn py-4">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/30">
                <CreditCard className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white">Portal Semakan Kendiri No. KP</h2>
              <p className="text-slate-400 text-sm mt-2">
                Staf SK Kepawa boleh memasukkan Nombor Kad Pengenalan masing-masing di bawah untuk mengesahkan kehadiran ke Bengkel Pengurusan Jenazah pada 05 November 2026.
              </p>

              <form onSubmit={handleScanSubmit} className="mt-6 space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Nombor Kad Pengenalan (12 digit)</label>
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Cth: 800808125208..."
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl py-3.5 px-4 text-white font-mono text-base focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  <span>Sahkan Kehadiran Saya</span>
                </button>
              </form>

              {scanMessage && (
                <div className={`mt-6 p-4 rounded-xl border text-left flex items-start space-x-3 ${
                  scanMessage.type === 'success' 
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200' 
                    : scanMessage.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                    : 'bg-red-950/60 border-red-700/60 text-red-200'
                }`}>
                  {scanMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {scanMessage.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                  {scanMessage.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 text-sm font-medium">
                    {scanMessage.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: REPORTS & PDF PRINTING ==================== */}
        {activeTab === 'reports' && roleMode === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-lg print:hidden">
              <div>
                <h2 className="text-xl font-bold text-white">Laporan Rasmi Kehadiran HRMIS</h2>
                <p className="text-slate-400 text-sm mt-1">Muat turun fail laporan rasmi JPN Sabah / SK Kepawa dalam format PDF/HTML.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadReportFile}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Muat Turun Fail PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Terus</span>
                </button>
              </div>
            </div>

            {/* Printable Official KPM Report Card */}
            <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto print:shadow-none print:w-full print:p-0">
              
              {/* Header Official */}
              <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">JABATAN PENDIDIKAN NEGERI SABAH • SEKOLAH KEBANGSAAN KEPAWA (XBA6019)</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">LAPORAN RASMI KEHADIRAN BENGKEL PENGURUSAN JENAZAH 2026</h2>
                <h3 className="text-base font-bold text-emerald-800 mt-2">Tarikh: 05 November 2026 | Tempat: Dewan Mini SK Kepawa</h3>
                <p className="text-xs text-slate-500 mt-1">Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-100 p-4 rounded-xl border border-slate-300 text-center">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Jumlah Staf</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Hadir</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{hadirCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Peratus Kehadiran</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">{attendanceRate}%</p>
                </div>
              </div>

              {/* Table for PDF Report */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900">
                      <th className="border border-slate-400 p-2.5 text-center w-12">Bil</th>
                      <th className="border border-slate-400 p-2.5">NO. KAD PENGENALAN / NAMA PENUH</th>
                      <th className="border border-slate-400 p-2.5">JAWATAN (HRMIS)</th>
                      <th className="border border-slate-400 p-2.5 text-center">STATUS</th>
                      <th className="border border-slate-400 p-2.5 text-center">MASA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-400 p-2">
                          <span className="font-mono text-emerald-800 font-bold block">{p.noKp}</span>
                          <span className="font-bold text-slate-900 block">{p.namaPenuh}</span>
                        </td>
                        <td className="border border-slate-400 p-2">{p.jawatan}</td>
                        <td className="border border-slate-400 p-2 text-center font-semibold">
                          <span className={p.status === 'Hadir' ? 'text-emerald-700' : 'text-amber-700'}>
                            {p.status}
                          </span>
                        </td>
                        <td className="border border-slate-400 p-2 text-center font-mono">{p.masaHadir || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-300 text-xs">
                <div>
                  <p className="font-bold">Disediakan Oleh:</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 pt-1 inline-block min-w-[200px]">NORADILAH BINTI RIBUT</p>
                  <p className="text-slate-600">Penyelaras / Admin Bengkel SK Kepawa</p>
                </div>
                <div>
                  <p className="font-bold">Disahkan Oleh:</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-t border-slate-400 pt-1 inline-block min-w-[200px]">MOHD ZAHARI BIN TIBIN</p>
                  <p className="text-slate-600">Guru Besar, SK Kepawa</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ==================== ADMIN SWITCHER MODAL ==================== */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 border border-emerald-500/30">
              <UserCog className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Akses Panel Admin Dashboard</h3>
            <p className="text-slate-400 text-xs mb-6">Sila pilih akaun pentadbir rasmi SK Kepawa untuk membuka panel admin dan Live Monitoring.</p>

            <div className="space-y-3">
              {[
                { name: 'MOHD ZAHARI BIN TIBIN', ic: '730401125977', role: 'Guru Besar (Admin Utama)' },
                { name: 'NORADILAH BINTI RIBUT', ic: '810929125238', role: 'Guru Pendidikan Islam / Penyelaras (Admin)' }
              ].map((adm) => {
                const isSelected = currentAdmin.noKp === adm.ic;
                const participantObj = participants.find(p => p.noKp === adm.ic) || participants[0];
                return (
                  <button
                    key={adm.ic}
                    onClick={() => {
                      setCurrentAdmin(participantObj);
                      setRoleMode('admin');
                      setActiveTab('dashboard');
                      setIsAdminModalOpen(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected && roleMode === 'admin'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{adm.name}</p>
                      <p className="text-xs text-emerald-400 mt-0.5">{adm.role}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">No. KP: {adm.ic}</p>
                    </div>
                    {isSelected && roleMode === 'admin' && (
                      <span className="bg-emerald-500 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setRoleMode('user');
                  setActiveTab('scanner');
                  setIsAdminModalOpen(false);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
              >
                Tukar ke Mod Pengguna (Scanner Sahaja)
              </button>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD PARTICIPANT MODAL ==================== */}
      {isAddModalOpen && roleMode === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Tambah Peserta Baru</h3>
            <p className="text-slate-400 text-xs mb-6">Masukkan maklumat staf atau guru untuk Bengkel SK Kepawa 2026.</p>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Nama Penuh (Huruf Besar)</label>
                <input
                  type="text"
                  value={newParticipant.namaPenuh}
                  onChange={(e) => setNewParticipant({ ...newParticipant, namaPenuh: e.target.value })}
                  placeholder="Cth: AHMAD BIN ALI"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Nombor Kad Pengenalan (12 digit)</label>
                <input
                  type="text"
                  value={newParticipant.noKp}
                  onChange={(e) => setNewParticipant({ ...newParticipant, noKp: e.target.value })}
                  placeholder="Cth: 800808125208"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-white font-mono text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Jawatan (HRMIS)</label>
                <input
                  type="text"
                  value={newParticipant.jawatan}
                  onChange={(e) => setNewParticipant({ ...newParticipant, jawatan: e.target.value })}
                  placeholder="Cth: Guru Akademik (DG5)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 text-sm font-medium transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== PARTICIPANT ID CARD MODAL ==================== */}
      {selectedParticipantForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative">
            
            <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border border-emerald-500/30">
              <img 
                src="/assets/aistudio/Logo_Sekolah_Kebangsaan_Kepawa_Khaysar_Mohamad_Noor_f9b71c57.png" 
                alt="Logo SK Kepawa" 
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">HRMIS / SK KEPAWA 2026</p>
            <h3 className="text-lg font-bold text-white mt-1">SLIP PENGESAHAN KEHADIRAN</h3>

            <div className="my-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Nama Penuh</span>
                <p className="text-white font-bold text-sm">{selectedParticipantForCard.namaPenuh}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Nombor Kad Pengenalan</span>
                <p className="text-emerald-400 font-mono text-sm font-bold">{selectedParticipantForCard.noKp}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Jawatan HRMIS</span>
                <p className="text-slate-300 text-xs">{selectedParticipantForCard.jawatan}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
              <div className="w-32 h-32 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-mono p-2 text-center leading-relaxed">
                NO KP BARCODE:<br/>{selectedParticipantForCard.noKp}
              </div>
            </div>

            <div>
              <button
                onClick={() => setSelectedParticipantForCard(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all border border-slate-700 cursor-pointer"
              >
                Tutup Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-xs text-slate-500 print:hidden">
        <p>Sistem Rasmi Kehadiran Bengkel Pengurusan Jenazah Peringkat SK Kepawa 2026 • Pentadbir: {currentAdmin.namaPenuh}</p>
      </footer>

    </div>
  );
}
