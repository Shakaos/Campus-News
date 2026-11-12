import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, UserPlus } from 'lucide-react';
import { adminApi, newsApi, roomApi } from './api';
import { getLocalDateInputValue } from './date';
import { AcademicCourse, CourseSubject, NewsItem, Room, User } from './types';

interface AdminViewProps {
  onBack: () => void;
  isWeb?: boolean;
}

export function AdminView({ onBack, isWeb = false }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'rooms' | 'students' | 'professors' | 'academic'>('news');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={isWeb ? 'web-admin space-y-4 px-1 py-2 md:px-2' : 'space-y-6 p-6 pb-32'}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className={`${isWeb ? 'text-2xl' : 'text-3xl'} font-black text-slate-900`}>Administração</h1>
          <p className="text-sm text-slate-500">Gerenciar notícias, contas e estrutura acadêmica</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 md:gap-4">
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
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Alunos
        </button>
        <button
          onClick={() => setActiveTab('professors')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors ${
            activeTab === 'professors'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Professores
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-3 font-bold border-b-2 transition-colors ${
            activeTab === 'academic'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Cursos e turmas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'news' && <NewsManager isWeb={isWeb} />}
      {activeTab === 'rooms' && <RoomsManager isWeb={isWeb} />}
      {activeTab === 'students' && <AccountManager role="aluno" isWeb={isWeb} />}
      {activeTab === 'professors' && <AccountManager role="professor" isWeb={isWeb} />}
      {activeTab === 'academic' && <AcademicManager isWeb={isWeb} />}
    </motion.div>
  );
}

function AccountManager({ role, isWeb = false }: { role: 'aluno' | 'professor'; isWeb?: boolean }) {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', courseId: '', coursePeriod: '1', classGroup: 'A' });
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ courseId: '', coursePeriod: '1', classGroup: 'A' });

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      setAccounts(role === 'aluno' ? await adminApi.listStudents() : await adminApi.listProfessors());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Erro ao carregar ${role === 'aluno' ? 'alunos' : 'professores'}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, [role]);

  useEffect(() => {
    if (role !== 'aluno') return;
    void adminApi.listCourses()
      .then(setCourses)
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar cursos.'));
  }, [role]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (role === 'aluno') {
        await adminApi.createStudent({
          ...formData,
          coursePeriod: Number(formData.coursePeriod),
        });
      } else {
        await adminApi.createProfessor(formData);
      }
      setFormData({ name: '', email: '', password: '', courseId: '', coursePeriod: '1', classGroup: 'A' });
      setShowForm(false);
      await loadAccounts();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : `Erro ao criar ${role === 'aluno' ? 'aluno' : 'professor'}.`);
      setIsLoading(false);
    }
  };

  const saveStudentProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudentId) return;
    setIsLoading(true);
    setError('');
    try {
      await adminApi.updateStudentAcademicProfile(editingStudentId, {
        ...profileForm,
        coursePeriod: Number(profileForm.coursePeriod),
      });
      setEditingStudentId(null);
      await loadAccounts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível atualizar o vínculo acadêmico.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
      >
        <UserPlus size={20} />
        Novo {role === 'aluno' ? 'Aluno' : 'Professor'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nome completo</label>
            <input type="text" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required minLength={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
            <input type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha inicial</label>
            <input type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700" />
          </div>
          {role === 'aluno' && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Curso</label>
                <select value={formData.courseId} onChange={(event) => setFormData({ ...formData, courseId: event.target.value })} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="">Selecione o curso</option>
                  {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                </select>
                {courses.length === 0 && <p className="mt-1 text-xs text-amber-700">Cadastre primeiro o curso em “Cursos e turmas”.</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">Período do curso
                  <select value={formData.coursePeriod} onChange={(event) => setFormData({ ...formData, coursePeriod: event.target.value })} required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
                    {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}º período</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">Turma
                  <input value={formData.classGroup} onChange={(event) => setFormData({ ...formData, classGroup: event.target.value })} required maxLength={30} placeholder="Ex.: A" className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </label>
              </div>
            </>
          )}
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isLoading || (role === 'aluno' && courses.length === 0)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
              <Check size={18} />
              {isLoading ? 'Salvando...' : 'Criar conta'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-400">
              <X size={18} />
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && !showForm && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}

      {isLoading && accounts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Nenhum {role === 'aluno' ? 'aluno' : 'professor'} cadastrado.</div>
      ) : (
        <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {accounts.map((account) => (
            <div key={account.id} className={`rounded-lg border border-slate-200 bg-white ${isWeb ? 'p-3' : 'p-4'}`}>
              <p className="font-bold text-slate-900">{account.name}</p>
              <p className="text-sm text-slate-500">{account.email}</p>
              {role === 'aluno' && (
                <>
                  <p className="mt-1 text-xs font-semibold text-blue-700">{account.courseName ? `${account.courseName} · ${account.coursePeriod}º período · Turma ${account.classGroup}` : 'Vínculo acadêmico não configurado'}</p>
                  <button type="button" onClick={() => {
                    setEditingStudentId(editingStudentId === account.id ? null : account.id);
                    setProfileForm({
                      courseId: account.courseId ?? '',
                      coursePeriod: String(account.coursePeriod ?? 1),
                      classGroup: account.classGroup ?? 'A',
                    });
                    setError('');
                  }} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
                    <Edit2 size={14} /> Editar curso/turma
                  </button>
                  {editingStudentId === account.id && (
                    <form onSubmit={saveStudentProfile} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <select value={profileForm.courseId} onChange={event => setProfileForm({ ...profileForm, courseId: event.target.value })} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Selecione o curso</option>
                        {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={profileForm.coursePeriod} onChange={event => setProfileForm({ ...profileForm, coursePeriod: event.target.value })} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                          {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}º período</option>)}
                        </select>
                        <input value={profileForm.classGroup} onChange={event => setProfileForm({ ...profileForm, classGroup: event.target.value })} required maxLength={30} placeholder="Turma" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{isLoading ? 'Salvando...' : 'Salvar vínculo acadêmico'}</button>
                    </form>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AcademicManager({ isWeb = false }: { isWeb?: boolean }) {
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<CourseSubject[]>([]);
  const [term, setTerm] = useState('');
  const [courseName, setCourseName] = useState('');
  const [form, setForm] = useState({ name: '', courseId: '', coursePeriod: '1', classGroup: 'A', professorId: '', schedule: '', workload: '60', credits: '3' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    const [courseRecords, professorRecords, subjectRecords, termRecord] = await Promise.all([
      adminApi.listCourses(),
      adminApi.listProfessors(),
      adminApi.listAcademicSubjects(),
      adminApi.getAcademicTerm(),
    ]);
    setCourses(courseRecords);
    setProfessors(professorRecords);
    setSubjects(subjectRecords);
    setTerm(termRecord.term);
    setForm(previous => ({
      ...previous,
      courseId: previous.courseId || courseRecords[0]?.id || '',
      professorId: previous.professorId || professorRecords[0]?.id || '',
    }));
  };

  useEffect(() => {
    void loadData()
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados acadêmicos.'))
      .finally(() => setIsLoading(false));
  }, []);

  const createCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      const course = await adminApi.createCourse(courseName);
      setCourses(previous => [...previous, course].sort((first, second) => first.name.localeCompare(second.name)));
      setForm(previous => ({ ...previous, courseId: previous.courseId || course.id }));
      setCourseName('');
      setMessage('Curso cadastrado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível cadastrar o curso.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveTerm = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await adminApi.setAcademicTerm(term);
      setTerm(result.term);
      await loadData();
      setMessage('Semestre letivo atualizado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível atualizar o semestre letivo.');
    } finally {
      setIsSaving(false);
    }
  };

  const createSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.createAcademicSubject({
        ...form,
        coursePeriod: Number(form.coursePeriod),
        workload: Number(form.workload),
        credits: Number(form.credits),
      });
      await loadData();
      setForm(previous => ({ ...previous, name: '', schedule: '' }));
      setMessage('Turma/disciplina cadastrada e vinculada ao professor.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível cadastrar a turma.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`space-y-5 ${isWeb ? 'px-1 py-2' : ''}`}>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Cursos da instituição</h2>
        <form onSubmit={createCourse} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={courseName} onChange={event => setCourseName(event.target.value)} required minLength={2} maxLength={120} placeholder="Ex.: Sistemas de Informação" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
          <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">Adicionar curso</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">{courses.map(course => <span key={course.id} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">{course.name}</span>)}</div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Semestre letivo atual</h2>
        <form onSubmit={saveTerm} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={term} onChange={event => setTerm(event.target.value)} required pattern="[0-9]{4}/[12]" title="Use o formato AAAA/1 ou AAAA/2" placeholder="2026/2" className="rounded-lg border border-slate-300 px-3 py-2" />
          <button type="submit" disabled={isSaving} className="rounded-lg bg-slate-800 px-4 py-2 font-bold text-white disabled:opacity-50">Salvar semestre</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Apenas as disciplinas deste semestre aparecem para alunos e professores.</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-bold text-slate-900">Abrir uma turma/disciplina neste semestre</h2>
        {courses.length === 0 ? <p className="mt-2 text-sm text-amber-700">Cadastre um curso antes de criar turmas.</p> : professors.length === 0 ? <p className="mt-2 text-sm text-amber-700">Cadastre um professor antes de atribuir disciplinas.</p> : (
          <form onSubmit={createSubject} className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Disciplina<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required minLength={2} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ex.: Algoritmos" /></label>
            <label className="text-sm font-semibold text-slate-700">Curso<select value={form.courseId} onChange={event => setForm({ ...form, courseId: event.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Período do curso<select value={form.coursePeriod} onChange={event => setForm({ ...form, coursePeriod: event.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}º período</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Turma<input value={form.classGroup} onChange={event => setForm({ ...form, classGroup: event.target.value })} required maxLength={30} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="A" /></label>
            <label className="text-sm font-semibold text-slate-700">Professor<select value={form.professorId} onChange={event => setForm({ ...form, professorId: event.target.value })} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{professors.map(professor => <option key={professor.id} value={professor.id}>{professor.name}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Horário<input value={form.schedule} onChange={event => setForm({ ...form, schedule: event.target.value })} required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Seg e Qua · 08:00" /></label>
            <label className="text-sm font-semibold text-slate-700">Carga horária (h)<input type="number" value={form.workload} onChange={event => setForm({ ...form, workload: event.target.value })} required min={1} max={1000} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-semibold text-slate-700">Créditos<input type="number" value={form.credits} onChange={event => setForm({ ...form, credits: event.target.value })} required min={1} max={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <button type="submit" disabled={isSaving || isLoading} className="rounded-lg bg-green-700 px-4 py-2 font-bold text-white disabled:opacity-50 sm:col-span-2">{isSaving ? 'Salvando...' : 'Cadastrar turma/disciplina'}</button>
          </form>
        )}
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</p>}

      <section className="space-y-2">
        <h2 className="font-bold text-slate-900">Turmas ativas · {term}</h2>
        {isLoading ? <p className="text-sm text-slate-500">Carregando turmas...</p> : subjects.length === 0 ? <p className="text-sm text-slate-500">Nenhuma turma cadastrada para este semestre.</p> : subjects.map(subject => (
          <article key={subject.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="font-bold text-slate-900">{subject.name} · Turma {subject.classGroup}</p>
            <p className="text-sm text-slate-600">{subject.courseName} · {subject.coursePeriod}º período · {subject.teacher}</p>
            <p className="text-xs text-slate-500">{subject.schedule} · {subject.workload}h · {subject.credits} créditos</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function NewsManager({ isWeb = false }: { isWeb?: boolean }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<NewsItem, 'id' | 'category'> & { category: NewsItem['category'] | '' }>({
    title: '',
    category: 'aviso',
    summary: '',
    content: '',
    date: getLocalDateInputValue(),
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
    const category = formData.category;
    if (!category) return;
    setIsLoading(true);
    const newsData: Omit<NewsItem, 'id'> = { ...formData, category };

    try {
      if (editingId) {
        await newsApi.update(editingId, newsData);
      } else {
        await newsApi.create(newsData);
      }
      
      await loadNews();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        category: 'aviso',
        summary: '',
        content: '',
        date: getLocalDateInputValue(),
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
              category: 'aviso',
              summary: '',
              content: '',
              date: getLocalDateInputValue(),
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
                onChange={(e) => setFormData({ ...formData, category: e.target.value as NewsItem['category'] | '' })}
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

      <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {isLoading && !showForm ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nenhuma notícia</div>
        ) : (
          news.map((item) => (
            <div key={item.id} className={`rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md ${isWeb ? 'p-3' : 'p-4'}`}>
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

function RoomsManager({ isWeb = false }: { isWeb?: boolean }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Room, 'id'>>({
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
        currentProfessor: formData.currentProfessor || undefined,
        nextClass: formData.nextClass || undefined,
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
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

      <div className={isWeb ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {isLoading && !showForm ? (
          <div className="text-center py-8 text-slate-500">Carregando...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-slate-500">Nenhuma sala</div>
        ) : (
          rooms.map((item) => (
            <div key={item.id} className={`rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md ${isWeb ? 'p-3' : 'p-4'}`}>
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
