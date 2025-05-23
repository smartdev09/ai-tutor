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
  },

  async checkAndResetTokens(userId: string) {
  try {
    // Get user's current data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('tokens, last_token_reset')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError

    const today = new Date().toDateString()
    const lastReset = user.last_token_reset ? new Date(user.last_token_reset).toDateString() : null

    // If tokens haven't been reset today, reset them
    if (lastReset !== today) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          tokens: 10000,
          last_token_reset: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError
      
      console.log('Tokens reset for user:', userId)
      return { tokens: 10000, wasReset: true }
    }

    return { tokens: user.tokens, wasReset: false }
  } catch (error) {
    console.error('Error checking/resetting tokens:', error)
    throw error
  }
}
};