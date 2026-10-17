import { useNavigate } from "react-router-dom";
import Standup from "../components/Standup";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"; // make sure you import your token constants

const TeamLeaderDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear tokens
    sessionStorage.removeItem(ACCESS_TOKEN) || localStorage.removeItem(ACCESS_TOKEN);
    sessionStorage.removeItem(REFRESH_TOKEN)|| localStorage.removeItem(REFRESH_TOKEN);
    sessionStorage.removeItem("currentUser") || localStorage.removeItem("currentUser"); 

    // Navigate to login page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Team Leader Dashboard</h1>

      {/* Action Cards */}
      <div className="flex flex-col gap-6 w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <p className="mb-4 text-gray-700 font-medium">Manage your team members</p>
          <button
            onClick={() => navigate("/manage/team/members")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Show & Manage Team Members
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <p className="mb-4 text-gray-700 font-medium">Invite new members to your team</p>
          <button
            onClick={() => navigate("/invite/team/member")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Invite Team Members
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <p className="mb-4 text-gray-700 font-medium">Create standups for your team</p>
          <button
            onClick={() => navigate("/createstandups")}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Create Standups
          </button>
        </div>
      </div>

      {/* Standup Component */}
      <div className="w-full mx-auto mt-10 rounded-lg p-6">
        <Standup/>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full max-w-md mt-6 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
};

export default TeamLeaderDashboard;
