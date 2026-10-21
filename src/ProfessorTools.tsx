import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Calendar, Newspaper, TrendingUp, Plus, Trash2, Check, Clock, X } from 'lucide-react';
import { academicApi } from './api';
import type { AttendanceStatus, ClassAttendanceRecord, CourseSubject, User } from './types';

interface LabReservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  labName: string;
  purpose: string;
}

interface ClassNotice {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface Report {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  data: any;
}

export function AttendanceList({ onBack, subjects, isWeb = false }: { onBack: () => void; subjects: CourseSubject[]; isWeb?: boolean }) {
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void academicApi.listStudents()
      .then(setStudents)
      .catch(loadError => setMessage(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os alunos.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!subjectId || !date) return;
    setAttendance({});
    void academicApi.listClassAttendance(subjectId)
      .then(records => {
        const todaysRecords = records.filter(record => record.date === date);
        setAttendance(Object.fromEntries(todaysRecords.map(record => [record.studentId, record.status])));
      })
      .catch(loadError => setMessage(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a chamada.'));
  }, [subjectId, date]);

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    if (!subjectId || !date || students.length === 0) return;
    setIsSaving(true);
    setMessage('');
    try {
      await academicApi.saveClassAttendance({
        subjectId,
        date,
        records: students.map(student => ({ studentId: student.id, status: attendance[student.id] ?? 'presente' })),
      });
      setMessage('Chamada salva. As faltas já aparecem no boletim do aluno.');
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a chamada.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={isWeb ? 'space-y-5 px-1 py-2 md:px-2' : 'space-y-6 p-6'}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Lista de Presença</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Matéria
          <select value={subjectId} onChange={event => setSubjectId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Data da aula
          <input type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
      </div>

      {message && <p role="status" className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      {isLoading ? <p className="text-sm text-slate-500">Carregando alunos...</p> : students.length === 0 ? <p className="text-sm text-slate-500">Nenhum aluno cadastrado.</p> : <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr><th className="px-4 py-3 font-bold">Aluno</th><th className="px-3 py-3 text-center font-bold">Presente</th><th className="px-3 py-3 text-center font-bold">Falta</th><th className="px-3 py-3 text-center font-bold">Atrasado</th></tr>
          </thead>
          <tbody>
            {students.map(student => {
              const status = attendance[student.id] ?? 'presente';
              const options: { status: AttendanceStatus; label: string; icon: React.ReactNode; color: string }[] = [
                { status: 'presente', label: 'Marcar presente', icon: <Check size={16} />, color: 'border-emerald-600 bg-emerald-600 text-white' },
                { status: 'ausente', label: 'Marcar falta', icon: <X size={16} />, color: 'border-red-600 bg-red-600 text-white' },
                { status: 'atraso', label: 'Marcar atrasado', icon: <Clock size={16} />, color: 'border-amber-500 bg-amber-500 text-white' },
              ];
              return <tr key={student.id} className="border-t border-slate-200">
                <th scope="row" className="px-4 py-3 font-semibold text-slate-900">{student.name}</th>
                {options.map(option => <td key={option.status} className="px-3 py-2 text-center">
                  <button type="button" aria-label={`${option.label}: ${student.name}`} aria-pressed={status === option.status} onClick={() => toggleAttendance(student.id, option.status)} className={`mx-auto grid size-9 place-items-center rounded-md border transition-colors ${status === option.status ? option.color : 'border-slate-300 bg-white text-slate-400 hover:bg-slate-100'}`}>
                    {option.icon}
                  </button>
                </td>)}
              </tr>;
            })}
          </tbody>
        </table>
      </div>}

      <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-100 p-3 text-sm">
        <div className="flex justify-between gap-2"><span className="font-semibold">Presentes:</span><span className="font-bold text-emerald-700">{students.filter(student => (attendance[student.id] ?? 'presente') === 'presente').length}</span></div>
        <div className="flex justify-between gap-2"><span className="font-semibold">Faltas:</span><span className="font-bold text-red-700">{students.filter(student => attendance[student.id] === 'ausente').length}</span></div>
        <div className="flex justify-between gap-2"><span className="font-semibold">Atrasados:</span><span className="font-bold text-amber-700">{students.filter(student => attendance[student.id] === 'atraso').length}</span></div>
      </div>

      <button
        onClick={() => void saveAttendance()}
        disabled={isSaving || isLoading || students.length === 0}
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-all disabled:opacity-60"
      >
        {isSaving ? 'Salvando chamada...' : 'Salvar chamada'}
      </button>
    </motion.div>
  );
}

export function LabReservation({ onBack }: { onBack: () => void }) {
  const [reservations, setReservations] = useState<LabReservation[]>([
    { id: '1', date: '2026-09-02', startTime: '10:00', endTime: '11:30', labName: 'Lab Informática 01', purpose: 'Prática de Programação' },
    { id: '2', date: '2026-09-04', startTime: '14:00', endTime: '15:30', labName: 'Lab Eletrônica 02', purpose: 'Projeto de Circuitos' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    labName: '',
    purpose: ''
  });

  const addReservation = () => {
    if (formData.date && formData.startTime && formData.endTime && formData.labName && formData.purpose) {
      setReservations([...reservations, {
        id: Date.now().toString(),
        ...formData
      }]);
      setFormData({ date: '', startTime: '', endTime: '', labName: '', purpose: '' });
      setShowForm(false);
      alert('Reserva criada com sucesso!');
    }
  };

  const deleteReservation = (id: string) => {
    setReservations(reservations.filter(r => r.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Reservar Laboratório</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Minhas Reservas</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-all"
          >
            <Plus size={16} />
            Nova Reserva
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Data"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              value={formData.labName}
              onChange={(e) => setFormData({...formData, labName: e.target.value})}
              placeholder="Nome do Laboratório"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="Propósito da Reserva"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={addReservation}
                className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700 transition-all"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-400 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {reservations.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-slate-600">Nenhuma reserva realizada</p>
            </div>
          ) : (
            reservations.map(reservation => (
              <div key={reservation.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{reservation.labName}</p>
                    <p className="text-sm text-slate-600">{reservation.purpose}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {new Date(reservation.date).toLocaleDateString('pt-BR')} - {reservation.startTime} às {reservation.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteReservation(reservation.id)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ClassNotices({ onBack }: { onBack: () => void }) {
  const [notices, setNotices] = useState<ClassNotice[]>([
    { id: '1', title: 'Prova Repositiva', content: 'A prova repositiva será no dia 10/09 às 14:00', date: '2026-09-01' },
    { id: '2', title: 'Entrega de Trabalho', content: 'Lembrar aos alunos sobre a entrega do trabalho até sexta-feira', date: '2026-08-31' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const addNotice = () => {
    if (formData.title && formData.content) {
      setNotices([...notices, {
        id: Date.now().toString(),
        title: formData.title,
        content: formData.content,
        date: new Date().toISOString().split('T')[0]
      }]);
      setFormData({ title: '', content: '' });
      setShowForm(false);
      alert('Aviso criado com sucesso!');
    }
  };

  const deleteNotice = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Avisos da Turma</h2>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-all"
        >
          <Plus size={16} />
          Novo Aviso
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Título do Aviso"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="Conteúdo do Aviso"
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={addNotice}
              className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700 transition-all"
            >
              Enviar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg hover:bg-slate-400 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-slate-600">Nenhum aviso criado</p>
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{notice.title}</p>
                  <p className="text-sm text-slate-600 mt-2">{notice.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(notice.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <button
                  onClick={() => deleteNotice(notice.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export function Reports({ onBack }: { onBack: () => void }) {
  const [reports] = useState<Report[]>([
    { id: '1', title: 'Desempenho da Turma', type: 'Geral', generatedAt: '2026-09-01', data: { average: 7.8, passed: 35, failed: 5 } },
    { id: '2', title: 'Presença por Aluno', type: 'Presença', generatedAt: '2026-08-31', data: { presentPercentage: 92 } },
  ]);

  const generateReport = () => {
    alert('Relatório gerado com sucesso!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Relatórios</h2>
      </div>

      <div className="flex justify-end">
        <button
          onClick={generateReport}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-all"
        >
          <Plus size={16} />
          Gerar Relatório
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold text-slate-900">{report.title}</p>
                <p className="text-sm text-slate-600">Tipo: {report.type}</p>
                <p className="text-xs text-slate-400 mt-2">Gerado em: {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
                <div className="mt-4 bg-slate-50 p-3 rounded-lg text-sm">
                  {Object.entries(report.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-semibold">{typeof value === 'number' ? `${value}${key.includes('Percentage') ? '%' : ''}` : value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
              >
                📥
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
