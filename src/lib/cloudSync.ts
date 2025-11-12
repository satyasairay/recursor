import { supabase } from '@/integrations/supabase/client';
import { Pattern, RecursionSession, Achievement } from './types';

export class CloudSync {
  private userId: string | null = null;

  setUser(userId: string | null) {
    this.userId = userId;
  }

  async saveSession(session: RecursionSession): Promise<string | null> {
    if (!this.userId) return null;

    try {
      const { data, error } = await supabase
        .from('recursion_sessions')
        .insert([{
          user_id: this.userId,
          depth: session.depth,
          pattern: session.patterns,
          timestamp: new Date(session.timestamp).toISOString(),
          metadata: session.metadata as any,
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to save session:', error);
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<RecursionSession>) {
    if (!this.userId) return;

    try {
      const updateData: any = { user_id: this.userId };
      
      if (updates.depth !== undefined) updateData.depth = updates.depth;
      if (updates.patterns) updateData.pattern = updates.patterns;
      if (updates.metadata) updateData.metadata = updates.metadata as any;

      const { error } = await supabase
        .from('recursion_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  async savePattern(sessionId: string, pattern: Pattern, depth: number) {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('recursion_patterns')
        .insert({
          session_id: sessionId,
          user_id: this.userId,
          pattern: pattern,
          depth: depth,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save pattern:', error);
    }
  }

  async saveAchievement(sessionId: string, code: string) {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('recursion_achievements')
        .insert([{
          session_id: sessionId,
          user_id: this.userId,
          code: code,
          unlocked_at: new Date().toISOString(),
          metadata: {},
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save achievement:', error);
    }
  }

  async saveConstellation(sessionId: string, svgData: string, metadata: any) {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('constellation_archives')
        .insert({
          session_id: sessionId,
          user_id: this.userId,
          svg_data: svgData,
          metadata: metadata,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save constellation:', error);
    }
  }

  async getUserSessions() {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('recursion_sessions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }
}

export const cloudSync = new CloudSync();
