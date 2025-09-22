
export interface UserProfile {
  basic_info: BasicInfo;
  goals: Goals;
  ride_preferences: RidePreferences;
  bike_setup: BikeSetup[];
  performance_metrics: PerformanceMetrics;
  training_profile: TrainingProfile;
  health_lifestyle: HealthLifestyle;
  achievements: Achievements;
  future_intentions: FutureIntentions;
  personality_profile: PersonalityProfile;
}

export interface BasicInfo {
  name: string;
  nickname: string;
  location: string;
  cycling_level: string;
  primary_discipline: string[];
  availability: {
    preferred_days: string[];
    preferred_times: string[];
  };
}

export interface Goals {
  short_term: string[];
  long_term: string[];
}

export interface RidePreferences {
  ride_types: string[];
  terrain: string[];
  weather_tolerance: string[];
  duration_preference: string;
  social_style: string;
  music_habits: string;
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

export interface PerformanceMetrics {
  ftp: number;
  vo2_max: number;
  avg_speed: number;
  max_speed: number;
  avg_power: number;
  max_power: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  cadence: {
    avg: number;
    max: number;
  };
  weekly_distance: number;
  monthly_elevation_gain: number;
}

export interface TrainingProfile {
  training_style: string;
  feedback_style: string;
  zones: {
    heart_rate: number[];
    power: number[];
  };
  tss: number;
  ctl: number;
  atl: number;
  form: number;
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
