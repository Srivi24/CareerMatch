import { db } from "./db";
import { 
  users, questions, options, assessments, answers, careers, engineeringBranches, programmes,
  type User, type InsertUser, type Question, type Option, type Assessment, 
  type Answer, type InsertAnswer, type Career, type InsertAssessment,
  type EngineeringBranch, type Programme, type InsertEngineeringBranch, type InsertProgramme
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Questions & Options
  getQuestions(): Promise<(Question & { options: Option[] })[]>;
  getQuestionsByCategory(): Promise<Record<string, Question[]>>;
  selectAssessmentQuestions(): Promise<number[]>;
  getQuestionsByIds(ids: number[]): Promise<(Question & { options: Option[] })[]>;
  createQuestion(question: Question, options: Option[]): Promise<Question>;

  // Assessment
  createAssessmentWithQuestions(userId: number): Promise<Assessment & { questions: (Question & { options: Option[] })[] }>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getUserAssessments(userId: number): Promise<Assessment[]>;
  updateAssessmentProgress(id: number, currentIndex: number): Promise<Assessment>;
  updateAssessmentStatus(id: number, status: string, scores?: any): Promise<Assessment>;
  
  // Answers
  saveAnswer(answer: InsertAnswer): Promise<Answer>;
  getAssessmentAnswers(assessmentId: number): Promise<(Answer & { option: Option, question: Question })[]>;

  // Careers/Programmes
  getCareers(): Promise<Career[]>;
  createCareer(career: Career): Promise<Career>; 
  
  getProgrammes(): Promise<(Programme & { branch?: EngineeringBranch })[]>;
  getEngineeringBranches(): Promise<EngineeringBranch[]>;
  createEngineeringBranch(branch: InsertEngineeringBranch): Promise<EngineeringBranch>;
  createProgramme(programme: InsertProgramme): Promise<Programme>;
  
  // Admin
  updateQuestion(id: number, question: Partial<Question>, options?: Option[]): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  updateCareer(id: number, career: Partial<Career>): Promise<Career>;
  deleteCareer(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getQuestions(): Promise<(Question & { options: Option[] })[]> {
    const qs = await db.select().from(questions).where(eq(questions.isActive, true)).orderBy(questions.displayOrder);
    const opts = await db.select().from(options);
    
    return qs.map(q => ({
      ...q,
      options: opts.filter(o => o.questionId === q.id).sort((a, b) => a.displayOrder - b.displayOrder)
    }));
  }

  async getQuestionsByCategory(): Promise<Record<string, Question[]>> {
    const qs = await db.select().from(questions).where(eq(questions.isActive, true));
    
    const result: Record<string, Question[]> = {
      R: [], I: [], A: [], S: [], E: [], C: [],
      LOGICAL: [], NUMERICAL: [], VERBAL: [],
      LEADERSHIP: [], TEAMWORK: [], DISCIPLINE: []
    };
    
    for (const q of qs) {
      if (q.section === 'INTEREST' && q.riasecCode) {
        result[q.riasecCode].push(q);
      } else if ((q.section === 'APTITUDE' || q.section === 'PERSONALITY') && q.subcategory) {
        result[q.subcategory].push(q);
      }
    }
    
    return result;
  }

  async selectAssessmentQuestions(): Promise<number[]> {
    const categorized = await this.getQuestionsByCategory();
    const selectedIds: number[] = [];
    
    const pickRandom = (arr: Question[], count: number): number[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map(q => q.id);
    };
    
    selectedIds.push(...pickRandom(categorized.R, 4));
    selectedIds.push(...pickRandom(categorized.I, 4));
    selectedIds.push(...pickRandom(categorized.A, 4));
    selectedIds.push(...pickRandom(categorized.S, 4));
    selectedIds.push(...pickRandom(categorized.E, 4));
    selectedIds.push(...pickRandom(categorized.C, 4));
    
    selectedIds.push(...pickRandom(categorized.LOGICAL, 3));
    selectedIds.push(...pickRandom(categorized.NUMERICAL, 3));
    selectedIds.push(...pickRandom(categorized.VERBAL, 2));
    
    selectedIds.push(...pickRandom(categorized.LEADERSHIP, 3));
    selectedIds.push(...pickRandom(categorized.TEAMWORK, 3));
    selectedIds.push(...pickRandom(categorized.DISCIPLINE, 2));
    
    return selectedIds.sort(() => Math.random() - 0.5);
  }

  async getQuestionsByIds(ids: number[]): Promise<(Question & { options: Option[] })[]> {
    if (ids.length === 0) return [];
    
    const qs = await db.select().from(questions);
    const opts = await db.select().from(options);
    
    const filtered = qs.filter(q => ids.includes(q.id));
    const orderedByIds = ids.map(id => filtered.find(q => q.id === id)!).filter(Boolean);
    
    return orderedByIds.map(q => ({
      ...q,
      options: opts.filter(o => o.questionId === q.id).sort((a, b) => a.displayOrder - b.displayOrder)
    }));
  }

  async createQuestion(question: any, opts: any[]): Promise<Question> {
    const [q] = await db.insert(questions).values(question).returning();
    if (opts.length > 0) {
      await db.insert(options).values(opts.map(o => ({ ...o, questionId: q.id })));
    }
    return q;
  }

  async createAssessmentWithQuestions(userId: number): Promise<Assessment & { questions: (Question & { options: Option[] })[] }> {
    const selectedQuestionIds = await this.selectAssessmentQuestions();
    
    const [assessment] = await db.insert(assessments).values({ 
      userId, 
      status: "in_progress",
      startedAt: new Date(),
      selectedQuestionIds,
      currentQuestionIndex: 0
    }).returning();
    
    const questions = await this.getQuestionsByIds(selectedQuestionIds);
    
    return { ...assessment, questions };
  }

  async updateAssessmentProgress(id: number, currentIndex: number): Promise<Assessment> {
    const [updated] = await db.update(assessments)
      .set({ currentQuestionIndex: currentIndex })
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async getUserAssessments(userId: number): Promise<Assessment[]> {
    return await db.select().from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.startedAt));
  }

  async updateAssessmentStatus(id: number, status: string, scores?: any): Promise<Assessment> {
    const [updated] = await db.update(assessments)
      .set({ 
        status, 
        completedAt: status === 'completed' ? new Date() : undefined,
        scores 
      })
      .where(eq(assessments.id, id))
      .returning();
    return updated;
  }

  async saveAnswer(answer: InsertAnswer): Promise<Answer> {
    const existing = await db.select().from(answers).where(
      and(
        eq(answers.assessmentId, answer.assessmentId),
        eq(answers.questionId, answer.questionId)
      )
    );

    if (existing.length > 0) {
      const [updated] = await db.update(answers)
        .set({ optionId: answer.optionId })
        .where(eq(answers.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newAnswer] = await db.insert(answers).values(answer).returning();
    return newAnswer;
  }

  async getAssessmentAnswers(assessmentId: number): Promise<(Answer & { option: Option, question: Question })[]> {
    const rows = await db.select({
      answer: answers,
      option: options,
      question: questions
    })
    .from(answers)
    .innerJoin(options, eq(answers.optionId, options.id))
    .innerJoin(questions, eq(answers.questionId, questions.id))
    .where(eq(answers.assessmentId, assessmentId));

    return rows.map(r => ({
      ...r.answer,
      option: r.option,
      question: r.question
    }));
  }

  async getCareers(): Promise<Career[]> {
    return await db.select().from(careers);
  }

  async createCareer(career: any): Promise<Career> {
    const [c] = await db.insert(careers).values(career).returning();
    return c;
  }

  async getProgrammes(): Promise<(Programme & { branch?: EngineeringBranch })[]> {
    const rows = await db.select({
      programme: programmes,
      branch: engineeringBranches
    })
    .from(programmes)
    .leftJoin(engineeringBranches, eq(programmes.branchId, engineeringBranches.id));

    return rows.map(r => ({
      ...r.programme,
      branch: r.branch || undefined
    }));
  }

  async getEngineeringBranches(): Promise<EngineeringBranch[]> {
    return await db.select().from(engineeringBranches);
  }

  async createEngineeringBranch(branch: InsertEngineeringBranch): Promise<EngineeringBranch> {
    const [b] = await db.insert(engineeringBranches).values(branch).returning();
    return b;
  }

  async createProgramme(programme: InsertProgramme): Promise<Programme> {
    const [p] = await db.insert(programmes).values(programme).returning();
    return p;
  }

  async updateQuestion(id: number, question: Partial<Question>, opts?: Option[]): Promise<Question> {
    const [q] = await db.update(questions).set(question).where(eq(questions.id, id)).returning();
    if (opts) {
      await db.delete(options).where(eq(options.questionId, id));
      if (opts.length > 0) {
        await db.insert(options).values(opts.map(o => ({ ...o, questionId: id })));
      }
    }
    return q;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(options).where(eq(options.questionId, id));
    await db.delete(questions).where(eq(questions.id, id));
  }

  async updateCareer(id: number, career: Partial<Career>): Promise<Career> {
    const [c] = await db.update(careers).set(career).where(eq(careers.id, id)).returning();
    return c;
  }

  async deleteCareer(id: number): Promise<void> {
    await db.delete(careers).where(eq(careers.id, id));
  }
}

export const storage = new DatabaseStorage();
