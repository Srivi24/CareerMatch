import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Questions
  app.get(api.questions.list.path, async (req, res) => {
    const questions = await storage.getQuestions();
    res.json(questions);
  });

  app.post(api.questions.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const input = api.questions.create.input.parse(req.body);
    // Cast options to any to satisfy type check for creating question with options logic in storage
    const question = await storage.createQuestion(input, input.options as any[]);
    res.status(201).json(question);
  });

  app.put(api.questions.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const input = api.questions.update.input.parse(req.body);
    const question = await storage.updateQuestion(id, input, input.options as any[]);
    res.json(question);
  });

  app.delete(api.questions.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    await storage.deleteQuestion(id);
    res.sendStatus(204);
  });

  // Assessments
  app.get(api.assessments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assessments = await storage.getUserAssessments(req.user!.id);
    res.json(assessments);
  });

  // Start new assessment with 40 randomly selected questions
  app.post(api.assessments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assessment = await storage.createAssessmentWithQuestions(req.user!.id);
    res.status(201).json(assessment);
  });

  app.get(api.assessments.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const assessment = await storage.getAssessment(id);
    
    if (!assessment) return res.sendStatus(404);
    if (assessment.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.sendStatus(403);
    }

    const answers = await storage.getAssessmentAnswers(id);
    const questions = assessment.selectedQuestionIds 
      ? await storage.getQuestionsByIds(assessment.selectedQuestionIds)
      : [];
    
    res.json({ ...assessment, answers, questions });
  });

  app.post(api.assessments.submitAnswer.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assessmentId = parseInt(req.params.id);
    const assessment = await storage.getAssessment(assessmentId);
    
    if (!assessment) return res.sendStatus(404);
    if (assessment.userId !== req.user!.id) return res.sendStatus(403);

    const input = api.assessments.submitAnswer.input.parse(req.body);
    const answer = await storage.saveAnswer({ ...input, assessmentId });
    res.json(answer);
  });

  // Update progress
  app.post("/api/assessments/:id/progress", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assessmentId = parseInt(req.params.id);
    const assessment = await storage.getAssessment(assessmentId);
    
    if (!assessment) return res.sendStatus(404);
    if (assessment.userId !== req.user!.id) return res.sendStatus(403);
    
    const { currentQuestionIndex } = req.body;
    const updated = await storage.updateAssessmentProgress(assessmentId, currentQuestionIndex);
    res.json(updated);
  });

  app.post(api.assessments.complete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const assessmentId = parseInt(req.params.id);
    const assessment = await storage.getAssessment(assessmentId);
    
    if (!assessment) return res.sendStatus(404);
    if (assessment.userId !== req.user!.id) return res.sendStatus(403);

    // Calculate comprehensive scores
    const answers = await storage.getAssessmentAnswers(assessmentId);
    const scores: Record<string, number> = { 
      // RIASEC Interest
      R: 0, I: 0, A: 0, S: 0, E: 0, C: 0,
      // Aptitude
      LOGICAL: 0, NUMERICAL: 0, VERBAL: 0,
      // Personality
      LEADERSHIP: 0, TEAMWORK: 0, DISCIPLINE: 0
    };
    
    for (const ans of answers) {
      const weight = ans.option.weight;
      // RIASEC Interest scores
      if (ans.question.section === 'INTEREST' && ans.question.riasecCode) {
        scores[ans.question.riasecCode] = (scores[ans.question.riasecCode] || 0) + weight;
      }
      // Aptitude and Personality scores
      if ((ans.question.section === 'APTITUDE' || ans.question.section === 'PERSONALITY') && ans.question.subcategory) {
        scores[ans.question.subcategory] = (scores[ans.question.subcategory] || 0) + weight;
      }
    }

    // Complete assessment
    const updated = await storage.updateAssessmentStatus(assessmentId, 'completed', scores);
    
    // Get Recommendations based on top 2 RIASEC scores
    const riasecScores = Object.entries(scores)
      .filter(([code]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(code))
      .sort(([,a], [,b]) => b - a);
    const topCodes = riasecScores.slice(0, 2).map(([code]) => code);
    
    const allCareers = await storage.getCareers();
    const recommendations = allCareers.filter(c => {
      if (!c.requiredCodes) return false;
      return c.requiredCodes.some(code => topCodes.includes(code));
    });

    res.json({ assessment: updated, recommendations });
  });

  // Careers & Programmes
  app.get(api.careers.list.path, async (req, res) => {
    const careers = await storage.getCareers();
    res.json(careers);
  });

  app.get("/api/programmes", async (req, res) => {
    const progs = await storage.getProgrammes();
    res.json(progs);
  });

  app.get("/api/engineering-branches", async (req, res) => {
    const branches = await storage.getEngineeringBranches();
    res.json(branches);
  });

  app.post(api.careers.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const input = api.careers.create.input.parse(req.body);
    const career = await storage.createCareer(input);
    res.status(201).json(career);
  });

  app.put(api.careers.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const input = api.careers.update.input.parse(req.body);
    const career = await storage.updateCareer(id, input);
    res.json(career);
  });

  app.delete(api.careers.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(403);
    const id = parseInt(req.params.id);
    await storage.deleteCareer(id);
    res.sendStatus(204);
  });

  // Seeding
  app.post("/api/seed", async (req, res) => {
    if (process.env.NODE_ENV === "production") return res.sendStatus(404);
    await seedDatabase();
    res.sendStatus(200);
  });

  return httpServer;
}

