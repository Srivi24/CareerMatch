import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useCareers() {
  return useQuery({
    queryKey: [api.careers.list.path],
    queryFn: async () => {
      const res = await fetch(api.careers.list.path);
      if (!res.ok) throw new Error("Failed to fetch careers");
      return api.careers.list.responses[200].parse(await res.json());
    },
  });
}
