import { useQuery } from "@tanstack/react-query";
import { getCitizen } from "@/api/citizens";
import { getOfficial } from "@/api/admin";
import { useSession } from "@/store/session";

export function useCitizen() {
  const id = useSession((s) => s.citizenId);
  const q = useQuery({ queryKey: ["citizen", id], queryFn: () => getCitizen(id!), enabled: !!id });
  return { id, citizen: q.data ?? null, loading: q.isLoading && !!id };
}

export function useOfficial() {
  const id = useSession((s) => s.officialId);
  const q = useQuery({ queryKey: ["official", id], queryFn: () => getOfficial(id!), enabled: !!id });
  return { id, official: q.data ?? null, loading: q.isLoading && !!id };
}
