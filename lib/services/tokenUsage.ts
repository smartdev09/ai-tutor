import { supabase } from "../supabase/client"

export const tokenUsageService = {
  async getCurrentUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('users')
      .select('tokens')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.tokens || 0;
  },

  async updateUsage(userId: string, tokensUsed: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tokens_left = await this.getCurrentUsage(userId);
    
    if (tokens_left - tokensUsed < 0) {
      throw new Error('Daily token limit exceeded');
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        tokens: tokens_left - tokensUsed,
      })
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};