import { z } from 'zod';
import { 
  insertUserSchema, 
  insertAssessmentSchema, 
  insertAnswerSchema,
  insertQuestionSchema,
  insertOptionSchema,
  insertCareerSchema,
  users,
  assessments,
  questions,
  options,
  careers,
  // courses,
  answers
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  questions: {
    list: {
      method: 'GET' as const,
      path: '/api/questions',
      responses: {
        200: z.array(z.custom<typeof questions.$inferSelect & { options: typeof options.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/questions',
      input: insertQuestionSchema.extend({ options: z.array(insertOptionSchema) }),
      responses: {
        201: z.custom<typeof questions.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/questions/:id',
      input: insertQuestionSchema.partial().extend({ options: z.array(insertOptionSchema).optional() }),
      responses: {
        200: z.custom<typeof questions.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/questions/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  assessments: {
    list: {
      method: 'GET' as const,
      path: '/api/assessments',
      responses: {
        200: z.array(z.custom<typeof assessments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assessments',
      input: insertAssessmentSchema.omit({ userId: true, status: true }),
      responses: {
        201: z.custom<typeof assessments.$inferSelect & { questions: Array<typeof questions.$inferSelect & { options: typeof options.$inferSelect[] }> }>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/assessments/:id',
      responses: {
        200: z.custom<typeof assessments.$inferSelect & { 
          answers: typeof answers.$inferSelect[], 
          questions: Array<typeof questions.$inferSelect & { options: typeof options.$inferSelect[] }> 
        }>(),
        404: errorSchemas.notFound,
      },
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/assessments/:id/answers',
      input: insertAnswerSchema.omit({ assessmentId: true }),
      responses: {
        200: z.custom<typeof answers.$inferSelect>(),
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/assessments/:id/complete',
      responses: {
        200: z.object({
          assessment: z.custom<typeof assessments.$inferSelect>(),
          recommendations: z.array(z.custom<typeof careers.$inferSelect>()),
        }),
      },
    },
  },
  careers: {
    list: {
      method: 'GET' as const,
      path: '/api/careers',
      responses: {
        200: z.array(z.custom<typeof careers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/careers',
      input: insertCareerSchema,
      responses: {
        201: z.custom<typeof careers.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/careers/:id',
      input: insertCareerSchema.partial(),
      responses: {
        200: z.custom<typeof careers.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/careers/:id',
      responses: {
        204: z.void(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
