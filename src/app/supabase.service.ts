import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  async submitRsvp(data: {
    guest_name: string;
    attendance: string;
    guest_count: number;
    guest_message: string;
  }) {
    return await this.supabase.from('rsvps').insert(data);
  }

  async getRsvpWishes() {
    return await this.supabase
      .from('rsvps')
      .select('guest_name, guest_message, created_at')
      .not('guest_message', 'is', null)
      .neq('guest_message', '')
      .order('created_at', { ascending: false });
  }

  async getAllRsvps() {
    return await this.supabase.from('rsvps').select('attendance, guest_count');
  }
}
