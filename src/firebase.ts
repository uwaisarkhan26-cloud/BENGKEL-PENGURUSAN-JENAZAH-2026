import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
let rawConfig = {
  projectId: "gen-lang-client-0703444782",
  appId: "1:785035586205:web:d45a1f595d7faba3d30274",
  apiKey: "AIzaSyADZYcVb0XkB3KXg-mMptCOGw0fJZxJFlE",
  authDomain: "gen-lang-client-0703444782.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-dashboardscanner-93c17f91-c0a1-4e50-8d83-fe0318061754",
  storageBucket: "gen-lang-client-0703444782.firebasestorage.app",
  messagingSenderId: "785035586205"
};

try {
  // If external json config is available, merge it
  const externalConfig = await import('../firebase-applet-config.json');
  if (externalConfig && externalConfig.default) {
    rawConfig = { ...rawConfig, ...externalConfig.default };
  }
} catch (e) {
  // Use embedded config
}

export const app = initializeApp(rawConfig);

export const db = rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore connection on boot
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
})();
