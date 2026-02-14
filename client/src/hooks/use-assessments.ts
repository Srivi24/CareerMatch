import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateAssessmentData = z.infer<typeof api.assessments.create.input>;
type SubmitAnswerData = z.infer<typeof api.assessments.submitAnswer.input>;

export function useAssessments() {
  return useQuery({
    queryKey: [api.assessments.list.path],
    queryFn: async () => {
      const res = await fetch(api.assessments.list.path);
      if (!res.ok) throw new Error("Failed to fetch assessments");
      return api.assessments.list.responses[200].parse(await res.json());
    },
  });
}

export function useAssessment(id: number | null) {
  return useQuery({
    queryKey: [api.assessments.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.assessments.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return api.assessments.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssessmentData) => {
      const res = await fetch(api.assessments.create.path, {
        method: api.assessments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create assessment");
      return api.assessments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
    },
  });
}

export function useSubmitAnswer(assessmentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitAnswerData) => {
      const url = buildUrl(api.assessments.submitAnswer.path, { id: assessmentId });
      const res = await fetch(url, {
        method: api.assessments.submitAnswer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return api.assessments.submitAnswer.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate the specific assessment to update progress/answers
      queryClient.invalidateQueries({ queryKey: [api.assessments.get.path, assessmentId] });
    },
  });
}

export function useCompleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.assessments.complete.path, { id });
      const res = await fetch(url, {
        method: api.assessments.complete.method,
      });
      if (!res.ok) throw new Error("Failed to complete assessment");
      return api.assessments.complete.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.assessments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.assessments.get.path, id] });
    },
  });
}
