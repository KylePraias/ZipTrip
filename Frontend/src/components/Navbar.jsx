// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import AuthButton from './AuthButton';

export default function Navbar() {
  return (
    <nav className="bg-amber-50 drop-shadow-2xl p-4 flex items-center">
      {/* Left side: Logo */}
      <h1 className="text-xl font-semibold text-blue-600">ZipTrip</h1>

      {/* Right side: Links and logout */}
      <div className="flex items-center ml-auto">
        {/* Navigation Links */}
        <div className="flex space-x-4 mr-12"> {/* ⬅️ Increased margin here */}
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-500">Dashboard</Link>
          <Link to="/create" className="text-gray-700 hover:text-blue-500">Create Trip</Link>
        </div>

        {/* Logout Button */}
        <AuthButton />
      </div>
    </nav>
  );
}
// // src/components/Navbar.jsx
// import { Link } from 'react-router-dom';
// import AuthButton from './AuthButton'; // ⬅️ import it here

// const Navbar = () => (
//   <nav className="flex items-center justify-between mb-4">
//     {/* Left side: navigation links */}
//     <div className="flex gap-4">
//       <Link to="/dashboard" className="text-blue-700 hover:underline">Dashboard</Link>
//       <Link to="/create" className="text-blue-700 hover:underline">Create Trip</Link>
//     </div>

//     {/* Right side: logout button */}
//     <AuthButton />
//   </nav>
// );

// export default Navbar;
