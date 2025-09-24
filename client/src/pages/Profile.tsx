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
    IonCardContent,
    IonSpinner
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { cog, trash } from 'ionicons/icons';
import { updateUserProfile } from '../services/userService';
import { UserProfile, BikeSetup } from '../userProfile';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CollapsibleCard } from '../components/CollapsibleCard';

// Default data for new users or as a fallback
const sampleData: UserProfile = {
    basic_info: {
        name: "",
        nickname: "",
        location: "",
        cycling_level: "Intermediate",
        primary_discipline: [],
        availability: {
            preferred_days: [],
            preferred_times: []
        }
    },
    goals: {
        short_term: [],
        long_term: []
    },
    ride_preferences: {
        ride_types: [],
        terrain: [],
        weather_tolerance: [],
        duration_preference: "",
        social_style: "",
        music_habits: ""
    },
    bike_setup: [],
    performance_metrics: {
        ftp: 0,
        vo2_max: 0,
        avg_speed: 0,
        max_speed: 0,
        avg_power: 0,
        max_power: 0,
        avg_heart_rate: 0,
        max_heart_rate: 0,
        cadence: {
            avg: 0,
            max: 0
        },
        weekly_distance: 0,
        monthly_elevation_gain: 0
    },
    training_profile: {
        training_style: "",
        feedback_style: "",
        zones: {
            heart_rate: [],
            power: []
        },
        tss: 0,
        ctl: 0,
        atl: 0,
        form: 0
    },
    health_lifestyle: {
        weight: 0,
        sleep_quality: "",
        nutrition: {
            on_bike: [],
            off_bike: []
        },
        injury_history: []
    },
    achievements: {
        milestones: [],
        personal_bests: {
            longest_ride: "",
            biggest_climb: "",
            fastest_segment: ""
        },
        bucket_list_rides: []
    },
    future_intentions: {
        upcoming_events: [],
        dream_gear: [],
        seasonal_goals: []
    },
    personality_profile: {
        cycling_identity: [],
        motivation_triggers: [],
        risk_tolerance: "",
        confidence_zones: {
            group_rides: "",
            descents: "",
            traffic: ""
        },
        post_ride_rituals: []
    }
};

// --- Options for Select Inputs ---
const CYCLING_LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const PRIMARY_DISCIPLINE_OPTIONS = ['Road', 'Gravel', 'Mountain', 'Track', 'Commuting', 'Touring'];
const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'];
const RIDE_TYPE_OPTIONS = ['Solo', 'Group', 'Training', 'Race', 'Social', 'Endurance'];
const TERRAIN_OPTIONS = ['Flat', 'Hilly', 'Mountainous', 'Mixed', 'Gravel', 'Paved'];
const WEATHER_TOLERANCE_OPTIONS = ['Hot', 'Warm', 'Cool', 'Cold', 'Dry', 'Wet', 'Windy'];
const DURATION_PREFERENCE_OPTIONS = ['< 1 hour', '1-2 hours', '2-4 hours', '> 4 hours'];
const SOCIAL_STYLE_OPTIONS = ['Quiet solo rides', 'Chatty group rides', 'Competitive group rides', 'A mix of both'];
const TRAINING_STYLE_OPTIONS = ['Structured', 'Unstructured', 'Following a plan', 'Just riding'];
const SLEEP_QUALITY_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
const RISK_TOLERANCE_OPTIONS = ['High', 'Moderate', 'Low'];
const CONFIDENCE_ZONES_OPTIONS = ['High', 'Medium', 'Low'];

const NEW_BIKE: BikeSetup = { bike_name: '', type: '', groupset: '', wheelset: '', tire_size: '', pedals: '', saddle: '', fit_notes: '' };

// Helper to handle nested state updates
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const newObj = JSON.parse(JSON.stringify(obj));
    let current = newObj;
    for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
    current[keys[keys.length - 1]] = value;
    return newObj;
};

