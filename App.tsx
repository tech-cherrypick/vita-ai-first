
import React, { useState, useEffect } from 'react';
import LandingPage from './screens/LandingPage';
import UserDashboard from './screens/UserDashboard';
import DoctorLoginPage from './screens/DoctorLoginPage';
import DoctorDashboard from './screens/DoctorDashboard';
import PatientLoginPage from './screens/PatientLoginPage';
import CareCoordinatorLoginPage from './screens/CaregiverLoginPage';
import CareCoordinatorDashboard from './screens/CaregiverDashboard';
import { mockPatients, Patient, TimelineEvent, CareCoordinatorTask, mockCareCoordinatorTasks, createNewPatient } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [userType, setUserType] = useState<'consumer' | 'doctor' | 'careCoordinator'>('consumer');
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);
  const [showPatientLogin, setShowPatientLogin] = useState(false);
  const [showCareCoordinatorLogin, setShowCareCoordinatorLogin] = useState(false);

  // Initialize state - start with EMPTY array (we'll fetch from Cloud)
  const [patients, setPatients] = useState<Patient[]>([]);

  const [careCoordinatorTasks, setCareCoordinatorTasks] = useState<CareCoordinatorTask[]>([]);

  // Current Patient ID - Track which user is logged in
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);

  // Helper to fetch from Cloud
  const fetchFromCloud = async (user: any) => {
    console.log("☁️ fetchFromCloud starting for:", user.email);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/data', {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const cloudData = await response.json();
        const profile = cloudData.profile;
        if (profile) {
          console.log("☁️ Profile found in cloud");
          const reconstructedPatient: Patient = {
            ...createNewPatient(profile.name, profile.email, profile.phone),
            ...profile,
            id: profile.id || Date.now(),
            vitals: cloudData.vitals ? [cloudData.vitals] : [],
          };
          setPatients([reconstructedPatient]);
          setCurrentPatientId(reconstructedPatient.id);
        } else {
          console.log("☁️ No profile found in cloud, using fallback");
          const fallbackPatient = createNewPatient(user.displayName || 'User', user.email || '', '');
          setPatients([fallbackPatient]);
          setCurrentPatientId(fallbackPatient.id);
        }
      } else {
        console.error("☁️ Cloud fetch failed with status:", response.status);
        const fallbackPatient = createNewPatient(user.displayName || 'User', user.email || '', '');
        setPatients([fallbackPatient]);
        setCurrentPatientId(fallbackPatient.id);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') console.error("☁️ fetchFromCloud timed out after 5s");
      else console.error("☁️ Failed to fetch cloud data:", err);

      const fallbackPatient = createNewPatient(user.displayName || 'User', user.email || '', '');
      setPatients([fallbackPatient]);
      setCurrentPatientId(fallbackPatient.id);
    } finally {
      console.log("☁️ fetchFromCloud finished");
      setIsLoading(false);
    }
  };

  const savePatientToCloud = async (section: string, data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('http://localhost:5000/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ section, data })
      });
    } catch (err) {
      console.error("Failed to sync to cloud:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsSignedIn(true);
        fetchFromCloud(user);
      } else {
        setFirebaseUser(null);
        setIsSignedIn(false);
        setCurrentPatientId(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Derived current patient
  const currentPatient = patients.find(p => p.id === currentPatientId) || patients[0] || null;

  useEffect(() => {
    console.log("📊 App State Update:", { isSignedIn, isLoading, patientsCount: patients.length, currentPatientId, hasCurrentPatient: !!currentPatient });
  }, [isSignedIn, isLoading, patients, currentPatientId, currentPatient]);

  const handleUpdatePatient = (
    patientId: number,
    newEvent: Omit<TimelineEvent, 'id' | 'date'> | null,
    updates: Partial<Patient> = {}
  ) => {
    // 1. Calculate Updated Patient Object Synchronously
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return;

    const currentP = patients[patientIndex];
    let newTimeline = currentP.timeline;

    if (newEvent) {
      const newTimelineEvent: TimelineEvent = {
        ...newEvent,
        id: `t${Date.now()}`, // Ensure unique ID
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };
      newTimeline = [newTimelineEvent, ...currentP.timeline];
    }

    const updatedPatient = {
      ...currentP,
      ...updates,
      timeline: newTimeline
    };

    // 2. Update React State
    const newPatients = [...patients];
    newPatients[patientIndex] = updatedPatient;
    setPatients(newPatients);

    // 3. Sync to Cloud
    savePatientToCloud('profile', {
      name: updatedPatient.name,
      email: updatedPatient.email,
      phone: updatedPatient.phone,
      shippingAddress: updatedPatient.shippingAddress,
      status: updatedPatient.status,
      nextAction: updatedPatient.nextAction
    });

    // NEW: Auto-complete Care Coordinator Tasks...
    // ... logic remains same but we should also sync tasks if needed

  };

  const handleCompleteCareCoordinatorTask = (taskId: string) => {
    setCareCoordinatorTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };


  const handleSignIn = (type: 'consumer' | 'doctor' | 'careCoordinator', userDetails?: { name: string, email: string, phone: string, uid: string }) => {
    setUserType(type);

    if (type === 'consumer' && userDetails) {
      const existingPatient = patients.find(p => p.email === userDetails.email);

      if (existingPatient) {
        setCurrentPatientId(existingPatient.id);
      } else {
        const newPatient = createNewPatient(userDetails.name, userDetails.email, userDetails.phone);
        // We can attach the Firebase UID here if we want to sync with Firestore later
        (newPatient as any).firebaseUid = userDetails.uid;
        setPatients(prev => [...prev, newPatient]);
        setCurrentPatientId(newPatient.id);

        // Sync new profile to Cloud
        savePatientToCloud('profile', {
          name: newPatient.name,
          email: newPatient.email,
          phone: newPatient.phone,
          shippingAddress: newPatient.shippingAddress,
          status: newPatient.status,
          nextAction: newPatient.nextAction,
          id: newPatient.id
        });

        const newTask: CareCoordinatorTask = {
          id: `task-onboard-${newPatient.id}`,
          patientId: newPatient.id,
          patientName: newPatient.name,
          patientImageUrl: newPatient.imageUrl,
          type: 'General Support',
          details: 'New patient registration. Verify contact details and ensure intake is started.',
          patientStatus: 'Action Required',
          priority: 'Medium',
          timestamp: 'Just now'
        };
        setCareCoordinatorTasks(prev => [newTask, ...prev]);
      }
    }

    setIsSignedIn(true);
    setShowDoctorLogin(false);
    setShowPatientLogin(false);
    setShowCareCoordinatorLogin(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsSignedIn(false);
      setUserType('consumer');
      setCurrentPatientId(null);
      setShowDoctorLogin(false);
      setShowPatientLogin(false);
      setShowCareCoordinatorLogin(false);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleShowPatientLogin = () => {
    setShowPatientLogin(true);
    setShowDoctorLogin(false);
    setShowCareCoordinatorLogin(false);
  };

  const handleShowDoctorLogin = () => {
    setShowDoctorLogin(true);
    setShowPatientLogin(false);
    setShowCareCoordinatorLogin(false);
  };

  const handleShowCareCoordinatorLogin = () => {
    setShowCareCoordinatorLogin(true);
    setShowDoctorLogin(false);
    setShowPatientLogin(false);
  }

  const handleBackToLanding = () => {
    setShowDoctorLogin(false);
    setShowPatientLogin(false);
    setShowCareCoordinatorLogin(false);
  }


  const renderContent = () => {
    console.log("🛠️ renderContent state:", { isSignedIn, isLoading, userType, currentPatientExists: !!currentPatient });
    if (isSignedIn) {
      if (userType === 'consumer') {
        // Ensure we have a valid patient object
        if (isLoading || !currentPatient) return (
          <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
            <p className="text-xl font-bold text-brand-purple">Loading your personalized experience...</p>
            <p className="text-sm text-brand-text-light mt-2">Checking with Vita cloud...</p>
          </div>
        );
        return <UserDashboard onSignOut={handleSignOut} patient={currentPatient} onUpdatePatient={handleUpdatePatient} />;
      }
      if (userType === 'doctor') {
        return <DoctorDashboard onSignOut={handleSignOut} allPatients={patients} onUpdatePatient={handleUpdatePatient} />;
      }
      if (userType === 'careCoordinator') {
        return <CareCoordinatorDashboard
          onSignOut={handleSignOut}
          allPatients={patients}
          onUpdatePatient={handleUpdatePatient}
          tasks={careCoordinatorTasks}
          onCompleteTask={handleCompleteCareCoordinatorTask}
        />;
      }
    } else {
      if (showDoctorLogin) {
        return <DoctorLoginPage onSignIn={() => handleSignIn('doctor')} onBack={handleBackToLanding} />;
      }
      if (showPatientLogin) {
        return <PatientLoginPage onSignIn={(details) => handleSignIn('consumer', details)} onBack={handleBackToLanding} />;
      }
      if (showCareCoordinatorLogin) {
        return <CareCoordinatorLoginPage onSignIn={() => handleSignIn('careCoordinator')} onBack={handleBackToLanding} />;
      }
      return <LandingPage onPatientLogin={handleShowPatientLogin} onDoctorLogin={handleShowDoctorLogin} onCaregiverLogin={handleShowCareCoordinatorLogin} />;
    }

    return null;
  }


  return (
    <div className="bg-brand-bg text-brand-text font-sans antialiased relative overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default App;
