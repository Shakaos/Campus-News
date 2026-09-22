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
  Key,
  Sun,
  Moon
} from 'lucide-react';
import { AppView, NewsItem, Room, QueueSector, QueueTicket, User, CourseSubject, GradeRecord } from './types';
import { authApi, newsApi, queueApi, roomApi } from './api';
import { AdminView } from './AdminView';
import { AttendanceList, LabReservation, ClassNotices, Reports } from './ProfessorTools';
import { ErrorBoundary, ErrorAlert } from './ErrorBoundary';
import { useError } from './hooks';

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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sectors, setSectors] = useState<QueueSector[]>([]);
  const [subjects, setSubjects] = useState<CourseSubject[]>(() => {
    const saved = localStorage.getItem('campus_subjects');
    if (saved) {
      try {
        return JSON.parse(saved) as CourseSubject[];
      } catch {
        localStorage.removeItem('campus_subjects');
      }
    }

    return [
      { id: 'alg', name: 'Algoritmos II', teacher: 'Prof. Souza', schedule: 'Ter e Qui • 08:00', workload: 80, credits: 4 },
      { id: 'bd', name: 'Banco de Dados', teacher: 'Prof. Lima', schedule: 'Seg e Qua • 10:00', workload: 80, credits: 4 },
      { id: 'eng', name: 'Engenharia de Software', teacher: 'Prof. Rocha', schedule: 'Qua e Sex • 14:00', workload: 60, credits: 3 }
    ];
  });
  const [grades, setGrades] = useState<GradeRecord[]>(() => {
    const saved = localStorage.getItem('campus_grades');
    if (saved) {
      try {
        return JSON.parse(saved) as GradeRecord[];
      } catch {
        localStorage.removeItem('campus_grades');
      }
    }

    return [
      { id: 'g1', studentId: 'me', studentName: 'Aluno', subjectId: 'alg', subjectName: 'Algoritmos II', value: 8.4, period: '1º Bimestre', status: 'Aprovado' },
      { id: 'g2', studentId: 'me', studentName: 'Aluno', subjectId: 'bd', subjectName: 'Banco de Dados', value: 7.1, period: '1º Bimestre', status: 'Aprovado' },
      { id: 'g3', studentId: 'me', studentName: 'Aluno', subjectId: 'eng', subjectName: 'Engenharia de Software', value: 6.3, period: '1º Bimestre', status: 'Recuperação' }
    ];
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('campus_theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const { error, showError, clearError } = useError();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('campus_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('campus_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('campus_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    const boot = async () => {
      const savedToken = localStorage.getItem('campus_token');
      const savedUser = localStorage.getItem('campus_user');

      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser) as User;
          setUser(userData);
          setView('home');
        } catch {
          localStorage.removeItem('campus_token');
          localStorage.removeItem('campus_user');
        }
      }

      try {
        const [newsData, roomsData, sectorsData] = await Promise.all([
          newsApi.list(),
          roomApi.list(),
          queueApi.list(),
        ]);

        setNews(newsData);
        setRooms(roomsData);
        setSectors(sectorsData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
        showError(message);
      }
    };

    void boot();
  }, [showError]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      const nextUser: User = response.user;
      setUser(nextUser);
      localStorage.setItem('campus_token', response.token);
      localStorage.setItem('campus_user', JSON.stringify(nextUser));
      setView('home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      showError(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_token');
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
    return (
      <ErrorBoundary>
        <LoginView onLogin={login} onRegister={async (name, email, password) => {
          const response = await authApi.register(name, email, password);
          setUser(response.user);
          localStorage.setItem('campus_token', response.token);
          localStorage.setItem('campus_user', JSON.stringify(response.user));
          setView('home');
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        {/* Error Alert */}
        {error && (
          <div className="fixed top-4 right-4 z-[100] max-w-md">
            <ErrorAlert message={error} onDismiss={clearError} />
          </div>
        )}

        {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-100">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-700/20">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold tracking-tight text-sm text-slate-900 leading-none dark:text-white">Campus News</h1>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">{user?.role}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
              <span className="text-[10px] text-slate-500 uppercase font-black dark:text-slate-300">{user.role}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full transition-colors text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
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
      <main className="max-w-md mx-auto pb-20 dark:bg-slate-950">
        <AnimatePresence mode="wait">
          {view === 'home' && <HomeView user={user!} onNavigate={navigate} />}
          {view === 'campus-news' && <JornalView onNavigate={navigate} news={news} />}
          {view === 'noticia' && selectedNews && <NewsDetailView news={selectedNews} onBack={() => navigate('campus-news')} />}
          {view === 'salas' && <SalasView rooms={rooms} onBack={() => navigate('home')} />}
          {view === 'filas' && <FilasView sectors={sectors} onBack={() => navigate('home')} onJoin={async (ticket) => { setActiveTicket(ticket); navigate('acompanhamento'); }} />}
          {view === 'acompanhamento' && activeTicket && <AcompanhamentoView sectors={sectors} ticket={activeTicket} onExit={() => { setActiveTicket(null); navigate('home'); }} />}
          {view === 'admin' && <AdminView onBack={() => navigate('home')} />}
          {view === 'professor-dashboard' && <ProfessorDashboard onBack={() => navigate('home')} onSelectTool={(tool) => navigate(tool as AppView)} />}
          {view === 'professor-attendance' && <AttendanceList onBack={() => navigate('professor-dashboard')} />}
          {view === 'professor-lab' && <LabReservation onBack={() => navigate('professor-dashboard')} />}
          {view === 'professor-notices' && <ClassNotices onBack={() => navigate('professor-dashboard')} />}
          {view === 'professor-reports' && <Reports onBack={() => navigate('professor-dashboard')} />}
          {view === 'professor-grades' && <ProfessorGradesView onBack={() => navigate('professor-dashboard')} grades={grades} setGrades={setGrades} subjects={subjects} />}
          {view === 'student-performance' && <StudentPerformanceView onBack={() => navigate('home')} userName={user?.name ?? 'Aluno'} grades={grades} subjects={subjects} />}
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
      </div>
    </ErrorBoundary>
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
            <>
              <ModuleCard
                icon={<Newspaper />}
                title="Campus News"
                description="Fique por dentro de eventos e avisos."
                onClick={() => onNavigate('campus-news')}
                color="bg-blue-700/10"
                iconColor="text-blue-800"
              />
              <ModuleCard
                icon={<TrendingUp />}
                title="Desempenho"
                description="Veja suas matérias e notas."
                onClick={() => onNavigate('student-performance')}
                color="bg-emerald-700/10"
                iconColor="text-emerald-700"
              />
            </>
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

function JornalView({ onNavigate, news }: { onNavigate: (v: AppView, n?: NewsItem) => void, news: NewsItem[] }) {
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
        {news.map((newsItem) => (
          <NewsCard 
            key={newsItem.id} 
            news={newsItem} 
            onClick={() => onNavigate('noticia', newsItem)} 
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEventSubscription = async () => {
    setIsLoading(true);
    try {
      // Simular inscrição em evento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubscribed(true);
      alert('Inscrição realizada com sucesso! Você receberá um email de confirmação.');
    } catch (error) {
      console.error('Erro ao se inscrever:', error);
      alert('Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <button 
            onClick={handleEventSubscription}
            disabled={isSubscribed || isLoading}
            className={`w-full py-5 rounded-2xl font-bold transition-all shadow-lg uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-[0.99] ${
              isSubscribed 
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 cursor-default'
                : 'bg-blue-700 text-white shadow-blue-700/30 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processando...' : isSubscribed ? '✓ Inscrito no Evento' : 'Inscrever-se no Evento'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SalasView({ rooms, onBack }: { rooms: Room[], onBack: () => void }) {
  const [filter, setFilter] = useState('');
  
  const filteredRooms = rooms.filter(r => 
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

function FilasView({ sectors, onJoin, onBack }: { sectors: QueueSector[], onJoin: (t: QueueTicket) => void, onBack: () => void }) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!selectedSector) return;

    try {
      const ticket = await queueApi.enter(selectedSector);
      onJoin(ticket);
    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      alert(error instanceof Error ? error.message : 'Erro ao entrar na fila.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Filas</h2>
      </div>

      <p className="text-slate-500 font-medium">Selecione o setor que deseja atendimento para entrar na fila virtual.</p>

      <div className="space-y-4">
        {sectors.map((sector) => (
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

function AcompanhamentoView({ sectors, ticket, onExit }: { sectors: QueueSector[], ticket: QueueTicket, onExit: () => void }) {
  const sector = useMemo(() => {
    return sectors.find(s => s.id === ticket.sectorId) ?? null;
  }, [sectors, ticket.sectorId]);

  if (!sector) return null;
  
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

function AdminActionButton({ label, color, icon, onClick }: { label: string, color: string, icon?: React.ReactNode, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`p-4 ${color} rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all text-left shadow-sm flex flex-col gap-2`}>
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

function LoginView({
  onLogin,
  onRegister,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'register') {
        await onRegister(name, email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível concluir a operação.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Decorative Elemets */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-32 -mb-32" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-10 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-700/40">
            <Key size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Campus<br/><span className="text-blue-500">Access</span></h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="flex rounded-2xl bg-slate-800 p-1">
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  Entrar
                </button>
                <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                  Criar conta
                </button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-slate-400 font-medium">{mode === 'login' ? 'Entre com sua conta do campus' : 'Crie sua conta de aluno'}</p>
                {mode === 'register' && <p className="text-xs text-slate-500">Seu acesso será criado como aluno.</p>}
              </div>

              {mode === 'register' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" required />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" required />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" minLength={6} className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all" required />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </motion.p>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] uppercase tracking-widest text-xs">
                {mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta'}
              </button>
            </motion.form>
        </AnimatePresence>

        <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          v2.4.0 • Segurança Criptografada
        </p>
      </motion.div>
    </div>
  );
}

function ProfessorDashboard({ onBack, onSelectTool }: { onBack: () => void, onSelectTool: (tool: 'professor-attendance' | 'professor-lab' | 'professor-notices' | 'professor-reports' | 'professor-grades' | 'student-performance') => void }) {
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
          <AdminActionButton label="Lista Presença" color="bg-white border-slate-200 text-slate-900" icon={<Users size={16} />} onClick={() => onSelectTool('professor-attendance')} />
          <AdminActionButton label="Reservar Lab" color="bg-white border-slate-200 text-slate-900" icon={<Calendar size={16} />} onClick={() => onSelectTool('professor-lab')} />
          <AdminActionButton label="Avisos Turma" color="bg-white border-slate-200 text-slate-900" icon={<Newspaper size={16} />} onClick={() => onSelectTool('professor-notices')} />
          <AdminActionButton label="Relatórios" color="bg-white border-slate-200 text-slate-900" icon={<TrendingUp size={16} />} onClick={() => onSelectTool('professor-reports')} />
          <AdminActionButton label="Notas" color="bg-blue-100 border-blue-200 text-blue-800" icon={<TrendingUp size={16} />} onClick={() => onSelectTool('professor-grades')} />
          <AdminActionButton label="Desempenho" color="bg-emerald-100 border-emerald-200 text-emerald-800" icon={<Activity size={16} />} onClick={() => onSelectTool('student-performance')} />
        </div>
      </div>
    </motion.div>
  );
}

function ProfessorGradesView({ onBack, grades, setGrades, subjects }: { onBack: () => void, grades: GradeRecord[], setGrades: React.Dispatch<React.SetStateAction<GradeRecord[]>>, subjects: CourseSubject[] }) {
  const updateGrade = (id: string, nextValue: number) => {
    setGrades(prev => prev.map(grade =>
      grade.id === id
        ? { ...grade, value: nextValue, status: nextValue >= 7 ? 'Aprovado' : nextValue >= 5 ? 'Recuperação' : 'Reprovado' }
        : grade
    ));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Lançamento de Notas</h2>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disciplinas ativas</p>
        <div className="space-y-2">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-900">{subject.name}</p>
              <p className="text-xs text-slate-500">{subject.teacher} • {subject.schedule}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {grades.map(grade => (
          <div key={grade.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{grade.studentName}</p>
                <p className="text-xs text-slate-500">{grade.subjectName} • {grade.period}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${grade.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : grade.status === 'Recuperação' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {grade.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={grade.value}
                onChange={(e) => updateGrade(grade.id, Number(e.target.value || 0))}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-slate-500">/ 10</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StudentPerformanceView({ onBack, userName, grades, subjects }: { onBack: () => void, userName: string, grades: GradeRecord[], subjects: CourseSubject[] }) {
  const average = (grades.reduce((sum, grade) => sum + grade.value, 0) / Math.max(grades.length, 1)).toFixed(1);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Desempenho e Matérias</h2>
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 rounded-[32px] shadow-lg shadow-blue-900/20">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Média geral</p>
        <p className="text-5xl font-black tracking-tight mt-2">{average}</p>
        <p className="mt-3 text-sm opacity-85">Aluno: {userName}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Matérias</h3>
        {subjects.map(subject => (
          <div key={subject.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{subject.name}</p>
                <p className="text-xs text-slate-500">{subject.teacher}</p>
              </div>
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{subject.credits} créditos</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{subject.schedule}</span>
              <span>{subject.workload}h</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Notas</h3>
        {grades.map(grade => (
          <div key={grade.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-slate-900">{grade.subjectName}</p>
              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${grade.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : grade.status === 'Recuperação' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {grade.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>{grade.period}</span>
              <span className="font-black text-slate-900">{grade.value.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
