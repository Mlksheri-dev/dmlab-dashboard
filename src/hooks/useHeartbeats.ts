import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useHeartbeats(deviceId: string) {
    return useQuery({
        queryKey: ["heartbeats", deviceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("heartbeats")
                .select("*")
                .eq("device_id", deviceId)
                .order("timestamp", { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        },
        refetchInterval: 5000,
    });
}
