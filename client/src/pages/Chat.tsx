import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonTextarea, IonButton, IonFooter, IonIcon, IonButtons, useIonAlert } from '@ionic/react';
import { send as sendIcon, trash as trashIcon } from 'ionicons/icons';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, FieldValue } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { clearChatHistory } from '../services/userService';
import { useStravaData } from '../context/StravaContext';
import { TrainingAnalyticsService } from '../services/TrainingAnalyticsService';
import '../theme/global.css';

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: FieldValue | Date;
}

interface TrainingMetrics {
    latestFitness: number | null;
    latestFatigue: number | null;
    latestBalance: number | null;
    hasOvertrainingWarning: boolean;
}

export const Chat: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCoachTyping, setIsCoachTyping] = useState(false);
    const [presentAlert] = useIonAlert();

    const { activities: stravaActivities, loading: stravaLoading } = useStravaData();

    const userId = user?.id;

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    useEffect(() => {
        if (!userId) return;
        const fetchProfile = async () => {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserProfile(userDocSnap.data() as UserProfile);
            }
        };
        void fetchProfile();
    }, [userId]);

    // This state is primarily for display/other components, handleSend will recalculate for immediate accuracy
    const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics>({
        latestFitness: null,
        latestFatigue: null,
        latestBalance: null,
        hasOvertrainingWarning: false,
    });

    useEffect(() => {
        if (stravaActivities.length > 0 && userProfile?.health_lifestyle?.ftp) {
            const ftp = userProfile.health_lifestyle.ftp;

            const dailyLoads: { date: Date; tss: number }[] = [];
            stravaActivities.forEach(activity => {
                const tss = TrainingAnalyticsService.calculateTss(activity, ftp);
                dailyLoads.push({ date: new Date(activity.startDate), tss });
            });

            const { ctl, atl } = TrainingAnalyticsService.calculateFitnessAndFatigue(dailyLoads);
            const tsb = ctl - atl;

            const overtrainingWarning = tsb <= -25; // Example threshold for overtraining

            setTrainingMetrics({
                latestFitness: ctl,
                latestFatigue: atl,
                latestBalance: tsb,
                hasOvertrainingWarning: overtrainingWarning,
            });
        } else {
            setTrainingMetrics({
                latestFitness: null,
                latestFatigue: null,
                latestBalance: null,
                hasOvertrainingWarning: false,
            });
        }
    }, [stravaActivities, userProfile]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const messagesCollectionRef = collection(db, `users/${userId}/messages`);
        const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<ChatMessage, 'id'> }));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("Chat.tsx: Error fetching messages: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleClearChat = () => {
        void presentAlert({
            header: 'Clear Chat History',
            message: 'Are you sure you want to permanently delete all messages?',
            buttons: [
                'Cancel',
                {
                    text: 'Clear',
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    handler: async () => {
                        if (!userId) return;
                        try {
                            await clearChatHistory(userId);
                            void presentAlert({ header: 'Success', message: 'Chat history cleared.', buttons: ['OK'] });
                        } catch (error) {
                            console.error("Failed to clear chat history", error);
                            void presentAlert({ header: 'Error', message: 'Could not clear chat history.', buttons: ['OK'] });
                        }
                    },
                },
            ],
        });
    };

    const handleSend = async () => {
        if (!text.trim() || !userId) return;

        const userMsg: ChatMessage = { role: 'user', content: text, timestamp: serverTimestamp() };
        setMessages(m => [...m, userMsg]);
        setText('');
        setIsCoachTyping(true);

        try {
            await addDoc(collection(db, `users/${userId}/messages`), userMsg);

            const systemPromptParts: string[] = [];
            let assistantText = '';

            // Recalculate training metrics directly within handleSend for immediate accuracy
            let currentFitness: number | null = null;
            let currentFatigue: number | null = null;
            let currentBalance: number | null = null;
            let currentHasOvertrainingWarning = false;

            if (stravaActivities.length > 0 && userProfile?.health_lifestyle?.ftp) {
                const ftp = userProfile.health_lifestyle.ftp;
                const dailyLoads: { date: Date; tss: number }[] = [];
                stravaActivities.forEach(activity => {
                    const tss = TrainingAnalyticsService.calculateTss(activity, ftp);
                    dailyLoads.push({ date: new Date(activity.startDate), tss });
                });

                const { ctl, atl } = TrainingAnalyticsService.calculateFitnessAndFatigue(dailyLoads);
                const tsb = ctl - atl;

                currentFitness = ctl;
                currentFatigue = atl;
                currentBalance = tsb;
                currentHasOvertrainingWarning = tsb <= -25; // Example threshold for overtraining
            }

            console.log('--- Debugging Training Metrics in handleSend ---');
            console.log('currentFitness:', currentFitness);
            console.log('currentFatigue:', currentFatigue);
            console.log('currentBalance:', currentBalance);
            console.log('currentHasOvertrainingWarning:', currentHasOvertrainingWarning);
            console.log('------------------------------------------------');

            // --- Determine the primary directive based on training metrics and set assistantText if critical ---
            if (currentHasOvertrainingWarning) {
                assistantText = `**URGENT WARNING: Vince, your latest training data shows an OVERTRAINING WARNING 😨. I strongly recommend prioritizing immediate rest and recovery. Please do NOT engage in any intense cycling activity today. We need to focus on your recovery.**`;
                systemPromptParts.push('You are a SAFETY-FIRST cycling coach. Your absolute primary goal is to reinforce the need for immediate rest and recovery due to overtraining. All subsequent advice must revolve around recovery. You MUST NOT suggest any intense activity. You MUST prioritize the user\'s safety and recovery above all else.');
            } else if (currentFatigue !== null && currentFatigue > 80) { // Adjusted threshold for high fatigue
                assistantText = `**IMPORTANT: Vince, your latest training data indicates HIGH FATIGUE (Score: ${currentFatigue}). I recommend caution and potential rest. Please avoid intense cycling activity today and focus on recovery.**`;
                systemPromptParts.push('You are a CAUTIOUS cycling coach. Your primary goal is to recommend caution and potential rest due to high fatigue. Avoid suggesting intense cycling activity. You MUST NOT suggest any intense activity. You MUST prioritize the user\'s recovery.');
            } else {
                systemPromptParts.push('You are a world-class cycling coach. Your primary goal is to provide encouraging and actionable advice based on the user\'s profile and their ongoing conversation with you. Always consider the provided training metrics and user profile in your advice.');
            }

            console.log('assistantText after conditions:', assistantText);

            // Always include critical instructions for continuous dialogue after the primary directive
            systemPromptParts.push('\n\n**CRITICAL INSTRUCTION: You MUST treat this conversation as a continuous dialogue. Before answering, review the ENTIRE chat history provided. Your advice must be context-aware and build upon previous messages, recommendations, and user-provided data. Do not repeat advice or ask for information that has already been given.**');

            // Add fatigue summary if available
            if (currentFitness !== null || currentFatigue !== null || currentBalance !== null) {
                systemPromptParts.push('\n**Latest Training Metrics (from most recent activity):**\n');
                if (currentFitness !== null) systemPromptParts.push(`  - Fitness: ${currentFitness}\n`);
                if (currentFatigue !== null) systemPromptParts.push(`  - Fatigue: ${currentFatigue}\n`);
                if (currentBalance !== null) systemPromptParts.push(`  - Balance: ${currentBalance}\n`);
            }

            if (userProfile) {
                systemPromptParts.push(`\n\nHere is the athlete's profile:\n${JSON.stringify(userProfile, null, 2)}`);
                systemPromptParts.push('\n\nWhen answering, consider all aspects of their profile in conjunction with the conversation history. If you need more information, ask clarifying questions.');
            }

            if (stravaActivities.length > 0) {
                systemPromptParts.push(`\n\nHere are the athlete's last ${stravaActivities.length} Strava activities (full details below):`);
                stravaActivities.forEach((activity, index) => {
                    systemPromptParts.push(`\nActivity ${index + 1}: ${activity.name} (${activity.type}), Distance: ${(activity.distanceM / 1000).toFixed(2)} km, Time: ${(activity.movingTimeS / 60).toFixed(0)} min, Date: ${new Date(activity.startDate).toLocaleDateString()}`);
                    if (activity.description) {
                        systemPromptParts.push(`\n  Description: ${activity.description}`);
                    }
                    if (activity.privateNote) {
                        systemPromptParts.push(`\n  Private Note (contains detailed training metrics): ${activity.privateNote}`);
                    }
                });
                systemPromptParts.push('\n');
            }

            const systemPrompt = systemPromptParts.join('');
            console.log('Final systemPrompt:', systemPrompt);

            // If assistantText was set due to a warning, use it directly. Otherwise, call AIService.chat.
            if (assistantText) {
                console.log('Sending assistantText directly:', assistantText);
                const assistantMsg: ChatMessage = { role: 'assistant', content: assistantText, timestamp: serverTimestamp() };
                await addDoc(collection(db, `users/${userId}/messages`), assistantMsg);
            } else {
                console.log('Calling AIService.chat with systemPrompt:', systemPrompt);
                const currentMessagesForAI = messages.map(m => ({ role: m.role, content: m.content }));
                const reply = await AIService.chat(systemPrompt, [...currentMessagesForAI, { role: userMsg.role, content: userMsg.content }]);
                assistantText = reply?.text ?? 'Sorry, I could not provide a response.';
                const assistantMsg: ChatMessage = { role: 'assistant', content: assistantText, timestamp: serverTimestamp() };
                await addDoc(collection(db, `users/${userId}/messages`), assistantMsg);
            }

        } catch (error) {
            console.error("Chat.tsx: Error during message send or AI reply: ", error);
            setMessages(m => m.filter(msg => msg !== userMsg));
            const errorMsg: ChatMessage = { role: 'assistant', content: 'Sorry, I ran into an error.', timestamp: serverTimestamp() };
            setMessages(m => [...m, errorMsg]);
        } finally {
            setIsCoachTyping(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Coach</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleClearChat}>
                            <IonIcon slot="icon-only" icon={trashIcon} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="chat-container">
                    {loading || stravaLoading ? <p>Loading messages and Strava data...</p> : messages.length === 0 ? (
                        <div className="initial-greeting">
                            <h3>Hey {userProfile?.basic_info?.name ?? 'Vince'}!</h3>
                            <p>
                                I’m your AI coach. I’m here to support your training—whether it’s a big goal or just getting out for a ride. I’ll use your profile and Strava data to give advice that fits you.
                            </p>
                        </div>
                    ) : messages.map((m, i) => (<ChatBubble key={m.id || i} role={m.role} text={m.content} />))}
                    {isCoachTyping && <ChatBubble role="assistant" text="Coach is typing..." />}
                </div>
            </IonContent>
            <IonFooter className="ion-no-border chat-footer">
                <div className="chat-input-wrapper">
                    <IonTextarea
                        value={text}
                        placeholder="What’s on your mind today?"
                        onIonChange={e => setText(e.detail.value!)}
                        className="chat-textarea"
                        autoGrow={true}
                    />
                    <IonButton onClick={handleSend} shape="round" className="chat-send-button">
                        <IonIcon icon={sendIcon} />
                    </IonButton>
                </div>
                <small style={{textAlign: 'center', display: 'block', padding: '0 10px 5px'}}>
                    As your coach, I am also learning and I can make mistakes sometimes. &nbsp;
                    <a href="mailto:feedback@velovo.app" style={{color: '#888'}}>Got thoughts or ideas? I’m here to learn and improve.</a>
                </small>
            </IonFooter>
        </IonPage>
    );
};
