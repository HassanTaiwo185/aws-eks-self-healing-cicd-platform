import { useLocation, useNavigate ,useParams } from "react-router-dom";
import { useState } from "react";
import api from "../api";

// handle edit user form
const EditUserForm = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state;

    const [formData, updateFormData] = useState({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
    });
    const [error, setError] = useState("");


    // handle change in user details
    const handleChange = (e) => {
        updateFormData(prev => ({
            ...prev, [e.target.name]: e.target.value,
        }));
    }

    // update Edit successfully
    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch(`/users/edit/${id}/`, formData);

            if (response.status === 200) {
                navigate("/manage/team/members")
            }
        } catch (err) {
            const data = err.response?.data;
            const status = err.response?.status;

            if (status === 403) {
                setError("You do not have permission to edit this user.");
                navigate('/')
                return;
            }

            const message =
                data?.non_field_errors?.[0] ||
                data?.detail ||
                "Something went wrong during update.";
            setError(message);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
  <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-6 text-center">Edit User</h2>

    {error && <p className="text-red-600 mb-4">{error}</p>}

    <form onSubmit={handleEdit} className="space-y-4">
      <div className="flex flex-col">
        <label className="mb-1 font-medium">Username:</label>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Email:</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Role:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="Team leader">Team leader</option>
          <option value="Team member">Team member</option>
        </select>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Update User
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>

    );
}

export default EditUserForm;
