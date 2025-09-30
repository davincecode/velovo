import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonTextarea, IonButton, IonFooter, IonIcon, IonButtons, useIonAlert } from '@ionic/react';
import { send as sendIcon, trash as trashIcon } from 'ionicons/icons';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { clearChatHistory } from '../services/userService';
import { StravaService, Activity } from '../services/StravaService'; // Import Activity
import '../theme/global.css';

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: any;
}

export const Chat: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCoachTyping, setIsCoachTyping] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [stravaActivities, setStravaActivities] = useState<Activity[]>([]); // New state for Strava activities
    const [presentAlert] = useIonAlert();

    const userId = user?.id;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            // Fetch User Profile
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const profile = userDocSnap.data() as UserProfile;
                setUserProfile(profile);

                // Fetch Strava Activities if access token exists
                if (profile.stravaAccessToken) { // Assuming stravaAccessToken is part of UserProfile
                    try {
                        const activities = await StravaService.getActivities(profile.stravaAccessToken, 1, 10); // Get last 10 activities
                        setStravaActivities(activities);
                    } catch (error) {
                        console.error("Chat.tsx: Error fetching Strava activities: ", error);
                        // Optionally, handle token refresh here if 401 Unauthorized
                    }
                }
            } else {
                console.log("Chat.tsx: No user profile found.");
            }

            // Fetch Chat Messages
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
        };

        fetchData();
    }, [userId]);

    const handleClearChat = () => {
        presentAlert({
            header: 'Clear Chat History',
            message: 'Are you sure you want to permanently delete all messages?',
            buttons: [
                'Cancel',
                {
                    text: 'Clear',
                    handler: async () => {
                        if (!userId) return;
                        try {
                            await clearChatHistory(userId);
                            presentAlert({ header: 'Success', message: 'Chat history cleared.', buttons: ['OK'] });
                        } catch (error) {
                            console.error("Failed to clear chat history", error);
                            presentAlert({ header: 'Error', message: 'Could not clear chat history.', buttons: ['OK'] });
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

            let systemPrompt = 'You are a world-class cycling coach. Your primary goal is to provide encouraging and actionable advice based on the user\'s profile and their ongoing conversation with you.';
            systemPrompt += '\n\n**CRITICAL INSTRUCTION: You MUST treat this conversation as a continuous dialogue. Before answering, review the ENTIRE chat history provided. Your advice must be context-aware and build upon previous messages, recommendations, and user-provided data. Do not repeat advice or ask for information that has already been given.**';

            if (userProfile) {
                systemPrompt += `\n\nHere is the athlete\'s profile:\n${JSON.stringify(userProfile, null, 2)}`;
                systemPrompt += '\n\nWhen answering, consider all aspects of their profile in conjunction with the conversation history. If you need more information, ask clarifying questions.';
            }

            // Add Strava activities to the system prompt
            if (stravaActivities.length > 0) {
                systemPrompt += `\n\nHere are the athlete's last ${stravaActivities.length} Strava activities:\n`;
                stravaActivities.forEach((activity, index) => {
                    systemPrompt += `Activity ${index + 1}: ${activity.name} (${activity.type}), Distance: ${(activity.distanceM / 1000).toFixed(2)} km, Time: ${(activity.movingTimeS / 60).toFixed(0)} min, Date: ${new Date(activity.startDate).toLocaleDateString()}\n`;
                });
                systemPrompt += '\nConsider these activities when providing advice. Focus on recent performance and trends.';
            }


            const currentMessagesForAI = messages.map(m => ({ role: m.role, content: m.content }));
            const reply = await AIService.chat(systemPrompt, [...currentMessagesForAI, { role: userMsg.role, content: userMsg.content }]);
            const assistantText = reply?.text ?? 'Sorry, I could not provide a response.';

            const assistantMsg: ChatMessage = { role: 'assistant', content: assistantText, timestamp: serverTimestamp() };
            await addDoc(collection(db, `users/${userId}/messages`), assistantMsg);

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
                    {loading ? <p>Loading messages...</p> : messages.length === 0 ? (
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
                        onIonChange={e => setText((e.target as any).value)}
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
