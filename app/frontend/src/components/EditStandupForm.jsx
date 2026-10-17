import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import api from "../api";

const EditStandupForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const standup = location.state;
   const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [formData, setFormData] = useState({
    title: standup?.title || "",
    progress: standup?.progress || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const response = await api.patch(`standups/edit/${id}/`, formData);
      if (response.status === 200) {
        currentUser.role === "Team Leader"? navigate("/teamleader/dashboard") : navigate("/member/dashboard")
         // or wherever you want after edit, e.g. standup list page
      }
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;

      if (status === 403) {
        setError("You do not have permission to edit this standup.");
        navigate("/");
        return;
      }

      const message = data?.non_field_errors?.[0] || data?.detail || "Something went wrong during update.";
      setError(message);
    }
  };

  return (
    <div>
      <h2>Edit Standup</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleEdit}>
        <div>
          <label>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Progress:</label>
          <input
            name="progress"
            value={formData.progress}
            onChange={handleChange}
            placeholder="Progress update"
          />
        </div>

        <button type="submit">Update Standup</button>
        <button type="button" onClick={() => navigate(-1)}>Cancel</button>
      </form>
    </div>
  );
};

export default EditStandupForm;
