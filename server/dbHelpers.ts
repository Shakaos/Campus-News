import { db } from './db.js';

export const getUsers = () => db.prepare('SELECT * FROM users ORDER BY name').all();
export const getNews = () => db.prepare('SELECT * FROM news ORDER BY date DESC').all();
export const getRooms = () => db.prepare('SELECT * FROM rooms ORDER BY building, name').all();
export const getQueueSectors = () => db.prepare('SELECT * FROM queue_sectors ORDER BY name').all();
const subjectQuery = `SELECT s.*, c.name AS courseName
  FROM academic_subjects s
  JOIN academic_courses c ON c.id = s.courseId`;
export const getSubjects = () => db.prepare(`${subjectQuery}
  WHERE s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
  ORDER BY c.name, s.coursePeriod, s.name, s.classGroup`).all();
export const getSubjectsForStudent = (studentId: string) => db.prepare(`${subjectQuery}
  JOIN users u ON u.id = ?
  WHERE u.role = 'aluno'
    AND s.courseId = u.courseId
    AND s.coursePeriod = u.coursePeriod
    AND s.classGroup = u.classGroup
    AND s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
  ORDER BY s.name`).all(studentId);
export const getSubjectsForProfessor = (professorId: string) => db.prepare(`${subjectQuery}
  WHERE s.professorId = ?
    AND s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
  ORDER BY c.name, s.coursePeriod, s.name, s.classGroup`).all(professorId);
export const getSubjectById = (id: string) => db.prepare(`${subjectQuery}
  WHERE s.id = ? AND s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')`).get(id) as any;
export const getStudentsForSubject = (subjectId: string, professorId?: string) => db.prepare(`
  SELECT u.id, u.name, u.role, u.email, u.courseId, u.coursePeriod, u.classGroup, c.name AS courseName
  FROM users u
  JOIN academic_subjects s
    ON s.courseId = u.courseId
    AND s.coursePeriod = u.coursePeriod
    AND s.classGroup = u.classGroup
  LEFT JOIN academic_courses c ON c.id = u.courseId
  WHERE s.id = ?
    AND s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
    AND u.role = 'aluno'
    AND (? IS NULL OR s.professorId = ?)
  ORDER BY u.name`).all(subjectId, professorId ?? null, professorId ?? null);
export const getAcademicCourses = () => db.prepare('SELECT * FROM academic_courses ORDER BY name').all();
export const getAcademicCourseById = (id: string) => db.prepare('SELECT * FROM academic_courses WHERE id = ?').get(id) as any;
export const createAcademicCourse = (data: { id: string; name: string }) => {
  db.prepare('INSERT INTO academic_courses (id, name) VALUES (@id, @name)').run(data);
  return data;
};
export const getCurrentAcademicTerm = () =>
  (db.prepare("SELECT value FROM academic_settings WHERE key = 'active_term'").get() as { value: string } | undefined)?.value ?? '';
