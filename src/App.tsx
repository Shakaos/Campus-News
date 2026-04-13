/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Newspaper, 
  Search, 
  Users, 
  ArrowLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Calendar, 
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Activity
} from 'lucide-react';
import { AppView, NewsItem, Room, QueueSector, QueueTicket } from './types';
import { MOCK_NEWS, MOCK_ROOMS, MOCK_SECTORS } from './constants';

/*
DIAGRAMA DE CASO DE USO (Mermaid)
graph TD
    Aluno((Aluno))
    Prof((Professor))
    Admin((Administrador))

    Aluno --> ViewNews[Visualizar Comunicados]
    Aluno --> ConsultRooms[Consultar Salas]
    Aluno --> JoinQueue[Entrar na Fila]
    
    Prof --> ConsultRooms
    
    Admin --> ManageContent[Gerenciar Conteúdo]
    Admin --> ViewDashboard[Ver Dashboard Analítico]
    Admin --> ManageQueue[Gerenciar Fila]
*/

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation helper
  const navigate = (newView: AppView, news?: NewsItem) => {
    setView(newView);
    if (news) setSelectedNews(news);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#141414]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <div className="w-8 h-8 bg-[#141414] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <h1 className="font-bold tracking-tight text-lg">Campus News</h1>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6"
          >
            <nav className="flex flex-col gap-6">
              <MenuLink icon={<LayoutDashboard size={20} />} label="Home" onClick={() => navigate('home')} />
              <MenuLink icon={<Newspaper size={20} />} label="Campus News" onClick={() => navigate('campus-news')} />
              <MenuLink icon={<Search size={20} />} label="Consulta de Salas" onClick={() => navigate('salas')} />
              <MenuLink icon={<Users size={20} />} label="Gestão de Filas" onClick={() => navigate('filas')} />
              <div className="h-px bg-gray-100 my-2" />
              <MenuLink icon={<Activity size={20} />} label="Admin Dashboard" onClick={() => navigate('admin')} />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView onNavigate={navigate} />}
          {view === 'campus-news' && <JornalView onNavigate={navigate} />}
          {view === 'noticia' && selectedNews && <NewsDetailView news={selectedNews} onBack={() => navigate('campus-news')} />}
          {view === 'salas' && <SalasView onBack={() => navigate('home')} />}
          {view === 'filas' && <FilasView onJoin={(ticket) => { setActiveTicket(ticket); navigate('acompanhamento'); }} />}
          {view === 'acompanhamento' && activeTicket && <AcompanhamentoView ticket={activeTicket} onExit={() => { setActiveTicket(null); navigate('home'); }} />}
          {view === 'admin' && <AdminView onBack={() => navigate('home')} />}
        </AnimatePresence>
      </main>

      {/* Quick Access Bar (Optional) */}
      {view !== 'home' && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center md:hidden"
        >
          <button onClick={() => navigate('home')} className={`p-2 ${view === 'home' ? 'text-black' : 'text-gray-400'}`}><LayoutDashboard size={24} /></button>
          <button onClick={() => navigate('campus-news')} className={`p-2 ${view === 'campus-news' ? 'text-black' : 'text-gray-400'}`}><Newspaper size={24} /></button>
          <button onClick={() => navigate('salas')} className={`p-2 ${view === 'salas' ? 'text-black' : 'text-gray-400'}`}><Search size={24} /></button>
          <button onClick={() => navigate('filas')} className={`p-2 ${view === 'filas' || view === 'acompanhamento' ? 'text-black' : 'text-gray-400'}`}><Users size={24} /></button>
        </motion.div>
      )}
    </div>
  );
}

// --- Sub-components ---

