import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUser, type CurrentUserInfo } from "@/lib/admin-access.functions";

export function useCurrentUser() {
  const fetchCurrentUser = useServerFn(getCurrentUser);
  return useQuery<CurrentUserInfo>({
    queryKey: ["current-user"],
    queryFn: () => fetchCurrentUser({}),
    staleTime: 60_000,
  });
}
