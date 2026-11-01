import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
const DATA_FILE = path.join(__dirname, 'data_attendance.json');
const INITIAL_PARTICIPANTS = [
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
function getStoredParticipants() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (e) {
        console.error(e);
    }
    return INITIAL_PARTICIPANTS;
}
function saveStoredParticipants(participants) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(participants, null, 2));
    }
    catch (e) {
        console.error(e);
    }
}
// API Routes
app.get('/api/participants', (req, res) => {
    const participants = getStoredParticipants();
    res.json(participants);
});
app.post('/api/scan', (req, res) => {
    const { noKp } = req.body;
    if (!noKp) {
        return res.status(400).json({ success: false, message: 'Nombor Kad Pengenalan diperlukan.' });
    }
    const query = String(noKp).trim().toLowerCase();
    const participants = getStoredParticipants();
    const found = participants.find(p => p.noKp.toLowerCase() === query ||
        p.noKp.toLowerCase().includes(query) ||
        p.namaPenuh.toLowerCase().includes(query));
    if (!found) {
        return res.status(404).json({ success: false, message: `No. KP atau nama "${noKp}" tidak dijumpai.` });
    }
    const now = new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (found.status === 'Hadir') {
        return res.json({
            success: true,
            alreadyCheckedIn: true,
            participant: found,
            message: `⚠️ ${found.namaPenuh} (No. KP: ${found.noKp}) telah pun merekodkan kehadiran pada ${found.masaHadir}.`
        });
    }
    const updated = participants.map(p => p.id === found.id ? { ...p, status: 'Hadir', masaHadir: now } : p);
    saveStoredParticipants(updated);
    const updatedParticipant = { ...found, status: 'Hadir', masaHadir: now };
    res.json({
        success: true,
        alreadyCheckedIn: false,
        participant: updatedParticipant,
        message: `✅ Berjaya! Kehadiran direkodkan untuk ${found.namaPenuh} (No. KP: ${found.noKp}) pada jam ${now}.`
    });
});
app.post('/api/toggle', (req, res) => {
    const { id } = req.body;
    const participants = getStoredParticipants();
    const updated = participants.map(p => {
        if (p.id === id) {
            const newStatus = p.status === 'Hadir' ? 'Belum Hadir' : 'Hadir';
            const now = newStatus === 'Hadir' ? new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : undefined;
            return { ...p, status: newStatus, masaHadir: now };
        }
        return p;
    });
    saveStoredParticipants(updated);
    res.json({ success: true, participants: updated });
});
app.post('/api/participants', (req, res) => {
    const { namaPenuh, noKp, jawatan } = req.body;
    if (!namaPenuh || !noKp) {
        return res.status(400).json({ success: false, message: 'Nama dan No. KP diperlukan.' });
    }
    const cleanIc = String(noKp).trim().replace(/\D/g, '');
    const participants = getStoredParticipants();
    const newItem = {
        id: Date.now().toString(),
        namaPenuh: String(namaPenuh).toUpperCase(),
        noKp: cleanIc,
        email: `g-${cleanIc.substring(6)}@moe-dl.edu.my`,
        jawatan: jawatan || 'Guru Akademik (DG5)',
        status: 'Belum Hadir'
    };
    const updated = [newItem, ...participants];
    saveStoredParticipants(updated);
    res.json({ success: true, participants: updated });
});
app.post('/api/delete', (req, res) => {
    const { id } = req.body;
    const participants = getStoredParticipants();
    const updated = participants.filter(p => p.id !== id);
    saveStoredParticipants(updated);
    res.json({ success: true, participants: updated });
});
app.post('/api/reset', (req, res) => {
    const participants = getStoredParticipants();
    const updated = participants.map(p => ({ ...p, status: 'Belum Hadir', masaHadir: undefined }));
    saveStoredParticipants(updated);
    res.json({ success: true, participants: updated });
});
// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
    });
    app.use(vite.middlewares);
}
else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
