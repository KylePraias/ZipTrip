import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import ZiptripLogo from "../assets/ZiptripLogo.png";

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-6">
      {/* Logo */}
      <img
        src={ZiptripLogo}
        alt="ZipTrip Logo"
        className="w-32 h-32 rounded-full mb-6 object-cover shadow-lg"
      />

      {/* App name */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
        ZipTrip
      </h1>
      <p className="text-gray-500 mb-8">Your AI-powered travel companion</p>

      {/* Card */}
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm text-center">
        <p className="text-lg text-gray-700 mb-6">Sign in to start planning</p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          data-testid="google-signin-btn"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-400">
        Plan smarter. Travel better.
      </p>
    </div>
  );
};

export default Login;
