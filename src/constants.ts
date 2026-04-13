import { NewsItem, Room, QueueSector } from './types';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Semana de Tecnologia 2026',
    category: 'evento',
    summary: 'Participe das palestras e workshops sobre IA e Desenvolvimento Sustentável.',
    content: 'A Semana de Tecnologia deste ano focará em como a Inteligência Artificial pode auxiliar no desenvolvimento de soluções sustentáveis para o planeta. Teremos convidados de grandes empresas de tecnologia e pesquisadores renomados.',
    date: '2026-04-15',
    imageUrl: 'https://picsum.photos/seed/tech/800/400'
  },
  {
    id: '2',
    title: 'Manutenção no Bloco B',
    category: 'urgente',
    summary: 'As salas do Bloco B estarão fechadas para manutenção elétrica amanhã.',
    content: 'Devido a uma manutenção emergencial na rede elétrica, todas as salas do Bloco B estarão inacessíveis no dia 14/04. As aulas serão realocadas para o Bloco C.',
    date: '2026-04-13',
    imageUrl: 'https://picsum.photos/seed/warning/800/400'
  },
  {
    id: '3',
    title: 'Novos horários da Biblioteca',
    category: 'aviso',
    summary: 'A biblioteca agora funcionará até as 22h durante o período de provas.',
    content: 'Para apoiar os estudantes durante a semana de exames, a biblioteca central estenderá seu horário de funcionamento. Aproveite o espaço para estudos em grupo e consultas ao acervo.',
    date: '2026-04-10',
    imageUrl: 'https://picsum.photos/seed/library/800/400'
  }
];

export const MOCK_ROOMS: Room[] = [
  { id: '101', name: 'Laboratório 01', building: 'Bloco A', floor: 'Térreo', status: 'ocupada', currentProfessor: 'Dr. Silva', nextClass: '14:00 - Redes', capacity: 30 },
  { id: '102', name: 'Sala 204', building: 'Bloco A', floor: '2º Andar', status: 'disponível', nextClass: '16:00 - Cálculo I', capacity: 45 },
  { id: '103', name: 'Auditório Central', building: 'Bloco C', floor: 'Térreo', status: 'disponível', nextClass: '19:00 - Palestra Magna', capacity: 200 },
  { id: '104', name: 'Laboratório de Química', building: 'Bloco B', floor: '1º Andar', status: 'manutenção', capacity: 25 },
];

export const MOCK_SECTORS: QueueSector[] = [
  { id: 'sec1', name: 'Secretaria Acadêmica', description: 'Matrículas, históricos e documentos.', currentNumber: 45, waitingCount: 12, averageServiceTime: 8 },
  { id: 'sec2', name: 'Financeiro', description: 'Pagamentos, bolsas e negociações.', currentNumber: 12, waitingCount: 3, averageServiceTime: 15 },
  { id: 'sec3', name: 'Coordenação de Curso', description: 'Dúvidas pedagógicas e estágios.', currentNumber: 8, waitingCount: 5, averageServiceTime: 20 },
];
