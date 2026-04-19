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
  Activity,
  User as UserIcon,
  Shield,
  GraduationCap,
  Key
} from 'lucide-react';
import { AppView, NewsItem, Room, QueueSector, QueueTicket, User, Role } from './types';
import { MOCK_NEWS, MOCK_ROOMS, MOCK_SECTORS } from './constants';

/*
DIAGRAMA DE CASO DE USO (Mermaid)
graph TD
    User((🧑‍🎓 Usuário))
    Admin((👨‍💼 Administrador))

    User --> ViewNews[📰 Visualizar Comunicados]
    User --> ConsultRooms[🏫 Consultar Salas]
    User --> JoinQueue[👥 Entrar na Fila]
    
    Admin --> ManageContent[📝 Gerenciar Conteúdo]
    Admin --> ViewDashboard[📊 Ver Dashboard Analítico]
    Admin --> ManageQueue[🎫 Gerenciar Fila]
*/

export default function App() {
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-login (mock)
  useEffect(() => {
    const savedUser = localStorage.getItem('campus_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setView('home');
    }
  }, []);

  const login = (role: Role) => {
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: role === 'admin' ? 'Admin Campus' : role === 'professor' ? 'Prof. Silva' : 'João Estudante',
      email: `${role}@campus.edu`,
      role
    };
    setUser(mockUser);
    localStorage.setItem('campus_user', JSON.stringify(mockUser));
    setView('home');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_user');
    setView('login');
    setIsMenuOpen(false);
  };

  // Navigation helper
  const navigate = (newView: AppView, news?: NewsItem) => {
    // Role protection
    if (newView === 'admin' && user?.role !== 'admin') return;
    if (newView === 'professor-dashboard' && user?.role !== 'professor') return;

    setView(newView);
    if (news) setSelectedNews(news);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  if (view === 'login') {
    return <LoginView onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-700/20">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold tracking-tight text-sm text-slate-900 leading-none">Campus News</h1>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{user?.role}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-900">{user.name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-black">{user.role}</span>
            </div>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 flex flex-col"
          >
            <div className="mb-10 flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
              <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white">
                <UserIcon size={24} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{user?.name}</h2>
                <p className="text-[10px] font-black uppercase text-blue-700 tracking-widest">{user?.role}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-4 flex-1">
              <MenuLink icon={<LayoutDashboard size={20} />} label="Início" onClick={() => navigate('home')} />
              <MenuLink icon={<Newspaper size={20} />} label="Campus News" onClick={() => navigate('campus-news')} />
              <MenuLink icon={<Search size={20} />} label="Consulta de Salas" onClick={() => navigate('salas')} />
              <MenuLink icon={<Users size={20} />} label="Gestão de Filas" onClick={() => navigate('filas')} />
              
              <div className="h-px bg-slate-100 my-2" />
              
              {user?.role === 'admin' && (
                <MenuLink icon={<Shield size={20} />} label="Painel Administrativo" onClick={() => navigate('admin')} />
              )}
              {user?.role === 'professor' && (
                <MenuLink icon={<GraduationCap size={20} />} label="Painel do Professor" onClick={() => navigate('professor-dashboard')} />
              )}
            </nav>

            <button 
              onClick={logout}
              className="mt-auto mb-10 flex items-center gap-4 text-red-500 font-bold p-4 hover:bg-red-50 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              Sair da Conta
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView user={user!} onNavigate={navigate} />}
          {view === 'campus-news' && <JornalView onNavigate={navigate} />}
          {view === 'noticia' && selectedNews && <NewsDetailView news={selectedNews} onBack={() => navigate('campus-news')} />}
          {view === 'salas' && <SalasView onBack={() => navigate('home')} />}
          {view === 'filas' && <FilasView onJoin={(ticket) => { setActiveTicket(ticket); navigate('acompanhamento'); }} />}
          {view === 'acompanhamento' && activeTicket && <AcompanhamentoView ticket={activeTicket} onExit={() => { setActiveTicket(null); navigate('home'); }} />}
          {view === 'admin' && <AdminView onBack={() => navigate('home')} />}
          {view === 'professor-dashboard' && <ProfessorDashboard onBack={() => navigate('home')} />}
        </AnimatePresence>
      </main>

      {/* Quick Access Bar (Optional) */}
      {view !== 'home' && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex justify-around items-center md:hidden shadow-lg"
        >
          <button onClick={() => navigate('home')} className={`p-2 transition-colors ${view === 'home' ? 'text-blue-800 bg-blue-100 rounded-xl' : 'text-slate-400 hover:text-slate-600'}`}><LayoutDashboard size={24} /></button>
          <button onClick={() => navigate('campus-news')} className={`p-2 transition-colors ${view === 'campus-news' ? 'text-blue-800 bg-blue-100 rounded-xl' : 'text-slate-400 hover:text-slate-600'}`}><Newspaper size={24} /></button>
          <button onClick={() => navigate('salas')} className={`p-2 transition-colors ${view === 'salas' ? 'text-blue-800 bg-blue-100 rounded-xl' : 'text-slate-400 hover:text-slate-600'}`}><Search size={24} /></button>
          <button onClick={() => navigate('filas')} className={`p-2 transition-colors ${view === 'filas' || view === 'acompanhamento' ? 'text-blue-800 bg-blue-100 rounded-xl' : 'text-slate-400 hover:text-slate-600'}`}><Users size={24} /></button>
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
      className="flex items-center gap-4 text-xl font-bold p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-800 text-left active:scale-[0.98]"
    >
      <div className="w-10 h-10 bg-blue-700/10 rounded-xl flex items-center justify-center text-blue-800">
        {icon}
      </div>
      {label}
    </button>
  );
}

function HomeView({ user, onNavigate }: { user: User, onNavigate: (v: AppView, n?: NewsItem) => void }) {
  const isProfessor = user.role === 'professor';
  const isAdmin = user.role === 'admin';

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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-700 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-700/30">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Campus Online
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-5xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Olá,<br />
            <span className="text-blue-800">{user.name.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium tracking-tight">
            {isAdmin ? 'Controle total do campus.' : isProfessor ? 'Gerencie suas aulas e salas.' : 'Seu dia no campus começa aqui.'}
          </p>
        </div>
      </div>

      {/* Urgent Highlight - More Striking */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        onClick={() => onNavigate('campus-news')}
        className="group relative overflow-hidden bg-red-100 p-px rounded-[32px] cursor-pointer ring-1 ring-red-200 shadow-sm"
      >
        <div className="bg-red-50/50 p-6 rounded-[31px] border border-red-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
            <AlertCircle size={140} className="text-red-600 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-red-600">Destaque Urgente</h3>
            </div>
            <p className="font-bold text-xl leading-tight text-slate-800 group-hover:text-red-700 transition-colors">
              Manutenção no Bloco B: Aulas realocadas para o Bloco C hoje.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 group-hover:text-red-700 transition-colors">
              Toque para ver detalhes
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modules Grid - Bento Style */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Acesso Rápido</h3>
          <div className="h-px flex-1 bg-slate-200 mx-4" />
        </div>
        
        <div className="grid gap-5">
          {isAdmin ? (
            <ModuleCard 
              icon={<Shield />}
              title="Administração"
              description="Gerenciar notícias, filas e usuários."
              onClick={() => onNavigate('admin')}
              color="bg-slate-900 text-white"
              iconColor="text-white"
            />
          ) : isProfessor ? (
            <ModuleCard 
              icon={<GraduationCap />}
              title="Minhas Aulas"
              description="Status de salas e horários."
              onClick={() => onNavigate('professor-dashboard')}
              color="bg-blue-900 text-white"
              iconColor="text-white"
            />
          ) : (
            <ModuleCard 
              icon={<Newspaper />}
              title="Campus News"
              description="Fique por dentro de eventos e avisos."
              onClick={() => onNavigate('campus-news')}
              color="bg-blue-700/10"
              iconColor="text-blue-800"
            />
          )}

          <div className="grid grid-cols-2 gap-5">
            <ModuleCard 
              icon={<Search />}
              title="Salas"
              description="Status atual"
              onClick={() => onNavigate('salas')}
              color="bg-emerald-700/10"
              iconColor="text-emerald-700"
              compact
            />
            <ModuleCard 
              icon={<Users />}
              title="Filas"
              description="Senha virtual"
              onClick={() => onNavigate('filas')}
              color="bg-orange-700/10"
              iconColor="text-orange-700"
              compact
            />
          </div>
        </div>
      </div>

      {/* Campus Pulse - New Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-[32px] space-y-4 shadow-sm">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity size={12} className="text-blue-800" />
          Campus Pulse
        </h3>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter text-slate-900">85%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ocupação</div>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter text-slate-900">12 min</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Espera Média</div>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="space-y-1">
            <div className="text-2xl font-black tracking-tighter text-slate-900">04</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Eventos</div>
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
  color = "bg-slate-100",
  iconColor = "text-blue-800",
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
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden ${compact ? 'flex flex-col justify-between h-48' : ''}`}
    >
      {/* Decorative Background Element */}
      <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 scale-50 group-hover:scale-100 ${color}`} />
      
      <div className="space-y-5 relative z-10">
        <div className={`p-4 ${color} rounded-2xl inline-flex group-hover:rotate-6 transition-transform duration-300 ${iconColor}`}>
          {React.cloneElement(icon as React.ReactElement, { size: compact ? 20 : 24 })}
        </div>
        <div className="space-y-1">
          <h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-black tracking-tight text-slate-900 group-hover:text-blue-800 transition-colors`}>
            {title}
          </h3>
          <p className={`text-sm font-medium leading-tight ${compact ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
          </p>
        </div>
      </div>
      
      {!compact && (
        <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 group-hover:text-blue-800 transition-all">
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
        <button onClick={() => onNavigate('home')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Campus News</h2>
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
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all hover:-translate-y-1"
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
      <div className="p-4 space-y-2 relative bg-white/90 backdrop-blur-sm">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
          news.category === 'urgente' ? 'bg-red-50 text-red-600 border border-red-100' : 
          news.category === 'evento' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {news.category}
        </span>
        <h3 className="font-bold text-lg leading-tight text-slate-900">{news.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{news.summary}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Calendar size={12} className="text-blue-700" />
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
      className="bg-slate-100 min-h-screen text-slate-900"
    >
      <div className="relative h-64">
        <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-slate-800 transition-colors hover:bg-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-md inline-block">
          {news.category}
        </span>
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">{news.title}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Calendar size={16} className="text-blue-700" />
          {new Date(news.date).toLocaleDateString('pt-BR')}
        </div>
        <div className="h-px bg-slate-200 my-4" />
        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">{news.content}</p>
        
        {news.category === 'evento' && (
          <button className="w-full bg-blue-700 text-white py-5 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-700/30 hover:scale-[1.01] active:scale-[0.99] mt-8 uppercase tracking-widest text-xs">
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
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Consulta de Salas</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar por sala ou bloco..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/10 text-slate-800 transition-all placeholder:text-slate-400 shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{room.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin size={12} className="text-blue-800" />
                  {room.building} • {room.floor}
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                room.status === 'disponível' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                room.status === 'ocupada' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {room.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Capacidade</span>
                <p className="text-sm font-semibold text-slate-700">{room.capacity} pessoas</p>
              </div>
              {room.currentProfessor && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Professor Atual</span>
                  <p className="text-sm font-semibold text-slate-700">{room.currentProfessor}</p>
                </div>
              )}
            </div>
            
            {room.nextClass && (
              <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                <Clock size={14} className="text-blue-800" />
                <span className="text-xs text-slate-600 font-medium">Próxima aula: <span className="text-slate-900 font-bold">{room.nextClass}</span></span>
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
        <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Filas</h2>
      </div>

      <p className="text-slate-500 font-medium">Selecione o setor que deseja atendimento para entrar na fila virtual.</p>

      <div className="space-y-4">
        {MOCK_SECTORS.map((sector) => (
          <button 
            key={sector.id}
            onClick={() => setSelectedSector(sector.id)}
            className={`w-full text-left p-6 rounded-2xl border transition-all ${
              selectedSector === sector.id 
                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-lg ${selectedSector === sector.id ? 'text-blue-700' : 'text-slate-900'}`}>{sector.name}</h3>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${selectedSector === sector.id ? 'bg-blue-200/50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                <Users size={14} />
                {sector.waitingCount} em espera
              </div>
            </div>
            <p className={`text-sm mb-4 leading-relaxed ${selectedSector === sector.id ? 'text-blue-600/80' : 'text-slate-500'}`}>
              {sector.description}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-800" />
                <span className={`text-xs font-bold ${selectedSector === sector.id ? 'text-blue-900' : 'text-slate-600'}`}>~{sector.averageServiceTime} min/atend.</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button 
        disabled={!selectedSector}
        onClick={handleJoin}
        className="w-full bg-blue-700 text-white py-5 rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-800 transition-all mt-4 sticky bottom-6 shadow-xl shadow-blue-700/20 uppercase tracking-widest text-xs"
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 space-y-8 text-center"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Atendimento</h2>
        <p className="text-slate-500 font-medium">{sector.name}</p>
      </div>

      <div className="bg-white p-10 rounded-[44px] border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-700" />
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sua Senha</span>
          <div className="text-8xl font-black tracking-tighter text-blue-700">{ticket.number}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Posição</span>
            <div className="text-2xl font-black text-slate-900">{ticket.position}º</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo Est.</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{ticket.estimatedTime} <span className="text-sm font-bold text-slate-400">min</span></div>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 p-6 rounded-3xl border border-blue-200 flex items-center gap-4 text-left">
        <div className="p-3 bg-blue-200 rounded-xl text-blue-800">
          <AlertCircle size={24} />
        </div>
        <p className="text-[13px] text-blue-900 leading-relaxed font-bold">
          Fique atento às telas no local. Você será chamado em breve!
        </p>
      </div>

      <button 
        onClick={onExit}
        className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
      >
        Sair da Fila
      </button>
    </motion.div>
  );
}

function AdminView({ onBack }: { onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="p-6 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Admin</h2>
        </div>
        <button className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><LogOut size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Users size={16} />} label="Total Hoje" value="248" trend="+12%" />
        <StatCard icon={<Clock size={16} />} label="Espera Média" value="14 min" trend="-2m" />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2 text-slate-900">
            <TrendingUp size={18} className="text-emerald-700" />
            Fluxo por Horário
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimas 24h</span>
        </div>
        
        <div className="h-40 flex items-end justify-between gap-2">
          {[40, 65, 80, 45, 30, 90, 70, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={`w-full rounded-t-lg ${h > 75 ? 'bg-red-500' : 'bg-blue-700'}`}
              />
              <span className="text-[8px] font-black text-slate-300">{8 + i*2}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-2">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <AdminActionButton label="Nova Notícia" color="bg-blue-100 text-blue-800 border border-blue-200" />
          <AdminActionButton label="Gerenciar Salas" color="bg-emerald-100 text-emerald-800 border border-emerald-200" />
          <AdminActionButton label="Relatórios PDF" color="bg-slate-100 text-slate-600 border border-slate-200" />
          <AdminActionButton label="Configurações" color="bg-slate-100 text-slate-600 border border-slate-200" />
        </div>
      </div>

      <button className="w-full py-5 text-red-600 font-bold border border-red-200 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors uppercase tracking-widest text-[10px]">
        Encerrar Sessão
      </button>
    </motion.div>
  );
}

function AdminActionButton({ label, color, icon }: { label: string, color: string, icon?: React.ReactNode }) {
  return (
    <button className={`p-4 ${color} rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all text-left shadow-sm flex flex-col gap-2`}>
      {icon && <div className="opacity-80">{icon}</div>}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 shrink-0">
      <div className="flex items-center justify-between text-slate-400">
        <div className="text-blue-700">{icon}</div>
        <span className={`text-[10px] font-black tracking-widest border px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'text-emerald-700 border-emerald-200 bg-emerald-100' : 'text-blue-700 border-blue-200 bg-blue-100'}`}>{trend}</span>
      </div>
      <div className="text-2xl font-black tracking-tighter text-slate-900">{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">{label}</div>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: (role: Role) => void }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Decorative Elemets */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-32 -mb-32" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-700/40">
            <Key size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Campus<br/><span className="text-blue-500">Access</span></h1>
          <p className="text-slate-400 font-medium">Selecione seu perfil para entrar</p>
        </div>

        <div className="space-y-4">
          <LoginOption 
            icon={<Shield size={24} />} 
            label="Administrador" 
            desc="Gestão e Monitoramento" 
            color="bg-slate-800 hover:bg-slate-700 border-slate-700" 
            onClick={() => onLogin('admin')} 
          />
          <LoginOption 
            icon={<GraduationCap size={24} />} 
            label="Professor" 
            desc="Salas e Avaliações" 
            color="bg-blue-800 hover:bg-blue-700 border-blue-700" 
            onClick={() => onLogin('professor')} 
          />
          <LoginOption 
            icon={<Users size={24} />} 
            label="Aluno" 
            desc="Serviços e Avisos" 
            color="bg-white/10 hover:bg-white/20 border-white/10" 
            onClick={() => onLogin('aluno')} 
          />
        </div>

        <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          v2.4.0 • Segurança Criptografada
        </p>
      </motion.div>
    </div>
  );
}

function LoginOption({ icon, label, desc, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-5 rounded-3xl border flex items-center gap-4 transition-all active:scale-95 ${color} text-left group`}
    >
      <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg leading-none mb-1">{label}</h3>
        <p className="text-xs opacity-60 font-medium">{desc}</p>
      </div>
      <ChevronRight size={20} className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function ProfessorDashboard({ onBack }: { onBack: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-8"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Painel do Professor</h2>
      </div>

      <div className="bg-blue-900 text-white p-8 rounded-[40px] space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="space-y-1">
          <h3 className="text-3xl font-black tracking-tight">Sala B-102</h3>
          <p className="opacity-70 font-bold uppercase text-[10px] tracking-widest">Aula Atual: Algoritmos II</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase opacity-60">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-bold">Em Aula</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase opacity-60">Alunos</span>
            <div className="font-bold">32 / 40</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Clock size={16} />} label="Tempo Restante" value="45m" trend="Ontime" />
        <StatCard icon={<Search size={16} />} label="Salas do Bloco" value="08 Free" trend="Live" />
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-2">Ferramentas Docentes</h3>
        <div className="grid grid-cols-2 gap-3">
          <AdminActionButton label="Lista Presença" color="bg-white border-slate-200 text-slate-900" icon={<Users size={16} />} />
          <AdminActionButton label="Reservar Lab" color="bg-white border-slate-200 text-slate-900" icon={<Calendar size={16} />} />
          <AdminActionButton label="Avisos Turma" color="bg-white border-slate-200 text-slate-900" icon={<Newspaper size={16} />} />
          <AdminActionButton label="Relatórios" color="bg-white border-slate-200 text-slate-900" icon={<TrendingUp size={16} />} />
        </div>
      </div>
    </motion.div>
  );
}