export const setCurrentAcademicTerm = (value: string) => {
  db.prepare(`INSERT INTO academic_settings (key, value) VALUES ('active_term', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(value);
  return value;
};
export const createAcademicSubject = (data: {
  id: string; name: string; teacher: string; schedule: string; workload: number; credits: number;
  courseId: string; coursePeriod: number; academicTerm: string; classGroup: string; professorId: string;
}) => {
  db.prepare(`INSERT INTO academic_subjects
    (id, name, teacher, schedule, workload, credits, courseId, coursePeriod, academicTerm, classGroup, professorId)
    VALUES (@id, @name, @teacher, @schedule, @workload, @credits, @courseId, @coursePeriod, @academicTerm, @classGroup, @professorId)`
  ).run(data);
  return db.prepare(`${subjectQuery} WHERE s.id = ?`).get(data.id);
};
export const getGrades = (studentId?: string) => {
  if (studentId) {
    return db.prepare('SELECT * FROM grades WHERE studentId = ? ORDER BY subjectName').all(studentId);
  }

  return db.prepare('SELECT * FROM grades ORDER BY subjectName, studentName').all();
};
export const getGradesForProfessor = (professorId: string) => db.prepare(`
  SELECT g.* FROM grades g
  JOIN academic_subjects s ON s.id = g.subjectId
  WHERE s.professorId = ?
    AND s.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
  ORDER BY g.subjectName, g.studentName`).all(professorId);
export const getGradeById = (id: string) => db.prepare('SELECT * FROM grades WHERE id = ?').get(id) as any;

export const getSubjectAssessments = (studentId?: string, professorId?: string) => studentId
  ? db.prepare('SELECT * FROM subject_assessments WHERE studentId = ? ORDER BY subjectName, period, assessmentType').all(studentId)
  : professorId
    ? db.prepare('SELECT * FROM subject_assessments WHERE professorId = ? ORDER BY subjectName, studentName, period, assessmentType').all(professorId)
    : db.prepare('SELECT * FROM subject_assessments ORDER BY subjectName, studentName, period, assessmentType').all();

export const saveSubjectAssessment = (data: {
  id: string; studentId: string; studentName: string; subjectId: string; subjectName: string;
  assessmentType: string; period: string; value: number; professorId: string; updatedAt: string;
}) => {
  db.prepare(`INSERT INTO subject_assessments
    (id, studentId, studentName, subjectId, subjectName, assessmentType, period, value, professorId, updatedAt)
    VALUES (@id, @studentId, @studentName, @subjectId, @subjectName, @assessmentType, @period, @value, @professorId, @updatedAt)
    ON CONFLICT(studentId, subjectId, assessmentType, period) DO UPDATE SET
      value = excluded.value, professorId = excluded.professorId, updatedAt = excluded.updatedAt`
  ).run(data);
  return db.prepare(`SELECT * FROM subject_assessments
    WHERE studentId = ? AND subjectId = ? AND assessmentType = ? AND period = ?`
  ).get(data.studentId, data.subjectId, data.assessmentType, data.period);
};

export const getClassAttendance = (subjectId: string) =>
  db.prepare('SELECT * FROM class_attendance WHERE subjectId = ? ORDER BY date DESC, studentName').all(subjectId);

export const getStudentAttendance = (studentId: string) =>
  db.prepare('SELECT * FROM class_attendance WHERE studentId = ? ORDER BY date DESC, subjectId').all(studentId);

export const saveClassAttendanceRecord = (data: {
  id: string; studentId: string; studentName: string; subjectId: string; date: string; status: string; professorId: string;
}) => {
  db.prepare(`INSERT INTO class_attendance (id, studentId, studentName, subjectId, date, status, professorId)
    VALUES (@id, @studentId, @studentName, @subjectId, @date, @status, @professorId)
    ON CONFLICT(studentId, subjectId, date) DO UPDATE SET status = excluded.status, professorId = excluded.professorId`
  ).run(data);
};

export const findUserByEmailOrRole = (value: string) =>
  db.prepare('SELECT * FROM users WHERE email = ? OR role = ? LIMIT 1').get(value, value) as any;

export const findUserByEmail = (email: string) =>
  db.prepare(`SELECT u.*, c.name AS courseName FROM users u
    LEFT JOIN academic_courses c ON c.id = u.courseId
    WHERE u.email = ? LIMIT 1`).get(email) as any;
export const findUserById = (id: string) =>
  db.prepare(`SELECT u.id, u.name, u.role, u.email, u.courseId, u.coursePeriod, u.classGroup, c.name AS courseName
    FROM users u LEFT JOIN academic_courses c ON c.id = u.courseId WHERE u.id = ? LIMIT 1`).get(id) as any;

export const createUser = (data: {
  id: string; name: string; role: string; email: string; password: string;
  courseId?: string | null; coursePeriod?: number | null; classGroup?: string | null;
}) => {
  const user = {
    ...data,
    courseId: data.courseId ?? null,
    coursePeriod: data.coursePeriod ?? null,
    classGroup: data.classGroup ?? null,
  };
  db.prepare(`
    INSERT INTO users (id, name, role, email, password, courseId, coursePeriod, classGroup)
    VALUES (@id, @name, @role, @email, @password, @courseId, @coursePeriod, @classGroup)
  `).run(user);
  return user;
};

export const updateUserAcademicProfile = (id: string, data: { courseId: string; coursePeriod: number; classGroup: string }) => {
  db.prepare(`UPDATE users SET courseId = @courseId, coursePeriod = @coursePeriod, classGroup = @classGroup
    WHERE id = @id AND role = 'aluno'`).run({ id, ...data });
  return findUserById(id);
};

export const getUsersByRole = (role: string) =>
  db.prepare(`SELECT u.id, u.name, u.role, u.email, u.courseId, u.coursePeriod, u.classGroup, c.name AS courseName
    FROM users u LEFT JOIN academic_courses c ON c.id = u.courseId
    WHERE u.role = ? ORDER BY u.name`).all(role);

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

export const createGrade = (data: {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  value: number;
  period: string;
  status: 'Aprovado' | 'Recuperação' | 'Reprovado';
}) => {
  db.prepare(`
    INSERT INTO grades (id, studentId, studentName, subjectId, subjectName, value, period, status)
    VALUES (@id, @studentId, @studentName, @subjectId, @subjectName, @value, @period, @status)
  `).run(data);
  return data;
};

export const updateGrade = (id: string, data: Partial<{ studentId: string; studentName: string; subjectId: string; subjectName: string; value: number; period: string; status: 'Aprovado' | 'Recuperação' | 'Reprovado' }>) => {
  const updates = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');

  if (!updates) return null;

  db.prepare(`UPDATE grades SET ${updates} WHERE id = @id`).run({ id, ...data });
  return db.prepare('SELECT * FROM grades WHERE id = ?').get(id);
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

export const createCampusEvent = (event: {
  id: string; professorId: string; title: string; description: string; location: string;
  startsAt: string; endsAt: string; entryToken: string; exitToken: string; createdAt: string;
}) => {
  db.prepare(`INSERT INTO campus_events
    (id, professorId, title, description, location, startsAt, endsAt, entryToken, exitToken, createdAt)
    VALUES (@id, @professorId, @title, @description, @location, @startsAt, @endsAt, @entryToken, @exitToken, @createdAt)`
  ).run(event);
  return event;
};

export const getCampusEventsByProfessor = (professorId: string) =>
  db.prepare(`SELECT e.id, e.professorId, e.title, e.description, e.location, e.startsAt, e.endsAt, e.createdAt,
    COUNT(a.id) AS attendeeCount,
    SUM(CASE WHEN a.checkedInAt IS NOT NULL AND a.checkedOutAt IS NOT NULL THEN 1 ELSE 0 END) AS completedCount
    FROM campus_events e LEFT JOIN event_attendance a ON a.eventId = e.id
    WHERE e.professorId = ? GROUP BY e.id ORDER BY e.startsAt DESC`).all(professorId);

export const getCampusEventByToken = (token: string) =>
  db.prepare('SELECT *, CASE WHEN entryToken = ? THEN \'entry\' ELSE \'exit\' END AS phase FROM campus_events WHERE entryToken = ? OR exitToken = ?').get(token, token, token) as any;

export const getCampusEventById = (id: string) =>
  db.prepare('SELECT * FROM campus_events WHERE id = ?').get(id) as any;

export const createEventQrToken = (data: { token: string; eventId: string; studentId: string; phase: 'entry' | 'exit'; expiresAt: string; createdAt: string }) => {
  const createToken = db.transaction(() => {
    db.prepare(`DELETE FROM event_qr_tokens WHERE eventId = ? AND studentId = ? AND phase = ? AND usedAt IS NULL`)
      .run(data.eventId, data.studentId, data.phase);
    db.prepare(`INSERT INTO event_qr_tokens (token, eventId, studentId, phase, expiresAt, createdAt)
      VALUES (@token, @eventId, @studentId, @phase, @expiresAt, @createdAt)`
    ).run(data);
  });
  createToken();
};

export const getEventByQrToken = (token: string) =>
  db.prepare(`SELECT q.token, q.studentId AS tokenStudentId, q.phase, q.expiresAt, q.usedAt,
    e.id, e.professorId, e.title, e.location, e.startsAt, e.endsAt
    FROM event_qr_tokens q JOIN campus_events e ON e.id = q.eventId WHERE q.token = ?`).get(token) as any;

export const getEventAttendanceRecord = (eventId: string, studentId: string) =>
  db.prepare('SELECT * FROM event_attendance WHERE eventId = ? AND studentId = ?').get(eventId, studentId) as any;

export const markEventQrTokenUsed = (token: string, usedAt: string) =>
  db.prepare('UPDATE event_qr_tokens SET usedAt = ? WHERE token = ? AND usedAt IS NULL').run(usedAt, token).changes > 0;

export const recordEventCheckIn = (data: { id: string; eventId: string; studentId: string; studentName: string; phase: 'entry' | 'exit'; timestamp: string }) => {
  if (data.phase === 'entry') {
    db.prepare(`INSERT INTO event_attendance (id, eventId, studentId, studentName, checkedInAt)
      VALUES (@id, @eventId, @studentId, @studentName, @timestamp)
      ON CONFLICT(eventId, studentId) DO UPDATE SET checkedInAt = COALESCE(checkedInAt, excluded.checkedInAt)`
    ).run(data);
  } else {
    db.prepare(`UPDATE event_attendance SET checkedOutAt = COALESCE(checkedOutAt, @timestamp)
      WHERE eventId = @eventId AND studentId = @studentId AND checkedInAt IS NOT NULL`).run(data);
  }
  return db.prepare('SELECT * FROM event_attendance WHERE eventId = ? AND studentId = ?').get(data.eventId, data.studentId) as any;
};

export const getEventAttendanceForStudent = (studentId: string) =>
  db.prepare(`SELECT a.*, e.title, e.description, e.location, e.startsAt, e.endsAt
    FROM event_attendance a JOIN campus_events e ON e.id = a.eventId
    WHERE a.studentId = ? ORDER BY e.startsAt DESC`).all(studentId);

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

export const createAssignment = (assignment: {
  id: string; subjectId: string; subjectName: string; professorId: string;
  title: string; description: string; dueAt: string; createdAt: string;
}) => {
  db.prepare(`INSERT INTO assignments (id, subjectId, subjectName, professorId, title, description, dueAt, createdAt)
    VALUES (@id, @subjectId, @subjectName, @professorId, @title, @description, @dueAt, @createdAt)`
  ).run(assignment);
  return assignment;
};

export const getAssignmentsByProfessor = (professorId: string) =>
  db.prepare(`SELECT a.*, c.name AS courseName, s.coursePeriod, s.classGroup, s.academicTerm
    FROM assignments a
    JOIN academic_subjects s ON s.id = a.subjectId
    JOIN academic_courses c ON c.id = s.courseId
    WHERE a.professorId = ? ORDER BY a.dueAt ASC`).all(professorId);

export const getAssignmentById = (id: string) =>
  db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as any;

export const getAssignmentsByStudent = (studentId: string) =>
  db.prepare(`SELECT a.*, c.name AS courseName, subject.coursePeriod, subject.classGroup, subject.academicTerm,
      s.completedAt, f.id AS fileId, f.fileName, f.fileSize, f.mimeType, f.uploadedAt AS fileUploadedAt
    FROM assignments a
    JOIN academic_subjects subject ON subject.id = a.subjectId
    JOIN academic_courses c ON c.id = subject.courseId
    JOIN users student ON student.id = ?
      AND student.role = 'aluno'
      AND subject.courseId = student.courseId
      AND subject.coursePeriod = student.coursePeriod
      AND subject.classGroup = student.classGroup
      AND subject.academicTerm = (SELECT value FROM academic_settings WHERE key = 'active_term')
    LEFT JOIN assignment_submissions s ON s.assignmentId = a.id AND s.studentId = ?
    LEFT JOIN assignment_submission_files f ON f.assignmentId = a.id AND f.studentId = ?
    ORDER BY a.dueAt ASC, f.uploadedAt ASC`).all(studentId, studentId, studentId)
    .reduce((assignments: any[], row: any) => {
      let assignment = assignments.find(item => item.id === row.id);
      if (!assignment) {
        assignment = { ...row, submissionFiles: [] };
        delete assignment.fileId;
        delete assignment.fileName;
        delete assignment.fileSize;
        delete assignment.mimeType;
        delete assignment.fileUploadedAt;
        assignments.push(assignment);
      }
      if (row.fileId) {
        assignment.submissionFiles.push({
          id: row.fileId,
          fileName: row.fileName,
          fileSize: row.fileSize,
          mimeType: row.mimeType,
          uploadedAt: row.fileUploadedAt,
        });
      }
      return assignments;
    }, []);

export const createAssignmentSubmissionFiles = (files: {
  id: string; assignmentId: string; studentId: string; fileName: string;
  storagePath: string; mimeType: string; fileSize: number; uploadedAt: string;
}[], completion: { id: string; assignmentId: string; studentId: string; completedAt: string }) => {
  const insert = db.prepare(`INSERT INTO assignment_submission_files
    (id, assignmentId, studentId, fileName, storagePath, mimeType, fileSize, uploadedAt)
    VALUES (@id, @assignmentId, @studentId, @fileName, @storagePath, @mimeType, @fileSize, @uploadedAt)`);
  const saveSubmission = db.transaction((items: typeof files) => {
    items.forEach(file => insert.run(file));
    db.prepare(`INSERT INTO assignment_submissions (id, assignmentId, studentId, completedAt)
      VALUES (@id, @assignmentId, @studentId, @completedAt)
      ON CONFLICT(assignmentId, studentId) DO UPDATE SET completedAt = excluded.completedAt`
    ).run(completion);
  });
  saveSubmission(files);
  return files.map(({ id, fileName, fileSize, mimeType, uploadedAt }) => ({ id, fileName, fileSize, mimeType, uploadedAt }));
};

export const getAssignmentSubmissionFilesForProfessor = (professorId: string) =>
  db.prepare(`SELECT a.id AS assignmentId, a.title AS assignmentTitle, a.subjectName,
      c.name AS courseName, s.coursePeriod, s.classGroup, f.studentId,
      u.name AS studentName, f.id AS fileId, f.fileName, f.fileSize, f.mimeType, f.uploadedAt
    FROM assignment_submission_files f
    JOIN assignments a ON a.id = f.assignmentId
    JOIN academic_subjects s ON s.id = a.subjectId
    JOIN academic_courses c ON c.id = s.courseId
    JOIN users u ON u.id = f.studentId
    WHERE a.professorId = ?
    ORDER BY f.uploadedAt DESC`).all(professorId)
    .reduce((submissions: any[], row: any) => {
      let submission = submissions.find(item => item.assignmentId === row.assignmentId && item.studentId === row.studentId);
      if (!submission) {
        submission = {
          id: `${row.assignmentId}:${row.studentId}`,
          assignmentId: row.assignmentId,
          assignmentTitle: row.assignmentTitle,
          subjectName: row.subjectName,
          courseName: row.courseName,
          coursePeriod: row.coursePeriod,
          classGroup: row.classGroup,
          studentId: row.studentId,
          studentName: row.studentName,
          uploadedAt: row.uploadedAt,
          files: [],
        };
        submissions.push(submission);
      }
      submission.uploadedAt = submission.uploadedAt > row.uploadedAt ? submission.uploadedAt : row.uploadedAt;
      submission.files.push({
        id: row.fileId,
        fileName: row.fileName,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
        uploadedAt: row.uploadedAt,
      });
      return submissions;
    }, []);

export const getAssignmentSubmissionFile = (id: string) =>
  db.prepare('SELECT * FROM assignment_submission_files WHERE id = ?').get(id) as any;

export const setAssignmentCompleted = (data: { id: string; assignmentId: string; studentId: string; completedAt: string | null }) => {
  if (data.completedAt) {
    db.prepare(`INSERT INTO assignment_submissions (id, assignmentId, studentId, completedAt)
      VALUES (@id, @assignmentId, @studentId, @completedAt)
      ON CONFLICT(assignmentId, studentId) DO UPDATE SET completedAt = excluded.completedAt`
    ).run(data);
  } else {
    db.prepare('DELETE FROM assignment_submissions WHERE assignmentId = ? AND studentId = ?').run(data.assignmentId, data.studentId);
  }
  return getAssignmentsByStudent(data.studentId).find((assignment: any) => assignment.id === data.assignmentId);
};

export const deleteClassNotice = (id: string) => {
  db.prepare('DELETE FROM class_notices WHERE id = ?').run(id);
};
