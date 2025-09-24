import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/react';
import { chevronDown, chevronUp } from 'ionicons/icons';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <IonCard>
      <IonCardHeader onClick={toggleOpen} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IonCardTitle>{title}</IonCardTitle>
        <IonIcon icon={isOpen ? chevronUp : chevronDown} />
      </IonCardHeader>
      {isOpen && (
        <IonCardContent style={{ height: '344px', overflowY: 'auto' }}>
          {children}
        </IonCardContent>
      )}
    </IonCard>
  );
};
