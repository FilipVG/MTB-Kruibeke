export type UserRole = 'member' | 'admin';
export type RideType = 'mtb' | 'gravel' | 'baanrit';
export type SponsorTier = 'main' | 'regular';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  birthdate: string | null;
  role: UserRole;
  is_active: boolean;
  email_reminders: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  title: string;
  description: string | null;
  ride_type: RideType;
  start_at: string;
  start_location: string;
  start_lat: number | null;
  start_lng: number | null;
  distance_km: number | null;
  gpx_url: string | null;
  in_ranking: boolean;
  points: number;
  registration_open: boolean;
  max_participants: number | null;
  cancelled: boolean;
  created_by: string | null;
  reminder_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideRegistration {
  id: string;
  ride_id: string;
  user_id: string;
  attended: boolean | null;
  notes: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  registration_required: boolean;
  max_participants: number | null;
  cancelled: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  tier: SponsorTier;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface RankingEntry {
  id: string;
  nickname: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  total_points: number;
  rides_attended: number;
}

// Joined types
export interface RideWithRegistrations extends Ride {
  registrations: (RideRegistration & { profile: Pick<Profile, 'id' | 'nickname' | 'first_name' | 'last_name' | 'avatar_url'> })[];
  registration_count?: number;
  is_registered?: boolean;
}
