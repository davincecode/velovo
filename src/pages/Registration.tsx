import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonDatetime } from '@ionic/react';
import React, { useState } from 'react';

const Registration: React.FC = () => {
  const [gender, setGender] = useState<string>();
  const [dob, setDob] = useState<string>();
  const [weight, setWeight] = useState<number>();
  const [ridingLevel, setRidingLevel] = useState<string>();
  const [trainingHours, setTrainingHours] = useState<number>();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Registration</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Registration</IonTitle>
          </IonToolbar>
        </IonHeader>
        <form>
          <IonList>
            <IonItem>
              <IonLabel>Gender</IonLabel>
              <IonSelect value={gender} placeholder="Select One" onIonChange={e => setGender(e.detail.value)}>
                <IonSelectOption value="female">Female</IonSelectOption>
                <IonSelectOption value="male">Male</IonSelectOption>
                <IonSelectOption value="other">Other</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Date of Birth</IonLabel>
              <IonDatetime presentation="date" value={dob} onIonChange={e => {
                if (typeof e.detail.value === 'string') {
                  setDob(e.detail.value);
                }
              }}></IonDatetime>
            </IonItem>
            <IonItem>
              <IonLabel>Weight (kg)</IonLabel>
              <IonInput type="number" value={weight} placeholder="Enter Weight" onIonChange={e => setWeight(parseInt(e.detail.value!, 10))}></IonInput>
            </IonItem>
            <IonItem>
              <IonLabel>Riding Level</IonLabel>
              <IonSelect value={ridingLevel} placeholder="Select Level" onIonChange={e => setRidingLevel(e.detail.value)}>
                <IonSelectOption value="beginner">Beginner</IonSelectOption>
                <IonSelectOption value="intermediate">Intermediate</IonSelectOption>
                <IonSelectOption value="advanced">Advanced</IonSelectOption>
                <IonSelectOption value="pro">Pro</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Weekly Training Hours</IonLabel>
              <IonInput type="number" value={trainingHours} placeholder="Enter Hours" onIonChange={e => setTrainingHours(parseInt(e.detail.value!, 10))}></IonInput>
            </IonItem>
          </IonList>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Registration;
