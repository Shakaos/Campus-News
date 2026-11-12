/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
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
  Moon,
  QrCode,
  BellRing,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { AppView, NewsItem, Room, QueueSector, QueueTicket, User, CourseSubject, GradeRecord, SubjectAssessmentRecord, ClassAttendanceRecord, AssessmentType, AssignmentRecord } from './types';
import { academicApi, assignmentApi, authApi, newsApi, queueApi, roomApi, subjectApi } from './api';
import { AdminView } from './AdminView';
import { AttendanceList, LabReservation, ClassNotices, Reports } from './ProfessorTools';
import { EventCheckin, ProfessorEvents, StudentEventScanner } from './EventTools';
import { ProfessorAssignments, StudentAssignments, StudentSchedule } from './AssignmentTools';
import { formatDate } from './date';
import { WebLayout } from './WebLayout';
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
  const isNativeApp = Capacitor.isNativePlatform();
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [activeTicket, setActiveTicket] = useState<QueueTicket | null>(null);
  const [scannedEventToken, setScannedEventToken] = useState<string | null>(null);
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
  const [assessments, setAssessments] = useState<SubjectAssessmentRecord[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<ClassAttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
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
    if (user?.role !== 'aluno') {
      setAssessments([]);
      setStudentAttendance([]);
      return;
    }
    void Promise.all([academicApi.listAssessments(), academicApi.listMyAttendance()])
      .then(([assessmentRecords, attendanceRecords]) => {
        setAssessments(assessmentRecords);
        setStudentAttendance(attendanceRecords);
      })
      .catch(loadError => showError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o boletim.'));
  }, [user, showError]);

  useEffect(() => {
    if (user?.role !== 'aluno') {
      setAssignments([]);
      return;
    }
    void assignmentApi.list()
      .then(setAssignments)
      .catch(loadError => showError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os trabalhos.'));
  }, [user, showError]);

  useEffect(() => {
    const boot = async () => {
      const savedToken = localStorage.getItem('campus_token');
      const savedUser = localStorage.getItem('campus_user');

      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser) as User;
          setUser(userData);
          setView(new URLSearchParams(window.location.search).has('eventToken') && userData.role === 'aluno' ? 'event-checkin' : 'home');
        } catch {
          localStorage.removeItem('campus_token');
          localStorage.removeItem('campus_user');
        }
      }

      try {
        const [newsData, roomsData, sectorsData, subjectData] = await Promise.all([
          newsApi.list(),
          roomApi.list(),
          queueApi.list(),
          subjectApi.list(),
        ]);

        setNews(newsData);
        setRooms(roomsData);
        setSectors(sectorsData);
        if (subjectData.length) setSubjects(subjectData);
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
      setView(new URLSearchParams(window.location.search).has('eventToken') && nextUser.role === 'aluno' ? 'event-checkin' : 'home');
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
    if (['professor-dashboard', 'professor-events', 'professor-assignments', 'professor-attendance', 'professor-lab', 'professor-notices', 'professor-reports', 'professor-grades'].includes(newView) && user?.role !== 'professor') return;
    if (['student-performance', 'student-events', 'student-schedule', 'student-assignments', 'event-checkin'].includes(newView) && user?.role !== 'aluno') return;

    setView(newView);
    if (news) setSelectedNews(news);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const isWideWorkspace = ['professor-dashboard', 'professor-attendance', 'professor-lab', 'professor-notices', 'professor-reports', 'professor-grades', 'professor-events', 'professor-assignments', 'student-events', 'student-schedule', 'student-assignments', 'event-checkin'].includes(view);

  if (view === 'login') {
    return (
      <ErrorBoundary>
        <LoginView onLogin={login} onRegister={async (name, email, password) => {
          const response = await authApi.register(name, email, password);
          setUser(response.user);
          localStorage.setItem('campus_token', response.token);
          localStorage.setItem('campus_user', JSON.stringify(response.user));
          setView(new URLSearchParams(window.location.search).has('eventToken') && response.user.role === 'aluno' ? 'event-checkin' : 'home');
        }} />
      </ErrorBoundary>
    );
  }

  const appScreens = (
    <AnimatePresence mode="wait">
      {view === 'home' && <HomeView user={user!} onNavigate={navigate} assignments={assignments} isWeb={!isNativeApp} />}
      {view === 'campus-news' && <JornalView onNavigate={navigate} news={news} isWeb={!isNativeApp} />}
      {view === 'noticia' && selectedNews && <NewsDetailView news={selectedNews} onBack={() => navigate('campus-news')} />}
      {view === 'salas' && <SalasView rooms={rooms} onBack={() => navigate('home')} isWeb={!isNativeApp} />}
      {view === 'filas' && <FilasView sectors={sectors} onBack={() => navigate('home')} onJoin={async (ticket) => { setActiveTicket(ticket); navigate('acompanhamento'); }} isWeb={!isNativeApp} />}
      {view === 'acompanhamento' && activeTicket && <AcompanhamentoView sectors={sectors} ticket={activeTicket} onExit={() => { setActiveTicket(null); navigate('home'); }} />}
      {view === 'admin' && <AdminView onBack={() => navigate('home')} isWeb={!isNativeApp} />}
      {view === 'professor-dashboard' && <ProfessorDashboard onBack={() => navigate('home')} onSelectTool={(tool) => navigate(tool as AppView)} isWeb={!isNativeApp} />}
      {view === 'professor-events' && <ProfessorEvents onBack={() => navigate('professor-dashboard')} />}
      {view === 'professor-assignments' && <ProfessorAssignments onBack={() => navigate('professor-dashboard')} subjects={subjects} isWeb={!isNativeApp} />}
      {view === 'student-schedule' && <StudentSchedule onBack={() => navigate('home')} subjects={subjects} isWeb={!isNativeApp} />}
      {view === 'student-assignments' && <StudentAssignments onBack={() => navigate('home')} assignments={assignments} onToggleCompletion={async (id, completed) => { const updated = await assignmentApi.setCompleted(id, completed); setAssignments(previous => previous.map(item => item.id === id ? updated : item)); }} onUploadFiles={async (id, files) => { const uploaded = await assignmentApi.uploadSubmission(id, files); setAssignments(previous => previous.map(item => item.id === id ? { ...item, completedAt: new Date().toISOString(), submissionFiles: [...(item.submissionFiles ?? []), ...uploaded] } : item)); return uploaded; }} isWeb={!isNativeApp} />}
      {view === 'student-events' && <StudentEventScanner onBack={() => navigate('home')} onScan={token => { setScannedEventToken(token); navigate('event-checkin'); }} />}
      {view === 'event-checkin' && <EventCheckin userName={user?.name ?? 'Aluno'} tokenOverride={scannedEventToken} onBack={() => { setScannedEventToken(null); navigate('student-events'); }} />}
      {view === 'professor-attendance' && <AttendanceList onBack={() => navigate('professor-dashboard')} subjects={subjects} isWeb={!isNativeApp} />}
      {view === 'professor-lab' && <LabReservation onBack={() => navigate('professor-dashboard')} />}
      {view === 'professor-notices' && <ClassNotices onBack={() => navigate('professor-dashboard')} />}
      {view === 'professor-reports' && <Reports onBack={() => navigate('professor-dashboard')} />}
      {view === 'professor-grades' && <ProfessorGradesView onBack={() => navigate('professor-dashboard')} subjects={subjects} />}
      {view === 'student-performance' && <StudentPerformanceView onBack={() => navigate('home')} userName={user?.name ?? 'Aluno'} assessments={assessments} attendance={studentAttendance} subjects={subjects} isWeb={!isNativeApp} />}
    </AnimatePresence>
  );

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

        {isNativeApp && <>
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
              {user?.role === 'professor' && (
                <MenuLink icon={<ClipboardList size={20} />} label="Trabalhos da turma" onClick={() => navigate('professor-assignments')} />
              )}
              {user?.role === 'aluno' && (
                <MenuLink icon={<QrCode size={20} />} label="Escanear palestra" onClick={() => navigate('student-events')} />
              )}
              {user?.role === 'aluno' && (
                <>
                  <MenuLink icon={<BookOpen size={20} />} label="Minhas disciplinas" onClick={() => navigate('student-schedule')} />
                  <MenuLink icon={<ClipboardList size={20} />} label="Trabalhos" onClick={() => navigate('student-assignments')} />
                </>
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
        </>}

      {/* Main Content */}
      {isNativeApp ? (
        <main className="mx-auto max-w-md px-4 pb-20 dark:bg-slate-950">{appScreens}</main>
      ) : (
        <WebLayout user={user!} view={view} theme={theme} onNavigate={navigate} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onLogout={logout}>
          {appScreens}
        </WebLayout>
      )}

      {/* Quick Access Bar (Optional) */}
      {isNativeApp && view !== 'home' && (
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

function getAssignmentDueNotice(dueAt: string) {
  const dueDate = new Date(dueAt);
  const today = new Date();
  const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dayDifference = Math.round((dueDay - todayDay) / 86400000);
  if (dayDifference === 0) return 'Vence hoje';
  if (dayDifference === 1) return 'Vence amanhã';
  return null;
}

function HomeView({ user, onNavigate, assignments = [], isWeb = false }: { user: User, onNavigate: (v: AppView, n?: NewsItem) => void, assignments?: AssignmentRecord[], isWeb?: boolean }) {
  const isProfessor = user.role === 'professor';
  const isAdmin = user.role === 'admin';
  const dueSoon = assignments.filter(assignment => !assignment.completedAt && getAssignmentDueNotice(assignment.dueAt));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={isWeb ? 'web-home grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start' : 'space-y-12 p-6'}
    >
      {/* Header Greeting */}
      <div className={`space-y-3 ${isWeb ? 'web-home-greeting' : ''}`}>
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
          <h2 className={`${isWeb ? 'text-4xl' : 'text-5xl'} font-black tracking-tighter leading-[0.9] text-slate-900`}>
            Olá,<br />
            <span className="text-blue-800">{user.name.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium tracking-tight">
            {isAdmin ? 'Controle total do campus.' : isProfessor ? 'Gerencie suas aulas e salas.' : 'Seu dia no campus começa aqui.'}
          </p>
        </div>
      </div>

      {user.role === 'aluno' && dueSoon.length > 0 && <button type="button" onClick={() => onNavigate('student-assignments')} className="flex w-full items-start gap-3 rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-left text-amber-950 hover:bg-amber-100">
        <BellRing size={18} className="mt-0.5 shrink-0" />
        <span><strong>{dueSoon.length === 1 ? 'Trabalho com prazo próximo' : `${dueSoon.length} trabalhos com prazo próximo`}</strong><span className="mt-1 block text-sm">{dueSoon.slice(0, 2).map(item => `${item.title}: ${getAssignmentDueNotice(item.dueAt)?.toLowerCase()}`).join(' · ')}</span></span>
      </button>}

      {/* Urgent Highlight - More Striking */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        onClick={() => onNavigate('campus-news')}
        className={`group relative overflow-hidden cursor-pointer bg-red-100 p-px ring-1 ring-red-200 shadow-sm ${isWeb ? 'web-home-alert rounded-lg' : 'rounded-[32px]'}`}
      >
        <div className={`relative overflow-hidden border border-red-200 bg-red-50/50 ${isWeb ? 'rounded-[11px] p-4' : 'rounded-[31px] p-6'}`}>
          <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
            <AlertCircle size={140} className="text-red-600 rotate-12" />
          </div>
          
          <div className={`relative z-10 ${isWeb ? 'space-y-2' : 'space-y-4'}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-red-600">Destaque Urgente</h3>
            </div>
            <p className={`${isWeb ? 'text-base' : 'text-xl'} font-bold leading-tight text-slate-800 transition-colors group-hover:text-red-700`}>
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
      <div className={`space-y-3 ${isWeb ? 'web-home-modules' : 'space-y-6'}`}>
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Acesso Rápido</h3>
          <div className="h-px flex-1 bg-slate-200 mx-4" />
        </div>
        
        <div className={isWeb ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5' : 'grid gap-5'}>
          {isAdmin ? (
            <ModuleCard 
              icon={<Shield />}
              title="Administração"
              description="Gerenciar notícias, filas e usuários."
              onClick={() => onNavigate('admin')}
              color="bg-slate-900 text-white"
              iconColor="text-white"
              web={isWeb}
            />
          ) : isProfessor ? (
            <>
              <ModuleCard
                icon={<GraduationCap />}
                title="Minhas Aulas"
                description="Status de salas e horários."
                onClick={() => onNavigate('professor-dashboard')}
                color="bg-blue-900 text-white"
                iconColor="text-white"
                web={isWeb}
              />
              {isWeb && <ModuleCard
                icon={<Calendar />}
                title="Palestras e eventos"
                description="Criar eventos e gerar QRs de presença."
                onClick={() => onNavigate('professor-events')}
                color="bg-emerald-800 text-white"
                iconColor="text-white"
                web
              />}
              {isWeb && <ModuleCard
                icon={<ClipboardList />}
                title="Trabalhos"
                description="Publique atividades e prazos."
                onClick={() => onNavigate('professor-assignments')}
                color="bg-orange-700/10"
                iconColor="text-orange-800"
                web
              />}
            </>
          ) : (
            <>
              <ModuleCard
                icon={<Newspaper />}
                title="Campus News"
                description="Fique por dentro de eventos e avisos."
                onClick={() => onNavigate('campus-news')}
                color="bg-blue-700/10"
                iconColor="text-blue-800"
                web={isWeb}
              />
              <ModuleCard
                icon={<TrendingUp />}
                title="Desempenho"
                description="Veja suas matérias e notas."
                onClick={() => onNavigate('student-performance')}
                color="bg-emerald-700/10"
                iconColor="text-emerald-700"
                web={isWeb}
              />
              <ModuleCard
                icon={<BookOpen />}
                title="Minhas disciplinas"
                description="Horários, docentes e carga horária."
                onClick={() => onNavigate('student-schedule')}
                color="bg-emerald-700/10"
                iconColor="text-emerald-700"
                web={isWeb}
              />
              <ModuleCard
                icon={<ClipboardList />}
                title="Trabalhos"
                description="Atividades, prazos e lembretes."
                onClick={() => onNavigate('student-assignments')}
                color="bg-orange-700/10"
                iconColor="text-orange-800"
                web={isWeb}
              />
            </>
          )}

          <div className={isWeb ? 'contents' : 'grid grid-cols-2 gap-5'}>
            <ModuleCard 
              icon={<Search />}
              title="Salas"
              description="Status atual"
              onClick={() => onNavigate('salas')}
              color="bg-emerald-700/10"
              iconColor="text-emerald-700"
              compact
              web={isWeb}
            />
            <ModuleCard 
              icon={<Users />}
              title="Filas"
              description="Senha virtual"
              onClick={() => onNavigate('filas')}
              color="bg-orange-700/10"
              iconColor="text-orange-700"
              compact
              web={isWeb}
            />
          </div>
          {isWeb && <CampusPulse compact />}
        </div>
      </div>

      {!isWeb && <CampusPulse />}
    </motion.div>
  );
}

function CampusPulse({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`bg-white border border-slate-200 shadow-sm ${compact ? 'flex min-h-20 flex-col justify-center gap-3 rounded-lg p-3' : 'space-y-4 rounded-[32px] p-6'}`}>
      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Activity size={12} className="text-blue-800" />Campus Pulse
      </h3>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="space-y-1 px-2 first:pl-0">
          <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-slate-900`}>85%</div>
          <div className="text-[9px] font-bold uppercase text-slate-400">Ocupação</div>
        </div>
        <div className="space-y-1 px-2">
          <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-slate-900`}>12 min</div>
          <div className="text-[9px] font-bold uppercase text-slate-400">Espera média</div>
        </div>
        <div className="space-y-1 px-2 last:pr-0">
          <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-slate-900`}>04</div>
          <div className="text-[9px] font-bold uppercase text-slate-400">Eventos</div>
        </div>
      </div>
    </section>
  );
}

function ModuleCard({ 
  icon, 
  title, 
  description, 
  onClick, 
  color = "bg-slate-100",
  iconColor = "text-blue-800",
  compact = false,
  web = false
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  onClick: () => void,
  color?: string,
  iconColor?: string,
  compact?: boolean,
  web?: boolean
}) {
  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left bg-white border border-slate-200 shadow-sm transition-all group relative overflow-hidden hover:shadow-md hover:border-blue-300 ${web ? `rounded-lg ${compact ? 'flex min-h-20 flex-col justify-between p-2.5' : 'min-h-24 p-3'}` : `rounded-[32px] p-7 ${compact ? 'flex h-48 flex-col justify-between' : ''}`}`}
    >
      {/* Decorative Background Element */}
      <div className={`absolute -right-4 -bottom-4 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 scale-50 group-hover:scale-100 ${color}`} />
      
      <div className={`${web ? 'space-y-2' : 'space-y-5'} relative z-10`}>
        <div className={`${web ? 'p-2 rounded-md' : 'p-4 rounded-2xl'} ${color} inline-flex transition-transform duration-300 group-hover:rotate-6 ${iconColor}`}>
          {React.cloneElement(icon as React.ReactElement, { size: web ? 20 : compact ? 20 : 24 })}
        </div>
        <div className="space-y-1">
          <h3 className={`${web ? (compact ? 'text-base' : 'text-lg') : (compact ? 'text-xl' : 'text-2xl')} font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-800`}>
            {title}
          </h3>
          <p className={`text-sm font-medium leading-tight ${compact ? 'text-slate-400' : 'text-slate-500'}`}>
            {description}
          </p>
        </div>
      </div>
      
      {!compact && (
        <div className={`${web ? 'mt-3' : 'mt-8'} flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all group-hover:text-blue-800`}>
          Acessar módulo
          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.button>
  );
}

function JornalView({ onNavigate, news, isWeb = false }: { onNavigate: (v: AppView, n?: NewsItem) => void, news: NewsItem[], isWeb?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={isWeb ? 'space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6'}
    >
      <div className="flex items-center gap-4">
        <button onClick={() => onNavigate('home')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Campus News</h2>
      </div>

      <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
        {news.map((newsItem) => (
          <NewsCard 
            key={newsItem.id} 
            news={newsItem} 
            onClick={() => onNavigate('noticia', newsItem)} 
            isWeb={isWeb}
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

function NewsCard({ news, onClick, isWeb = false }: NewsCardProps & { isWeb?: boolean }) {
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
      className={`bg-white border border-slate-200 overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-blue-300 hover:-translate-y-1 ${isWeb ? 'rounded-lg' : 'rounded-2xl'}`}
    >
      {news.imageUrl && (
        <div className={`${isWeb ? 'h-32' : 'h-40'} overflow-hidden relative`}>
          <motion.img 
            src={news.imageUrl} 
            alt={news.title} 
            style={{ y, scale: 1.2 }} // Escala maior para evitar bordas vazias durante o parallax
            className="w-full h-full object-cover absolute inset-0" 
            referrerPolicy="no-referrer" 
          />
        </div>
      )}
      <div className={`${isWeb ? 'space-y-1.5 p-3' : 'space-y-2 p-4'} relative bg-white/90 backdrop-blur-sm`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
          news.category === 'urgente' ? 'bg-red-50 text-red-600 border border-red-100' : 
          news.category === 'evento' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {news.category}
        </span>
        <h3 className={`${isWeb ? 'text-base' : 'text-lg'} font-bold leading-tight text-slate-900`}>{news.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">{news.summary}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Calendar size={12} className="text-blue-700" />
          {formatDate(news.date)}
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
          {formatDate(news.date)}
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

function SalasView({ rooms, onBack, isWeb = false }: { rooms: Room[], onBack: () => void, isWeb?: boolean }) {
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
      className={isWeb ? 'space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6'}
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

      <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
        {filteredRooms.map((room) => (
          <div key={room.id} className={`bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors ${isWeb ? 'space-y-2 rounded-lg p-3' : 'space-y-3 rounded-2xl p-5'}`}>
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
              <div className={`bg-slate-50 flex items-center gap-3 ${isWeb ? 'rounded-md p-2' : 'rounded-xl p-3'}`}>
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

function FilasView({ sectors, onJoin, onBack, isWeb = false }: { sectors: QueueSector[], onJoin: (t: QueueTicket) => void, onBack: () => void, isWeb?: boolean }) {
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
      className={isWeb ? 'space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6'}
    >
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Gestão de Filas</h2>
      </div>

      <p className="text-slate-500 font-medium">Selecione o setor que deseja atendimento para entrar na fila virtual.</p>

      <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
        {sectors.map((sector) => (
          <button 
            key={sector.id}
            onClick={() => setSelectedSector(sector.id)}
            className={`w-full text-left border transition-all ${isWeb ? 'rounded-lg p-4' : 'rounded-2xl p-6'} ${
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
            <p className={`text-sm ${isWeb ? 'mb-2' : 'mb-4'} leading-relaxed ${selectedSector === sector.id ? 'text-blue-600/80' : 'text-slate-500'}`}>
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
        className={`bg-blue-700 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-800 transition-all shadow-xl shadow-blue-700/20 uppercase tracking-widest text-xs ${isWeb ? 'ml-auto block w-fit min-w-48 rounded-md px-5 py-2.5' : 'sticky bottom-6 mt-4 w-full rounded-2xl py-5'}`}
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

function AdminActionButton({ label, color, icon, onClick, compact = false }: { label: string, color: string, icon?: React.ReactNode, onClick?: () => void, compact?: boolean }) {
  return (
    <button onClick={onClick} className={`${compact ? 'min-h-20 rounded-lg p-3' : 'p-4 rounded-2xl'} ${color} text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all text-left shadow-sm flex flex-col gap-2`}>
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

function ProfessorDashboard({ onBack, onSelectTool, isWeb = false }: { onBack: () => void, onSelectTool: (tool: 'professor-attendance' | 'professor-lab' | 'professor-notices' | 'professor-reports' | 'professor-grades' | 'professor-events' | 'professor-assignments' | 'student-performance') => void, isWeb?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={isWeb ? 'web-prof-dashboard space-y-5 px-1 py-2 md:px-2' : 'space-y-8 px-1 py-5 md:px-2 md:py-8'}
    >
      <div className={`flex items-center gap-4 ${isWeb ? 'web-prof-dashboard-header' : ''}`}>
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Painel do Professor</h2>
      </div>

      <div className={`grid gap-4 ${isWeb ? 'web-prof-dashboard-main xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]' : 'lg:grid-cols-[1.2fr_0.8fr]'} lg:items-start`}>
      <div className={`bg-blue-900 text-white rounded-2xl space-y-5 shadow-xl relative overflow-hidden ${isWeb ? 'web-prof-room p-5' : 'p-6 md:p-8'}`}>
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

      <div className={`grid grid-cols-2 ${isWeb ? 'web-prof-stats gap-2 xl:grid-cols-1' : 'gap-4 lg:grid-cols-1'}`}>
        <StatCard icon={<Clock size={16} />} label="Tempo Restante" value="45m" trend="Ontime" />
        <StatCard icon={<Search size={16} />} label="Salas do Bloco" value="08 Free" trend="Live" />
      </div>

      </div>
      <div className={`space-y-3 ${isWeb ? 'web-prof-tools pt-1' : 'space-y-4'}`}>
        <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-2">Ferramentas Docentes</h3>
        <div className={`grid grid-cols-2 ${isWeb ? 'gap-2 sm:grid-cols-3 xl:grid-cols-4' : 'gap-3 sm:grid-cols-3 lg:grid-cols-2'}`}>
          <AdminActionButton compact={isWeb} label="Palestras e QRs" color="bg-emerald-800 border-emerald-900 text-white" icon={<Calendar size={16} />} onClick={() => onSelectTool('professor-events')} />
          <AdminActionButton compact={isWeb} label="Trabalhos" color="bg-orange-100 border-orange-200 text-orange-900" icon={<ClipboardList size={16} />} onClick={() => onSelectTool('professor-assignments')} />
          <AdminActionButton compact={isWeb} label="Lista Presença" color="bg-white border-slate-200 text-slate-900" icon={<Users size={16} />} onClick={() => onSelectTool('professor-attendance')} />
          <AdminActionButton compact={isWeb} label="Reservar Lab" color="bg-white border-slate-200 text-slate-900" icon={<Calendar size={16} />} onClick={() => onSelectTool('professor-lab')} />
          <AdminActionButton compact={isWeb} label="Avisos Turma" color="bg-white border-slate-200 text-slate-900" icon={<Newspaper size={16} />} onClick={() => onSelectTool('professor-notices')} />
          <AdminActionButton compact={isWeb} label="Relatórios" color="bg-white border-slate-200 text-slate-900" icon={<TrendingUp size={16} />} onClick={() => onSelectTool('professor-reports')} />
          <AdminActionButton compact={isWeb} label="Notas" color="bg-blue-100 border-blue-200 text-blue-800" icon={<TrendingUp size={16} />} onClick={() => onSelectTool('professor-grades')} />
          <AdminActionButton compact={isWeb} label="Desempenho" color="bg-emerald-100 border-emerald-200 text-emerald-800" icon={<Activity size={16} />} onClick={() => onSelectTool('student-performance')} />
        </div>
      </div>
    </motion.div>
  );
}

function ProfessorGradesView({ onBack, subjects }: { onBack: () => void; subjects: CourseSubject[] }) {
  const [students, setStudents] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<SubjectAssessmentRecord[]>([]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [period, setPeriod] = useState<GradeRecord['period']>('1º Bimestre');
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const assessmentTypes: AssessmentType[] = ['N1', 'N2', 'Trabalho', 'Exame'];

  useEffect(() => {
    void Promise.all([academicApi.listStudents(), academicApi.listAssessments()])
      .then(([studentRecords, assessmentRecords]) => {
        setStudents(studentRecords);
        setAssessments(assessmentRecords);
      })
      .catch(loadError => setMessage(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a lista.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const nextValues: Record<string, string> = {};
    assessments.filter(record => record.subjectId === subjectId && record.period === period)
      .forEach(record => { nextValues[`${record.studentId}:${record.assessmentType}`] = String(record.value); });
    setValues(nextValues);
  }, [assessments, subjectId, period]);

  const saveAssessments = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const pending = students.flatMap(student => assessmentTypes.flatMap(assessmentType => {
        const value = values[`${student.id}:${assessmentType}`];
        if (value === undefined || value === '') return [];
        return [{ studentId: student.id, subjectId, assessmentType, period, value: Number(value) }];
      }));
      const savedRecords = await Promise.all(pending.map(record => academicApi.saveAssessment(record)));
      setAssessments(previous => {
        const replaced = previous.filter(record => !(record.subjectId === subjectId && record.period === period));
        return [...replaced, ...savedRecords];
      });
      setMessage(savedRecords.length ? 'Planilha salva no boletim dos alunos.' : 'Preencha ao menos uma nota antes de salvar.');
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a nota.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 px-1 py-3 md:px-2">
      <div className="flex items-center gap-4"><button onClick={onBack} className="rounded-full p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft size={20} /></button><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-800">Área docente</p><h2 className="text-2xl font-bold text-slate-900">Lançamento de notas</h2></div></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Matéria<select value={subjectId} onChange={event => setSubjectId(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5">{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Período<select value={period} onChange={event => setPeriod(event.target.value as GradeRecord['period'])} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5"><option>1º Bimestre</option><option>2º Bimestre</option><option>3º Bimestre</option><option>4º Bimestre</option></select></label>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th className="sticky left-0 bg-slate-100 px-4 py-3 font-bold">Aluno</th>{assessmentTypes.map(type => <th key={type} className="px-3 py-3 text-center font-bold">{type}</th>)}<th className="px-3 py-3 text-center font-bold">Média parcial</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Carregando planilha...</td></tr> : students.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum aluno cadastrado.</td></tr> : students.map(student => {
              const rowValues = assessmentTypes.map(type => Number(values[`${student.id}:${type}`])).filter(Number.isFinite);
              const rowAverage = rowValues.length ? (rowValues.reduce((sum, grade) => sum + grade, 0) / rowValues.length).toFixed(1) : '—';
              return <tr key={student.id} className="border-t border-slate-200">
                <th scope="row" className="sticky left-0 bg-white px-4 py-2.5 font-semibold text-slate-900">{student.name}</th>
                {assessmentTypes.map(type => <td key={type} className="px-2 py-2 text-center"><input aria-label={`${type} - ${student.name}`} type="number" min="0" max="10" step="0.1" value={values[`${student.id}:${type}`] ?? ''} onChange={event => setValues(previous => ({ ...previous, [`${student.id}:${type}`]: event.target.value }))} className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-900 focus:border-emerald-700 focus:outline-none" /></td>)}
                <td className="px-3 py-2 text-center font-bold text-slate-800">{rowAverage}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void saveAssessments()} disabled={isLoading || isSaving || students.length === 0} className="rounded-md bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50">{isSaving ? 'Salvando planilha...' : 'Salvar planilha'}</button>{message && <p role="status" className="text-sm text-slate-600">{message}</p>}</div>
    </motion.div>
  );
}

function StudentPerformanceView({ onBack, userName, assessments, attendance, subjects, isWeb = false }: { onBack: () => void; userName: string; assessments: SubjectAssessmentRecord[]; attendance: ClassAttendanceRecord[]; subjects: CourseSubject[]; isWeb?: boolean }) {
  const subjectAverages = subjects.map(subject => {
    const rows = assessments.filter(record => record.subjectId === subject.id && record.assessmentType !== 'Exame');
    return rows.length ? rows.reduce((sum, record) => sum + record.value, 0) / rows.length : null;
  }).filter((value): value is number => value !== null);
  const average = subjectAverages.length ? (subjectAverages.reduce((sum, value) => sum + value, 0) / subjectAverages.length).toFixed(1) : '—';
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const selectedSubject = subjects.find(subject => subject.id === selectedSubjectId);
  if (selectedSubject) {
    const subjectRecords = assessments.filter(record => record.subjectId === selectedSubject.id);
    const subjectAttendance = attendance.filter(record => record.subjectId === selectedSubject.id);
    const absences = subjectAttendance.filter(record => record.status === 'ausente').length;
    const attendancePercent = subjectAttendance.length
      ? Math.round(((subjectAttendance.length - absences) / subjectAttendance.length) * 100)
      : null;
    const countedScores = subjectRecords.filter(record => record.assessmentType !== 'Exame');
    const subjectAverage = countedScores.length
      ? (countedScores.reduce((sum, record) => sum + record.value, 0) / countedScores.length).toFixed(1)
      : '—';

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={isWeb ? 'space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6'}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setSelectedSubjectId(null)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <ArrowLeft size={18} />Voltar às matérias
          </button>
          <h2 className="text-xl font-bold text-slate-900">Boletim da matéria</h2>
        </div>

        <section className={`flex flex-wrap items-start justify-between gap-4 border border-slate-200 bg-white ${isWeb ? 'rounded-lg p-4' : 'rounded-2xl p-5'}`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">{selectedSubject.teacher}</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedSubject.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedSubject.schedule} · {selectedSubject.workload} horas</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-900">Dados lançados pelo professor</span>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <SubjectMetric label="Média parcial simples" value={subjectAverage} />
          <SubjectMetric label="Presença" value={attendancePercent === null ? 'Sem dados' : `${attendancePercent}%`} />
          <SubjectMetric label="Faltas" value={`${absences} de ${subjectAttendance.length} aulas registradas`} />
        </section>

        {attendancePercent !== null && <section aria-label="Percentual de presença" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600"><span>Frequência</span><span className="font-bold text-emerald-800">{attendancePercent}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={attendancePercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${attendancePercent}%` }} />
          </div>
        </section>}

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Planilha de avaliações</h3>
            <span className="text-xs text-slate-500">Aluno: {userName}</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr><th className="px-4 py-3 font-bold">Período</th><th className="px-4 py-3 font-bold">Avaliação</th><th className="px-4 py-3 font-bold">Nota</th></tr>
              </thead>
              <tbody>
                {subjectRecords.length === 0 ? <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">Nenhuma nota lançada nesta matéria.</td></tr> : subjectRecords.map(record => <tr key={record.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-600">{record.period}</td>
                  <th scope="row" className="px-4 py-3 font-semibold text-slate-800">{record.assessmentType}</th>
                  <td className="px-4 py-3 font-bold text-slate-900">{record.value.toFixed(1)}</td>
                </tr>)}
                {subjectRecords.length > 0 && <tr className="border-t-2 border-slate-300 bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-700">Notas sem exame</td>
                  <th scope="row" className="px-4 py-3 font-bold text-slate-900">Média parcial simples</th>
                  <td className="px-4 py-3 font-black text-slate-900">{subjectAverage}</td>
                </tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Frequência por aula</h3>
          {subjectAttendance.length === 0 ? <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Nenhuma chamada registrada nesta matéria.</p> : <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[420px] border-collapse text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Situação</th></tr></thead><tbody>{subjectAttendance.slice().sort((a, b) => b.date.localeCompare(a.date)).map(record => <tr key={record.id} className="border-t border-slate-200"><td className="px-4 py-3">{formatDate(record.date)}</td><td className="px-4 py-3 capitalize">{record.status}</td></tr>)}</tbody></table></div>}
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={isWeb ? 'space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6'}>
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-bold text-slate-900">Desempenho e Matérias</h2>
      </div>

      <div className={`bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/20 ${isWeb ? 'rounded-xl p-4' : 'rounded-[32px] p-6'}`}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Média geral</p>
        <p className="text-5xl font-black tracking-tight mt-2">{average}</p>
        <p className="mt-3 text-sm opacity-85">Aluno: {userName}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Matérias</h3>
        <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {subjects.map(subject => (
              <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`w-full border border-slate-200 bg-white text-left shadow-sm transition-colors hover:border-emerald-700 hover:bg-slate-50 ${isWeb ? 'rounded-lg p-3' : 'rounded-2xl p-4'}`}
                >
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
                </button>
          ))}
        </div>
      </section>

      <section className="space-y-3"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Resumo das notas lançadas</h3><div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>{subjects.map(subject => { const records = assessments.filter(record => record.subjectId === subject.id); const marked = attendance.filter(record => record.subjectId === subject.id); const absences = marked.filter(record => record.status === 'ausente').length; const scoreRows = records.filter(record => record.assessmentType !== 'Exame'); const avg = scoreRows.length ? (scoreRows.reduce((sum, record) => sum + record.value, 0) / scoreRows.length).toFixed(1) : '—'; return <article key={subject.id} className={`border border-slate-200 bg-white shadow-sm ${isWeb ? 'rounded-lg p-3' : 'rounded-2xl p-4'}`}><h4 className="font-bold text-slate-900">{subject.name}</h4><div className="mt-2 flex justify-between gap-3 text-sm text-slate-600"><span>Média parcial simples</span><strong className="text-slate-900">{avg}</strong></div><div className="mt-1 flex justify-between gap-3 text-sm text-slate-600"><span>Faltas</span><strong className="text-slate-900">{absences} / {marked.length}</strong></div></article>; })}</div></section>
    </motion.div>
  );
}

function SubjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
