import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";

const UserTable = ({ users, dispatch, currentUser, fetchError, loading }) => {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState(null);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;
    try {
      const response = await api.delete(`users/delete/${id}/`);
      if (response.status === 204 || response.status === 200) {
        dispatch({ type: "deleteuser", payload: id });
        setActionError(null);
      }
    } catch {
      setActionError("Failed to delete user. Please try again.");
    }
  };

  const handleEdit = (user) => {
    const confirmEdit = window.confirm("Are you sure you want to edit this user?");
    if (!confirmEdit) return;
    navigate(`/edit/user/${user.id}`, { state: user });
  };

  return (
    <div className="min-h-screen p-4 bg-blue-50 flex flex-col items-center w-full">
      <button onClick={() => navigate(-1)} className="mb-4 self-start bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500">
        Go Back
      </button>

      {fetchError && (
        <div className="mb-2 w-full flex justify-center">
          <div className="text-red-500 px-4 py-2 border border-red-300 bg-white rounded-md">{fetchError}</div>
        </div>
      )}

      {actionError && (
        <div className="mb-2 w-full flex justify-center">
          <div className="text-red-500 px-4 py-2 border border-red-300 bg-white rounded-md">{actionError}</div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-gray-700 font-semibold">Loading users...</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="min-w-full border border-gray-300 border-collapse shadow-md bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border border-gray-300 text-left">Username</th>
                  <th className="p-3 border border-gray-300 text-left">Email</th>
                  <th className="p-3 border border-gray-300 text-left">Role</th>
                  {currentUser?.role === "Team leader" && (
                    <th className="p-3 border border-gray-300 text-left">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-300">{user.username}</td>
                      <td className="p-2 border border-gray-300">{user.email}</td>
                      <td className="p-2 border border-gray-300">{user.role}</td>
                      {currentUser?.role === "Team leader" && (
                        <td className="p-2 border border-gray-300 space-x-2">
                          <button onClick={() => handleEdit(user)} className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600">Edit</button>
                          <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentUser?.role === "Team leader" ? 4 : 3} className="p-4 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-4 w-full">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="mb-1"><span className="font-bold text-gray-700">Username: </span>{user.username}</div>
                  <div className="mb-1"><span className="font-bold text-gray-700">Email: </span>{user.email}</div>
                  <div className="mb-3"><span className="font-bold text-gray-700">Role: </span>{user.role}</div>
                  {currentUser?.role === "Team leader" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="flex-1 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600">Delete</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No users found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserTable;