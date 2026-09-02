import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { newsApi, roomApi } from './api';
import { NewsItem, Room } from './types';

interface AdminViewProps {
  onBack: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'rooms'>('news');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 space-y-6 pb-32"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Administração</h1>
          <p className="text-sm text-slate-500">Gerenciar notícias e salas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors ${
            activeTab === 'news'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Notícias
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors ${
            activeTab === 'rooms'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Salas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'news' && <NewsManager />}
      {activeTab === 'rooms' && <RoomsManager />}
    </motion.div>
  );
}

function NewsManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    summary: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await newsApi.list();
      setNews(data);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        await newsApi.update(editingId, formData);
      } else {
        await newsApi.create(formData);
      }
      
      await loadNews();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        category: '',
        summary: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        imageUrl: '',
      });
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      alert('Erro ao salvar notícia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setFormData({
      title: item.title,
      category: item.category,
      summary: item.summary,
      content: item.content,
      date: item.date,
      imageUrl: item.imageUrl || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja deletar esta notícia?')) return;

    setIsLoading(true);
    try {
      await newsApi.delete(id);
      await loadNews();
    } catch (error) {
      console.error('Erro ao deletar notícia:', error);
      alert('Erro ao deletar notícia');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          if (!showForm) {
            setFormData({
              title: '',
              category: '',
              summary: '',
              content: '',
              date: new Date().toISOString().split('T')[0],
              imageUrl: '',
            });
          }
        }}
        className="w-full flex items-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
      >
        <Plus size={20} />
        Nova Notícia
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Título da notícia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Selecione</option>
                <option value="evento">Evento</option>
                <option value="urgente">Urgente</option>
                <option value="aviso">Aviso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Resumo</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Resumo breve"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Conteúdo</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
              placeholder="Conteúdo completo"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">URL da Imagem</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check size={20} />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-400 transition-colors"
            >
              <X size={20} />
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {isLoading && !showForm ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nenhuma notícia</div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{item.category}</span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.summary}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Deletar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    status: 'disponível',
    currentProfessor: '',
    nextClass: '',
    capacity: 30,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await roomApi.list();
      setRooms(data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        capacity: Number(formData.capacity),
        currentProfessor: formData.currentProfessor || null,
        nextClass: formData.nextClass || null,
      };

      if (editingId) {
        await roomApi.update(editingId, submitData);
      } else {
        await roomApi.create(submitData);
      }

      await loadRooms();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        building: '',
        floor: '',
        status: 'disponível',
        currentProfessor: '',
        nextClass: '',
        capacity: 30,
      });
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      alert('Erro ao salvar sala');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: Room) => {
    setFormData({
      name: item.name,
      building: item.building,
      floor: item.floor,
      status: item.status,
      currentProfessor: item.currentProfessor || '',
      nextClass: item.nextClass || '',
      capacity: item.capacity,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja deletar esta sala?')) return;

    setIsLoading(true);
    try {
      await roomApi.delete(id);
      await loadRooms();
    } catch (error) {
      console.error('Erro ao deletar sala:', error);
      alert('Erro ao deletar sala');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          if (!showForm) {
            setFormData({
              name: '',
              building: '',
              floor: '',
              status: 'disponível',
              currentProfessor: '',
              nextClass: '',
              capacity: 30,
            });
          }
        }}
        className="w-full flex items-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
      >
        <Plus size={20} />
        Nova Sala
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Sala</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Ex: Sala 301"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Bloco</label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Ex: Bloco A"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Andar</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Ex: 3º Andar"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="disponível">Disponível</option>
                <option value="ocupada">Ocupada</option>
                <option value="manutenção">Manutenção</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Capacidade</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                required
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Professor Atual</label>
            <input
              type="text"
              value={formData.currentProfessor}
              onChange={(e) => setFormData({ ...formData, currentProfessor: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Ex: Dr. Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Próxima Aula</label>
            <input
              type="text"
              value={formData.nextClass}
              onChange={(e) => setFormData({ ...formData, nextClass: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Ex: 14:00 - Matemática"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check size={20} />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-400 transition-colors"
            >
              <X size={20} />
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {isLoading && !showForm ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nenhuma sala</div>
        ) : (
          rooms.map((item) => (
            <div key={item.id} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.building} - {item.floor}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded font-bold ${
                    item.status === 'disponível'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'ocupada'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="text-sm text-slate-600 mb-3">
                <p>Capacidade: {item.capacity} pessoas</p>
                {item.currentProfessor && <p>Professor: {item.currentProfessor}</p>}
                {item.nextClass && <p>Próxima: {item.nextClass}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Deletar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
