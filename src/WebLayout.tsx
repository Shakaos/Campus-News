import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, BookOpen, CalendarDays, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Newspaper, QrCode, Search, Shield, Sun, Users, X } from 'lucide-react';
import type { AppView, User } from './types';

interface WebLayoutProps {
  user: User;
  view: AppView;
  theme: 'light' | 'dark';
  onNavigate: (view: AppView) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export function WebLayout({ user, view, theme, onNavigate, onToggleTheme, onLogout, children }: WebLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const links: { label: string; view: AppView; icon: ReactNode }[] = [
    { label: 'Visão geral', view: 'home', icon: <LayoutDashboard size={18} /> },
    { label: 'Notícias', view: 'campus-news', icon: <Newspaper size={18} /> },
    { label: 'Salas', view: 'salas', icon: <Search size={18} /> },
    { label: 'Filas', view: 'filas', icon: <Users size={18} /> },
    ...(user.role === 'professor' ? [
      { label: 'Painel docente', view: 'professor-dashboard' as AppView, icon: <GraduationCap size={18} /> },
      { label: 'Palestras e eventos', view: 'professor-events' as AppView, icon: <CalendarDays size={18} /> },
      { label: 'Trabalhos', view: 'professor-assignments' as AppView, icon: <ClipboardList size={18} /> },
    ] : []),
    ...(user.role === 'admin' ? [{ label: 'Administração', view: 'admin' as AppView, icon: <Shield size={18} /> }] : []),
    ...(user.role === 'aluno' ? [
      { label: 'Escanear palestra', view: 'student-events' as AppView, icon: <QrCode size={18} /> },
      { label: 'Minhas disciplinas', view: 'student-schedule' as AppView, icon: <BookOpen size={18} /> },
      { label: 'Trabalhos', view: 'student-assignments' as AppView, icon: <ClipboardList size={18} /> },
      { label: 'Desempenho', view: 'student-performance' as AppView, icon: <Activity size={18} /> },
    ] : []),
  ];
  const pageTitle = links.find(link => link.view === view)?.label
    ?? (view === 'professor-events' || view === 'student-events' ? 'Palestras e eventos' : view === 'event-checkin' ? 'Confirmação de presença' : 'Campus');

  const navigate = (nextView: AppView) => {
    onNavigate(nextView);
    setIsMobileMenuOpen(false);
  };

  const navItems = (mobile = false) => links.map(link => {
    const active = view === link.view
      || (link.view === 'professor-dashboard' && view.startsWith('professor-'))
      || (link.view === 'campus-news' && view === 'noticia')
      || (link.view === 'filas' && view === 'acompanhamento');
    return (
      <button
        key={link.view}
        type="button"
        onClick={() => navigate(link.view)}
        className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'} ${mobile ? 'py-3' : 'py-2.5'}`}
      >
        {link.icon}<span>{link.label}</span>
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <button type="button" onClick={() => navigate('home')} className="mb-8 flex items-center gap-3 px-2 text-left">
          <span className="grid size-10 place-items-center rounded-md bg-emerald-800 text-sm font-black text-white">C</span>
          <span><span className="block text-base font-bold leading-tight">Campus</span><span className="block text-xs text-slate-500">Portal acadêmico</span></span>
        </button>
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Menu</p>
        <nav className="flex flex-1 flex-col gap-1">{navItems()}</nav>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="truncate px-3 text-sm font-bold">{user.name}</p>
          <p className="mb-3 px-3 text-xs capitalize text-slate-500">{user.role}</p>
          <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><LogOut size={18} />Sair da conta</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir navegação" className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-100"><Menu size={20} /></button>
            <div className="min-w-0"><p className="hidden text-xs text-slate-500 sm:block">Campus / {pageTitle}</p><h1 className="truncate text-lg font-bold">{pageTitle}</h1></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-right sm:block"><span className="block max-w-48 truncate text-sm font-semibold">{user.name}</span><span className="block text-xs capitalize text-slate-500">{user.role}</span></span>
            <button type="button" onClick={onToggleTheme} aria-label="Alternar tema" title="Alternar tema" className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button type="button" onClick={onLogout} aria-label="Sair da conta" title="Sair da conta" className="hidden size-10 place-items-center rounded-md text-slate-600 hover:bg-red-50 hover:text-red-700 sm:grid dark:text-slate-200"><LogOut size={19} /></button>
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen && <motion.div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)}>
            <motion.aside className="flex h-full w-[min(19rem,86vw)] flex-col bg-white p-4 dark:bg-slate-900" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.2 }} onClick={event => event.stopPropagation()}>
              <div className="mb-7 flex items-center justify-between"><span className="text-lg font-bold">Campus</span><button type="button" aria-label="Fechar navegação" onClick={() => setIsMobileMenuOpen(false)} className="grid size-10 place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button></div>
              <nav className="flex flex-1 flex-col gap-1">{navItems(true)}</nav>
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700"><p className="mb-3 truncate px-3 text-sm font-semibold">{user.name}</p><button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={18} />Sair da conta</button></div>
            </motion.aside>
          </motion.div>}
        </AnimatePresence>

        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1600px] px-4 py-5 pb-10 sm:px-6 sm:py-7 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
