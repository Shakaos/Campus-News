import { db } from './db.js';

export const getUsers = () => db.prepare('SELECT * FROM users ORDER BY name').all();
export const getNews = () => db.prepare('SELECT * FROM news ORDER BY date DESC').all();
export const getRooms = () => db.prepare('SELECT * FROM rooms ORDER BY building, name').all();
export const getQueueSectors = () => db.prepare('SELECT * FROM queue_sectors ORDER BY name').all();

export const findUserByEmailOrRole = (value: string) =>
  db.prepare('SELECT * FROM users WHERE email = ? OR role = ? LIMIT 1').get(value, value) as any;

export const addQueueTicket = (ticket: {
  id: string;
  sectorId: string;
  userId: string;
  number: number;
  position: number;
  estimatedTime: number;
  timestamp: string;
}) => {
  db.prepare(`
    INSERT INTO queue_tickets (id, sectorId, userId, number, position, estimatedTime, timestamp)
    VALUES (@id, @sectorId, @userId, @number, @position, @estimatedTime, @timestamp)
  `).run(ticket);
};

export const getTicketsByUser = (userId: string) =>
  db.prepare('SELECT * FROM queue_tickets WHERE userId = ? ORDER BY timestamp DESC').all(userId);

// News CRUD
export const createNews = (data: {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  date: string;
  imageUrl?: string;
}) => {
  db.prepare(`
    INSERT INTO news (id, title, category, summary, content, date, imageUrl)
    VALUES (@id, @title, @category, @summary, @content, @date, @imageUrl)
  `).run(data);
  return data;
};

export const updateNews = (id: string, data: Partial<{ title: string; category: string; summary: string; content: string; date: string; imageUrl: string }>) => {
  const updates = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');
  
  if (!updates) return null;
  
  db.prepare(`UPDATE news SET ${updates} WHERE id = @id`).run({ id, ...data });
  return db.prepare('SELECT * FROM news WHERE id = ?').get(id);
};

export const deleteNews = (id: string) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(id);
};

// Rooms CRUD
export const createRoom = (data: {
  id: string;
  name: string;
  building: string;
  floor: string;
  status: string;
  currentProfessor?: string | null;
  nextClass?: string | null;
  capacity: number;
}) => {
  db.prepare(`
    INSERT INTO rooms (id, name, building, floor, status, currentProfessor, nextClass, capacity)
    VALUES (@id, @name, @building, @floor, @status, @currentProfessor, @nextClass, @capacity)
  `).run(data);
  return data;
};

export const updateRoom = (id: string, data: Partial<{ name: string; building: string; floor: string; status: string; currentProfessor: string | null; nextClass: string | null; capacity: number }>) => {
  const updates = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');
  
  if (!updates) return null;
  
  db.prepare(`UPDATE rooms SET ${updates} WHERE id = @id`).run({ id, ...data });
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
};

export const deleteRoom = (id: string) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
};

// Attendance CRUD
export const createAttendance = (data: {
  id: string;
  classId: string;
  professorId: string;
  studentName: string;
  status: string;
  date: string;
  timestamp: string;
}) => {
  db.prepare(`
    INSERT INTO attendance_records (id, classId, professorId, studentName, status, date, timestamp)
    VALUES (@id, @classId, @professorId, @studentName, @status, @date, @timestamp)
  `).run(data);
  return data;
};

export const getAttendanceByClass = (classId: string) =>
  db.prepare('SELECT * FROM attendance_records WHERE classId = ? ORDER BY timestamp DESC').all(classId);

export const updateAttendance = (id: string, data: Partial<{ status: string }>) => {
  const updates = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');
  
  if (!updates) return null;
  
  db.prepare(`UPDATE attendance_records SET ${updates} WHERE id = @id`).run({ id, ...data });
  return db.prepare('SELECT * FROM attendance_records WHERE id = ?').get(id);
};

// Lab Reservation CRUD
export const createLabReservation = (data: {
  id: string;
  labName: string;
  professorId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  timestamp: string;
}) => {
  db.prepare(`
    INSERT INTO lab_reservations (id, labName, professorId, date, startTime, endTime, purpose, timestamp)
    VALUES (@id, @labName, @professorId, @date, @startTime, @endTime, @purpose, @timestamp)
  `).run(data);
  return data;
};

export const getLabReservationsByProfessor = (professorId: string) =>
  db.prepare('SELECT * FROM lab_reservations WHERE professorId = ? ORDER BY date DESC').all(professorId);

export const deleteLabReservation = (id: string) => {
  db.prepare('DELETE FROM lab_reservations WHERE id = ?').run(id);
};

// Class Notices CRUD
export const createClassNotice = (data: {
  id: string;
  classId: string;
  professorId: string;
  title: string;
  content: string;
  date: string;
  timestamp: string;
}) => {
  db.prepare(`
    INSERT INTO class_notices (id, classId, professorId, title, content, date, timestamp)
    VALUES (@id, @classId, @professorId, @title, @content, @date, @timestamp)
  `).run(data);
  return data;
};

export const getClassNoticesByClass = (classId: string) =>
  db.prepare('SELECT * FROM class_notices WHERE classId = ? ORDER BY timestamp DESC').all(classId);

export const deleteClassNotice = (id: string) => {
  db.prepare('DELETE FROM class_notices WHERE id = ?').run(id);
};
