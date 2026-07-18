import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Establishment, Publication, Review, Application, RelationshipRequest, ServiceRequest, Role } from './types';
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, query, addDoc, updateDoc, where } from 'firebase/firestore';

interface AppState {
  currentUser: User | null;
  users: User[];
  establishments: Establishment[];
  publications: Publication[];
  reviews: Review[];
  favorites: Record<string, string[]>;
  applications: Application[];
  relationshipRequests: RelationshipRequest[];
  serviceRequests: ServiceRequest[];
  loading: boolean;
  globalError: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null;
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: Omit<User, 'id'>, pass: string, estData?: Partial<Establishment>) => Promise<void>;
  envoyerCodeOtp: (phone: string, containerId: string) => Promise<void>;
  confirmerCodeOtp: (otpCode: string, registrationData?: {
    name: string;
    role: Role;
    country: string;
    city: string;
    phone: string;
    email?: string;
    estData?: Partial<Establishment>;
  }) => Promise<void>;
  addEstablishment: (est: Omit<Establishment, 'id' | 'status' | 'averageRating'>) => Promise<void>;
  addPublication: (pub: Omit<Publication, 'id' | 'views' | 'clicks' | 'createdAt'>) => Promise<void>;
  toggleFavorite: (clientId: string, establishmentId: string) => Promise<void>;
  validateEstablishment: (id: string) => Promise<void>;
  upgradeToGerant: (estData: Partial<Establishment>) => Promise<void>;
  createRelationshipRequest: (req: Omit<RelationshipRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  updateRelationshipRequest: (id: string, status: 'acceptee' | 'refusee') => Promise<void>;
  createServiceRequest: (req: Omit<ServiceRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  updateServiceRequest: (id: string, status: 'validee' | 'refusee', message?: string) => Promise<void>;
  createConversation: (clientId: string, establishmentId: string, clientName: string, establishmentName: string, ownerId: string) => Promise<string>;
  toggleDJStatus: (requestId: string, isDJ: boolean) => Promise<void>;
  setGlobalError: (err: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null) => void;
  toggleTheme: () => void;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const DEFAULT_ESTABLISHMENTS: Establishment[] = [];

const DEFAULT_PUBLICATIONS: Publication[] = [];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    establishments: [],
    publications: [],
    reviews: [],
    favorites: {},
    applications: [],
    relationshipRequests: [],
    serviceRequests: [],
    loading: true,
    globalError: null,
    theme: (localStorage.getItem('app-theme') as 'light' | 'dark') || 'light'
  });

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const toggleTheme = () => {
    setState(s => {
      const newTheme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', newTheme);
      return { ...s, theme: newTheme };
    });
  };

  const setGlobalError = (err: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null) => {
    setState(s => ({ ...s, globalError: err }));
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!state.currentUser) {
      setUnreadCount(0);
      return;
    }

    const isGerant = state.currentUser.role === 'gerant';
    const convQuery = query(
      collection(db, 'conversations'),
      where(isGerant ? 'ownerId' : 'clientId', '==', state.currentUser.id)
    );

    const unsubscribe = onSnapshot(convQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const isUnread = isGerant ? data.unreadByGerant : data.unreadByClient;
        if (isUnread) count++;
      });
      setUnreadCount(count);
    }, (error) => {
      console.error("Erreur listening to unread conversations:", error);
    });

    return () => unsubscribe();
  }, [state.currentUser?.id, state.currentUser?.role]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, 
      (firebaseUser) => {
        if (firebaseUser) {
          console.log("[onAuthStateChanged] Succès de la détection de l'utilisateur :", {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
            emailVerified: firebaseUser.emailVerified
          });
          if (unsubscribeDoc) unsubscribeDoc();
          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data() as Partial<Omit<User, 'id'>>;
              
              let role = userData.role;
              if (typeof role === 'string') {
                role = role.toLowerCase().trim() as Role;
              }
              
              if (!role || !['client', 'gerant', 'admin'].includes(role)) {
                console.error(`[onAuthStateChanged] ERREUR CRITIQUE: Le rôle est manquant ou invalide ("${role}") pour l'utilisateur ${firebaseUser.email}`);
                
                // Attempt to recover role by checking if user has any establishments
                try {
                  const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
                  const estQuery = query(collection(db, 'establishments'), where('ownerId', '==', firebaseUser.uid));
                  const estSnapshot = await getDocs(estQuery);
                  if (!estSnapshot.empty) {
                    console.log(`[onAuthStateChanged] Récupération du rôle: l'utilisateur a des établissements, restauration en tant que 'gerant'`);
                    role = 'gerant';
                    await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'gerant' });
                  } else {
                    alert(`Erreur: Votre profil est incomplet ou corrompu (rôle non défini). L'application va utiliser un accès limité.`);
                    role = 'client'; // Fallback
                    await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'client' });
                  }
                } catch(e) {
                  console.error("Failed to recover role:", e);
                  role = 'client'; // Fallback
                }
              }

              console.log("[onAuthStateChanged] Profil utilisateur chargé avec succès de Firestore :", userData.name, "Rôle:", role);
              setState(s => ({ ...s, currentUser: { id: firebaseUser.uid, ...userData, role } as User, loading: false }));
            } else {
              console.warn("[onAuthStateChanged] Aucun profil utilisateur Firestore trouvé pour UID :", firebaseUser.uid);
              
              // Création d'un profil par défaut (self-healing) pour éviter de bloquer l'utilisateur
              import('firebase/firestore').then(async ({ setDoc, collection, query, where, getDocs }) => {
                try {
                  const estQuery = query(collection(db, 'establishments'), where('ownerId', '==', firebaseUser.uid));
                  const estSnapshot = await getDocs(estQuery);
                  const isGerant = !estSnapshot.empty;
                  const recoveredRole = isGerant ? 'gerant' : 'client';

                  const defaultProfile = {
                    name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utilisateur'),
                    email: firebaseUser.email || '',
                    phone: firebaseUser.phoneNumber || '',
                    role: recoveredRole as Role,
                    country: 'Burkina Faso',
                    city: 'Ouagadougou'
                  };

                  console.log(`[onAuthStateChanged] Création automatique d'un profil '${recoveredRole}' par défaut pour l'UID:`, firebaseUser.uid);
                  await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
                  console.log("[onAuthStateChanged] Profil créé par défaut avec succès.");
                  // L'écouteur onSnapshot va se déclencher à nouveau automatiquement dès que le document sera créé !
                } catch (err) {
                  console.error("[onAuthStateChanged] Échec de la création automatique du profil par défaut :", err);
                  setState(s => ({ ...s, currentUser: { id: firebaseUser.uid, name: firebaseUser.email || 'Utilisateur', email: firebaseUser.email || '', phone: firebaseUser.phoneNumber || '', role: 'client', country: 'Burkina Faso', city: 'Ouagadougou' }, loading: false }));
                }
              });
            }
          }, (error: any) => {
            console.error("[onAuthStateChanged] Erreur de connexion à Firestore (onSnapshot users):", {
              code: error?.code,
              message: error?.message,
              stack: error?.stack
            });
            setState(s => ({ ...s, currentUser: { id: firebaseUser.uid, name: firebaseUser.email || 'Utilisateur', email: firebaseUser.email || '', role: 'client' }, loading: false }));
          });
        } else {
          console.log("[onAuthStateChanged] Aucun utilisateur n'est connecté.");
          if (unsubscribeDoc) unsubscribeDoc();
          setState(s => ({ ...s, currentUser: null, loading: false }));
        }
      },
      (error: any) => {
        console.error("[onAuthStateChanged] Erreur de l'observateur d'authentification Firebase :", {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        });
        
        const errorMessage = `Erreur d'authentification globale : ${error?.message || 'Inconnue'} (${error?.code || 'unknown'})`;
        setGlobalError({
          message: errorMessage,
          code: error?.code,
          type: 'error'
        });
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Listeners for public data (establishments and publications) available to everyone
  useEffect(() => {
    // Listen to establishments
    const estQuery = query(collection(db, 'establishments'));
    const unsubscribeEst = onSnapshot(estQuery, (snapshot) => {
      const ests: Establishment[] = [];
      snapshot.forEach(doc => ests.push({ id: doc.id, ...doc.data() } as Establishment));
      
      // Combine with defaults to ensure the database is never empty
      const mergedEsts = [...ests];
      DEFAULT_ESTABLISHMENTS.forEach(defEst => {
        if (!mergedEsts.some(e => e.id === defEst.id || e.name.toLowerCase() === defEst.name.toLowerCase())) {
          mergedEsts.push(defEst);
        }
      });
      
      setState(s => ({ ...s, establishments: mergedEsts }));
    }, (error) => {
      console.error("Erreur establishments:", error);
      // Fallback to defaults in case of error
      setState(s => ({ ...s, establishments: DEFAULT_ESTABLISHMENTS }));
    });

    // Listen to publications
    const pubQuery = query(collection(db, 'publications'));
    const unsubscribePub = onSnapshot(pubQuery, (snapshot) => {
      const pubs: Publication[] = [];
      snapshot.forEach(doc => pubs.push({ id: doc.id, ...doc.data() } as Publication));
      
      // Combine with defaults to ensure the database is never empty
      const mergedPubs = [...pubs];
      DEFAULT_PUBLICATIONS.forEach(defPub => {
        if (!mergedPubs.some(p => p.id === defPub.id || p.title.toLowerCase() === defPub.title.toLowerCase())) {
          mergedPubs.push(defPub);
        }
      });
      
      setState(s => ({ ...s, publications: mergedPubs }));
    }, (error) => {
      console.error("Erreur publications:", error);
      // Fallback to defaults in case of error
      setState(s => ({ ...s, publications: DEFAULT_PUBLICATIONS }));
    });

    return () => {
      unsubscribeEst();
      unsubscribePub();
    };
  }, []);

  // Listeners for user-specific / private data requiring authentication
  useEffect(() => {
    if (!state.currentUser) {
      // Clear authenticated state data when user logs out
      setState(s => ({ ...s, users: [], relationshipRequests: [], serviceRequests: [], favorites: {} }));
      return;
    }

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const uList: User[] = [];
      snapshot.forEach(doc => {
        uList.push({ id: doc.id, ...doc.data() } as User);
      });
      setState(s => ({ ...s, users: uList }));
    }, (error) => {
      console.error("Erreur listening to users:", error);
    });

    // Listen to relationship requests
    const relQuery = query(collection(db, 'relationshipRequests'));
    const unsubscribeRel = onSnapshot(relQuery, (snapshot) => {
      const rels: RelationshipRequest[] = [];
      snapshot.forEach(doc => rels.push({ id: doc.id, ...doc.data() } as RelationshipRequest));
      setState(s => ({ ...s, relationshipRequests: rels }));
    }, (error) => {
      console.error("Erreur relationshipRequests:", error);
    });

    // Listen to service requests
    const serQuery = query(collection(db, 'serviceRequests'));
    const unsubscribeSer = onSnapshot(serQuery, (snapshot) => {
      const sers: ServiceRequest[] = [];
      snapshot.forEach(doc => sers.push({ id: doc.id, ...doc.data() } as ServiceRequest));
      setState(s => ({ ...s, serviceRequests: sers }));
    }, (error) => {
      console.error("Erreur serviceRequests:", error);
    });

    // Listen to favorites
    const unsubscribeFav = onSnapshot(doc(db, 'favorites', state.currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const establishmentIds = data?.establishmentIds || [];
        setState(s => ({
          ...s,
          favorites: {
            ...s.favorites,
            [state.currentUser!.id]: establishmentIds
          }
        }));
      } else {
        setState(s => ({
          ...s,
          favorites: {
            ...s.favorites,
            [state.currentUser!.id]: []
          }
        }));
      }
    }, (error) => {
      console.error("Erreur listening to favorites:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRel();
      unsubscribeSer();
      unsubscribeFav();
    };
  }, [state.currentUser?.id]);

  const translateFirebaseError = (error: any): string => {
    const code = error?.code || 'unknown';
    const message = error?.message || '';

    switch (code) {
      case 'auth/unauthorized-domain':
        return `Le domaine actuel n'est pas autorisé dans Firebase. Veuillez l'ajouter dans Authentication > Paramètres > Domaines autorisés de la console Firebase. [Code: ${code}]`;
      case 'auth/too-many-requests':
        return `Trop de tentatives de connexion échouées. Votre compte est temporairement bloqué pour des raisons de sécurité. Veuillez patienter environ 5 minutes. [Code: ${code}]`;
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return `Identifiant (email, téléphone ou code de vérification) ou mot de passe incorrect. [Code: ${code}]`;
      case 'auth/user-disabled':
        return `Ce compte a été désactivé par l'administrateur. [Code: ${code}]`;
      case 'auth/network-request-failed':
        return `Erreur de connexion réseau. Veuillez vérifier votre connexion Internet. [Code: ${code}]`;
      case 'auth/operation-not-allowed':
        return `Cette méthode d'authentification n'est pas activée dans la console Firebase. [Code: ${code}]`;
      case 'auth/email-already-in-use':
        return `Cette adresse email est déjà associée à un compte. [Code: ${code}]`;
      case 'auth/invalid-email':
        return `L'adresse email saisie est invalide. [Code: ${code}]`;
      case 'auth/weak-password':
        return `Le mot de passe est trop faible (6 caractères minimum). [Code: ${code}]`;
      case 'auth/invalid-phone-number':
        return `Le numéro de téléphone saisi est invalide. Veuillez utiliser le format international (ex: +22670000000). [Code: ${code}]`;
      case 'auth/missing-phone-number':
        return `Le numéro de téléphone est manquant. [Code: ${code}]`;
      case 'auth/code-expired':
        return `Le code de vérification SMS/OTP a expiré. Veuillez demander un nouveau code. [Code: ${code}]`;
      case 'auth/invalid-verification-code':
        return `Le code de vérification SMS/OTP saisi est incorrect. [Code: ${code}]`;
      case 'auth/captcha-check-failed':
        return `La vérification reCAPTCHA a échoué. Veuillez réessayer. [Code: ${code}]`;
      case 'unavailable':
        return `Impossible de se connecter à la base de données. Veuillez désactiver vos bloqueurs de publicités (uBlock, etc.), votre VPN, ou vérifier votre pare-feu réseau. L'erreur "unavailable" indique que votre navigateur bloque la connexion à Firestore. [Code: ${code}]`;
      default:
        return `${message || 'Une erreur inconnue est survenue.'} [Code: ${code}]`;
    }
  };

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const envoyerCodeOtp = async (phone: string, containerId: string) => {
    try {
      console.log(`[Phone Auth] Initialisation du reCAPTCHA sur le conteneur: [${containerId}]`);
      
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }

      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log("[Phone Auth] reCAPTCHA résolu avec succès.");
        }
      });

      console.log(`[Phone Auth] Envoi du code OTP au numéro: [${phone}]`);
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      console.log("[Phone Auth] Code OTP envoyé avec succès.");
    } catch (error: any) {
      console.error("[Phone Auth] Échec de l'envoi du code OTP :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const confirmerCodeOtp = async (otpCode: string, registrationData?: {
    name: string;
    role: Role;
    country: string;
    city: string;
    phone: string;
    email?: string;
    estData?: Partial<Establishment>;
  }) => {
    if (!confirmationResult) {
      const msg = "Aucun code de vérification n'a été envoyé. Veuillez d'abord demander un code OTP.";
      setGlobalError({ message: msg, type: 'error' });
      throw new Error(msg);
    }

    try {
      console.log(`[Phone Auth] Confirmation du code OTP: [${otpCode}]`);
      const credential = await confirmationResult.confirm(otpCode);
      const firebaseUser = credential.user;
      console.log("[Phone Auth] Code validé. UID de l'utilisateur :", firebaseUser.uid);

      if (registrationData) {
        console.log("[Phone Auth] Données d'inscription détectées. Création du profil utilisateur...");
        const newUserData = {
          name: registrationData.name.trim(),
          email: registrationData.email?.trim() || '',
          phone: firebaseUser.phoneNumber || registrationData.phone,
          role: registrationData.role,
          country: registrationData.country || 'Burkina Faso',
          city: registrationData.city || 'Ouagadougou'
        };

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          console.log("[Phone Auth] Profil Firestore créé avec succès.");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }

        if (registrationData.role === 'gerant' && registrationData.estData) {
          console.log("[Phone Auth] Rôle gérant détecté. Création de l'établissement...");
          try {
            await addDoc(collection(db, 'establishments'), {
              ownerId: firebaseUser.uid,
              name: registrationData.estData.name || '',
              category: registrationData.estData.category || 'autre',
              country: registrationData.country || 'Burkina Faso',
              city: registrationData.city || 'Ouagadougou',
              neighborhood: registrationData.estData.neighborhood || '',
              address: registrationData.estData.address || '',
              phone: firebaseUser.phoneNumber || registrationData.phone,
              description: '',
              photos: [],
              geolocation: registrationData.estData.geolocation || '',
              status: 'valide',
              averageRating: 0
            });
            console.log("[Phone Auth] Établissement créé avec succès dans Firestore.");
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'establishments');
          }
        }
      }
    } catch (error: any) {
      console.error("[Phone Auth] Échec de la confirmation du code OTP :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const login = async (email: string, pass: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error("Veuillez saisir votre adresse e-mail.");
    }
    if (!pass) {
      throw new Error("Veuillez saisir votre mot de passe.");
    }

    try {
      console.log(`[Email Login] Tentative de connexion pour : [${trimmedEmail}]`);
      await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      console.log("[Email Login] Connexion réussie.");
    } catch (error: any) {
      console.error("[Email Login] Échec de la connexion :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const register = async (userData: Omit<User, 'id'>, pass: string, estData?: Partial<Establishment>) => {
    const emailStr = (userData.email || '').trim();
    if (!emailStr) {
      throw new Error("L'adresse e-mail est obligatoire.");
    }
    if (!pass || pass.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    }

    try {
      console.log(`[Email Register] Tentative d'inscription pour : [${emailStr}]`);
      const credential = await createUserWithEmailAndPassword(auth, emailStr, pass);
      const firebaseUser = credential.user;
      console.log("[Email Register] Compte d'authentification créé avec UID :", firebaseUser.uid);

      const newUserData = {
        name: userData.name.trim() || 'Utilisateur',
        email: emailStr,
        phone: userData.phone || '',
        role: userData.role,
        country: userData.country || 'Burkina Faso',
        city: userData.city || 'Ouagadougou'
      };

      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        console.log("[Email Register] Profil Firestore créé avec succès.");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }

      if (userData.role === 'gerant' && estData) {
        console.log("[Email Register] Rôle gérant détecté. Création de l'établissement...");
        try {
          await addDoc(collection(db, 'establishments'), {
            ownerId: firebaseUser.uid,
            name: estData.name || '',
            category: estData.category || 'autre',
            country: userData.country || 'Burkina Faso',
            city: userData.city || 'Ouagadougou',
            neighborhood: estData.neighborhood || '',
            address: estData.address || '',
            phone: userData.phone || '',
            description: '',
            photos: [],
            geolocation: estData.geolocation || '',
            status: 'valide',
            averageRating: 0
          });
          console.log("[Email Register] Établissement créé avec succès dans Firestore.");
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'establishments');
        }
      }
    } catch (error: any) {
      console.error("[Email Register] Échec global d'inscription :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    try {
      console.log("[Logout] Tentative de déconnexion...");
      await signOut(auth);
      setConfirmationResult(null);
      console.log("[Logout] Déconnecté avec succès.");
    } catch (error: any) {
      console.error("[Logout] Erreur lors de la déconnexion :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const addEstablishment = async (est: Omit<Establishment, 'id' | 'status' | 'averageRating'>) => {
    try {
      await addDoc(collection(db, 'establishments'), {
        ...est,
        status: 'valide',
        averageRating: 0
      });
    } catch (error) {
      console.error("Erreur ajout etablissement:", error);
    }
  };

  const addPublication = async (pub: Omit<Publication, 'id' | 'views' | 'clicks' | 'createdAt'>) => {
    try {
      const cleanPub = Object.entries(pub).reduce((acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {} as any);

      await addDoc(collection(db, 'publications'), {
        ...cleanPub,
        views: 0,
        clicks: 0,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur ajout publication:", error);
      throw error;
    }
  };

  const toggleFavorite = async (clientId: string, establishmentId: string) => {
    try {
      const userFavs = state.favorites[clientId] || [];
      const isFav = userFavs.includes(establishmentId);
      const updatedFavs = isFav 
        ? userFavs.filter(id => id !== establishmentId)
        : [...userFavs, establishmentId];

      setState(s => ({
        ...s,
        favorites: {
          ...s.favorites,
          [clientId]: updatedFavs
        }
      }));

      await setDoc(doc(db, 'favorites', clientId), {
        establishmentIds: updatedFavs
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `favorites/${clientId}`);
    }
  };

  const validateEstablishment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'establishments', id), {
        status: 'valide'
      });
    } catch (error) {
      console.error("Erreur validation etablissement:", error);
    }
  };

  const upgradeToGerant = async (estData: Partial<Establishment>) => {
    if (!state.currentUser) return;
    try {
      // Create or update user doc
      await setDoc(doc(db, 'users', state.currentUser.id), {
        name: state.currentUser.name,
        email: state.currentUser.email || '',
        phone: state.currentUser.phone || '',
        role: 'gerant',
        country: state.currentUser.country || '',
        city: state.currentUser.city || 'Non spécifié' // Ensure city is not empty
      }, { merge: true });

      // Add establishment
      await addDoc(collection(db, 'establishments'), {
        ownerId: state.currentUser.id,
        name: estData.name || '',
        category: estData.category || 'autre',
        country: state.currentUser.country || '',
        city: state.currentUser.city || 'Non spécifié',
        neighborhood: estData.neighborhood || '',
        address: estData.address || '',
        phone: state.currentUser.phone || state.currentUser.email || '',
        description: '',
        photos: [],
        geolocation: estData.geolocation || '',
        status: 'valide',
        averageRating: 0
      });
    } catch (error) {
      console.error("Erreur lors de la mise à niveau vers gérant:", error);
      throw error;
    }
  };

  const createRelationshipRequest = async (req: Omit<RelationshipRequest, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, 'relationshipRequests'), {
        ...req,
        status: 'en_attente',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createRelationshipRequest:", error);
      throw error;
    }
  };

  const updateRelationshipRequest = async (id: string, status: 'acceptee' | 'refusee') => {
    try {
      await updateDoc(doc(db, 'relationshipRequests', id), { status });
    } catch (error: any) {
      console.error("Erreur updateRelationshipRequest:", error);
      throw error;
    }
  };

  const createServiceRequest = async (req: Omit<ServiceRequest, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        ...req,
        status: 'en_attente',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createServiceRequest:", error);
      throw error;
    }
  };

  const updateServiceRequest = async (id: string, status: 'validee' | 'refusee', managerMessage?: string) => {
    try {
      await updateDoc(doc(db, 'serviceRequests', id), { status, managerMessage });
    } catch (error: any) {
      console.error("Erreur updateServiceRequest:", error);
      throw error;
    }
  };

  const createConversation = async (clientId: string, establishmentId: string, clientName: string, establishmentName: string, ownerId: string) => {
    const convId = `${clientId}_${establishmentId}`;
    const convRef = doc(db, 'conversations', convId);
    
    // Check if exists
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      return convId;
    }

    await setDoc(convRef, {
      clientId,
      clientName,
      establishmentId,
      establishmentName,
      ownerId,
      lastMessage: 'Discussion démarrée',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: auth.currentUser?.uid || clientId,
      unreadByClient: auth.currentUser?.uid === ownerId,
      unreadByGerant: auth.currentUser?.uid === clientId
    });
    return convId;
  };

  const toggleDJStatus = async (requestId: string, isDJ: boolean) => {
    try {
      await updateDoc(doc(db, 'relationshipRequests', requestId), { isDJ });
    } catch (error) {
      console.error("Erreur toggleDJStatus:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      unreadCount,
      login,
      logout,
      register,
      envoyerCodeOtp,
      confirmerCodeOtp,
      addEstablishment,
      addPublication,
      toggleFavorite,
      validateEstablishment,
      upgradeToGerant,
      createRelationshipRequest,
      updateRelationshipRequest,
      createServiceRequest,
      updateServiceRequest,
      createConversation,
      toggleDJStatus,
      setGlobalError,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}

