import { useEffect, useRef, useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import { ArrowLeft, CalendarDays, Check, Download, MapPin, Plus, QrCode, Users, Camera, Link2 } from 'lucide-react';
import { apiFetch } from './api';
import type { User } from './types';

interface CampusEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  attendeeCount?: number;
  completedCount?: number;
}

interface EventAttendance {
  eventId: string;
  title: string;
  location: string;
  startsAt: string;
  endsAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

const dateLabel = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
const qrUrl = (token: string) => `${import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin}/?eventToken=${encodeURIComponent(token)}`;

function extractEventToken(rawValue: string) {
  try {
    const parsedUrl = new URL(rawValue);
    return parsedUrl.searchParams.get('eventToken');
  } catch {
    return /^[a-f0-9]{64}$/i.test(rawValue.trim()) ? rawValue.trim() : null;
  }
}

export function StudentEventScanner({ onBack, onScan }: { onBack: () => void; onScan: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const onScanRef = useRef(onScan);
  const [isScanning, setIsScanning] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isScanning || !video) return;
    let isDisposed = false;
    const reader = new BrowserQRCodeReader();
    readerRef.current = reader;

    void reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result, _scanError, controls) => {
      if (isDisposed || !result) return;
      const token = extractEventToken(result.getText());
      if (!token) {
        setError('Esse QR não é um código individual de entrada ou saída da palestra.');
        return;
      }
      isDisposed = true;
      controls.stop();
      setIsScanning(false);
      onScanRef.current(token);
    }).catch(scanError => {
      if (isDisposed) return;
      setError(scanError instanceof Error ? scanError.message : 'Não foi possível abrir a câmera. Confira as permissões do navegador.');
      setIsScanning(false);
    });

    return () => {
      isDisposed = true;
      readerRef.current?.reset();
      readerRef.current = null;
    };
  }, [isScanning]);

  const submitManualCode = (event: FormEvent) => {
    event.preventDefault();
    const token = extractEventToken(manualValue.trim());
    if (!token) {
      setError('Cole o link completo do QR ou o código individual válido.');
      return;
    }
    setError('');
    onScanRef.current(token);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Voltar" className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-200"><ArrowLeft size={20} /></button>
        <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Área do aluno</p><h2 className="text-2xl font-bold text-slate-900">Escanear palestra</h2></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="space-y-4 border-y border-slate-300 py-5">
          <div><h3 className="font-bold text-slate-900">Leitura pela câmera</h3><p className="mt-1 text-sm text-slate-600">Use a câmera para ler o QR individual que o professor gerou para você.</p></div>
          {!isScanning ? <button type="button" onClick={() => { setError(''); setIsScanning(true); }} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-3 font-bold text-white hover:bg-emerald-900"><Camera size={18} />Abrir câmera</button> : <div className="space-y-3"><video ref={videoRef} className="aspect-video w-full rounded-lg bg-slate-950 object-cover" muted playsInline /><button type="button" onClick={() => { readerRef.current?.reset(); setIsScanning(false); }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Parar câmera</button></div>}
          {error && <p role="alert" className="border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}
        </section>

        <form onSubmit={submitManualCode} className="space-y-3 border-y border-slate-300 py-5">
          <div><h3 className="font-bold text-slate-900">Inserir código manualmente</h3><p className="mt-1 text-sm text-slate-600">Alternativa quando a câmera não estiver disponível.</p></div>
          <label className="block text-sm font-semibold text-slate-700">Link ou código do QR
            <input value={manualValue} onChange={event => setManualValue(event.target.value)} placeholder="Cole o link individual do QR" className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" />
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100"><Link2 size={16} />Confirmar código</button>
        </form>
      </div>
    </section>
  );
}

export function ProfessorEvents({ onBack }: { onBack: () => void }) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [entryQr, setEntryQr] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [qrPhase, setQrPhase] = useState<'entry' | 'exit' | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', location: '', startsAt: '', endsAt: '' });

  const loadEvents = async () => setEvents(await apiFetch<CampusEvent[]>('/events'));

  useEffect(() => {
    void Promise.all([loadEvents(), apiFetch<User[]>('/attendance/students')])
      .then(([, studentRecords]) => {
        setStudents(studentRecords);
        setSelectedStudentId(studentRecords[0]?.id ?? '');
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os eventos e alunos.'));
  }, []);

  useEffect(() => {
    if (!qrExpiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(qrExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setEntryQr('');
        setQrPhase(null);
      }
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiresAt]);

  const showCodes = (event: CampusEvent) => {
    setSelectedEvent(event);
    setEntryQr('');
    setQrPhase(null);
    setQrExpiresAt(null);
  };

  const generateStudentQr = async (phase: 'entry' | 'exit') => {
    if (!selectedEvent || !selectedStudentId) return;
    setIsGeneratingQr(true);
    setError('');
    setEntryQr('');
    try {
      const credential = await apiFetch<{ token: string; phase: 'entry' | 'exit'; studentName: string; expiresAt: string }>(`/events/${selectedEvent.id}/qr`, {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudentId, phase }),
      });
      const image = await QRCode.toDataURL(qrUrl(credential.token), { width: 280, margin: 2, errorCorrectionLevel: 'H' });
      setEntryQr(image);
      setQrPhase(credential.phase);
      setQrExpiresAt(credential.expiresAt);
    } catch (qrError) {
      setError(qrError instanceof Error ? qrError.message : 'Não foi possível gerar o QR individual.');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const createEvent = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      const created = await apiFetch<CampusEvent>('/events', {
        method: 'POST',
        body: JSON.stringify({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }),
      });
      setForm({ title: '', description: '', location: '', startsAt: '', endsAt: '' });
      await loadEvents();
      showCodes(created);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar o evento.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-7 px-1 py-5 md:px-2 md:py-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} aria-label="Voltar ao painel" className="rounded-md p-2 text-slate-600 hover:bg-slate-200"><ArrowLeft size={20} /></button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Área docente</p>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Palestras e eventos</h2>
        </div>
      </div>

      {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <form onSubmit={createEvent} className="space-y-4 border-y border-slate-300 py-5">
          <div className="flex items-center gap-2"><Plus size={18} className="text-emerald-700" /><h3 className="font-bold text-slate-900">Criar palestra</h3></div>
          <label className="block text-sm font-semibold text-slate-700">Título<input required minLength={3} maxLength={120} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
          <label className="block text-sm font-semibold text-slate-700">Descrição<textarea required minLength={5} maxLength={1000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
          <label className="block text-sm font-semibold text-slate-700">Local<input required value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Início<input required type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
            <label className="block text-sm font-semibold text-slate-700">Término<input required type="datetime-local" value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
          </div>
          <button disabled={isCreating} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-5 py-3 font-bold text-white hover:bg-emerald-900 disabled:opacity-60"><Plus size={17} />{isCreating ? 'Criando...' : 'Criar evento e gerar QRs'}</button>
        </form>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-900">Eventos criados <span className="font-normal text-slate-500">({events.length})</span></h3>
          {events.length === 0 ? <p className="border-y border-slate-300 py-6 text-sm text-slate-500">Nenhum evento criado ainda.</p> : events.map(event => (
            <article key={event.id} className="flex flex-col gap-3 border-y border-slate-300 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h4 className="font-bold text-slate-900">{event.title}</h4><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} />{event.location}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={14} />{dateLabel(event.startsAt)}</p><p className="mt-2 flex items-center gap-3 text-xs text-slate-600"><span className="inline-flex items-center gap-1"><Users size={14} />{event.attendeeCount ?? 0} inscritos</span><span>{event.completedCount ?? 0} certificados</span></p></div>
              <button onClick={() => showCodes(event)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"><QrCode size={16} />Gerar QR por aluno</button>
            </article>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="border-t-2 border-slate-900 pt-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">QR individual e temporário</p><h3 className="text-xl font-bold text-slate-900">{selectedEvent.title}</h3></div><button onClick={() => setSelectedEvent(null)} className="text-sm font-semibold text-slate-600 underline">Fechar</button></div>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <label className="block max-w-xl text-sm font-semibold text-slate-700">Aluno<select value={selectedStudentId} onChange={event => { setSelectedStudentId(event.target.value); setEntryQr(''); setQrPhase(null); setQrExpiresAt(null); }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5">{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={isGeneratingQr || !selectedStudentId} onClick={() => void generateStudentQr('entry')} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><QrCode size={16} />Gerar QR de entrada</button>
                <button type="button" disabled={isGeneratingQr || !selectedStudentId} onClick={() => void generateStudentQr('exit')} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><QrCode size={16} />Gerar QR de saída</button>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">O QR é vinculado à conta selecionada, expira em 2 minutos e só pode ser usado uma vez. Se expirar, gere outro. Na saída, o aluno precisa já ter confirmado a entrada.</p>
            </div>
            {entryQr && qrPhase ? <div className="flex flex-col items-center border border-slate-300 bg-white p-4 text-center"><p className="font-bold text-slate-900">{qrPhase === 'entry' ? 'Entrada' : 'Saída'} · {students.find(student => student.id === selectedStudentId)?.name}</p><img src={entryQr} alt={`QR individual de ${qrPhase === 'entry' ? 'entrada' : 'saída'}`} className="my-3 size-56 max-w-full"/><p className="text-sm font-bold text-amber-800">Expira em {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</p><a href={entryQr} download={`qr-${qrPhase}-${selectedStudentId}-${selectedEvent.id}.png`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><Download size={15} />Baixar QR individual</a></div> : <div className="grid min-h-56 place-items-center border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Selecione o aluno e gere um QR de entrada ou saída.</div>}
          </div>
        </div>
      )}
    </section>
  );
}

export function EventCheckin({ userName, tokenOverride, onBack }: { userName: string; tokenOverride?: string | null; onBack?: () => void }) {
  const [message, setMessage] = useState('Confirmando presença...');
  const [attendance, setAttendance] = useState<EventAttendance | null>(null);
  const [history, setHistory] = useState<EventAttendance[]>([]);
  const [certificateAttendance, setCertificateAttendance] = useState<EventAttendance | null>(null);
  const token = tokenOverride ?? new URLSearchParams(window.location.search).get('eventToken');

  useEffect(() => {
    const confirm = async () => {
      try {
        if (!token) throw new Error('Este QR code não contém uma confirmação válida.');
        const result = await apiFetch<{ event: { id: string }; attendance: EventAttendance }>('/events/confirm', { method: 'POST', body: JSON.stringify({ token }) });
        setAttendance(result.attendance);
        if (result.attendance.checkedInAt && result.attendance.checkedOutAt) setCertificateAttendance(result.attendance);
        setMessage(result.attendance.checkedOutAt ? 'Saída confirmada.' : 'Entrada confirmada.');
        setHistory(await apiFetch<EventAttendance[]>('/events/my-attendance'));
      } catch (confirmError) {
        setMessage(confirmError instanceof Error ? confirmError.message : 'Não foi possível confirmar presença.');
        try { setHistory(await apiFetch<EventAttendance[]>('/events/my-attendance')); } catch { /* Preserve the confirmation result. */ }
      }
    };
    void confirm();
  }, [token]);

  const certificateReady = Boolean(certificateAttendance?.checkedInAt && certificateAttendance?.checkedOutAt);

  return (
    <section className="mx-auto max-w-4xl space-y-7 py-8">
      <div className="border-b border-slate-300 pb-5">{onBack && <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ArrowLeft size={16} />Voltar ao scanner</button>}<p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Presença em evento</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{message}</h2>{attendance && <p className="mt-2 text-slate-600">{attendance.title} · {attendance.location}</p>}</div>
      {certificateReady && certificateAttendance ? <article className="event-certificate mx-auto max-w-2xl border-2 border-emerald-800 bg-white p-8 text-center md:p-12 print:border-black"><Check className="mx-auto text-emerald-800" size={36} /><p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">Certificado de presença</p><h3 className="mt-4 text-3xl font-bold text-slate-900">{certificateAttendance.title}</h3><p className="mx-auto mt-5 max-w-lg leading-7 text-slate-700">Certificamos que <strong>{userName}</strong> participou do evento realizado em {certificateAttendance.location}, com presença confirmada na entrada e na saída.</p><div className="mt-8 grid gap-3 border-t border-slate-300 pt-5 text-sm text-slate-600 sm:grid-cols-2"><p>Entrada: {dateLabel(certificateAttendance.checkedInAt!)}</p><p>Saída: {dateLabel(certificateAttendance.checkedOutAt!)}</p></div><button onClick={() => window.print()} className="mt-8 inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-3 font-bold text-white print:hidden"><Download size={17} />Imprimir / salvar PDF</button></article> : <div className="border-l-4 border-amber-500 bg-amber-50 px-5 py-4 text-sm text-amber-900">O certificado fica disponível depois de confirmar a entrada e a saída usando os respectivos QRs.</div>}
      {history.length > 0 && <div className="space-y-3"><h3 className="font-bold text-slate-900">Minhas participações</h3>{history.map(item => <div key={item.eventId} className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-300 py-3 text-sm"><div><span className="font-semibold">{item.title}</span><p className="mt-1 text-slate-600">{item.checkedInAt ? 'Entrada confirmada' : 'Sem entrada'} · {item.checkedOutAt ? 'Saída confirmada' : 'Sem saída'}</p></div>{item.checkedInAt && item.checkedOutAt && <button onClick={() => setCertificateAttendance(item)} className="font-semibold text-emerald-800 underline">Ver certificado</button>}</div>)}</div>}
    </section>
  );
}
