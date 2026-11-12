import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, BellRing, BookOpen, CalendarClock, Check, Circle, Plus, Upload } from 'lucide-react';
import { assignmentApi } from './api';
import type { AssignmentRecord, AssignmentSubmissionFile, AssignmentSubmissionNotice, CourseSubject } from './types';

function getDueState(dueAt: string) {
  const due = new Date(dueAt);
  const today = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayDifference = Math.round((dueDay - todayDay) / 86400000);
  if (dayDifference < 0) return { label: 'Atrasado', className: 'bg-red-100 text-red-800' };
  if (dayDifference === 0) return { label: 'Vence hoje', className: 'bg-red-100 text-red-800' };
  if (dayDifference === 1) return { label: 'Vence amanhã', className: 'bg-amber-100 text-amber-900' };
  return { label: due.toLocaleDateString('pt-BR'), className: 'bg-slate-100 text-slate-600' };
}

const dateTimeLabel = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export function ProfessorAssignments({ onBack, subjects, isWeb = false }: { onBack: () => void; subjects: CourseSubject[]; isWeb?: boolean }) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ subjectId: subjects[0]?.id ?? '', title: '', description: '', dueAt: '' });

  const loadAssignments = async () => {
    const [work, uploaded] = await Promise.all([assignmentApi.list(), assignmentApi.listSubmissions()]);
    setAssignments(work);
    setSubmissions(uploaded);
  };
  useEffect(() => {
    const refresh = () => {
      void loadAssignments().catch(error => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os trabalhos.')).finally(() => setIsLoading(false));
    };
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const downloadSubmission = async (assignmentId: string, file: AssignmentSubmissionFile) => {
    const fileWindow = window.open('', '_blank');
    setMessage('');
    try {
      const { url } = await assignmentApi.getSubmissionFileUrl(assignmentId, file.id);
      if (fileWindow) fileWindow.location.href = url;
      else setMessage('O navegador bloqueou a abertura do arquivo. Permita pop-ups e tente novamente.');
    } catch (error) {
      fileWindow?.close();
      setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo.');
    }
  };

  const createAssignment = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const created = await assignmentApi.create({ ...form, dueAt: new Date(form.dueAt).toISOString() });
      setAssignments(previous => [...previous, created].sort((first, second) => first.dueAt.localeCompare(second.dueAt)));
      setForm(previous => ({ ...previous, title: '', description: '', dueAt: '' }));
      setMessage('Trabalho publicado. Os alunos verão o prazo e os alertas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível publicar o trabalho.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={`space-y-6 ${isWeb ? 'px-1 py-2 md:px-2' : 'p-4'}`}>
      <header className="flex items-center gap-3"><button type="button" onClick={onBack} aria-label="Voltar ao painel" className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-200"><ArrowLeft size={20} /></button><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Área docente</p><h2 className="text-2xl font-bold text-slate-900">Trabalhos da turma</h2></div></header>

      <form onSubmit={createAssignment} className="grid gap-4 border-y border-slate-300 py-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">Matéria<select required value={form.subjectId} onChange={event => setForm({ ...form, subjectId: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5">{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Título<input required minLength={3} maxLength={140} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" placeholder="Ex.: Lista de exercícios 2" /></label>
        <label className="text-sm font-semibold text-slate-700">Prazo de entrega<input required type="datetime-local" value={form.dueAt} onChange={event => setForm({ ...form, dueAt: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2 xl:col-span-4">Orientações<textarea required minLength={3} maxLength={2000} rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5" /></label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4"><button type="submit" disabled={isSaving || subjects.length === 0} className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50"><Plus size={16} />{isSaving ? 'Publicando...' : 'Publicar trabalho'}</button>{message && <p role="status" className="text-sm text-slate-600">{message}</p>}</div>
      </form>

      <section className="space-y-3"><h3 className="font-bold text-slate-900">Trabalhos publicados</h3>{isLoading ? <p className="text-sm text-slate-500">Carregando trabalhos...</p> : assignments.length === 0 ? <p className="border-y border-slate-300 py-6 text-sm text-slate-500">Nenhum trabalho publicado ainda.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assignments.map(assignment => { const dueState = getDueState(assignment.dueAt); return <article key={assignment.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-emerald-800">{assignment.subjectName}</p><h4 className="mt-1 font-bold text-slate-900">{assignment.title}</h4></div><CalendarClock size={17} className="shrink-0 text-slate-400" /></div><p className="text-sm leading-5 text-slate-600">{assignment.description}</p><div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">Prazo: {dateTimeLabel(assignment.dueAt)}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${dueState.className}`}>{dueState.label}</span></div></article>; })}</div>}</section>
      <section className="space-y-3">
        <h3 className="font-bold text-slate-900">Entregas dos alunos</h3>
        {submissions.length === 0 ? <p className="border-y border-slate-300 py-5 text-sm text-slate-500">Nenhum arquivo recebido ainda.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{submissions.map(submission => <article key={submission.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div><p className="text-xs font-semibold text-emerald-800">{submission.subjectName}</p><h4 className="mt-1 font-bold text-slate-900">{submission.assignmentTitle}</h4><p className="mt-1 text-sm text-slate-600">{submission.studentName}</p></div>
          <ul className="space-y-2 border-t border-slate-100 pt-3">{submission.files.map(file => <li key={file.id}><button type="button" onClick={() => void downloadSubmission(submission.assignmentId, file)} className="flex w-full items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-left text-xs text-blue-700 hover:bg-blue-50"><span className="truncate">{file.fileName}</span><ArrowDownToLine size={15} className="shrink-0" /></button></li>)}</ul>
        </article>)}</div>}
      </section>
      {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    </section>
  );
}

export function StudentSchedule({ onBack, subjects, isWeb = false }: { onBack: () => void; subjects: CourseSubject[]; isWeb?: boolean }) {
  return (
    <section className={`space-y-5 ${isWeb ? 'px-1 py-2 md:px-2' : 'p-4'}`}>
      <header className="flex items-center gap-3"><button type="button" onClick={onBack} aria-label="Voltar" className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-200"><ArrowLeft size={20} /></button><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Área do aluno</p><h2 className="text-2xl font-bold text-slate-900">Minhas disciplinas</h2></div></header>
      {subjects.length === 0 ? <p className="border-y border-slate-300 py-6 text-sm text-slate-500">Nenhuma disciplina cadastrada para o período.</p> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.map(subject => <article key={subject.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{subject.name}</h3><p className="mt-1 text-sm text-slate-600">{subject.teacher}</p></div><BookOpen size={18} className="text-emerald-800" /></div><div className="border-t border-slate-100 pt-3 text-sm text-slate-600"><p><span className="font-semibold text-slate-800">Horário:</span> {subject.schedule}</p><p className="mt-1"><span className="font-semibold text-slate-800">Carga horária:</span> {subject.workload}h · {subject.credits} créditos</p></div></article>)}</div>}
    </section>
  );
}

export function StudentAssignments({ onBack, assignments, onToggleCompletion, onUploadFiles, isWeb = false }: { onBack: () => void; assignments: AssignmentRecord[]; onToggleCompletion: (assignmentId: string, completed: boolean) => Promise<void>; onUploadFiles: (assignmentId: string, files: File[]) => Promise<AssignmentSubmissionFile[]>; isWeb?: boolean }) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const upcoming = assignments.filter(item => !item.completedAt && ['Vence hoje', 'Vence amanhã'].includes(getDueState(item.dueAt).label));

  const toggle = async (item: AssignmentRecord) => {
    setMessage('');
    try { await onToggleCompletion(item.id, !item.completedAt); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o trabalho.'); }
  };

  const uploadFiles = async (item: AssignmentRecord) => {
    const files = selectedFiles[item.id] ?? [];
    if (!files.length) {
      setMessage('Selecione ao menos um arquivo para enviar.');
      return;
    }
    setUploadingId(item.id);
    setMessage('');
    try {
      await onUploadFiles(item.id, files);
      setSelectedFiles(previous => ({ ...previous, [item.id]: [] }));
      setMessage('Arquivos enviados ao professor com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível enviar os arquivos.');
    } finally {
      setUploadingId(null);
    }
  };

  const downloadFile = async (assignmentId: string, file: AssignmentSubmissionFile) => {
    const fileWindow = window.open('', '_blank');
    setMessage('');
    try {
      const { url } = await assignmentApi.getSubmissionFileUrl(assignmentId, file.id);
      if (fileWindow) fileWindow.location.href = url;
      else setMessage('O navegador bloqueou a abertura do arquivo. Permita pop-ups e tente novamente.');
    } catch (error) {
      fileWindow?.close();
      setMessage(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo.');
    }
  };

  return (
    <section className={`space-y-5 ${isWeb ? 'px-1 py-2 md:px-2' : 'p-4'}`}>
      <header className="flex items-center gap-3"><button type="button" onClick={onBack} aria-label="Voltar" className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-200"><ArrowLeft size={20} /></button><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Área do aluno</p><h2 className="text-2xl font-bold text-slate-900">Trabalhos</h2></div></header>
      {upcoming.length > 0 && <div role="alert" className="flex items-start gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-amber-950"><BellRing size={18} className="mt-0.5 shrink-0" /><div><p className="font-bold">Atenção aos prazos</p><p className="mt-1 text-sm">{upcoming.map(item => `${item.title} (${getDueState(item.dueAt).label.toLowerCase()})`).join(' · ')}</p></div></div>}
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      {assignments.length === 0 ? <p className="border-y border-slate-300 py-6 text-sm text-slate-500">Nenhum trabalho publicado para suas disciplinas.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assignments.map(item => {
        const dueState = getDueState(item.dueAt);
        const completed = Boolean(item.completedAt);
        const files = selectedFiles[item.id] ?? [];
        const submissionFiles = item.submissionFiles ?? [];
        return <article key={item.id} className={`space-y-3 rounded-lg border bg-white p-4 ${completed ? 'border-emerald-200' : 'border-slate-200'}`}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-emerald-800">{item.subjectName}</p><h3 className="mt-1 font-bold text-slate-900">{item.title}</h3></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${completed ? 'bg-emerald-100 text-emerald-800' : dueState.className}`}>{completed ? 'Concluído' : dueState.label}</span></div>
          <p className="text-sm leading-5 text-slate-600">{item.description}</p>
          <p className="text-xs text-slate-500">Entrega: {dateTimeLabel(item.dueAt)}</p>
          {submissionFiles.length > 0 && <div className="space-y-2 border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-700">Arquivos enviados</p>{submissionFiles.map(file => <button key={file.id} type="button" onClick={() => void downloadFile(item.id, file)} className="flex w-full items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-left text-xs text-blue-700 hover:bg-blue-50"><span className="truncate">{file.fileName}</span><ArrowDownToLine size={15} className="shrink-0" /></button>)}</div>}
          <label className="block text-xs font-semibold text-slate-700">Anexar arquivos (PDF, Word, Excel ou imagens; até 10 MB cada)
            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp" onChange={event => {
              const files: File[] = event.currentTarget.files ? Array.from(event.currentTarget.files) : [];
              if (files.length > 5 || files.some(file => file.size > 10 * 1024 * 1024)) {
                setMessage('Envie até 5 arquivos por vez, com no máximo 10 MB cada.');
                event.target.value = '';
                return;
              }
              setMessage('');
              setSelectedFiles(previous => ({ ...previous, [item.id]: files }));
            }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-semibold file:text-blue-700" />
          </label>
          {files.length > 0 && <p className="text-xs text-slate-500">{files.map(file => file.name).join(' · ')}</p>}
          <button type="button" disabled={uploadingId === item.id || files.length === 0} onClick={() => void uploadFiles(item)} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><Upload size={16} />{uploadingId === item.id ? 'Enviando...' : 'Enviar ao professor'}</button>
          <button type="button" onClick={() => void toggle(item)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${completed ? 'border border-slate-300 text-slate-700 hover:bg-slate-100' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'}`}>{completed ? <Circle size={16} /> : <Check size={16} />}{completed ? 'Marcar como pendente' : 'Marcar como concluído'}</button>
        </article>;
      })}</div>}
    </section>
  );
}
