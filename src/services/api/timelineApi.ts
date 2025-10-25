import { supabase } from '../supabase/config';


export interface TimelineEvent {
  event_id: string;
  event_name: string;
  event_date_time: string;
  location: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches timeline events for the current user
 */
export const getUserTimelineEvents = async (user_id: string): Promise<TimelineEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('user_id', user_id)
      .order('event_date_time', { ascending: true });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return [];
  }
};

export const addTimelineEvent = async (user_id: string, event: Omit<TimelineEvent, 'event_id' | 'created_at' | 'updated_at' | 'user_id'>) => {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert([{ ...event, user_id }]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding timeline event:', error);
    throw error;
  }
};

export const updateTimelineEvent = async (event_id: string, updates: Partial<TimelineEvent>) => {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .update(updates)
      .eq('event_id', event_id);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating timeline event:', error);
    throw error;
  }
};

export const deleteTimelineEvent = async (event_id: string) => {
  try {
    const { error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('event_id', event_id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return false;
  }
};
