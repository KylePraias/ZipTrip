import { createContext, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  
  // Better debug logging
  useEffect(() => {
    console.log("AuthContext UPDATE:", { 
      userEmail: user?.email,
      userId: user?.uid,
      loading: loading,
      error: error?.message,
      hasUser: !!user
    });
  }, [user, loading, error]);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);