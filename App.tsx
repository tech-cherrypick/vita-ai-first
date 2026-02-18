import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Patient, TimelineEvent, CareCoordinatorTask, createNewPatient } from './constants';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';

// Lazy load all dashboard components for better performance
const UserDashboard = lazy(() => import('./screens/UserDashboard'));
const DoctorDashboard = lazy(() => import('./screens/DoctorDashboard'));
const CareCoordinatorDashboard = lazy(() => import('./screens/CaregiverDashboard'));
const UnifiedLoginPage = lazy(() => import('./screens/UnifiedLoginPage'));
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'));
const LandingPage = lazy(() => import('./screens/LandingPage'));

type UserRole = 'patient' | 'doctor' | 'careCoordinator' | 'trainer' | 'nutritionist' | 'admin';

const App: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserRole>(() => {
    return (localStorage.getItem('vita_user_type') as UserRole) || 'patient';
  });

  useEffect(() => {
    localStorage.setItem('vita_user_type', userType);
  }, [userType]);
  const [showLogin, setShowLogin] = useState(false);

  // Initialize state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [careCoordinatorTasks, setCareCoordinatorTasks] = useState<CareCoordinatorTask[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string | number | null>(null);

  const fetchUserRole = async (user: any) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    console.log("🔍 Fetching role from:", `${API_BASE_URL}/api/user/role`);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/user/role`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log("📡 Role response status:", response.status);
      if (response.ok) {
        const { role } = await response.json();
        console.log("👤 Fetched User Role:", role);
        setUserType(role as UserRole);
        return role;
      } else {
        const errorText = await response.text();
        console.error("❌ Role fetch failed status:", response.status, errorText);
      }
    } catch (err) {
      console.error("❌ Failed to fetch user role (catch):", err);
    }
    return 'patient';
  };

  const fetchFromCloud = async (user: any) => {
    console.log("☁️ fetchFromCloud starting for:", user.email);
    setIsLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const cloudData = await response.json();
        console.log("📥 Cloud data received:", Object.keys(cloudData));

        const profile = cloudData.profile || {};

        const reconstructedPatient: Patient = {
          ...createNewPatient(profile.name || user.displayName || 'User', profile.email || user.email || '', profile.phone || ''),
          ...profile,
          age: profile.age || 0,
          // Merge other sections if they exist
          timeline: cloudData.timeline?.events || [],
          patient_history: cloudData.patient_history || [],
          prescriptions: cloudData.prescriptions || [],
          vitals: cloudData.vitals?.list || [],
          weeklyLogs: cloudData.weeklyLogs?.entries || [],
          tracking: cloudData.tracking || { labs: { status: 'Pending' }, consultation: { status: 'Pending' }, shipment: { status: 'Pending' } },
          clinic: cloudData.clinic || {},
          reports: cloudData.reports || [],
          current_loop: cloudData.current_loop || {},
          dailyLogs: cloudData.dailyLogs || {},
          carePlan: cloudData.carePlan || undefined,
          id: profile.id || Date.now(),
        };

        // If timeline from DB is empty, use the one from createNewPatient
        if (reconstructedPatient.timeline.length === 0) {
          reconstructedPatient.timeline = createNewPatient(profile.name || user.displayName, profile.email || user.email, profile.phone).timeline;
        }

        setPatients([reconstructedPatient]);
        setCurrentPatientId(reconstructedPatient.id);
      } else {
        const fallbackPatient = createNewPatient(user.displayName || 'User', user.email || '', '');
        setPatients([fallbackPatient]);
        setCurrentPatientId(fallbackPatient.id);
      }
    } catch (err) {
      console.error("☁️ Failed to fetch cloud data:", err);
      // Fallback to ensure we don't show "User not found"
      const fallbackPatient = createNewPatient(user.displayName || 'User', user.email || '', '');
      setPatients([fallbackPatient]);
      setCurrentPatientId(fallbackPatient.id);
    } finally {
      setIsLoading(false);
      // Double check: if patients is still empty for some reason, add one
      setPatients(prev => {
        if (prev.length === 0) {
          const fallback = createNewPatient(user.displayName || 'User', user.email || '', '');
          setCurrentPatientId(fallback.id);
          return [fallback];
        }
        return prev;
      });
    }
  };

  const fetchDoctorPatients = async (user: any) => {
    console.log("👨‍⚕️ fetchDoctorPatients starting");
    setIsLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const patientsList = await response.json();
        console.log("📋 Fetched patients list:", patientsList.length);

        // Map basic data to Patient type if needed, or assume backend returns compatible structure
        // Need to ensure Structure matches Patient Interface.
        // Be safe: merge with createNewPatient defaults just in case.
        const mappedPatients = patientsList.map((p: any) => ({
          ...createNewPatient(p.name || 'Unknown', p.email || '', ''),
          ...p, // Override with backend data
          id: p.id || Date.now(), // Ensure ID
        }));

        setPatients(mappedPatients);
      } else {
        console.error("❌ Failed to fetch patients list");
      }
    } catch (err) {
      console.error("❌ Error fetching doctor patients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePatientToCloud = async (section: string, data: any, targetPatientId?: string | number) => {
    const user = auth.currentUser;
    if (!user) return;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    try {
      const token = await user.getIdToken();

      // If doctor or care coordinator updating a specific patient
      if ((userType === 'doctor' || userType === 'careCoordinator') && targetPatientId) {
        console.log(`📡 [Coordinator Sync] ${section} for patient ${targetPatientId} (Type: ${typeof targetPatientId}) -> /api/doctor/update-patient`);
        const response = await fetch(`${API_BASE_URL}/api/doctor/update-patient`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId: String(targetPatientId), // Force string UID
            section,
            data
          })
        });
        const resData = await response.json().catch(() => ({}));
        console.log(`📥 [Coordinator Sync] Response (${response.status}):`, resData);
      } else {
        // Standard self-sync for patient
        console.log(`📡 [Patient Sync] ${section} -> /api/sync`);
        const response = await fetch(`${API_BASE_URL}/api/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ section, data })
        });
        const resData = await response.json().catch(() => ({}));
        console.log(`📥 [Patient Sync] Response (${response.status}):`, resData);
      }
    } catch (err) {
      console.error("Failed to sync to cloud:", err);
    }
  };

  useEffect(() => {
    console.log("🛠️ App Mounted");

    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("🔄 Redirect Success for:", result.user.email);
        }
      } catch (error: any) {
        console.error("🔄 Redirect Error:", error.code, error.message);
      }
    };
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔥 onAuthStateChanged:", user ? `${user.email} (${user.uid})` : "NO USER");

      if (user) {
        setFirebaseUser(user);
        setIsSignedIn(true);

        // Store token for dashboard components that use sessionStorage
        user.getIdToken().then(token => {
          sessionStorage.setItem('authToken', token);
        });

        try {
          const role = await fetchUserRole(user);
          setUserType(role as any);
          if (role === 'patient') {
            await fetchFromCloud(user);
          } else if (role === 'doctor' || role === 'careCoordinator') {
            await fetchDoctorPatients(user);
          } else {
            setIsLoading(false);
          }
        } catch (err) {
          console.error("❌ Error during auth initialization:", err);
          setIsLoading(false);
        }
      } else {
        setFirebaseUser(null);
        setIsSignedIn(false);
        setCurrentPatientId(null);
        setIsLoading(false);
        setUserType('patient');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const currentPatient = patients.find(p => p.id === currentPatientId) || patients[0] || null;

  const handleUpdatePatient = (
    patientId: string | number,
    newEvent: Omit<TimelineEvent, 'id' | 'date'> | null,
    updates: Partial<Patient> = {}
  ) => {
    const patientIndex = patients.findIndex(p => String(p.id) === String(patientId));
    console.log(`🔄 handleUpdatePatient: id=${patientId}, index=${patientIndex}, userType=${userType}`);

    if (patientIndex === -1) {
      console.warn(`⚠️ Patient with ID ${patientId} not found in state!`);
      return;
    }

    const currentP = patients[patientIndex];
    console.log(`📝 Applying updates to ${currentP.name}:`, updates);
    let newTimeline = currentP.timeline;
    let newHistory = currentP.patient_history || [];

    if (newEvent) {
      const newTimelineEvent: TimelineEvent = {
        ...newEvent,
        id: `t${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };

      // Favor patient_history for the unified view, otherwise fallback to timeline
      if (currentP.patient_history) {
        newHistory = [newTimelineEvent, ...currentP.patient_history];
      } else {
        newTimeline = [newTimelineEvent, ...currentP.timeline];
      }
    }

    const updatedPatient = {
      ...currentP,
      ...updates,
      tracking: updates.tracking ? { ...currentP.tracking, ...updates.tracking } : currentP.tracking,
      clinic: updates.clinic ? { ...currentP.clinic, ...updates.clinic } : currentP.clinic,
      current_loop: updates.current_loop ? { ...currentP.current_loop, ...updates.current_loop } : currentP.current_loop,
      timeline: newTimeline,
      patient_history: newHistory
    };

    const newPatients = [...patients];
    newPatients[patientIndex] = updatedPatient;
    setPatients(newPatients);

    savePatientToCloud('profile', {
      id: updatedPatient.id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      phone: updatedPatient.phone,
      age: updatedPatient.age,
      shippingAddress: updatedPatient.shippingAddress,
      status: updatedPatient.status,
      nextAction: updatedPatient.nextAction,
      careTeam: updatedPatient.careTeam,
      goal: updatedPatient.goal,
      pathway: updatedPatient.pathway,
      // Removed currentPrescription to avoid duplication in profile; it now lives in 'clinic' subcollection
    }, updatedPatient.id);

    if (newEvent) {
      savePatientToCloud('timeline', { events: updatedPatient.timeline }, updatedPatient.id);
    }

    if (updates.vitals) {
      savePatientToCloud('vitals', { list: updatedPatient.vitals }, updatedPatient.id);
    }

    if (updates.weeklyLogs) {
      savePatientToCloud('weeklyLogs', { entries: updatedPatient.weeklyLogs }, updatedPatient.id);
    }

    if (updates.dailyLogs) {
      savePatientToCloud('dailyLogs', updatedPatient.dailyLogs, updatedPatient.id);
    }

    if (updates.carePlan) {
      savePatientToCloud('carePlan', updatedPatient.carePlan, updatedPatient.id);
    }

    // New Data Persistence
    if (updates.reports) {
      // Use specific media_reports section for better scaling and multi-user sync
      savePatientToCloud('media_reports', updates.reports, updatedPatient.id);
    }

    if (updates.tracking) {
      savePatientToCloud('tracking', updatedPatient.tracking, updatedPatient.id);
    }

    if (updates.clinic) {
      savePatientToCloud('clinic', updatedPatient.clinic, updatedPatient.id);
    }
  };

  const handleCompleteCareCoordinatorTask = (taskId: string) => {
    setCareCoordinatorTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('vita_user_type');
      sessionStorage.removeItem('authToken');
      await signOut(auth);
      setShowLogin(false);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-xl font-bold text-brand-purple">Preparing your Portal...</p>
        </div>
      );
    }

    if (!isSignedIn) {
      if (showLogin) {
        return <UnifiedLoginPage onSignIn={() => { }} />;
      }
      return <LandingPage onLogin={() => setShowLogin(true)} />;
    }

    switch (userType) {
      case 'admin':
        return <AdminDashboard onSignOut={handleSignOut} />;
      case 'doctor':

        const rawName = firebaseUser?.displayName || "Mitchell";
        const docName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
        return <DoctorDashboard onSignOut={handleSignOut} allPatients={patients} onUpdatePatient={handleUpdatePatient} userName={docName} />;
      case 'careCoordinator':
      case 'trainer':
      case 'nutritionist':
        return (
          <CareCoordinatorDashboard
            onSignOut={handleSignOut}
            allPatients={patients}
            onUpdatePatient={handleUpdatePatient}
            tasks={careCoordinatorTasks}
            onCompleteTask={handleCompleteCareCoordinatorTask}
            userName={firebaseUser?.displayName || "Care Manager"}
          />
        );
      case 'patient':
      default:
        if (!currentPatient) return <div>User profile not found.</div>;
        if (!currentPatient) return <div>User profile not found.</div>;
        return <UserDashboard onSignOut={handleSignOut} patient={currentPatient} onUpdatePatient={handleUpdatePatient} userName={firebaseUser?.displayName || currentPatient.name || "User"} />;
    }
  };

  return (
    <div className="bg-brand-bg text-brand-text font-sans antialiased relative overflow-x-hidden">
      <Suspense fallback={
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-xl font-bold text-brand-purple">Loading...</p>
        </div>
      }>
        {renderContent()}
      </Suspense>
    </div>
  );
};

export default App;
