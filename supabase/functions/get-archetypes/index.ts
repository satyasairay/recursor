import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Fetch archetype stats
    const { data: stats, error: statsError } = await supabase
      .from("archetype_stats")
      .select("*")
      .single();

    if (statsError) throw statsError;

    const archetypes = [
      {
        name: "Diver",
        description: "Plunges deep without hesitation",
        count: stats.diver_count,
        percentage: Math.round((stats.diver_count / stats.total_sessions) * 100),
        traits: ["High depth", "Low mutation", "Focused exploration"],
      },
      {
        name: "Cycler",
        description: "Returns to familiar patterns",
        count: stats.cycler_count,
        percentage: Math.round((stats.cycler_count / stats.total_sessions) * 100),
        traits: ["Repeated patterns", "Stability", "Recognition"],
      },
      {
        name: "Explorer",
        description: "Constantly seeks new territory",
        count: stats.explorer_count,
        percentage: Math.round((stats.explorer_count / stats.total_sessions) * 100),
        traits: ["High mutation", "Diverse paths", "Curiosity"],
      },
      {
        name: "Repeater",
        description: "Finds comfort in echoes",
        count: stats.repeater_count,
        percentage: Math.round((stats.repeater_count / stats.total_sessions) * 100),
        traits: ["Pattern repetition", "Consistency", "Precision"],
      },
      {
        name: "Drifter",
        description: "Flows without destination",
        count: stats.drifter_count,
        percentage: Math.round((stats.drifter_count / stats.total_sessions) * 100),
        traits: ["Moderate change", "Adaptability", "Fluidity"],
      },
    ];

    return new Response(
      JSON.stringify({
        archetypes,
        totalSessions: stats.total_sessions,
        lastUpdated: stats.last_updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
