import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";


const CreateStandup = ({ onCreate }) => {
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      const res = await api.post("standups/create/", {
        title,
        progress,
      });

      if (res.status === 201) {
         onCreate?.();
        setTitle("");
        setProgress("");
        setError("");
        // refresh standup list in parent
      }
    } catch (err) {
      setError("Failed to create standup");
      
    }
  };

  return (
    <div className="min-h-screen  bg-blue-50 flex flex-col items-center justify-center mt-4 gap-3 w-full ">
      
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 w-full max-w-md flex flex-col gap-4">
      <h3 className="text-xl font-bold text-gray-800">Create New Standup</h3>
      {error && <div className="mb-4 p-3 border border-red-400 text-red-700 rounded-md">{error}</div>}
      <div>
        <label>
          Title:
          <input
            type="text"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="Standup title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>

      <div>
        <label>
          Progress:
          <input
            type="text"
            maxLength={255}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            placeholder="Progress update"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>

      <button type="submit"
      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Create Standup</button>
    </form>
     <button onClick={() => navigate(-1)} className="mt-4 text-blue-400 hover:text-blue-800 hover:underline">Back</button>
    </div>
  );
};

export default CreateStandup;
