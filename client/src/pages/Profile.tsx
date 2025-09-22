import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonListHeader,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { cog, trash, chevronDown, chevronUp } from 'ionicons/icons';
import { updateUserProfile } from '../services/userService';
import { UserProfile, BikeSetup } from '../userProfile';

// Sample data to pre-fill the form
const sampleData: UserProfile = {
  "basic_info": {
    "name": "Vincent",
    "nickname": "Vince",
    "location": "Montreal, QC, Canada",
    "cycling_level": "Intermediate",
    "primary_discipline": ["Road", "Gravel"],
    "availability": {
      "preferred_days": ["Saturday", "Sunday"],
      "preferred_times": ["Morning"]
    }
  },
  "goals": {
    "short_term": ["Improve FTP", "Ride 150km"],
    "long_term": ["Complete a Gran Fondo", "Upgrade drivetrain"]
  },
  "ride_preferences": {
    "ride_types": ["Solo", "Group", "Training"],
    "terrain": ["Hilly", "Gravel"],
    "weather_tolerance": ["Cool", "Dry"],
    "duration_preference": "2–4 hours",
    "social_style": "Quiet solo rides",
    "music_habits": "Podcasts during long rides"
  },
  "bike_setup": [
    {
      "bike_name": "Cervélo Aspero",
      "type": "Gravel",
      "groupset": "SRAM Force AXS",
      "wheelset": "DT Swiss GRC 1400",
      "tire_size": "700x40c",
      "pedals": "SPD",
      "saddle": "Fizik Argo",
      "fit_notes": "Slight tilt forward, 5mm setback"
    }
  ],
  "performance_metrics": {
    "ftp": 265,
    "vo2_max": 58,
    "avg_speed": 28.5,
    "max_speed": 62.1,
    "avg_power": 210,
    "max_power": 850,
    "avg_heart_rate": 145,
    "max_heart_rate": 182,
    "cadence": {
      "avg": 85,
      "max": 110
    },
    "weekly_distance": 220,
    "monthly_elevation_gain": 7500
  },
  "training_profile": {
    "training_style": "Structured",
    "feedback_style": "Data-heavy with motivational tone",
    "zones": {
      "heart_rate": [120, 135, 150, 165, 180],
      "power": [150, 200, 250, 300, 350]
    },
    "tss": 650,
    "ctl": 72,
    "atl": 85,
    "form": -13
  },
  "health_lifestyle": {
    "weight": 72,
    "sleep_quality": "Good",
    "nutrition": {
      "on_bike": ["Maurten gels", "Bananas"],
      "off_bike": ["High protein", "Low sugar"]
    },
    "injury_history": ["Knee pain (2023)", "Lower back tightness"]
  },
  "achievements": {
    "milestones": ["First century ride", "Top 10 on local Strava climb"],
    "personal_bests": {
      "longest_ride": "165km",
      "biggest_climb": "Mont Mégantic",
      "fastest_segment": "Côte Saint-Antoine sprint"
    },
    "bucket_list_rides": ["Alpe d’Huez", "Gaspé Peninsula"]
  },
  "future_intentions": {
    "upcoming_events": ["Gravel Cup Quebec", "Rapha Prestige"],
    "dream_gear": ["CeramicSpeed OSPW", "Quarq power meter"],
    "seasonal_goals": ["Base training in winter", "Peak for spring races"]
  },
  "personality_profile": {
    "cycling_identity": ["Gravel explorer", "Weekend warrior"],
    "motivation_triggers": ["Adventure", "Progress tracking"],
    "risk_tolerance": "Moderate",
    "confidence_zones": {
      "group_rides": "Medium",
      "descents": "High",
      "traffic": "Low"
    },
    "post_ride_rituals": ["Stretching", "Uploading to Strava", "Coffee"]
  }
};

// Options for the select inputs
const CYCLING_LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const PRIMARY_DISCIPLINE_OPTIONS = ['Road', 'Gravel', 'Mountain', 'Track', 'Commuting', 'Touring'];
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];

