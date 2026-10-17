import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SignupPage from "./pages/Signup";
import RegisterPage from "./pages/Register";
import ConfirmUserPage from "./pages/ConfirmUser";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import EditUserForm from "./pages/EditUserForm";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";
import TeamMemberDashboard from "./pages/TeamMemberDashboard";
import User from "./components/Users";
import InviteTeamMemberForm from "./pages/InviteTeamMemberForm";
import CreateStandup from "./components/CreateStandup";
import StandupPage from "./components/StandupPage";
import ChatRoom from "./components/ChatRoom";
import EditStandupForm from "./components/EditStandupForm";
import NotFound from "./pages/NotFound";

function App() {
  const [backendReady, setBackendReady] = useState(false);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    const wakeBackend = async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/users/register/`, {
          method: "OPTIONS",
        });
      } catch (e) {
        // ignore errors — we just want to wake it up
      } finally {
        setBackendReady(true);
        setWaking(false);
      }
    };

    // Show loading for max 10 seconds then show app anyway
    const timeout = setTimeout(() => {
      setBackendReady(true);
      setWaking(false);
    }, 10000);

    wakeBackend().then(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  if (waking) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold text-gray-700">Starting up CollabsUp...</h2>
          <p className="text-gray-500 text-sm text-center">
            Our server is waking up. This takes about 30 seconds on first load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm/user" element={<ConfirmUserPage />} />
        <Route path="/forgot/password" element={<ForgotPasswordPage />} />
        <Route path="/reset/password" element={<ResetPasswordPage />} />
        <Route path="/edit/user/:id" element={<EditUserForm />} />
        <Route path="/teamleader/dashboard" element={<TeamLeaderDashboard />} />
        <Route path="/member/dashboard" element={<TeamMemberDashboard />} />
        <Route path="/manage/team/members" element={<User />} />
        <Route path="/invite/team/member" element={<InviteTeamMemberForm />} />
        <Route path="/standups" element={<StandupPage />} />
        <Route path="/createstandups" element={<CreateStandup />} />
        <Route path="/chatroom/:roomId/:standupId" element={<ChatRoom />} />
        <Route path="/edit/standup/:id" element={<EditStandupForm />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;