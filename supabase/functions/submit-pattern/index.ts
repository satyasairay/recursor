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

    const { patterns, achievements, nodeCount } = await req.json();

    // Generate anonymous session hash
    const sessionData = {
      patterns: patterns.slice(-5), // Last 5 patterns
      timestamp: Date.now(),
      random: Math.random().toString(36),
    };
    const sessionHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(sessionData))
    ).then(buf => 
      Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
    );

    // Calculate metrics
    const avgDepth = patterns.reduce((sum: number, p: any) => sum + p.depth, 0) / patterns.length;
    const uniquePatterns = new Set(patterns.map((p: any) => p.signature)).size;
    const mutationRate = uniquePatterns / patterns.length;

    // Submit anonymous pattern data
    const { error: insertError } = await supabase
      .from("anonymous_patterns")
      .insert({
        session_hash: sessionHash,
        pattern_signature: patterns[patterns.length - 1]?.signature || "",
        depth: Math.round(avgDepth),
        mutation_rate: mutationRate,
        achievement_flags: achievements,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // Compute archetype
    const archetype = computeArchetype({
      avgDepth: Math.round(avgDepth),
      mutationRate,
      patterns,
      achievements,
      nodeCount,
    });

    // Update archetype stats
    const { data: statsData, error: statsError } = await supabase
      .from("archetype_stats")
      .select("*")
      .single();

    if (statsError) {
      console.error("Stats fetch error:", statsError);
      throw statsError;
    }

    const updatedStats = {
      total_sessions: (statsData?.total_sessions || 0) + 1,
      [`${archetype.toLowerCase()}_count`]: ((statsData as any)?.[`${archetype.toLowerCase()}_count`] || 0) + 1,
      last_updated: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("archetype_stats")
      .update(updatedStats)
      .eq("id", statsData.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Calculate percentile
    const archetypeCount = updatedStats[`${archetype.toLowerCase()}_count`];
    const percentile = Math.round((archetypeCount / updatedStats.total_sessions) * 100);

    return new Response(
      JSON.stringify({
        archetype,
        percentile,
        totalSessions: updatedStats.total_sessions,
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

function computeArchetype(data: {
  avgDepth: number;
  mutationRate: number;
  patterns: any[];
  achievements: string[];
  nodeCount: number;
}): string {
  const { avgDepth, mutationRate, patterns, achievements, nodeCount } = data;

  // Diver: High depth, low mutation, "the_diver" achievement
  if (avgDepth > 8 && mutationRate < 0.4 && achievements.includes("the_diver")) {
    return "Diver";
  }

  // Cycler: Low mutation, "looped_path" achievement, repeated patterns
  if (mutationRate < 0.3 && achievements.includes("looped_path")) {
    return "Cycler";
  }

  // Explorer: High mutation, many nodes, "the_scatterer" achievement
  if (mutationRate > 0.7 && nodeCount > 20 && achievements.includes("the_scatterer")) {
    return "Explorer";
  }

  // Repeater: Very low mutation, "echo_state" achievement
  if (mutationRate < 0.2 && achievements.includes("echo_state")) {
    return "Repeater";
  }

  // Drifter: Moderate mutation, no strong patterns
  if (mutationRate > 0.4 && mutationRate < 0.7) {
    return "Drifter";
  }

  // Default based on depth
  if (avgDepth > 6) return "Diver";
  if (mutationRate > 0.6) return "Explorer";
  return "Drifter";
}
