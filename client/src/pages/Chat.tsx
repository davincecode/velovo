import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonTextarea, IonButton, IonFooter, IonIcon, IonButtons, useIonAlert } from '@ionic/react';
import { send as sendIcon, trash as trashIcon } from 'ionicons/icons';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../userProfile';
import { clearChatHistory } from '../services/userService'; // Import the new service
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
    const [presentAlert] = useIonAlert();

    const userId = user?.id;

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserProfile(userDocSnap.data() as UserProfile);
            } else {
                console.log("Chat.tsx: No user profile found.");
            }
        };

        fetchUserProfile();

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
                            // The onSnapshot listener will automatically update the UI
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
    
            let systemPrompt = 'You are a world-class cycling coach. Be encouraging and provide actionable advice.';
            if (userProfile) {
                systemPrompt += `\n\nHere is the athlete\'s profile:\n${JSON.stringify(userProfile, null, 2)}`;
                systemPrompt += '\n\nWhen answering, consider all aspects of their profile. If you need more information, ask clarifying questions.';
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
                    {loading ? <p>Loading messages...</p> : messages.length === 0 ? <p>Start a conversation with your AI Coach!</p> : messages.map((m, i) => (<ChatBubble key={m.id || i} role={m.role} text={m.content} />))}
                    {isCoachTyping && <ChatBubble role="assistant" text="Coach is typing..." />}
                </div>
            </IonContent>
            <IonFooter className="ion-no-border chat-footer">
                <div className="chat-input-wrapper">
                    <IonTextarea
                        value={text}
                        placeholder="Ask your coach..."
                        onIonChange={e => setText((e.target as any).value)}
                        className="chat-textarea"
                        autoGrow={true}
                    />
                    <IonButton onClick={handleSend} shape="round" className="chat-send-button">
                        <IonIcon icon={sendIcon} />
                    </IonButton>
                </div>
            </IonFooter>
        </IonPage>
    );
};
