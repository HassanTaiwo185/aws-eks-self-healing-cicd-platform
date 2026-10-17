import { useEffect, useReducer, useState } from "react";
import api from "../api";
import UserTable from "../components/UserTable";

const initialUsers = [];

const reducer = (state, action) => {
  switch (action.type) {
    case "Listusers":
      return action.payload;
    case "deleteuser":
      return state.filter(user => user.id !== action.payload);
    default:
      return state;
  }
};

const User = () => {
  const [users, dispatch] = useReducer(reducer, initialUsers);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(false); 

  const fetchUsers = async () => {
    setLoading(true); 
    try {
      const response = await api.get("users/list/");
      dispatch({ type: "Listusers", payload: response.data });
      setFetchError(null);
    } catch {
      setFetchError("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <UserTable 
        users={users} 
        dispatch={dispatch} 
        currentUser={currentUser} 
        fetchError={fetchError} 
        loading={loading}
      />
    </div>
  );
};

export default User;
