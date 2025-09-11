import React, { useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonInput, IonButton } from '@ionic/react';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import '../theme/global.css';


export const Chat: React.FC = () => {
    const { user, stravaAccessToken } = useAuth();
    const [messages, setMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
    const [text, setText] = useState('');


    const send = async () => {
        if (!text.trim()) return;
        const userMsg = { role:'user' as const, content: text };
        setMessages(m => [...m, userMsg]);


// Build system prompt with profile + placeholder activities fetch
        const systemPrompt = `You are an AI coach for athletes. Use profile: ${JSON.stringify(user)}. Use recent activities if available.`;


        try {
            const reply = await AIService.chat(systemPrompt, [userMsg]);
            const assistantText = reply?.text ?? 'Sorry, I could not answer.';
            setMessages(m => [...m, { role:'assistant', content: assistantText }]);
        } catch (e) {
            setMessages(m => [...m, { role:'assistant', content: 'AI service error.' }]);
        }


        setText('');
    };


    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>AI Coach</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <div style={{height:'60vh', overflow:'auto', marginBottom:12}}>
                    {messages.map((m,i)=>(<ChatBubble key={i} role={m.role} text={m.content}/>))}
                </div>
                <div style={{display:'flex', gap:8}}>
                    <IonInput value={text} placeholder="Ask your coach..." onIonChange={e=>setText((e.target as any).value)} />
                    <IonButton onClick={send}>Send</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};
