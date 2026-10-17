// src/pages/InviteTeamMemberForm.jsx
import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const InviteTeamMemberForm = () => {
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInvite = async () => {
    if (!inviteeEmail) {
      setError("Please enter an email.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("teams/invite/", {
        invitee_email: inviteeEmail,
      });

      if (response.status === 200 || response.status === 201) {
        setInviteLink(response.data.invite_link);
        setError("");
        setInviteeEmail("");
      }
    } catch (err) {
      setError("Failed to send invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center w-full">
      <form
  onSubmit={(e) => {
    e.preventDefault(); 
    handleInvite();     
  }}
  className="bg-white shadow-md rounded-lg p-6 w-full max-w-md flex flex-col gap-4"
>
      
      <h2 className="font-bold">Invite a Team Member</h2>

      <input
        type="email"
        value={inviteeEmail}
        onChange={(e) => setInviteeEmail(e.target.value)}
        placeholder="Enter team member's email"
        className="w-full px-3 py-2 border rounded-md"
      />
      <button
      type="button"
      onClick={handleInvite}
      disabled={loading}
     
      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? "Sending..." : "Send Invite"}
    </button>

      {error && <p className="mb-4 p-3 border border-red-400 text-red-700 rounded-md">{error}</p>}

      <br />
      <button onClick={() => navigate(-1)}
        className="w-full bg-gray-300 py-2 rounded-md hover:bg-gray-400">Back</button>
        </form>
    </div>
    
  );
};

export default InviteTeamMemberForm;
