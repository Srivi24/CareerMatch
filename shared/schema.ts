import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, admin
  name: text("name").notNull(),
  classLevel: text("class_level"), // 10th, 12th
  currentStream: text("current_stream"), // Science, Commerce, Arts
  city: text("city"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  section: text("section").notNull(), // INTEREST, APTITUDE, PERSONALITY
  riasecCode: text("riasec_code"), // R, I, A, S, E, C (null for non-RIASEC)
  subcategory: text("subcategory"), // LOGICAL, NUMERICAL, VERBAL, LEADERSHIP, TEAMWORK, DISCIPLINE
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  text: text("text").notNull(), // "Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"
  weight: integer("weight").notNull(), // 0, 1, 2, 3, 4
  displayOrder: integer("display_order").notNull().default(1),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  scores: jsonb("scores").$type<Record<string, number>>(), // { R: 20, I: 15, ... }
  selectedQuestionIds: jsonb("selected_question_ids").$type<number[]>(), // Array of question IDs for this assessment
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  questionId: integer("question_id").notNull(),
  optionId: integer("option_id").notNull(),
});

export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  stream: text("stream").notNull(), // Science, Commerce, etc.
  requiredCodes: text("required_codes").array(), // ["I", "R"]
  typicalDegree: text("typical_degree"),
});

export const engineeringBranches = pgTable("engineering_branches", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  broadWorkArea: text("broad_work_area"), // e.g., "Core Engineering", "IT & Software"
});

export const programmes = pgTable("programmes", {
  id: serial("id").primaryKey(),
  branchId: integer("branch_id"), // FK to engineering_branches (optional)
  stream: text("stream").notNull(), // ARTS, SCIENCE, COMMERCE, ENGINEERING, MANAGEMENT, SOCIAL_WORK
  degreeLevel: text("degree_level").notNull().default("Undergraduate"),
  degreeType: text("degree_type").notNull(), // B.E., B.Tech, B.Sc, B.A., B.Com, B.C.A., B.B.A., B.S.W.
  fullName: text("full_name").notNull(),
  durationYears: integer("duration_years").notNull().default(4),
  shortDescription: text("short_description"),
  eligibility12thStream: text("eligibility_12th_stream"),
  keyTags: text("key_tags").array(),
  aiRecommended: boolean("ai_recommended").default(false),
  isActive: boolean("is_active").default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
}));

export const engineeringBranchesRelations = relations(engineeringBranches, ({ many }) => ({
  programmes: many(programmes),
}));

export const programmesRelations = relations(programmes, ({ one }) => ({
  branch: one(engineeringBranches, {
    fields: [programmes.branchId],
    references: [engineeringBranches.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, {
    fields: [options.questionId],
    references: [questions.id],
  }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  assessment: one(assessments, {
    fields: [answers.assessmentId],
    references: [assessments.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  option: one(options, {
    fields: [answers.optionId],
    references: [options.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertOptionSchema = createInsertSchema(options).omit({ id: true });
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true, startedAt: true, completedAt: true, scores: true, selectedQuestionIds: true, currentQuestionIndex: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true });
export const insertCareerSchema = createInsertSchema(careers).omit({ id: true });
export const insertEngineeringBranchSchema = createInsertSchema(engineeringBranches).omit({ id: true });
export const insertProgrammeSchema = createInsertSchema(programmes).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type Option = typeof options.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Career = typeof careers.$inferSelect;
export type EngineeringBranch = typeof engineeringBranches.$inferSelect;
export type Programme = typeof programmes.$inferSelect;
export type InsertProgramme = z.infer<typeof insertProgrammeSchema>;
export type InsertEngineeringBranch = z.infer<typeof insertEngineeringBranchSchema>;

export type QuestionWithOptions = Question & { options: Option[] };
export type ProgrammeWithBranch = Programme & { branch?: EngineeringBranch };