function MenuLink({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 text-xl font-medium text-gray-800 hover:text-black transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}

function HomeView({ onNavigate }: { onNavigate: (v: AppView, n?: NewsItem) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-6 space-y-12"
    >
      {/* Header Greeting */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/20">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Campus Online
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-[#141414]">
            Olá,<br />
            <span className="text-gray-300">Estudante</span>
          </h2>
          <p className="text-gray-400 text-lg font-medium tracking-tight">
            Seu dia no campus começa aqui.
          </p>
        </div>
      </div>

      {/* Urgent Highlight - More Striking */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        onClick={() => onNavigate('campus-news')}
        className="group relative overflow-hidden bg-red-50 p-1 rounded-[32px] cursor-pointer"
      >
        <div className="bg-white p-6 rounded-[31px] border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <AlertCircle size={140} className="text-red-600 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-red-500">Urgente</h3>
            </div>
            <p className="font-bold text-xl leading-tight text-gray-900 group-hover:text-red-600 transition-colors">
              Manutenção no Bloco B: Aulas realocadas para o Bloco C hoje.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-red-500/60 group-hover:text-red-500 transition-colors">
              Toque para ver detalhes
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modules Grid - Bento Style */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Serviços</h3>
          <div className="h-px flex-1 bg-gray-100 mx-4" />
        </div>
        
        <div className="grid gap-5">
          <ModuleCard 
            icon={<Newspaper className="text-blue-600" />}
            title="Campus News"
            description="Fique por dentro de eventos, editais e avisos importantes."
            onClick={() => onNavigate('campus-news')}
            color="bg-blue-50"
            iconColor="text-blue-600"
          />
          <div className="grid grid-cols-2 gap-5">
            <ModuleCard 
              icon={<Search className="text-green-600" />}
              title="Salas"
              description="Status em tempo real"
              onClick={() => onNavigate('salas')}
              color="bg-green-50"
              iconColor="text-green-600"
              compact
            />
            <ModuleCard 
              icon={<Users className="text-orange-600" />}
              title="Filas"
              description="Senha virtual"
              onClick={() => onNavigate('filas')}
              color="bg-orange-50"
              iconColor="text-orange-600"
              compact
            />
          </div>
        </div>
      </div>

      {/* Campus Pulse - New Section */}
      <div className="bg-gray-100/50 p-6 rounded-[32px] space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Activity size={12} />
          Campus Pulse
        </h3>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter">85%</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Ocupação Média</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter">12 min</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Espera Média</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter">04</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Eventos Hoje</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModuleCard({ 
  icon, 
  title, 
  description, 
  onClick, 
  color = "bg-gray-50",
  iconColor = "text-gray-600",
  compact = false 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  onClick: () => void,
  color?: string,
  iconColor?: string,
  compact?: boolean
}) {
  return (
    <motion.button 
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group relative overflow-hidden ${compact ? 'flex flex-col justify-between h-48' : ''}`}
    >
      {/* Decorative Background Element */}
      <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-0 group-hover:opacity-[0.07] transition-all duration-500 scale-50 group-hover:scale-100 ${color}`} />
      
      <div className="space-y-5 relative z-10">
        <div className={`p-4 ${color} rounded-2xl inline-flex group-hover:rotate-6 transition-transform duration-300`}>
          {React.cloneElement(icon as React.ReactElement, { size: compact ? 20 : 24 })}
        </div>
        <div className="space-y-1">
          <h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-black tracking-tight group-hover:text-black transition-colors`}>
            {title}
          </h3>
          <p className={`text-sm font-medium leading-tight ${compact ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-black transition-all">
          Acessar módulo
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.button>
  );
}

function JornalView({ onNavigate }: { onNavigate: (v: AppView, n?: NewsItem) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('home')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold">Campus News</h2>
      </div>

      <div className="space-y-4">
        {MOCK_NEWS.map((news) => (
          <NewsCard 
            key={news.id} 
            news={news} 
            onClick={() => onNavigate('noticia', news)} 
          />
        ))}
      </div>
    </motion.div>
  );
}

interface NewsCardProps {
  news: NewsItem;
  onClick: () => void;
  key?: string | number;
}

function NewsCard({ news, onClick }: NewsCardProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Efeito de parallax sutil: move a imagem de -20px a 20px conforme o scroll
  const y = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  return (
    <div 
      ref={ref}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      {news.imageUrl && (
        <div className="h-40 overflow-hidden relative">
          <motion.img 
            src={news.imageUrl} 
            alt={news.title} 
            style={{ y, scale: 1.2 }} // Escala maior para evitar bordas vazias durante o parallax
            className="w-full h-full object-cover absolute inset-0" 
            referrerPolicy="no-referrer" 
          />
        </div>
      )}
      <div className="p-4 space-y-2 relative bg-white">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
          news.category === 'urgente' ? 'bg-red-100 text-red-600' : 
          news.category === 'evento' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {news.category}
        </span>
        <h3 className="font-bold text-lg leading-tight">{news.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{news.summary}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
          <Calendar size={12} />
          {new Date(news.date).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
}

function NewsDetailView({ news, onBack }: { news: NewsItem, onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white min-h-screen"
    >
      <div className="relative h-64">
        <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-md">
          {news.category}
        </span>
        <h2 className="text-3xl font-bold leading-tight">{news.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar size={16} />
          {new Date(news.date).toLocaleDateString('pt-BR')}
        </div>
        <div className="h-px bg-gray-100 my-4" />
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{news.content}</p>
        
        {news.category === 'evento' && (
          <button className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors mt-8">
            Inscrever-se no Evento
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SalasView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState('');
  
  const filteredRooms = MOCK_ROOMS.filter(r => 
    r.name.toLowerCase().includes(filter.toLowerCase()) || 
    r.building.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold">Consulta de Salas</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar por sala ou bloco..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{room.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin size={12} />
                  {room.building} • {room.floor}
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                room.status === 'disponível' ? 'bg-green-100 text-green-600' : 
                room.status === 'ocupada' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
              }`}>
                {room.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Capacidade</span>
                <p className="text-sm font-medium">{room.capacity} pessoas</p>
              </div>
              {room.currentProfessor && (
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Professor Atual</span>
                  <p className="text-sm font-medium">{room.currentProfessor}</p>
                </div>
              )}
            </div>
            
            {room.nextClass && (
              <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">Próxima: {room.nextClass}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FilasView({ onJoin }: { onJoin: (t: QueueTicket) => void }) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const handleJoin = () => {
    if (!selectedSector) return;
    const sector = MOCK_SECTORS.find(s => s.id === selectedSector)!;
    
    const ticket: QueueTicket = {
      id: Math.random().toString(36).substr(2, 9),
      sectorId: selectedSector,
      number: sector.currentNumber + sector.waitingCount + 1,
      position: sector.waitingCount + 1,
      estimatedTime: (sector.waitingCount + 1) * sector.averageServiceTime,
      timestamp: new Date().toISOString()
    };
    
    onJoin(ticket);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold">Gestão de Filas</h2>
      </div>

      <p className="text-gray-500">Selecione o setor que deseja atendimento para entrar na fila virtual.</p>

      <div className="space-y-4">
        {MOCK_SECTORS.map((sector) => (
          <button 
            key={sector.id}
            onClick={() => setSelectedSector(sector.id)}
            className={`w-full text-left p-5 rounded-2xl border transition-all ${
              selectedSector === sector.id ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-black'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{sector.name}</h3>
              <div className={`flex items-center gap-1 text-xs ${selectedSector === sector.id ? 'text-gray-400' : 'text-gray-500'}`}>
                <Users size={14} />
                {sector.waitingCount} em espera
              </div>
            </div>
            <p className={`text-sm mb-4 ${selectedSector === sector.id ? 'text-gray-400' : 'text-gray-500'}`}>
              {sector.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className={selectedSector === sector.id ? 'text-gray-400' : 'text-gray-400'} />
                <span className="text-xs font-bold">~{sector.averageServiceTime} min/atend.</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button 
        disabled={!selectedSector}
        onClick={handleJoin}
        className="w-full bg-[#141414] text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-all mt-4 sticky bottom-6 shadow-xl"
      >
        Entrar na Fila
      </button>
    </motion.div>
  );
}

function AcompanhamentoView({ ticket, onExit }: { ticket: QueueTicket, onExit: () => void }) {
  const sector = MOCK_SECTORS.find(s => s.id === ticket.sectorId)!;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="p-6 space-y-8 text-center"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Seu Atendimento</h2>
        <p className="text-gray-500">{sector.name}</p>
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-black" />
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Sua Senha</span>
          <div className="text-6xl font-black tracking-tighter">{ticket.number}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Posição</span>
            <div className="text-xl font-bold">{ticket.position}º</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Espera Est.</span>
            <div className="text-xl font-bold">{ticket.estimatedTime} min</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 text-left">
        <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Você receberá uma notificação quando faltarem 2 pessoas para sua vez. 
          Certifique-se de estar próximo ao setor.
        </p>
      </div>

      <button 
        onClick={onExit}
        className="w-full border-2 border-red-100 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-50 transition-colors"
      >
        Sair da Fila
      </button>
    </motion.div>
  );
}

function AdminView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-6 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
          <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        </div>
        <button className="p-2 text-red-500 hover:bg-red-50 rounded-full"><LogOut size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Users size={16} />} label="Total Hoje" value="248" trend="+12%" />
        <StatCard icon={<Clock size={16} />} label="Espera Média" value="14 min" trend="-2m" />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Fluxo por Horário
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Últimas 24h</span>
        </div>
        
        <div className="h-40 flex items-end justify-between gap-2">
          {[40, 65, 80, 45, 30, 90, 70, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={`w-full rounded-t-lg ${h > 75 ? 'bg-red-400' : 'bg-gray-200'}`}
              />
              <span className="text-[8px] font-bold text-gray-400">{8 + i*2}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-4 bg-gray-50 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors text-left">
            Nova Notícia
          </button>
          <button className="p-4 bg-gray-50 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors text-left">
            Gerenciar Salas
          </button>
          <button className="p-4 bg-gray-50 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors text-left">
            Relatórios PDF
          </button>
          <button className="p-4 bg-gray-50 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors text-left">
            Configurações
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-gray-400">
        {icon}
        <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-blue-500'}`}>{trend}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
    </div>
  );
}
