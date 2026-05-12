import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
apiKey: 'AIzaSyBEWcZJLHjT7ietMOVMa1Ats943IwtHYiQ',
authDomain: 'neuro-note-d1970.firebaseapp.com',
projectId: 'neuro-note-d1970',
storageBucket: 'neuro-note-d1970.firebasestorage.app',
messagingSenderId: '471664150398',
appId: '1:471664150398:web:7de13ede0f4efe7028952f'
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;