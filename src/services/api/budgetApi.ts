// Budget and Expenses API for Supabase
import { supabase } from '../supabase/config';
import { v4 as uuidv4 } from 'uuid';

export type Budget = {
  id: string;
  user_id: string;
  total_budget: number;
  created_at?: string;
};

export type Expense = {
  item_id: string;
  user_id: string;
  item_name: string;
  category: string;
  amount: number;
  vendor_name: string;
  status: string; // 'Pending' or 'Paid'
  created_at?: string;
  updated_at?: string;
};

// Fetch the user's budget_max from the preferences JSONB column in users table
export const getUserBudgetMax = async (userId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('preferences')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  try {
    const prefs = data.preferences || {};
    return typeof prefs.budget_max === 'number' ? prefs.budget_max : prefs.budget_max ? parseFloat(prefs.budget_max) : null;
  } catch {
    return null;
  }
};

// Update the user's budget_max in the preferences JSONB column in users table
export const updateUserBudgetMax = async (userId: string, budgetMax: number) => {
  // Fetch current preferences
  const { data, error } = await supabase
    .from('users')
    .select('preferences')
    .eq('user_id', userId)
    .single();
  if (error || !data) throw error || new Error('User not found');
  const preferences = data.preferences || {};
  preferences.budget_max = budgetMax;
  const { error: updateError } = await supabase
    .from('users')
    .update({ preferences })
    .eq('user_id', userId);
  if (updateError) throw updateError;
  return true;
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

export const addExpense = async (expense: Omit<Expense, 'item_id'|'created_at'|'updated_at'>) => {
  const { data, error } = await supabase
    .from('budget_items')
    .insert([{ ...expense, item_id: uuidv4(), created_at: new Date().toISOString() }]);
  if (error) throw error;
  return data;
};

export const updateExpense = async (expense: Expense) => {
  const { data, error } = await supabase
    .from('budget_items')
    .update(expense)
    .eq('item_id', expense.item_id);
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('budget_items')
    .delete()
    .eq('item_id', id);
  if (error) throw error;
  return true;
};
