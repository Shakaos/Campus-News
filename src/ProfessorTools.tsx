import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Calendar, Newspaper, TrendingUp, Plus, Trash2, Check, Clock } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentName: string;
  status: 'presente' | 'ausente' | 'atraso';
}

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

export function AttendanceList({ onBack }: { onBack: () => void }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: '1', studentName: 'João Silva', status: 'presente' },
    { id: '2', studentName: 'Maria Santos', status: 'presente' },
    { id: '3', studentName: 'Carlos Oliveira', status: 'atraso' },
    { id: '4', studentName: 'Ana Costa', status: 'ausente' },
    { id: '5', studentName: 'Pedro Gomes', status: 'presente' },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleAttendance = (id: string, newStatus: AttendanceRecord['status']) => {
    setAttendance(prev => 
      prev.map(record => 
        record.id === id ? { ...record, status: newStatus } : record
      )
    );
  };

  const saveAttendance = () => {
    // Here you would save to backend
    setEditingId(null);
    alert('Presença registrada com sucesso!');
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
        <h2 className="text-2xl font-bold text-slate-900">Lista de Presença - Algoritmos II</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
        <p className="font-semibold">Aula: Algoritmos II - Sala B-102</p>
        <p className="text-blue-700">Data: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="space-y-3">
        {attendance.map(record => (
          <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{record.studentName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAttendance(record.id, 'presente')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                  record.status === 'presente'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-emerald-100'
                }`}
              >
                <Check size={16} className="inline mr-1" />
                Presente
              </button>
              <button
                onClick={() => toggleAttendance(record.id, 'atraso')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                  record.status === 'atraso'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-yellow-100'
                }`}
              >
                <Clock size={16} className="inline mr-1" />
                Atraso
              </button>
              <button
                onClick={() => toggleAttendance(record.id, 'ausente')}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                  record.status === 'ausente'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-red-100'
                }`}
              >
                Ausente
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 p-4 rounded-xl space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Presentes:</span>
          <span className="text-emerald-600 font-bold">{attendance.filter(a => a.status === 'presente').length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Atrasos:</span>
          <span className="text-yellow-600 font-bold">{attendance.filter(a => a.status === 'atraso').length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Ausentes:</span>
          <span className="text-red-600 font-bold">{attendance.filter(a => a.status === 'ausente').length}</span>
        </div>
      </div>

      <button
        onClick={saveAttendance}
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-all"
      >
        Salvar Presença
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
