import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonTextarea, IonButton, IonFooter, IonIcon } from '@ionic/react';
import { send as sendIcon } from 'ionicons/icons';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import { db } from '../services/firebase'; // Import db from your firebase config
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import '../theme/global.css';


interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: any; // Use any for serverTimestamp for now, will be a Firebase Timestamp
}

export const Chat: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    const userId = user?.id; // Get the current user's ID

    console.log('Chat.tsx: Current user object:', user);
    console.log('Chat.tsx: Current userId:', userId);

    useEffect(() => {
        console.log('Chat.tsx: useEffect triggered. userId:', userId);
        if (!userId) {
            console.log('Chat.tsx: No userId found, returning early from useEffect.');
            // If there's no user, we should stop loading but show an appropriate message
            setLoading(false);
            return;
        }

        const messagesCollectionRef = collection(db, `users/${userId}/messages`);
        const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('Chat.tsx: onSnapshot triggered. Messages received:', snapshot.docs.length);
            const fetchedMessages: ChatMessage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<ChatMessage, 'id'>
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("Chat.tsx: Error fetching messages from Firestore: ", error);
            setLoading(false);
        });

        return () => {
            console.log('Chat.tsx: Cleaning up onSnapshot listener.');
            unsubscribe();
        };
    }, [userId]);

    const handleSend = async () => {
        if (!text.trim() || !userId) {
            console.warn('Chat.tsx: Cannot send message. Text is empty or userId is missing.');
            return;
        }

        const userMsg: ChatMessage = { role: 'user', content: text, timestamp: serverTimestamp() };
        // Optimistically add message to UI
        setMessages(m => [...m, userMsg]);
        setText('');

        try {
            // Add user message to Firestore
            await addDoc(collection(db, `users/${userId}/messages`), userMsg);
            console.log('Chat.tsx: User message added to Firestore.');

            const systemPrompt = `You are an AI coach for athletes. Use profile: ${JSON.stringify(user)}.`;

            // Call AI service with all current messages (including the new user message)
            const currentMessagesForAI = messages.map(m => ({ role: m.role, content: m.content }));
            const reply = await AIService.chat(systemPrompt, [...currentMessagesForAI, { role: userMsg.role, content: userMsg.content }]);
            const assistantText = reply?.text ?? 'Sorry, I could not answer.';
            console.log('Chat.tsx: AI service replied.');

            const assistantMsg: ChatMessage = { role: 'assistant', content: assistantText, timestamp: serverTimestamp() };
            // Add assistant message to Firestore
            await addDoc(collection(db, `users/${userId}/messages`), assistantMsg);
            console.log('Chat.tsx: Assistant message added to Firestore.');

        } catch (error) {
            console.error("Chat.tsx: AI message or Firestore write error: ", error);
            // If AI call or Firestore write fails, you might want to revert the optimistic update
            // or show an error message.
            setMessages(m => m.filter(msg => msg !== userMsg)); // Remove optimistic update if it failed
            // Add an error message to the chat
            setMessages(m => [...m, { role: 'assistant', content: 'AI service error.', timestamp: serverTimestamp() }]);
        }
    };

    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Coach</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <div className="chat-container">
                    {loading ? (
                        <p>Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p>Start a conversation with your AI Coach!</p>
                    ) : (
                        messages.map((m, i) => (<ChatBubble key={m.id || i} role={m.role} text={m.content} />))
                    )}
                </div>
            </IonContent>
            <IonFooter className="chat-input-container">
                <div className="flex items-center ion-padding">
                    <IonTextarea value={text} placeholder="Ask your coach..." onIonChange={e => setText((e.target as any).value)} className="chat-input" autoGrow={true} />
                    <IonButton onClick={handleSend} shape="round" className="send-button">
                        <IonIcon icon={sendIcon} />
                    </IonButton>
                </div>
            </IonFooter>
        </IonPage>
    );
};
