import React, { useState } from 'react';
import { IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonTextarea, IonButton, IonFooter, IonIcon } from '@ionic/react';
import { send as sendIcon } from 'ionicons/icons';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { AIService } from '../services/AIService';
import '../theme/global.css';


export const Chat: React.FC = () => {
    const { user, stravaAccessToken } = useAuth();
    const [messages, setMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
    const [text, setText] = useState('');


    const handleSend = async () => {
        if (!text.trim()) return;
        const userMsg = { role:'user' as const, content: text };
        setMessages(m => [...m, userMsg]);


        const systemPrompt = `You are an AI coach for athletes. Use profile: ${JSON.stringify(user)}. Use recent activities if available.`;


        try {
            const reply = await AIService.chat(systemPrompt, [userMsg]);
            const assistantText = reply?.text ?? 'Sorry, I could not answer.';
            setMessages(m => [...m, { role:'assistant', content: assistantText }]);
        } catch (error) {
            setMessages(m => [...m, { role:'assistant', content: 'AI service error.' }]);
            console.log("AI msg error: ", error)
        }
        setText('');
    };


    return (
        <IonPage>
            <IonHeader><IonToolbar><IonTitle>Coach</IonTitle></IonToolbar></IonHeader>
            <IonContent className="ion-padding">
                <div className="chat-container">
                    {messages.map((m,i)=>(<ChatBubble key={i} role={m.role} text={m.content}/>))}
                </div>
            </IonContent>
            <IonFooter className="chat-input-container">
                    <div className="flex items-center ion-padding">
                        <IonTextarea value={text} placeholder="Ask your coach..." onIonChange={e=>setText((e.target as any).value)} className="chat-input" autoGrow={true} />
                        <IonButton onClick={handleSend} shape="round" className="send-button">
                            <IonIcon icon={sendIcon} />
                        </IonButton>
                    </div>
            </IonFooter>
        </IonPage>
    );
};