export const Profile: React.FC = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user?.id) {
                setProfileData(sampleData);
                setLoading(false);
                return;
            }
            const userDocRef = doc(db, 'users', user.id);
            try {
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setProfileData(userDocSnap.data() as UserProfile);
                } else {
                    setProfileData(sampleData);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setProfileData(sampleData);
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, [user?.id]);

    const handleInputChange = (path: string, value: any, type: 'string' | 'string[]' | 'number' = 'string') => {
        if (!profileData) return;
        let processedValue: any = value;
        if (type === 'string[]' && typeof value === 'string') {
            processedValue = (value || '').split(',').map((s:string) => s.trim());
        } else if (type === 'number') {
            processedValue = parseFloat(value) || 0;
        }
        setProfileData(prevData => setNestedValue(prevData!, path, processedValue));
    };

    const addBike = () => {
        if (!profileData) return;
        const newBikeSetup = [...profileData.bike_setup, NEW_BIKE];
        setProfileData({ ...profileData, bike_setup: newBikeSetup });
    };

    const removeBike = (index: number) => {
        if (!profileData) return;
        const newBikeSetup = profileData.bike_setup.filter((_, i) => i !== index);
        setProfileData({ ...profileData, bike_setup: newBikeSetup });
    };

    const handleSave = async () => {
        if (!user || !user.id || !profileData) {
            alert('Profile data is not ready or user is not logged in.');
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

    if (loading || !profileData) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>My Profile</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent style={{ textAlign: 'center' }}><IonSpinner /></IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>My Profile</IonTitle>
                    <IonButtons slot="end">
                        <IonButton routerLink="/settings">
                            <IonIcon slot="icon-only" icon={cog} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

                    <IonList style={{ marginInline: '0' }}>
                        <IonItem><IonLabel position="stacked">Name</IonLabel><IonInput value={profileData.basic_info.name} onIonChange={e => handleInputChange('basic_info.name', e.detail.value)} /></IonItem>
                        <IonItem><IonLabel position="stacked">Nickname</IonLabel><IonInput value={profileData.basic_info.nickname} onIonChange={e => handleInputChange('basic_info.nickname', e.detail.value)} /></IonItem>
                        <IonItem><IonLabel position="stacked">Location</IonLabel><IonInput value={profileData.basic_info.location} onIonChange={e => handleInputChange('basic_info.location', e.detail.value)} /></IonItem>
                        <IonItem><IonLabel>Cycling Level</IonLabel><IonSelect value={profileData.basic_info.cycling_level} onIonChange={e => handleInputChange('basic_info.cycling_level', e.detail.value)}>{CYCLING_LEVEL_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                        <IonItem><IonLabel>Primary Discipline</IonLabel><IonSelect multiple value={profileData.basic_info.primary_discipline} onIonChange={e => handleInputChange('basic_info.primary_discipline', e.detail.value)}>{PRIMARY_DISCIPLINE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                        <IonItem><IonLabel>Preferred Days</IonLabel><IonSelect multiple value={profileData.basic_info.availability.preferred_days} onIonChange={e => handleInputChange('basic_info.availability.preferred_days', e.detail.value)}>{DAY_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                        <IonItem><IonLabel>Preferred Times</IonLabel><IonSelect multiple value={profileData.basic_info.availability.preferred_times} onIonChange={e => handleInputChange('basic_info.availability.preferred_times', e.detail.value)}>{TIME_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                    </IonList>

                    <CollapsibleCard title="Ride Preferences">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel>Ride Types</IonLabel><IonSelect multiple value={profileData.ride_preferences.ride_types} onIonChange={e => handleInputChange('ride_preferences.ride_types', e.detail.value)}>{RIDE_TYPE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Preferred Terrain</IonLabel><IonSelect multiple value={profileData.ride_preferences.terrain} onIonChange={e => handleInputChange('ride_preferences.terrain', e.detail.value)}>{TERRAIN_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Weather Tolerance</IonLabel><IonSelect multiple value={profileData.ride_preferences.weather_tolerance} onIonChange={e => handleInputChange('ride_preferences.weather_tolerance', e.detail.value)}>{WEATHER_TOLERANCE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Typical Duration</IonLabel><IonSelect value={profileData.ride_preferences.duration_preference} onIonChange={e => handleInputChange('ride_preferences.duration_preference', e.detail.value)}>{DURATION_PREFERENCE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Social Style</IonLabel><IonSelect value={profileData.ride_preferences.social_style} onIonChange={e => handleInputChange('ride_preferences.social_style', e.detail.value)}>{SOCIAL_STYLE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel position="stacked">Music Habits</IonLabel><IonInput value={profileData.ride_preferences.music_habits} onIonChange={e => handleInputChange('ride_preferences.music_habits', e.detail.value)} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Goals">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel position="stacked">Short-Term Goals (comma-separated)</IonLabel><IonTextarea value={profileData.goals.short_term.join(', ')} onIonChange={e => handleInputChange('goals.short_term', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Long-Term Goals (comma-separated)</IonLabel><IonTextarea value={profileData.goals.long_term.join(', ')} onIonChange={e => handleInputChange('goals.long_term', e.detail.value, 'string[]')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Bike Setup">
                        <>
                            {profileData.bike_setup.map((bike, index) => (
                                <IonCard key={index}>
                                    <IonCardHeader>
                                        <IonCardTitle>
                                            Bike {index + 1}: {bike.bike_name || 'New Bike'}
                                            <IonButton fill="clear" color="danger" onClick={(e) => { e.stopPropagation(); removeBike(index) }} slot="end">
                                                <IonIcon icon={trash} />
                                            </IonButton>
                                        </IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <IonList style={{ marginInline: '0' }}>
                                            <IonItem><IonLabel position="stacked">Bike Name</IonLabel><IonInput value={bike.bike_name} onIonChange={e => handleInputChange(`bike_setup.${index}.bike_name`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Type</IonLabel><IonInput value={bike.type} onIonChange={e => handleInputChange(`bike_setup.${index}.type`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Groupset</IonLabel><IonInput value={bike.groupset} onIonChange={e => handleInputChange(`bike_setup.${index}.groupset`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Wheelset</IonLabel><IonInput value={bike.wheelset} onIonChange={e => handleInputChange(`bike_setup.${index}.wheelset`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Tire Size</IonLabel><IonInput value={bike.tire_size} onIonChange={e => handleInputChange(`bike_setup.${index}.tire_size`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Pedals</IonLabel><IonInput value={bike.pedals} onIonChange={e => handleInputChange(`bike_setup.${index}.pedals`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Saddle</IonLabel><IonInput value={bike.saddle} onIonChange={e => handleInputChange(`bike_setup.${index}.saddle`, e.detail.value)} /></IonItem>
                                            <IonItem><IonLabel position="stacked">Fit Notes</IonLabel><IonTextarea value={bike.fit_notes} onIonChange={e => handleInputChange(`bike_setup.${index}.fit_notes`, e.detail.value)} /></IonItem>
                                        </IonList>
                                    </IonCardContent>
                                </IonCard>
                            ))}
                            <IonButton expand="block" fill="outline" onClick={addBike} className="ion-margin-top">Add Bike</IonButton>
                        </>
                    </CollapsibleCard>

                    <CollapsibleCard title="Performance Metrics">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel>FTP (W)</IonLabel><IonInput type="number" value={profileData.performance_metrics.ftp} onIonChange={e => handleInputChange('performance_metrics.ftp', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>VO2 Max</IonLabel><IonInput type="number" value={profileData.performance_metrics.vo2_max} onIonChange={e => handleInputChange('performance_metrics.vo2_max', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Avg Speed (km/h)</IonLabel><IonInput type="number" value={profileData.performance_metrics.avg_speed} onIonChange={e => handleInputChange('performance_metrics.avg_speed', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Max Speed (km/h)</IonLabel><IonInput type="number" value={profileData.performance_metrics.max_speed} onIonChange={e => handleInputChange('performance_metrics.max_speed', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Avg Power (W)</IonLabel><IonInput type="number" value={profileData.performance_metrics.avg_power} onIonChange={e => handleInputChange('performance_metrics.avg_power', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Max Power (W)</IonLabel><IonInput type="number" value={profileData.performance_metrics.max_power} onIonChange={e => handleInputChange('performance_metrics.max_power', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Avg Heart Rate (bpm)</IonLabel><IonInput type="number" value={profileData.performance_metrics.avg_heart_rate} onIonChange={e => handleInputChange('performance_metrics.avg_heart_rate', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Max Heart Rate (bpm)</IonLabel><IonInput type="number" value={profileData.performance_metrics.max_heart_rate} onIonChange={e => handleInputChange('performance_metrics.max_heart_rate', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Avg Cadence (rpm)</IonLabel><IonInput type="number" value={profileData.performance_metrics.cadence.avg} onIonChange={e => handleInputChange('performance_metrics.cadence.avg', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Max Cadence (rpm)</IonLabel><IonInput type="number" value={profileData.performance_metrics.cadence.max} onIonChange={e => handleInputChange('performance_metrics.cadence.max', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Weekly Distance (km)</IonLabel><IonInput type="number" value={profileData.performance_metrics.weekly_distance} onIonChange={e => handleInputChange('performance_metrics.weekly_distance', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Monthly Elevation Gain (m)</IonLabel><IonInput type="number" value={profileData.performance_metrics.monthly_elevation_gain} onIonChange={e => handleInputChange('performance_metrics.monthly_elevation_gain', e.detail.value, 'number')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Training Profile">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel>Training Style</IonLabel><IonSelect value={profileData.training_profile.training_style} onIonChange={e => handleInputChange('training_profile.training_style', e.detail.value)}>{TRAINING_STYLE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel position="stacked">Feedback Style</IonLabel><IonInput value={profileData.training_profile.feedback_style} onIonChange={e => handleInputChange('training_profile.feedback_style', e.detail.value)} /></IonItem>
                            <IonItem><IonLabel position="stacked">Heart Rate Zones (comma-separated)</IonLabel><IonTextarea value={profileData.training_profile.zones.heart_rate.join(', ')} onIonChange={e => handleInputChange('training_profile.zones.heart_rate', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Power Zones (comma-separated)</IonLabel><IonTextarea value={profileData.training_profile.zones.power.join(', ')} onIonChange={e => handleInputChange('training_profile.zones.power', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel>TSS</IonLabel><IonInput type="number" value={profileData.training_profile.tss} onIonChange={e => handleInputChange('training_profile.tss', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>CTL</IonLabel><IonInput type="number" value={profileData.training_profile.ctl} onIonChange={e => handleInputChange('training_profile.ctl', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>ATL</IonLabel><IonInput type="number" value={profileData.training_profile.atl} onIonChange={e => handleInputChange('training_profile.atl', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Form (TSB)</IonLabel><IonInput type="number" value={profileData.training_profile.form} onIonChange={e => handleInputChange('training_profile.form', e.detail.value, 'number')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Health & Lifestyle">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel>Weight (kg)</IonLabel><IonInput type="number" value={profileData.health_lifestyle.weight} onIonChange={e => handleInputChange('health_lifestyle.weight', e.detail.value, 'number')} /></IonItem>
                            <IonItem><IonLabel>Sleep Quality</IonLabel><IonSelect value={profileData.health_lifestyle.sleep_quality} onIonChange={e => handleInputChange('health_lifestyle.sleep_quality', e.detail.value)}>{SLEEP_QUALITY_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel position="stacked">On-Bike Nutrition (comma-separated)</IonLabel><IonTextarea value={profileData.health_lifestyle.nutrition.on_bike.join(', ')} onIonChange={e => handleInputChange('health_lifestyle.nutrition.on_bike', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Off-Bike Nutrition (comma-separated)</IonLabel><IonTextarea value={profileData.health_lifestyle.nutrition.off_bike.join(', ')} onIonChange={e => handleInputChange('health_lifestyle.nutrition.off_bike', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Injury History (comma-separated)</IonLabel><IonTextarea value={profileData.health_lifestyle.injury_history.join(', ')} onIonChange={e => handleInputChange('health_lifestyle.injury_history', e.detail.value, 'string[]')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Achievements">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel position="stacked">Milestones (comma-separated)</IonLabel><IonTextarea value={profileData.achievements.milestones.join(', ')} onIonChange={e => handleInputChange('achievements.milestones', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Longest Ride</IonLabel><IonInput value={profileData.achievements.personal_bests.longest_ride} onIonChange={e => handleInputChange('achievements.personal_bests.longest_ride', e.detail.value)} /></IonItem>
                            <IonItem><IonLabel position="stacked">Biggest Climb</IonLabel><IonInput value={profileData.achievements.personal_bests.biggest_climb} onIonChange={e => handleInputChange('achievements.personal_bests.biggest_climb', e.detail.value)} /></IonItem>
                            <IonItem><IonLabel position="stacked">Fastest Segment</IonLabel><IonInput value={profileData.achievements.personal_bests.fastest_segment} onIonChange={e => handleInputChange('achievements.personal_bests.fastest_segment', e.detail.value)} /></IonItem>
                            <IonItem><IonLabel position="stacked">Bucket List Rides (comma-separated)</IonLabel><IonTextarea value={profileData.achievements.bucket_list_rides.join(', ')} onIonChange={e => handleInputChange('achievements.bucket_list_rides', e.detail.value, 'string[]')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Future Intentions">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel position="stacked">Upcoming Events (comma-separated)</IonLabel><IonTextarea value={profileData.future_intentions.upcoming_events.join(', ')} onIonChange={e => handleInputChange('future_intentions.upcoming_events', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Dream Gear (comma-separated)</IonLabel><IonTextarea value={profileData.future_intentions.dream_gear.join(', ')} onIonChange={e => handleInputChange('future_intentions.dream_gear', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Seasonal Goals (comma-separated)</IonLabel><IonTextarea value={profileData.future_intentions.seasonal_goals.join(', ')} onIonChange={e => handleInputChange('future_intentions.seasonal_goals', e.detail.value, 'string[]')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <CollapsibleCard title="Personality Profile">
                        <IonList style={{ marginInline: '0' }}>
                            <IonItem><IonLabel position="stacked">Cycling Identity (comma-separated)</IonLabel><IonTextarea value={profileData.personality_profile.cycling_identity.join(', ')} onIonChange={e => handleInputChange('personality_profile.cycling_identity', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel position="stacked">Motivation Triggers (comma-separated)</IonLabel><IonTextarea value={profileData.personality_profile.motivation_triggers.join(', ')} onIonChange={e => handleInputChange('personality_profile.motivation_triggers', e.detail.value, 'string[]')} /></IonItem>
                            <IonItem><IonLabel>Risk Tolerance</IonLabel><IonSelect value={profileData.personality_profile.risk_tolerance} onIonChange={e => handleInputChange('personality_profile.risk_tolerance', e.detail.value)}>{RISK_TOLERANCE_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Confidence in Group Rides</IonLabel><IonSelect value={profileData.personality_profile.confidence_zones.group_rides} onIonChange={e => handleInputChange('personality_profile.confidence_zones.group_rides', e.detail.value)}>{CONFIDENCE_ZONES_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Confidence on Descents</IonLabel><IonSelect value={profileData.personality_profile.confidence_zones.descents} onIonChange={e => handleInputChange('personality_profile.confidence_zones.descents', e.detail.value)}>{CONFIDENCE_ZONES_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel>Confidence in Traffic</IonLabel><IonSelect value={profileData.personality_profile.confidence_zones.traffic} onIonChange={e => handleInputChange('personality_profile.confidence_zones.traffic', e.detail.value)}>{CONFIDENCE_ZONES_OPTIONS.map(o => (<IonSelectOption key={o} value={o}>{o}</IonSelectOption>))}</IonSelect></IonItem>
                            <IonItem><IonLabel position="stacked">Post-Ride Rituals (comma-separated)</IonLabel><IonTextarea value={profileData.personality_profile.post_ride_rituals.join(', ')} onIonChange={e => handleInputChange('personality_profile.post_ride_rituals', e.detail.value, 'string[]')} /></IonItem>
                        </IonList>
                    </CollapsibleCard>

                    <IonButton expand="block" type="submit" className="ion-margin-top">Save Profile</IonButton>
                </form>
            </IonContent>
        </IonPage>
    );
};
