
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

  const [userType, setUserType] = useState<'consumer' | 'doctor' | 'careCoordinator'>('consumer');
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);
  const [showPatientLogin, setShowPatientLogin] = useState(false);
  const [showCareCoordinatorLogin, setShowCareCoordinatorLogin] = useState(false);

  // Initialize state from localStorage if available, otherwise start with EMPTY array
  const [patients, setPatients] = useState<Patient[]>(() => {
    const savedPatients = localStorage.getItem('vita_patients_v3');
    return savedPatients ? JSON.parse(savedPatients) : [];
  });

  const [careCoordinatorTasks, setCareCoordinatorTasks] = useState<CareCoordinatorTask[]>(() => {
    const savedTasks = localStorage.getItem('vita_tasks_v3');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  // Current Patient ID - Track which user is logged in
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('vita_patients_v3', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('vita_tasks_v3', JSON.stringify(careCoordinatorTasks));
  }, [careCoordinatorTasks]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsSignedIn(true);
        // If user exists, try to find them in our patients list
        const p = patients.find(p => p.email === user.email);
        if (p) setCurrentPatientId(p.id);
      } else {
        setFirebaseUser(null);
        setIsSignedIn(false);
        setCurrentPatientId(null);
      }
    });
    return () => unsubscribe();
  }, [patients]);

  // Derived current patient
  const currentPatient = patients.find(p => p.id === currentPatientId) || patients[0] || null;

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

    // NEW: Auto-complete Care Coordinator Tasks based on patient actions
    if (newEvent) {
      if (newEvent.title === 'Root-Cause Labs Scheduled') {
        setCareCoordinatorTasks(prev => prev.filter(task =>
          !(task.patientId === patientId && task.type === 'Lab Coordination')
        ));
      }
      if (newEvent.title === 'Consultation Scheduled' || newEvent.title === 'Follow-up Scheduled') {
        setCareCoordinatorTasks(prev => prev.filter(task =>
          !(task.patientId === patientId && (task.type === 'Follow-up Request' || task.type === 'New Consultation'))
        ));
      }
    }

    // 3. Care Coordinator Task Generation
    // Logic to create tasks based on the UPDATED patient object and the event type.

    // --- COMPOSITE EVENT HANDLING (Clinical Plan Update) ---
    if (newEvent?.title === 'Clinical Plan Update') {
      // If it's a composite update, we break it down into specific tasks.

      // 1. Rx Task
      if (newEvent.context?.rx) {
        setCareCoordinatorTasks(prev => [{
          id: `task-rx-${Date.now()}`,
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Medication Shipment',
          details: `New Rx: ${newEvent.context.rx.name} (${newEvent.context.rx.dosage}). Verify & Ship.`,
          patientStatus: 'Awaiting Shipment',
          priority: 'High',
          timestamp: 'Just now',
          context: { prescription: newEvent.context.rx }
        }, ...prev]);
      }

      // 2. Labs Task
      if (newEvent.context?.labs) {
        setCareCoordinatorTasks(prev => [{
          id: `task-labs-${Date.now()}`,
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Lab Coordination',
          details: `Doctor Ordered: ${newEvent.context.labs.orders}. Coordinate with patient.`,
          patientStatus: 'Additional Testing Required',
          priority: 'Medium',
          timestamp: 'Just now',
          context: { requestedTests: newEvent.context.labs.orders }
        }, ...prev]);
      }

      // 3. Consult Task
      if (newEvent.context?.consult) {
        setCareCoordinatorTasks(prev => [{
          id: `task-consult-${Date.now()}`,
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Follow-up Request',
          details: `Follow-up needed: ${newEvent.context.consult.timeframe}. Ensure booking.`,
          patientStatus: 'Follow-up Required',
          priority: 'Low',
          timestamp: 'Just now'
        }, ...prev]);
      }
    }
    // --- SINGLE EVENT / LEGACY HANDLING ---
    else {
      let newCareCoordinatorTask: Omit<CareCoordinatorTask, 'id' | 'timestamp'> | null = null;

      // CASE 1: Intake Completed
      if (newEvent?.type === 'Assessment' && newEvent?.title === 'Digital Intake Completed') {
        newCareCoordinatorTask = {
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Intake Review',
          details: 'New intake form submitted. Please review before clinical handoff.',
          patientStatus: 'Assessment Review',
          priority: 'Medium'
        };
      }
      // CASE 2: Labs Scheduled by Patient
      else if (newEvent?.type === 'Labs' && newEvent?.title === 'Root-Cause Labs Scheduled') {
        newCareCoordinatorTask = {
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Lab Coordination',
          details: `Labs scheduled for ${newEvent.context?.labDateTime}. Monitor portal for incoming results.`,
          patientStatus: 'Awaiting Lab Results',
          priority: 'Medium',
          context: { labDateTime: newEvent.context?.labDateTime }
        };
      }
      // CASE 3: Status-based Rx Change (Legacy/Fallback)
      else if (updatedPatient.status === 'Awaiting Shipment' && currentP.status !== 'Awaiting Shipment') {
        const prescription = updatedPatient.currentPrescription;
        newCareCoordinatorTask = {
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Medication Shipment',
          details: `Rx Change: ${prescription.name} (${prescription.dosage}). Verify inventory and ship.`,
          patientStatus: 'Awaiting Shipment',
          priority: 'High',
          context: { prescription: prescription }
        };
      }
      // CASE 4: Status-based Labs (Legacy/Fallback)
      else if (updatedPatient.status === 'Additional Testing Required' && currentP.status !== 'Additional Testing Required') {
        newCareCoordinatorTask = {
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Lab Coordination',
          details: `Doctor requested additional diagnostics: ${newEvent?.context?.requestedTests || 'See chart'}. Coordinate with patient.`,
          patientStatus: 'Additional Testing Required',
          priority: 'Medium'
        };
      }
      // CASE 5: Status-based Consult (Legacy/Fallback)
      else if (updatedPatient.status === 'Follow-up Required' && currentP.status !== 'Follow-up Required') {
        newCareCoordinatorTask = {
          patientId: updatedPatient.id,
          patientName: updatedPatient.name,
          patientImageUrl: updatedPatient.imageUrl,
          type: 'Follow-up Request',
          details: `Doctor requested follow-up: ${newEvent?.context?.timeframe || 'ASAP'}. Ensure patient books.`,
          patientStatus: 'Follow-up Required',
          priority: 'Low'
        };
      }

      if (newCareCoordinatorTask) {
        setCareCoordinatorTasks(prevTasks => [{
          ...newCareCoordinatorTask,
          id: `task${Date.now()}`,
          timestamp: 'Just now'
        }, ...prevTasks]);
      }
    }

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
    if (isSignedIn) {
      if (userType === 'consumer') {
        // Ensure we have a valid patient object
        if (!currentPatient) return <div className="p-10 text-center">Loading Patient Profile...</div>;
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
