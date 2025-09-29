export interface UserProfile {
  basic_info: BasicInfo;
  goals: Goals;
  ride_preferences: RidePreferences;
  bike_setup: BikeSetup[];
  health_lifestyle: HealthLifestyle;
  achievements: Achievements;
  future_intentions: FutureIntentions;
  personality_profile: PersonalityProfile;
}

export interface BasicInfo {
  name: string;
  lastname: string;
  location: string;
  cycling_level: string;
  primary_discipline: string[];
}

export interface Goals {
  short_term: string[];
  long_term: string[];
}

export interface RidePreferences {
  ride_types: string[];
  terrain: string[];
}

export interface BikeSetup {
  bike_name: string;
  type: string;
  groupset: string;
  wheelset: string;
  tire_size: string;
  pedals: string;
  saddle: string;
  fit_notes: string;
}

export interface HealthLifestyle {
  weight: number;
  sleep_quality: string;
  nutrition: {
    on_bike: string[];
    off_bike: string[];
  };
  injury_history: string[];
}

export interface Achievements {
  milestones: string[];
  personal_bests: {
    longest_ride: string;
    biggest_climb: string;
    fastest_segment: string;
  };
  bucket_list_rides: string[];
}

export interface FutureIntentions {
  upcoming_events: string[];
  dream_gear: string[];
  seasonal_goals: string[];
}

export interface PersonalityProfile {
  cycling_identity: string[];
  motivation_triggers: string[];
  risk_tolerance: string;
  confidence_zones: {
    group_rides: string;
    descents: string;
    traffic: string;
  };
  post_ride_rituals: string[];
}