async function seedDatabase() {
  const existingBranches = await storage.getEngineeringBranches();
  if (existingBranches.length === 0) {
    const existingQ = await storage.getQuestions();
    const opts = [
      { text: "Strongly Disagree", weight: 1 },
      { text: "Disagree", weight: 2 },
      { text: "Neutral", weight: 3 },
      { text: "Agree", weight: 4 },
      { text: "Strongly Agree", weight: 5 },
    ];

    if (existingQ.length === 0) {
      const questions = [
        // Realistic (R)
        { text: "I like working with my hands and fixing things.", section: "INTEREST", categoryCode: "R", order: 1 },
        { text: "I would enjoy operating heavy machinery.", section: "INTEREST", categoryCode: "R", order: 2 },
        { text: "I like outdoor work like gardening or construction.", section: "INTEREST", categoryCode: "R", order: 3 },
        // Investigative (I)
        { text: "I enjoy solving complex math and science problems.", section: "INTEREST", categoryCode: "I", order: 4 },
        { text: "I like conducting experiments in a lab.", section: "INTEREST", categoryCode: "I", order: 5 },
        { text: "I enjoy researching and discovering new facts.", section: "INTEREST", categoryCode: "I", order: 6 },
        // Artistic (A)
        { text: "I love creative writing, poetry, or blogging.", section: "INTEREST", categoryCode: "A", order: 7 },
        { text: "I enjoy performing on stage or playing music.", section: "INTEREST", categoryCode: "A", order: 8 },
        { text: "I like designing layouts, logos, or interiors.", section: "INTEREST", categoryCode: "A", order: 9 },
        // Social (S)
        { text: "I feel fulfilled when helping others with personal problems.", section: "INTEREST", categoryCode: "S", order: 10 },
        { text: "I enjoy teaching or explaining things to people.", section: "INTEREST", categoryCode: "S", order: 11 },
        { text: "I like volunteering for community service.", section: "INTEREST", categoryCode: "S", order: 12 },
        // Enterprising (E)
        { text: "I like to start my own business or projects.", section: "INTEREST", categoryCode: "E", order: 13 },
        { text: "I enjoy persuading or leading people.", section: "INTEREST", categoryCode: "E", order: 14 },
        { text: "I am comfortable taking risks to achieve goals.", section: "INTEREST", categoryCode: "E", order: 15 },
        // Conventional (C)
        { text: "I like following clear rules and procedures.", section: "INTEREST", categoryCode: "C", order: 16 },
        { text: "I enjoy managing data, records, or budgets.", section: "INTEREST", categoryCode: "C", order: 17 },
        { text: "I like keeping things orderly and systematic.", section: "INTEREST", categoryCode: "C", order: 18 },
      ];
      for (const q of questions) {
        await storage.createQuestion(q, opts);
      }
    }

    // Seed Engineering Branches
    const branches = [
      { slug: "civil", name: "CIVIL ENGINEERING", description: "Design and maintenance of infrastructure like bridges and roads.", broadWorkArea: "Core Engineering" },
      { slug: "mechanical", name: "MECHANICAL ENGINEERING", description: "Design and manufacturing of machinery and mechanical systems.", broadWorkArea: "Core Engineering" },
      { slug: "cse", name: "COMPUTER SCIENCE & ENGINEERING", description: "Study of computation, software systems, and network security.", broadWorkArea: "IT & Software" },
      { slug: "it", name: "INFORMATION TECHNOLOGY", description: "Management and processing of information using computers.", broadWorkArea: "IT & Software" },
      { slug: "ece", name: "ELECTRONICS & COMMUNICATION", description: "Design of electronic circuits and wireless communication systems.", broadWorkArea: "IT & Software" },
      { slug: "eee", name: "ELECTRICAL & ELECTRONICS", description: "Study of power systems, electrical machinery, and renewable energy.", broadWorkArea: "Core Engineering" },
      { slug: "chemical", name: "CHEMICAL & MATERIALS", description: "Process engineering, petrochemicals, and materials science.", broadWorkArea: "Core Engineering" },
      { slug: "biotech", name: "BIOTECH & LIFE SCIENCES", description: "Application of biological systems in industry and medicine.", broadWorkArea: "Emerging Tech" },
      { slug: "emerging", name: "INTERDISCIPLINARY & EMERGING", description: "Cross-disciplinary tech like Robotics, Mechatronics, and AI.", broadWorkArea: "Emerging Tech" },
    ];

    const branchMap: Record<string, number> = {};
    for (const b of branches) {
      const created = await storage.createEngineeringBranch(b);
      branchMap[b.slug] = created.id;
    }

    const programmes = [
      // Civil
      { branchId: branchMap["civil"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Civil Engineering", durationYears: 4, shortDescription: "Fundamentals of construction, structural design, and urban planning.", eligibility12thStream: "Science with Mathematics", keyTags: ["Construction", "Infrastructure"] },
      { branchId: branchMap["civil"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Environmental Engineering", durationYears: 4, shortDescription: "Focus on sustainability, waste management, and pollution control.", eligibility12thStream: "Science with Mathematics", keyTags: ["Sustainability", "Environment"] },
      { branchId: branchMap["civil"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Geoinformatics", durationYears: 4, shortDescription: "Usage of spatial data, GPS, and satellite imaging in engineering.", eligibility12thStream: "Science with Mathematics", keyTags: ["GIS", "Mapping"] },
      
      // Mechanical
      { branchId: branchMap["mechanical"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Mechanical Engineering", durationYears: 4, shortDescription: "Core study of thermodynamics, mechanics, and machine design.", eligibility12thStream: "Science with Mathematics", keyTags: ["Machines", "Design"] },
      { branchId: branchMap["mechanical"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Automobile Engineering", durationYears: 4, shortDescription: "Design and manufacturing of vehicles and propulsion systems.", eligibility12thStream: "Science with Mathematics", keyTags: ["Automotive", "Transport"] },
      
      // CSE
      { branchId: branchMap["cse"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Computer Science and Engineering", durationYears: 4, shortDescription: "Comprehensive study of algorithms, data structures, and software engineering.", eligibility12thStream: "Science with Mathematics", keyTags: ["Software", "Computing"] },
      { branchId: branchMap["cse"], stream: "ENGINEERING", degreeType: "B.Tech", fullName: "B.Tech Artificial Intelligence and Data Science", durationYears: 4, shortDescription: "Focus on machine learning, big data, and cognitive computing.", eligibility12thStream: "Science with Mathematics", keyTags: ["AI", "Data Science"] },
      { branchId: branchMap["cse"], stream: "ENGINEERING", degreeType: "B.Tech", fullName: "B.Tech Cyber Security", durationYears: 4, shortDescription: "Protecting digital systems and networks from cyber threats.", eligibility12thStream: "Science with Mathematics", keyTags: ["Security", "Network"] },
      
      // IT
      { branchId: branchMap["it"], stream: "ENGINEERING", degreeType: "B.Tech", fullName: "B.Tech Information Technology", durationYears: 4, shortDescription: "Managing software applications and information infrastructure.", eligibility12thStream: "Science with Mathematics", keyTags: ["IT", "Services"] },
      
      // ECE
      { branchId: branchMap["ece"], stream: "ENGINEERING", degreeType: "B.E.", fullName: "B.E. Electronics and Communication Engineering", durationYears: 4, shortDescription: "Design of communication protocols and electronic hardware.", eligibility12thStream: "Science with Mathematics", keyTags: ["Wireless", "Electronics"] },
      
      // Arts & Science (NEP 4-year style)
      { stream: "SCIENCE", degreeType: "B.Sc.", fullName: "B.Sc. Mathematics", durationYears: 4, shortDescription: "Deep dive into pure and applied mathematical theories.", eligibility12thStream: "Science with Mathematics", keyTags: ["Math", "Research"] },
      { stream: "SCIENCE", degreeType: "B.Sc.", fullName: "B.Sc. Physics", durationYears: 4, shortDescription: "Exploring the fundamental laws of nature and energy.", eligibility12thStream: "Science with Mathematics", keyTags: ["Physics", "Energy"] },
      { stream: "SCIENCE", degreeType: "B.Sc.", fullName: "B.Sc. Psychology", durationYears: 4, shortDescription: "Scientific study of human behavior and mental processes.", eligibility12thStream: "Any stream", keyTags: ["Behavior", "Science"] },
      { stream: "SCIENCE", degreeType: "B.C.A.", fullName: "B.C.A. Computer Applications", durationYears: 4, shortDescription: "Practical application of computer science in business.", eligibility12thStream: "Any stream with Maths", keyTags: ["Software", "Business"] },
      
      { stream: "ARTS", degreeType: "B.A.", fullName: "B.A. Economics", durationYears: 4, shortDescription: "Study of resource allocation and financial systems.", eligibility12thStream: "Any stream", keyTags: ["Finance", "Policy"] },
      { stream: "ARTS", degreeType: "B.A.", fullName: "B.A. English", durationYears: 4, shortDescription: "Literature, linguistics, and creative writing.", eligibility12thStream: "Any stream", keyTags: ["Literature", "Arts"] },
      { stream: "ARTS", degreeType: "B.A.", fullName: "B.A. Journalism & Mass Communication", durationYears: 4, shortDescription: "Media studies, reporting, and digital storytelling.", eligibility12thStream: "Any stream", keyTags: ["Media", "Communication"] },
      
      { stream: "COMMERCE", degreeType: "B.Com.", fullName: "B.Com. General", durationYears: 4, shortDescription: "Core principles of accounting, trade, and business law.", eligibility12thStream: "Commerce", keyTags: ["Business", "Accounting"] },
      { stream: "COMMERCE", degreeType: "B.Com.", fullName: "B.Com. Corporate Secretaryship", durationYears: 4, shortDescription: "Focus on corporate governance and compliance.", eligibility12thStream: "Commerce", keyTags: ["Corporate", "Law"] },
      
      { stream: "MANAGEMENT", degreeType: "B.B.A.", fullName: "B.B.A. General", durationYears: 4, shortDescription: "Fundamentals of business administration and leadership.", eligibility12thStream: "Any stream", keyTags: ["Management", "Leadership"] },
      { stream: "MANAGEMENT", degreeType: "B.B.A.", fullName: "B.B.A. Logistics & Supply Chain", durationYears: 4, shortDescription: "Managing the flow of goods and services globally.", eligibility12thStream: "Any stream", keyTags: ["Logistics", "Operations"] },
      
      { stream: "SOCIAL_WORK", degreeType: "B.S.W.", fullName: "B.S.W. Social Work", durationYears: 4, shortDescription: "Professional training for community service and social welfare.", eligibility12thStream: "Any stream", keyTags: ["Social", "Community"] },
    ];

    for (const p of programmes) {
      await storage.createProgramme(p);
    }

    // Careers (Legacy Seed)
    const careerList = [
      { title: "Software Engineer", description: "Builds apps and systems using code.", stream: "Science", requiredCodes: ["I", "R"], typicalDegree: "B.Tech/BE in CS/IT" },
      { title: "Civil Engineer", description: "Designs and maintains infrastructure like bridges and roads.", stream: "Science", requiredCodes: ["R", "I"], typicalDegree: "B.Tech in Civil" },
      { title: "Data Scientist", description: "Uses statistics and AI to extract insights from data.", stream: "Science", requiredCodes: ["I", "C"], typicalDegree: "B.Sc/B.Tech (Stats/DS)" },
      { title: "Chartered Accountant", description: "Manages financial accounts and audits.", stream: "Commerce", requiredCodes: ["C", "E"], typicalDegree: "B.Com + CA" },
      { title: "Psychologist", description: "Studies human behavior and mental processes.", stream: "Arts", requiredCodes: ["S", "I"], typicalDegree: "BA/MA Psychology" },
    ];

    for (const c of careerList) {
      await storage.createCareer(c);
    }
  }
}