const NEW_BIKE: BikeSetup = {
  bike_name: '',
  type: '',
  groupset: '',
  wheelset: '',
  tire_size: '',
  pedals: '',
  saddle: '',
  fit_notes: ''
};


// Helper to handle nested state updates
const setNestedValue = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return newObj;
};

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile>(sampleData);
  const [bikeCardVisibility, setBikeCardVisibility] = useState<boolean[]>([]);

  useEffect(() => {
    setBikeCardVisibility(profileData.bike_setup.map(() => true));
  }, [profileData.bike_setup.length]);

  const handleInputChange = (path: string, value: any, type: 'string' | 'string[]' | 'number' = 'string') => {
    let processedValue: any = value;
    if (type === 'string[]' && typeof value === 'string') {
      processedValue = (value || '').split(',').map((s:string) => s.trim());
    } else if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    }
    setProfileData(prevData => setNestedValue(prevData, path, processedValue));
  };

  const addBike = () => {
    const newBikeSetup = [...profileData.bike_setup, NEW_BIKE];
    setProfileData({ ...profileData, bike_setup: newBikeSetup });
  };

  const removeBike = (index: number) => {
    const newBikeSetup = profileData.bike_setup.filter((_, i) => i !== index);
    setProfileData({ ...profileData, bike_setup: newBikeSetup });
  };

  const toggleBikeCard = (index: number) => {
    const newVisibility = [...bikeCardVisibility];
    newVisibility[index] = !newVisibility[index];
    setBikeCardVisibility(newVisibility);
  };


  const handleSave = async () => {
    if (!user || !user.id) {
      alert('You must be logged in to update your profile. Your user ID is missing.');
      return;
    }
    try {
      await updateUserProfile(user.id, profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/settings">
              <IonIcon slot="icon-only" icon={cog} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Basic Info */}
          <IonList>
            <IonListHeader><IonLabel>Basic Info</IonLabel></IonListHeader>
            <IonItem>
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput value={profileData.basic_info.name} onIonChange={e => handleInputChange('basic_info.name', e.detail.value)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Nickname</IonLabel>
              <IonInput value={profileData.basic_info.nickname} onIonChange={e => handleInputChange('basic_info.nickname', e.detail.value)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Location</IonLabel>
              <IonInput value={profileData.basic_info.location} onIonChange={e => handleInputChange('basic_info.location', e.detail.value)} />
            </IonItem>
            <IonItem>
              <IonLabel>Cycling Level</IonLabel>
              <IonSelect
                value={profileData.basic_info.cycling_level}
                onIonChange={e => handleInputChange('basic_info.cycling_level', e.detail.value)}
              >
                {CYCLING_LEVEL_OPTIONS.map(level => (
                  <IonSelectOption key={level} value={level}>
                    {level}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Primary Discipline</IonLabel>
              <IonSelect
                multiple={true}
                value={profileData.basic_info.primary_discipline}
                onIonChange={e => handleInputChange('basic_info.primary_discipline', e.detail.value)}
              >
                {PRIMARY_DISCIPLINE_OPTIONS.map(discipline => (
                  <IonSelectOption key={discipline} value={discipline}>
                    {discipline}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Preferred Days</IonLabel>
              <IonSelect
                multiple={true}
                value={profileData.basic_info.availability.preferred_days}
                onIonChange={e => handleInputChange('basic_info.availability.preferred_days', e.detail.value)}
              >
                {DAY_OPTIONS.map(day => (
                  <IonSelectOption key={day} value={day}>
                    {day}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Preferred Times</IonLabel>
              <IonSelect
                multiple={true}
                value={profileData.basic_info.availability.preferred_times}
                onIonChange={e => handleInputChange('basic_info.availability.preferred_times', e.detail.value)}
              >
                {TIME_OPTIONS.map(time => (
                  <IonSelectOption key={time} value={time}>
                    {time}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonList>

          {/* Goals */}
          <IonList>
            <IonListHeader><IonLabel>Goals</IonLabel></IonListHeader>
            <IonItem>
              <IonLabel position="stacked">Short-Term Goals (comma-separated)</IonLabel>
              <IonTextarea value={profileData.goals.short_term.join(', ')} onIonChange={e => handleInputChange('goals.short_term', e.detail.value, 'string[]')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Long-Term Goals (comma-separated)</IonLabel>
              <IonTextarea value={profileData.goals.long_term.join(', ')} onIonChange={e => handleInputChange('goals.long_term', e.detail.value, 'string[]')} />
            </IonItem>
          </IonList>

          {/* Bike Setup */}
          <IonListHeader><IonLabel>Bike Setup</IonLabel></IonListHeader>
          {profileData.bike_setup.map((bike, index) => (
            <IonCard key={index}>
              <IonCardHeader onClick={() => toggleBikeCard(index)} style={{ cursor: 'pointer' }}>
                <IonCardTitle>
                  Bike {index + 1}: {bike.bike_name || 'New Bike'}
                  <IonButton fill="clear" color="danger" onClick={(e) => {e.stopPropagation(); removeBike(index)}} slot="end">
                    <IonIcon icon={trash} />
                  </IonButton>
                  <IonIcon icon={bikeCardVisibility[index] ? chevronUp : chevronDown} slot="end" />
                </IonCardTitle>
              </IonCardHeader>
              {bikeCardVisibility[index] && (
                <IonCardContent>
                  <IonList>
                    <IonItem>
                      <IonLabel position="stacked">Bike Name</IonLabel>
                      <IonInput value={bike.bike_name} onIonChange={e => handleInputChange(`bike_setup.${index}.bike_name`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Type</IonLabel>
                      <IonInput value={bike.type} onIonChange={e => handleInputChange(`bike_setup.${index}.type`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Groupset</IonLabel>
                      <IonInput value={bike.groupset} onIonChange={e => handleInputChange(`bike_setup.${index}.groupset`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Wheelset</IonLabel>
                      <IonInput value={bike.wheelset} onIonChange={e => handleInputChange(`bike_setup.${index}.wheelset`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Tire Size</IonLabel>
                      <IonInput value={bike.tire_size} onIonChange={e => handleInputChange(`bike_setup.${index}.tire_size`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Pedals</IonLabel>
                      <IonInput value={bike.pedals} onIonChange={e => handleInputChange(`bike_setup.${index}.pedals`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Saddle</IonLabel>
                      <IonInput value={bike.saddle} onIonChange={e => handleInputChange(`bike_setup.${index}.saddle`, e.detail.value)} />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Fit Notes</IonLabel>
                      <IonTextarea value={bike.fit_notes} onIonChange={e => handleInputChange(`bike_setup.${index}.fit_notes`, e.detail.value)} />
                    </IonItem>
                  </IonList>
                </IonCardContent>
              )}
            </IonCard>
          ))}
          <IonButton expand="block" fill="outline" onClick={addBike} className="ion-margin-top">
            Add Bike
          </IonButton>

          {/* Performance Metrics (Sample) */}
          <IonList>
            <IonListHeader><IonLabel>Performance & Health</IonLabel></IonListHeader>
            <IonItem>
              <IonLabel position="stacked">FTP (W)</IonLabel>
              <IonInput type="number" value={profileData.performance_metrics.ftp} onIonChange={e => handleInputChange('performance_metrics.ftp', e.detail.value, 'number')} />
            </IonItem>
             <IonItem>
              <IonLabel position="stacked">Weight (kg)</IonLabel>
              <IonInput type="number" value={profileData.health_lifestyle.weight} onIonChange={e => handleInputChange('health_lifestyle.weight', e.detail.value, 'number')} />
            </IonItem>
          </IonList>
          {/* TODO: Add the rest of the form fields following the patterns above */}


          <IonButton expand="block" type="submit" className="ion-margin-top">
            Save Profile
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};
