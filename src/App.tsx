import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, Printer, Download, Search, 
  Plus, Trash2, Edit, ShieldCheck, FileText, BarChart3, Calendar, 
  MapPin, UserCheck, RefreshCw, Check, AlertCircle, QrCode, Sparkles,
  ArrowRight, ShieldAlert, CheckSquare, Layers, HelpCircle, CreditCard, Lock, Unlock, UserCog, Radio, Activity,
  AlertTriangle, X, LogOut, KeyRound, Eye, EyeOff, Timer
} from 'lucide-react';
import { db } from './firebase';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch 
} from 'firebase/firestore';

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

export const cleanJawatan = (j: string): string => {
  if (!j) return '';
  return j.replace(/\s*\(DG\d*\)/gi, '').trim();
};

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: '1', namaPenuh: 'ALIZAH BINTI ABD SUILI', noKp: '800808125208', email: 'g-08232901@moe-dl.edu.my', jawatan: 'Guru Prasekolah', status: 'Belum Hadir' },
  { id: '2', namaPenuh: 'ASNAH BINTI MD DANIL', noKp: '790929125478', email: 'g-78232902@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '3', namaPenuh: 'MOHD ZAHARI BIN TIBIN', noKp: '730401125977', email: 'g-77263791@moe-dl.edu.my', jawatan: 'Guru Besar', status: 'Belum Hadir' },
  { id: '4', namaPenuh: 'NURTITAH BINTI MEMBUAI', noKp: '680807125966', email: 'g-6632911@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '5', namaPenuh: 'FAIRUZ @ SITI FAIRUZ BINTI ABD RAHMAN', noKp: '741008125106', email: 'g-06232904@moe-dl.edu.my', jawatan: 'Guru Penolong Kanan HEM', status: 'Belum Hadir' },
  { id: '6', namaPenuh: 'DAYANG SABARIAH @ MILAH BINTI JOAS', noKp: '720817125330', email: 'g-30232903@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '7', namaPenuh: 'ROHIDAH @ NORIDAH BINTI MASLIN', noKp: '720708125366', email: 'g-6632912@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '8', namaPenuh: 'SARIPAH BINTI OMAR', noKp: '721113125046', email: 'g-46233078@moe-dl.edu.my', jawatan: 'Guru Pemulihan', status: 'Belum Hadir' },
  { id: '9', namaPenuh: 'SITI HABIBAH BINTI TAIP', noKp: '820303125286', email: 'g-86233208@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '10', namaPenuh: 'NORADILAH BINTI RIBUT', noKp: '810929125238', email: 'g-38232909@moe-dl.edu.my', jawatan: 'Guru Pendidikan Islam', status: 'Belum Hadir' },
  { id: '11', namaPenuh: 'NORMAWATI BINTI ISMAIL', noKp: '840406035740', email: 'g-40232910@moe-dl.edu.my', jawatan: 'Guru Pendidikan Islam', status: 'Belum Hadir' },
  { id: '12', namaPenuh: 'SITI HAFIZAH BINTI DURAMAN', noKp: '820611125624', email: 'g-82061112@moe-dl.edu.my', jawatan: 'Pembantu Pengurusan Murid (N1)', status: 'Belum Hadir' },
  { id: '13', namaPenuh: 'KHAYSAR BIN MOHAMAD NOOR', noKp: '821124126181', email: 'g-81232906@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
  { id: '14', namaPenuh: 'MD HAFIZUDDIN BIN MADINI', noKp: '940317126657', email: 'g-94031712@moe-dl.edu.my', jawatan: 'Pembantu Khidmat Am (H1)', status: 'Belum Hadir' },
  { id: '15', namaPenuh: 'MIMI NUR SHAHERA BINTI HAMINUS', noKp: '970620016220', email: 'g-20510582@moe-dl.edu.my', jawatan: 'Guru Perpustakaan dan Media', status: 'Belum Hadir' },
  { id: '16', namaPenuh: 'NOORLIANA ERDENAA BINTI MUSNIN', noKp: '970611125994', email: 'g-94575251@moe-dl.edu.my', jawatan: 'Guru Akademik', status: 'Belum Hadir' },
];

// Target Unlock: 05 November 2026, 6:30 AM (MYT GMT+8)
export const TARGET_UNLOCK_DATE = new Date('2026-11-05T06:30:00+08:00');

// Authorized Admins who have 24/7 unlimited access at any time
export const AUTHORIZED_ADMIN_ICS = ['730401125977', '810929125238'];

export const getCountdown = (now: Date) => {
  const diffMs = TARGET_UNLOCK_DATE.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { isUnlocked: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / (3600 * 24));
  const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { isUnlocked: false, days, hours, minutes, seconds };
};

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem('sk_kepawa_attendance_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) }));
        }
      }
    } catch (e) {}
    return DEFAULT_PARTICIPANTS;
  });

  // Role state: 'admin' (Mohd Zahari or Noradilah) vs 'user' (Guru / Staf - Isi Kehadiran Sahaja)
  const [roleMode, setRoleMode] = useState<'admin' | 'user'>(() => {
    return localStorage.getItem('sk_kepawa_role_mode') === 'admin' ? 'admin' : 'user';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'live' | 'participants' | 'reports'>(() => {
    return localStorage.getItem('sk_kepawa_role_mode') === 'admin' ? 'dashboard' : 'scanner';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Hadir' | 'Belum Hadir'>('Semua');

  // Real-time ticking clock for Date/Time Lock
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Admin state: Admins are Mohd Zahari Bin Tibin & Noradilah Binti Ribut
  const [currentAdmin, setCurrentAdmin] = useState<Participant>(() => {
    const saved = localStorage.getItem('sk_kepawa_admin_ic');
    const initialList = (() => {
      try {
        const s = localStorage.getItem('sk_kepawa_attendance_data');
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) }));
          }
        }
      } catch (e) {}
      return DEFAULT_PARTICIPANTS;
    })();
    const targetIc = saved || '730401125977';
    return initialList.find((p: Participant) => p.noKp === targetIc) || initialList[2] || initialList[0];
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedAdminCandidateIc, setSelectedAdminCandidateIc] = useState('730401125977');
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [showAdminPin, setShowAdminPin] = useState(false);
  
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
    jawatan: 'Guru Akademik'
  });

  const [selectedParticipantForCard, setSelectedParticipantForCard] = useState<Participant | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [toastNotification, setToastNotification] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; message: string } | null>(null);
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // 1-second live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin Verification: Admins Mohd Zahari & Noradilah can open system AT ANY TIME
  const isAdminActive = roleMode === 'admin' && AUTHORIZED_ADMIN_ICS.includes(currentAdmin.noKp);
  const countdown = getCountdown(currentTime);
  const isSystemUnlocked = isAdminActive || countdown.isUnlocked;

  // Fetch participants from server API (Live Cloud Sync with local fallback)
  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/participants');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const cleaned = data.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) }));
          setParticipants(cleaned);
          localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(cleaned));
          const savedAdminIc = localStorage.getItem('sk_kepawa_admin_ic') || '730401125977';
          const foundAdmin = cleaned.find((p: Participant) => p.noKp === savedAdminIc) || cleaned[2] || cleaned[0];
          if (foundAdmin) setCurrentAdmin(foundAdmin);
        }
      }
    } catch (e) {
      // Running on static hosting like Netlify (fallback safely)
    }
  };

  useEffect(() => {
    fetchParticipants();

    // Real-time multi-device cloud synchronization via Firebase Firestore
    let unsubscribe = () => {};
    try {
      const colRef = collection(db, 'participants');
      unsubscribe = onSnapshot(colRef, async (snapshot) => {
        if (snapshot.empty) {
          try {
            const batch = writeBatch(db);
            DEFAULT_PARTICIPANTS.forEach(p => {
              const ref = doc(db, 'participants', p.id);
              batch.set(ref, p);
            });
            await batch.commit();
          } catch (e) {
            console.warn("Notice: Firestore seeding:", e);
          }
        } else {
          const loaded: Participant[] = [];
          snapshot.forEach(docSnap => {
            const item = docSnap.data() as Participant;
            loaded.push({ ...item, jawatan: cleanJawatan(item.jawatan) });
          });
          // Sort by ID 1..16
          loaded.sort((a, b) => Number(a.id) - Number(b.id));
          setParticipants(loaded);
          localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(loaded));

          // Auto-clean any records in Firestore that still have (DG...)
          const dirtyDocs = snapshot.docs.filter(docSnap => {
            const j = (docSnap.data() as Participant).jawatan || '';
            return j.includes('DG');
          });
          if (dirtyDocs.length > 0) {
            try {
              const batch = writeBatch(db);
              dirtyDocs.forEach(docSnap => {
                const currentJawatan = (docSnap.data() as Participant).jawatan;
                batch.update(docSnap.ref, { jawatan: cleanJawatan(currentJawatan) });
              });
              batch.commit().catch(e => console.warn("Firestore jawatan cleanup:", e));
            } catch (e) {}
          }

          const savedAdminIc = localStorage.getItem('sk_kepawa_admin_ic') || '730401125977';
          const foundAdmin = loaded.find(p => p.noKp === savedAdminIc) || loaded[2] || loaded[0];
          if (foundAdmin) setCurrentAdmin(foundAdmin);
        }
      }, (err) => {
        console.warn("Firestore live sync notice:", err);
      });
    } catch (e) {
      console.warn("Firestore initialization notice:", e);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('sk_kepawa_admin_ic', currentAdmin.noKp);
  }, [currentAdmin]);

  useEffect(() => {
    localStorage.setItem('sk_kepawa_role_mode', roleMode);
  }, [roleMode]);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Strict RBAC: Non-admin users are strictly restricted to the attendance check-in tab
  useEffect(() => {
    if (roleMode === 'user' && activeTab !== 'scanner') {
      setActiveTab('scanner');
    }
  }, [roleMode, activeTab]);

  // Admin authentication handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);

    const pin = adminPinInput.trim();
    if (!pin) {
      setAdminAuthError('Sila masukkan PIN keselamatan pentadbir.');
      return;
    }

    // Allowed PIN: strictly XBA6019 (Kod Sekolah SK Kepawa)
    const isValid = pin.toUpperCase() === 'XBA6019';

    if (!isValid) {
      setAdminAuthError('PIN Keselamatan tidak sah. Sila masukkan Kod PIN Pentadbir SK Kepawa yang betul.');
      return;
    }

    const matchedAdmin = participants.find(p => p.noKp === selectedAdminCandidateIc) || 
      (selectedAdminCandidateIc === '730401125977' ? participants[2] : participants[9]) || 
      participants[0];

    setCurrentAdmin(matchedAdmin);
    setRoleMode('admin');
    setActiveTab('dashboard');
    localStorage.setItem('sk_kepawa_role_mode', 'admin');
    localStorage.setItem('sk_kepawa_admin_ic', matchedAdmin.noKp);
    setAdminPinInput('');
    setAdminAuthError(null);
    setIsAdminModalOpen(false);
    setToastNotification({
      type: 'success',
      message: `Akses Pentadbir Dibuka: Selamat datang ${matchedAdmin.namaPenuh}! Sistem kini dibuka sepenuhnya pada bila-bila masa.`
    });
  };

  const handleAdminLogout = () => {
    setRoleMode('user');
    setActiveTab('scanner');
    localStorage.setItem('sk_kepawa_role_mode', 'user');
    setIsAdminModalOpen(false);
    setToastNotification({
      type: 'info',
      message: 'Anda telah log keluar daripada Panel Admin.'
    });
  };

  // Calculations
  const totalCount = participants.length;
  const hadirCount = participants.filter(p => p.status === 'Hadir').length;
  const belumHadirCount = totalCount - hadirCount;
  const attendanceRate = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 0;

  // Direct file download handler for PDF/HTML report
  const handleDownloadReportFile = () => {
    const reportHtml = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <title>Laporan Kehadiran Bengkel Pengurusan Jenazah SK Kepawa 2026</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #111; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    h2 { color: #1e3a8a; margin: 6px 0; }
    h3 { margin: 5px 0; color: #3b82f6; }
    .stats { display: flex; justify-content: space-around; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; margin-bottom: 20px; text-align: center; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th, td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; }
    th { background-color: #dbeafe; color: #1e3a8a; text-align: center; }
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
          <td class="text-center" style="font-weight: bold; color: ${p.status === 'Hadir' ? '#1d4ed8' : '#b45309'};">${p.status}</td>
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

  // Handle Scanner / Isi Kehadiran submission (with 05 Nov 2026 6:30 AM lock & Admin bypass)
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify lock: Only admins Mohd Zahari & Noradilah can submit anytime before 05 Nov 2026 6:30 AM
    if (!isSystemUnlocked) {
      setScanMessage({
        type: 'error',
        text: 'Sistem kehadiran dikunci sehingga 05 November 2026 jam 6.30 pagi. (Hanya Admin Mohd Zahari & Noradilah dibenarkan membuka sistem pada bila-bila masa).'
      });
      return;
    }

    const query = scanInput.trim();
    if (!query) return;

    const processLocalScan = (icQuery: string) => {
      const cleanInput = icQuery.trim().replace(/\D/g, '');
      const found = participants.find(p => {
        const pClean = p.noKp.replace(/\D/g, '');
        return pClean === cleanInput || (cleanInput.length >= 6 && pClean.includes(cleanInput));
      }) || participants.find(p => p.namaPenuh.toLowerCase().includes(icQuery.toLowerCase().trim()));

      if (!found) {
        setScanMessage({
          type: 'error',
          text: `Tiada rekod staf ditemui untuk No. KP: "${icQuery}". Sila semak semula nombor kad pengenalan anda.`
        });
        setLastScanned(null);
        return;
      }

      const nowTime = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

      if (found.status === 'Hadir') {
        setLastScanned(found);
        setScanMessage({
          type: 'warning',
          text: `Perhatian: ${found.namaPenuh} telah pun direkodkan HADIR pada ${found.masaHadir || nowTime}.`
        });
        return;
      }

      const updatedParticipant: Participant = {
        ...found,
        status: 'Hadir',
        masaHadir: nowTime
      };

      const updatedList = participants.map(p => p.id === found.id ? updatedParticipant : p);
      setParticipants(updatedList);
      localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(updatedList));
      setLastScanned(updatedParticipant);
      setScanMessage({
        type: 'success',
        text: `Tahniah! Kehadiran disahkan untuk ${found.namaPenuh} (${found.jawatan}) pada jam ${nowTime}.`
      });

      // Sync to Firebase Firestore (Real-time live multi-device sync)
      try {
        updateDoc(doc(db, 'participants', found.id), {
          status: 'Hadir',
          masaHadir: nowTime
        });
      } catch (e) {
        console.warn("Firestore sync write error:", e);
      }
    };

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noKp: query })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLastScanned(data.participant);
          if (data.alreadyCheckedIn) {
            setScanMessage({ type: 'warning', text: data.message });
          } else {
            setScanMessage({ type: 'success', text: data.message });
            fetchParticipants();
            try {
              updateDoc(doc(db, 'participants', data.participant.id), {
                status: 'Hadir',
                masaHadir: data.participant.masaHadir || new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
              });
            } catch (e) {}
          }
          setScanInput('');
          return;
        } else {
          setScanMessage({ type: 'error', text: data.message || 'Ralat imbasan.' });
          setLastScanned(null);
          setScanInput('');
          return;
        }
      }
      processLocalScan(query);
    } catch (err) {
      processLocalScan(query);
    }
    setScanInput('');
  };

  // Quick toggle status
  const toggleStatus = async (id: string) => {
    if (roleMode === 'user') {
      setToastNotification({
        type: 'warning',
        message: 'Akses Terhad: Hanya Panel Admin (Mohd Zahari / Noradilah) dibenarkan menukar status kehadiran.'
      });
      return;
    }
    const nowTime = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
    const target = participants.find(p => p.id === id);
    if (!target) return;
    const newStatus = target.status === 'Hadir' ? 'Belum Hadir' : 'Hadir';
    const newMasa = newStatus === 'Hadir' ? (target.masaHadir || nowTime) : '';

    const updated = participants.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus as any,
          masaHadir: newMasa
        };
      }
      return p;
    });

    setParticipants(updated);
    localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(updated));

    setToastNotification({
      type: 'info',
      message: `Status ${target.namaPenuh} ditukar kepada "${newStatus}".`
    });

    // Firestore live update
    try {
      updateDoc(doc(db, 'participants', id), {
        status: newStatus,
        masaHadir: newMasa
      });
    } catch (e) {}

    try {
      const res = await fetch('/api/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.participants)) {
          setParticipants(data.participants.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) })));
        }
      }
    } catch (e) {}
  };

  // Open delete participant modal
  const promptDeleteParticipant = (p: Participant) => {
    if (roleMode === 'user') {
      setToastNotification({
        type: 'warning',
        message: 'Akses Terhad: Hanya Panel Admin dibenarkan memadam peserta.'
      });
      return;
    }
    setParticipantToDelete(p);
  };

  const handleConfirmDelete = async () => {
    if (!participantToDelete || roleMode === 'user') return;
    const target = participantToDelete;
    const updated = participants.filter(p => p.id !== target.id);
    setParticipants(updated);
    localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(updated));
    setParticipantToDelete(null);

    setToastNotification({
      type: 'info',
      message: `Peserta ${target.namaPenuh} telah dipadam.`
    });

    // Firestore live delete
    try {
      deleteDoc(doc(db, 'participants', target.id));
    } catch (e) {}

    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.participants)) {
          setParticipants(data.participants.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) })));
        }
      }
    } catch (e) {}
  };

  // Trigger reset confirmation modal
  const handleOpenResetModal = () => {
    if (roleMode === 'user') {
      setToastNotification({
        type: 'warning',
        message: 'Akses Terhad: Hanya Panel Admin (Mohd Zahari / Noradilah) dibenarkan mengeset semula kehadiran.'
      });
      return;
    }
    setIsResetModalOpen(true);
  };

  // Execute full attendance reset with real-time Firestore sync & UI feedback
  const handleExecuteReset = async () => {
    if (roleMode === 'user') {
      setIsResetModalOpen(false);
      return;
    }
    setIsResetting(true);

    try {
      const resetList: Participant[] = participants.map(p => ({
        ...p,
        status: 'Belum Hadir' as const,
        masaHadir: undefined,
        nota: undefined
      }));
      setParticipants(resetList);
      localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(resetList));
      setLastScanned(null);
      setScanMessage(null);

      // Firestore live batch reset
      try {
        const batch = writeBatch(db);
        participants.forEach(p => {
          const pRef = doc(db, 'participants', p.id);
          batch.set(pRef, {
            status: 'Belum Hadir',
            masaHadir: ''
          }, { merge: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn("Firestore batch reset notice:", e);
      }

      // Sync with Express backend if running
      try {
        const res = await fetch('/api/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.participants)) {
            setParticipants(data.participants.map((p: Participant) => ({ ...p, jawatan: cleanJawatan(p.jawatan) })));
          }
        }
      } catch (e) {}

      setToastNotification({
        type: 'success',
        message: 'Kehadiran berjaya diset semula! Semua staf kini berstatus "Belum Hadir".'
      });
    } catch (err) {
      console.error(err);
      setToastNotification({
        type: 'error',
        message: 'Ralat semasa menetapkan semula kehadiran. Sila cuba lagi.'
      });
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);
    if (roleMode === 'user') return;
    if (!newParticipant.namaPenuh || !newParticipant.noKp) {
      setAddFormError('Sila lengkapkan Nama Penuh dan Nombor Kad Pengenalan.');
      return;
    }
    const cleanIc = newParticipant.noKp.trim().replace(/\D/g, '');
    if (cleanIc.length < 8) {
      setAddFormError('Sila masukkan Nombor Kad Pengenalan yang sah (sekurang-kurangnya 8-12 digit).');
      return;
    }

    const created: Participant = {
      id: String(Date.now()),
      namaPenuh: newParticipant.namaPenuh.trim().toUpperCase(),
      noKp: cleanIc,
      email: `${cleanIc}@moe-dl.edu.my`,
      jawatan: cleanJawatan(newParticipant.jawatan || 'Guru Akademik'),
      status: 'Belum Hadir'
    };

    const updated = [...participants, created];
    setParticipants(updated);
    localStorage.setItem('sk_kepawa_attendance_data', JSON.stringify(updated));
    setNewParticipant({ namaPenuh: '', noKp: '', jawatan: 'Guru Akademik' });
    setIsAddModalOpen(false);
    setToastNotification({
      type: 'success',
      message: `Peserta baharu (${created.namaPenuh}) berjaya didaftarkan.`
    });

    // Firestore live add
    try {
      await setDoc(doc(db, 'participants', created.id), created);
    } catch (e) {}

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPenuh: created.namaPenuh,
          noKp: created.noKp,
          jawatan: created.jawatan
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setParticipants(data.participants);
      }
    } catch (e) {}
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
      
      {/* Top Header - Blue Theme */}
      <header className="bg-slate-950 border-b border-blue-900/40 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-blue-950/40 overflow-hidden border border-blue-500/30">
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
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                }`}>
                  {roleMode === 'admin' ? `Admin: ${currentAdmin.namaPenuh}` : 'Portal Isi Kehadiran Guru & Staf'}
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">05 Nov 2026 • 6:30 Pagi • Dewan Mini SK Kepawa</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Bengkel Pengurusan Jenazah Peringkat SK Kepawa 2026</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {roleMode === 'admin' ? (
              <>
                {/* Admin role active controls */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => {
                      setAdminAuthError(null);
                      setIsAdminModalOpen(true);
                    }}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer"
                    title="Pengurusan Pentadbir Bertugas"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </button>
                  <button
                    onClick={handleAdminLogout}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-slate-300 hover:text-red-300 hover:bg-red-950/40 cursor-pointer"
                    title="Log Keluar daripada Panel Admin"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Log Keluar</span>
                  </button>
                </div>

                <button 
                  onClick={handleDownloadReportFile} 
                  className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAdminPinInput('');
                  setAdminAuthError(null);
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-blue-300 hover:text-blue-200 border border-blue-500/30 hover:border-blue-400 transition-all cursor-pointer shadow-md shadow-blue-950/20 group"
                title="Akses khas untuk Pentadbir sahaja"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Panel Admin (Khas Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Admin Sahaja (Blue Palette) */}
        {roleMode === 'admin' && (
          <div className="bg-slate-900/90 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-2">
              {[
                { id: 'dashboard', label: 'Dashboard Statistik', icon: BarChart3 },
                { id: 'live', label: 'Live Monitoring 🔴', icon: Radio },
                { id: 'scanner', label: 'Isi Kehadiran', icon: UserCheck },
                { id: 'participants', label: 'Senarai Peserta & Kehadiran', icon: Users },
                { id: 'reports', label: 'Laporan & Cetakan PDF', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================== TAB: DASHBOARD (BLUE THEME) ==================== */}
        {activeTab === 'dashboard' && roleMode === 'admin' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Banner announcement - Royal Blue & Deep Navy Gradient */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-700/40 p-6 sm:p-8 shadow-xl">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Admin: {currentAdmin.namaPenuh} ({currentAdmin.jawatan})</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Dashboard Kehadiran Dewan Mini SK Kepawa
                </h2>
                <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                  Pantau kehadiran warga SK Kepawa pada 05 November 2026 secara langsung dengan penyegerakan awan (Live Cloud Sync).
                </p>

                {/* Event Schedule Info */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Tarikh: <strong className="text-white">05 November 2026</strong>
                    </span>
                    <span className="text-slate-500">•</span>
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Buka Umum: <strong className="text-white">6:30 Pagi</strong>
                    </span>
                    <span className="text-slate-500">•</span>
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Lokasi: <strong className="text-white">Dewan Mini SK Kepawa</strong>
                    </span>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                    Akses Admin Dibuka Bila-Bila Masa
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setActiveTab('live')} 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
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

            {/* Statistics Cards - Blue Theme */}
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

              <div className="bg-slate-950 border border-blue-900/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute right-4 top-4 w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center text-blue-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hadir (Checked-In)</p>
                <p className="text-3xl font-extrabold text-blue-400 mt-2">{hadirCount}</p>
                <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
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
                <div className="absolute right-4 top-4 w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peratus Kehadiran</p>
                <p className="text-3xl font-extrabold text-sky-400 mt-2">{attendanceRate}%</p>
                <div className="mt-4 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }}></div>
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Check-ins */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Workshop Info */}
              <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span>Maklumat Program</span>
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Tarikh Program</p>
                      <p className="text-slate-400 text-xs mt-0.5">05 November 2026 (Khamis)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Waktu Buka Umum</p>
                      <p className="text-blue-300 text-xs mt-0.5 font-mono">05 Nov 2026, 6:30 Pagi</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Tempat Program</p>
                      <p className="text-slate-400 text-xs mt-0.5">Dewan Mini SK Kepawa</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <UserCog className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Pentadbir Bertugas (Akses Penuh)</p>
                      <p className="text-blue-300 text-xs mt-0.5 font-medium">{currentAdmin.namaPenuh}</p>
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
                        <Plus className="w-4 h-4 text-blue-400" />
                        Tambah Peserta Baru
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </button>
                    <button 
                      type="button"
                      onClick={handleOpenResetModal}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-red-950/40 text-red-300 border border-slate-800 hover:border-red-800/60 text-sm font-semibold transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
                      title="Set semula status semua staf kepada Belum Hadir"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-red-400 group-hover:rotate-180 transition-transform duration-500" />
                        Set Semula Kehadiran
                      </span>
                      <span className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">
                        Admin
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Checked-In List */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-400" />
                    <span>Aktiviti Kehadiran Terkini</span>
                  </h3>
                  <span className="text-xs bg-blue-500/15 text-blue-400 px-3 py-1 rounded-full font-medium border border-blue-500/30">
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
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-blue-900/30 hover:border-blue-700/50 transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                              {p.namaPenuh.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{p.namaPenuh}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-xs text-blue-400 font-mono">No. KP: {p.noKp}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-400">{p.jawatan}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
            <div className="bg-slate-950 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 animate-pulse"></div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20 animate-pulse">
                    <Radio className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
                      <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">Live Stream Kehadiran Dewan Mini</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mt-1">Pemantauan Langsung (Live Monitoring)</h2>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Status Kehadiran Semasa</p>
                  <p className="text-2xl font-black text-blue-400 font-mono mt-0.5">{hadirCount} / {totalCount} <span className="text-xs text-slate-400 font-normal">({attendanceRate}%)</span></p>
                </div>
              </div>

              {/* Big Screen Grid / Live Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recently Checked-In Live Stream */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
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
                              ? 'bg-blue-950/60 border-blue-500/60 shadow-lg shadow-blue-500/10' 
                              : 'bg-slate-950/60 border-slate-800'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                                {idx === 0 ? '✨' : '✓'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{p.namaPenuh}</p>
                                <p className="text-xs font-mono text-blue-400 mt-0.5">No. KP: {p.noKp} • {p.jawatan}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-mono font-bold border border-blue-500/30">
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
                      <div className="text-center py-16 text-blue-400 font-bold">
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
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all shadow-md shadow-blue-600/20 cursor-pointer"
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

        {/* ==================== TAB: ISI KEHADIRAN (LOCK RULES APPLIED) ==================== */}
        {(roleMode === 'user' || activeTab === 'scanner') && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-2 sm:py-6">
            
            {/* If Admin is logged in, show special Admin status badge */}
            {isAdminActive && (
              <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-xs flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white text-sm">Akses Pentadbir Aktif: {currentAdmin.namaPenuh}</p>
                    <p className="text-blue-300 text-[11px] mt-0.5">
                      Sistem dibuka sepenuhnya untuk pentadbir pada bila-bila masa.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-500/40">
                  Admin Unlocked
                </span>
              </div>
            )}

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600"></div>
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-lg ${
                isSystemUnlocked
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-950/40 animate-pulse'
              }`}>
                {isSystemUnlocked ? <UserCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 border ${
                isSystemUnlocked 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isSystemUnlocked ? 'bg-blue-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></span>
                <span>
                  {isSystemUnlocked 
                    ? 'Sistem Kehadiran Dibuka (Live Cloud Sync)' 
                    : 'Sistem Dikunci Sehingga 05 Nov 2026, 6:30 Pagi'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isSystemUnlocked ? 'Isi Kehadiran Peserta' : 'Sistem Kehadiran Dikunci'}
              </h2>

              {isSystemUnlocked ? (
                /* Unlocked for Admin or when 05 Nov 2026 6:30 AM is reached */
                <>
                  <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
                    Sila masukkan 12 digit <span className="text-white font-semibold">Nombor Kad Pengenalan (No. KP)</span> anda tanpa tanda sengkang (-) untuk mengesahkan kehadiran ke Bengkel Pengurusan Jenazah SK Kepawa 2026.
                  </p>

                  <form onSubmit={handleScanSubmit} className="mt-7 max-w-xl mx-auto">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                      <input
                        ref={scanInputRef}
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        placeholder="Masukkan No. Kad Pengenalan anda (cth: 800808125208)..."
                        className="w-full bg-slate-900 border-2 border-slate-700 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-slate-500 text-base focus:outline-none shadow-inner transition-all font-mono"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="absolute right-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                      >
                        <span>Masuk</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Locked State: Only opens on 05 Nov 2026 at 6:30 AM, except for Admin */
                <div className="mt-3 space-y-5">
                  <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                    Sistem pendaftaran kehadiran hanya akan dibuka kepada umum pada <span className="text-white font-bold">05 November 2026</span> tepat pada jam <span className="text-amber-300 font-bold">6.30 pagi</span>.
                  </p>

                  {/* Countdown Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-blue-500/30 max-w-md mx-auto shadow-inner">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
                      <Timer className="w-4 h-4 text-blue-400" />
                      <span>Kiraan Detik Pembukaan Rasmi:</span>
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="block text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                          {String(countdown.days).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Hari</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="block text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                          {String(countdown.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Jam</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="block text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                          {String(countdown.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Minit</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="block text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono animate-pulse">
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold">Saat</span>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400 text-center">
                      Tarikh: <strong className="text-slate-200">05 Nov 2026</strong> • Jam: <strong className="text-slate-200">6:30 Pagi</strong> (Dewan Mini SK Kepawa)
                    </div>
                  </div>

                  {/* Form Input - Disabled with Lock */}
                  <div className="max-w-xl mx-auto relative flex items-center opacity-60 cursor-not-allowed">
                    <Lock className="absolute left-4 w-5 h-5 text-amber-400" />
                    <input
                      type="text"
                      disabled
                      placeholder="Sistem Terkunci: Hanya dibuka pada 05 Nov 2026, 6:30 AM..."
                      className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-32 text-slate-400 placeholder-slate-500 text-base font-mono cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled
                      className="absolute right-2 bg-slate-800 text-slate-500 font-medium px-5 py-2.5 rounded-xl text-sm border border-slate-700 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Terkunci</span>
                    </button>
                  </div>

                  {/* Direct Admin Login Call-to-action */}
                  <div className="pt-4 border-t border-slate-800/80 max-w-md mx-auto">
                    <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-600/40 text-center space-y-2">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Khas bagi Admin <strong className="text-white">MOHD ZAHARI BIN TIBIN</strong> dan <strong className="text-white">NORADILAH BINTI RIBUT</strong>, anda boleh membuka sistem pada bila-bila masa:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminPinInput('');
                          setAdminAuthError(null);
                          setIsAdminModalOpen(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Log Masuk Pentadbir (Buka Sistem Sekarang)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Scan Message Alert */}
              {scanMessage && (
                <div className={`mt-6 p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  scanMessage.type === 'success' 
                    ? 'bg-blue-950/60 border-blue-700/60 text-blue-200' 
                    : scanMessage.type === 'warning'
                    ? 'bg-amber-950/60 border-amber-700/60 text-amber-200'
                    : 'bg-red-950/60 border-red-700/60 text-red-200'
                }`}>
                  {scanMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {lastScanned.namaPenuh.substring(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full font-mono border border-blue-500/30">
                        No. KP: {lastScanned.noKp}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{lastScanned.namaPenuh}</h4>
                      <p className="text-xs text-slate-400">{lastScanned.jawatan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Status Kehadiran</span>
                    <span className="text-sm font-bold text-blue-400 font-mono flex items-center gap-1 justify-end">
                      <Check className="w-4 h-4 text-blue-400" />
                      {lastScanned.masaHadir || 'Hadir'}
                    </span>
                  </div>
                </div>
              )}

              {/* Ringkasan Maklumat Program & Kehadiran untuk Guru */}
              <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Tarikh Program</span>
                  <p className="text-white text-sm font-medium mt-0.5">05 November 2026</p>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Lokasi & Waktu</span>
                  <p className="text-white text-sm font-medium mt-0.5">Dewan Mini • 6:30 Pagi</p>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Kehadiran Semasa</span>
                  <p className="text-blue-400 text-sm font-bold mt-0.5 font-mono">{hadirCount} / {totalCount} Staf Hadir</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: PARTICIPANTS (BLUE PALETTE) ==================== */}
        {activeTab === 'participants' && roleMode === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-lg">
              <div>
                <h2 className="text-xl font-bold text-white">Senarai Staf HRMIS SK Kepawa</h2>
                <p className="text-slate-400 text-sm mt-1">Urus kehadiran peserta berdasarkan Nombor Kad Pengenalan rasmi.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-red-950/40 text-red-300 border border-slate-700 hover:border-red-800/60 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                  title="Set semula semua status kehadiran kepada Belum Hadir"
                >
                  <RefreshCw className="w-4 h-4 text-red-400" />
                  <span>Set Semula Semua</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
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
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
                {(['Semua', 'Hadir', 'Belum Hadir'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === status 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
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
                            <span className="font-mono text-xs text-blue-400 font-bold block">{p.noKp}</span>
                            <span className="font-semibold text-white block mt-0.5">{p.namaPenuh}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-300 text-xs">{p.jawatan}</td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              p.status === 'Hadir' 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
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
                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20'
                                }`}
                              >
                                {p.status === 'Hadir' ? '🔄 Reset Kehadiran' : 'Tandakan Hadir'}
                              </button>
                              <button
                                onClick={() => setSelectedParticipantForCard(p)}
                                title="Lihat Slip Pendaftaran Peserta"
                                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => promptDeleteParticipant(p)}
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
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
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
                <h2 className="text-xl sm:text-2xl font-extrabold text-blue-950 mt-1">LAPORAN RASMI KEHADIRAN BENGKEL PENGURUSAN JENAZAH 2026</h2>
                <h3 className="text-base font-bold text-blue-800 mt-2">Tarikh: 05 November 2026 | Tempat: Dewan Mini SK Kepawa</h3>
                <p className="text-xs text-slate-500 mt-1">Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8 bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-center">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Jumlah Staf</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Hadir</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">{hadirCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Peratus Kehadiran</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1">{attendanceRate}%</p>
                </div>
              </div>

              {/* Table for PDF Report */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-blue-100 text-slate-900">
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
                          <span className="font-mono text-blue-800 font-bold block">{p.noKp}</span>
                          <span className="font-bold text-slate-900 block">{p.namaPenuh}</span>
                        </td>
                        <td className="border border-slate-400 p-2">{p.jawatan}</td>
                        <td className="border border-slate-400 p-2 text-center font-semibold">
                          <span className={p.status === 'Hadir' ? 'text-blue-700' : 'text-amber-700'}>
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

      {/* ==================== ADMIN AUTH & SWITCHER MODAL ==================== */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setAdminPinInput('');
                setAdminAuthError(null);
                setIsAdminModalOpen(false);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-400 shadow-lg shadow-blue-500/10">
                {roleMode === 'admin' ? <ShieldCheck className="w-7 h-7 text-blue-400" /> : <Lock className="w-7 h-7 text-amber-400" />}
              </div>
              <h3 className="text-xl font-bold text-white">
                {roleMode === 'admin' ? 'Pengurusan Pentadbir Bengkel' : 'Pengesahan Panel Admin'}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {roleMode === 'admin' 
                  ? 'Akses Pentadbir Aktif (Mohd Zahari / Noradilah) - Dibuka pada bila-bila masa.' 
                  : 'Khas untuk Mohd Zahari Bin Tibin & Noradilah Binti Ribut (PIN: XBA6019).'}
              </p>
            </div>

            {roleMode === 'admin' ? (
              /* Already authenticated Admin view */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Pentadbir Aktif Semasa</span>
                      <p className="font-bold text-white text-sm mt-0.5">{currentAdmin.namaPenuh}</p>
                      <p className="text-xs text-slate-300">{currentAdmin.jawatan}</p>
                      <p className="text-xs font-mono text-blue-400 mt-1">No. KP: {currentAdmin.noKp}</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-blue-400" /> Dibuka
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Tukar Pentadbir Bertugas:</label>
                  <div className="space-y-2">
                    {[
                      { name: 'MOHD ZAHARI BIN TIBIN', ic: '730401125977', role: 'Guru Besar (Admin Utama)' },
                      { name: 'NORADILAH BINTI RIBUT', ic: '810929125238', role: 'Guru Pendidikan Islam / Penyelaras (Admin)' }
                    ].map((adm) => {
                      const isCurrent = currentAdmin.noKp === adm.ic;
                      return (
                        <button
                          key={adm.ic}
                          disabled={isCurrent}
                          onClick={() => {
                            const pObj = participants.find(p => p.noKp === adm.ic) || participants[0];
                            setCurrentAdmin(pObj);
                            localStorage.setItem('sk_kepawa_admin_ic', adm.ic);
                            setToastNotification({
                              type: 'info',
                              message: `Pentadbir bertugas ditukar kepada: ${adm.name}`
                            });
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                            isCurrent
                              ? 'bg-slate-900 border-blue-500/60 text-white cursor-default'
                              : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-white">{adm.name}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{adm.role}</p>
                            <p className="text-slate-500 text-[10px] font-mono mt-0.5">No. KP: {adm.ic}</p>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={handleAdminLogout}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Keluar Admin</span>
                  </button>
                  <button
                    onClick={() => setIsAdminModalOpen(false)}
                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              /* User Mode: Requires admin candidate selection and security PIN */
              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Pilih Akaun Pentadbir:</label>
                  <div className="space-y-2">
                    {[
                      { name: 'MOHD ZAHARI BIN TIBIN', ic: '730401125977', role: 'Guru Besar (Admin Utama)' },
                      { name: 'NORADILAH BINTI RIBUT', ic: '810929125238', role: 'Guru Pendidikan Islam / Penyelaras (Admin)' }
                    ].map((adm) => {
                      const isSelected = selectedAdminCandidateIc === adm.ic;
                      return (
                        <div
                          key={adm.ic}
                          onClick={() => {
                            setSelectedAdminCandidateIc(adm.ic);
                            setAdminAuthError(null);
                          }}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-500/10'
                              : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-white text-xs sm:text-sm">{adm.name}</p>
                            <p className="text-[11px] text-blue-400 mt-0.5">{adm.role}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">No. KP: {adm.ic}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>PIN Keselamatan Pentadbir</span>
                    <span className="text-[10px] text-blue-400 font-normal">Khas Admin</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showAdminPin ? 'text' : 'password'}
                      value={adminPinInput}
                      onChange={(e) => {
                        setAdminPinInput(e.target.value);
                        setAdminAuthError(null);
                      }}
                      placeholder="Masukkan PIN Keselamatan Pentadbir..."
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPin(!showAdminPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      title={showAdminPin ? "Sembunyikan PIN" : "Tunjukkan PIN"}
                    >
                      {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {adminAuthError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{adminAuthError}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPinInput('');
                      setAdminAuthError(null);
                      setIsAdminModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Buka Panel Admin</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ==================== ADD PARTICIPANT MODAL ==================== */}
      {isAddModalOpen && roleMode === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Tambah Peserta Baru</h3>
            <p className="text-slate-400 text-xs mb-6">Masukkan maklumat staf atau guru untuk Bengkel SK Kepawa 2026.</p>

            {addFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Nama Penuh (Huruf Besar)</label>
                <input
                  type="text"
                  value={newParticipant.namaPenuh}
                  onChange={(e) => setNewParticipant({ ...newParticipant, namaPenuh: e.target.value })}
                  placeholder="Cth: AHMAD BIN ALI"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none uppercase"
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
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-white font-mono text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Jawatan (HRMIS)</label>
                <input
                  type="text"
                  value={newParticipant.jawatan}
                  onChange={(e) => setNewParticipant({ ...newParticipant, jawatan: e.target.value })}
                  placeholder="Cth: Guru Akademik"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
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
            
            <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border border-blue-500/30">
              <img 
                src="/assets/aistudio/Logo_Sekolah_Kebangsaan_Kepawa_Khaysar_Mohamad_Noor_f9b71c57.png" 
                alt="Logo SK Kepawa" 
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">HRMIS / SK KEPAWA 2026</p>
            <h3 className="text-lg font-bold text-white mt-1">SLIP PENGESAHAN KEHADIRAN</h3>

            <div className="my-6 p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Nama Penuh</span>
                <p className="text-white font-bold text-sm">{selectedParticipantForCard.namaPenuh}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Nombor Kad Pengenalan</span>
                <p className="text-blue-400 font-mono text-sm font-bold">{selectedParticipantForCard.noKp}</p>
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

      {/* ==================== RESET ALL ATTENDANCE MODAL ==================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-red-900/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-lg shadow-red-950/40">
              <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold mb-2">
              <span>Tindakan Pentadbir (Admin)</span>
            </div>

            <h3 className="text-xl font-bold text-white mt-1">Set Semula Semua Kehadiran?</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Adakah anda pasti ingin menetapkan semula semua rekod kehadiran staf kembali kepada status <span className="text-amber-400 font-semibold">"Belum Hadir"</span>?
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Staf Hadir Semasa:</span>
                <span className="font-bold text-blue-400 font-mono">{hadirCount} Orang</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Status Selepas Set Semula:</span>
                <span className="font-bold text-amber-400 font-mono">0 Hadir / {totalCount} Belum Hadir</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-normal">
                ⚠️ Rekod masa imbasan akan dipadam dan diselaraskan secara langsung ke Firebase Cloud Firestore serta peranti lain.
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengeset Semula...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Ya, Set Semula</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== DELETE PARTICIPANT CONFIRMATION MODAL ==================== */}
      {participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-red-900/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>

            <h3 className="text-xl font-bold text-white">Padam Peserta?</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              Adakah anda pasti ingin memadam staf/peserta ini daripada senarai bengkel?
            </p>

            <div className="my-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1">
              <p className="font-bold text-white text-sm">{participantToDelete.namaPenuh}</p>
              <p className="font-mono text-blue-400 text-xs">No. KP: {participantToDelete.noKp}</p>
              <p className="text-slate-400">{participantToDelete.jawatan}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Padam</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-sm sm:max-w-md animate-fadeIn shadow-2xl">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-md ${
            toastNotification.type === 'success' 
              ? 'bg-blue-950/95 border-blue-500/60 text-blue-100 shadow-blue-950/60' 
              : toastNotification.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/60 text-amber-100 shadow-amber-950/60'
              : toastNotification.type === 'error'
              ? 'bg-red-950/95 border-red-500/60 text-red-100 shadow-red-950/60'
              : 'bg-blue-950/95 border-blue-500/60 text-blue-100 shadow-blue-950/60'
          }`}>
            {toastNotification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
            {toastNotification.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toastNotification.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toastNotification.type === 'info' && <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold">{toastNotification.message}</p>
            </div>
            <button 
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
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
