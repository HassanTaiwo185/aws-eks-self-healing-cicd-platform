import { useState,useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { useNavigate, useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Form = ({ route, isLogin = true }) => {
  const query = useQuery();
  const inviteToken = query.get("invite_token");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [code, setCode] = useState("")
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // reset all when route changes
  useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setError(null);
    setRememberMe(false);
    setLoading(false);
  }, [route, isLogin]);




  // validating password to meet up strong password protocol
  function validatePassword(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasMinLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    return hasUppercase && hasMinLength && hasNumber && hasSpecialChar;
  }


  // login user based on role
  const login = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.post(route, { username, password });
      if (response.status === 200) {
        const { access, refresh } = response.data;
        
        // Decide storage type based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(ACCESS_TOKEN, access);
      storage.setItem(REFRESH_TOKEN, refresh); 


        // getting current user signed in 
        const userResponse = await api.get("users/me/");
        const currentUser = userResponse.data;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        

        if (currentUser.role === "Team leader") {
          navigate("/teamleader/dashboard")
        } else {
          navigate("/member/dashboard");
        }
      } // handling response error based on status
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.response?.status === 400) {
        setError("Please fill in all fields");
      } else if (err.response?.status === 403) {
        setError("Access denied");
        navigate('/')
      } else {
        setError("Something went wrong. Try again");
      }
    } finally {
      setLoading(false);
    }
  };

  // registering new user 
  const createUser = async (e) => {
  e.preventDefault();
  if (loading) return;
  if (!username || !password || !confirmPassword || !email) {
    setError("Please fill in all fields");
    return;
  }
  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }
  if (!validatePassword(password)) {
    setError(
      "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."
    );
    return;
  }

  setLoading(true);
  try {
    const response = await api.post(route, {
      username,
      password,
      email,
      ...(inviteToken && { invite_token: inviteToken }),
    });

    if (response.status === 200 || response.status === 201) {
      localStorage.setItem("usernameForConfirm", username);
      navigate("/confirm/user");
    }
  } catch (err) {
    const data = err.response?.data;

    if (err.response?.status === 400 && data) {
      // Extract first error message from DRF response
      const firstKey = Object.keys(data)[0];
      const message =
        Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
      setError(message);
    } else if (err.response?.status === 403) {
      setError("Access denied");
      navigate("/");
    } else {
      setError("Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};


 // confirm user email 
const confirmUser = async (e) => {
  e.preventDefault();
  if (loading) return;
  if (!code) {
    setError("Please enter the confirmation code.");
    return;
  }

  setLoading(true);
  try {
    const username = localStorage.getItem("usernameForConfirm") || "";
    const response = await api.post(route, { username, code });

    if (response.status === 200) {
      navigate("/"); // only navigate if successful
    }
  } catch (err) {
    const status = err.response?.status;

    if (status === 400) { 
      setError("Invalid confirmation code. Please try again."); // show error, don't navigate
    } else if (status === 403)  {
      setError("Access denied");
      navigate('/'); // only navigate if really forbidden
    } else {
      setError("Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};


  // requesting forgot password 
  const requestReset = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(route, { email, username });
      if (response.status === 200) {
        alert("Reset code sent to your email.");
        const { username: resUsername, email: resEmail } = response.data;
        localStorage.setItem("resetUsername", resUsername);
        localStorage.setItem("resetEmail", resEmail);
        navigate("/reset/password");
      } // handling response error based on status
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 400 && data) {
        if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setError("An error occurred. Please check your input.");
        }
      } else if (err.response?.status === 403) {
        setError("Access denied");
        navigate('/')
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  // reset password after sucessful user validation 
  const resetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters, include an uppercase letter, a number, and a special character.");
      return;
    }

    setLoading(true);
    try {
      const storedUsername = localStorage.getItem("resetUsername") || username;
      const storedEmail = localStorage.getItem("resetEmail") || email;

      const response = await api.post(route, {
        username: storedUsername,
        email: storedEmail,
        code,
        password,
        confirm_password: confirmPassword,
      });
      if (response.status === 200) {
        alert("Password reset successful.");
        navigate("/");
      } // handling response error based on status
    } catch (err) {
      const data = err.response?.data;
      if (data?.non_field_errors || data?.detail || data?.error) {
        const message = data?.non_field_errors?.[0] || data?.detail || data?.error;
        setError(message);
      } else if (err.response?.status === 403) {
        setError("Access denied");
        navigate('/');
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md m-auto rounded-lg shadow-md p-8" >
      {error && <div className="mb-4 p-3 border border-red-400 text-red-700 rounded-md">{error}</div>}
      

      <div className="space-y-4">
      {/* FORGOT PASSWORD */}
      {route === "users/forgot/" && (
        <>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent" />
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" 
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent" />
          <button onClick={requestReset} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </>
      )}
  
      {/* RESET PASSWORD */}
      {route === "users/reset/" && (
        <>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit Code" 
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"/>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password" 
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"/>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" 
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"/>
          <button onClick={resetPassword} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </>
      )}

      {/* USERNAME FIELD */}
      {(isLogin || route === "users/register/") && (
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent" />
      )}

      {/* LOGIN PASSWORD FIELD */}
      {isLogin && (
  <>
    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Password"
      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"
    />
    <label className="flex items-center space-x-2 text-sm text-gray-600">
      <input
        type="checkbox"
        checked={rememberMe}
        onChange={() => setRememberMe(!rememberMe)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
      />
       <span>Remember Me</span>
    </label>
  </>
)}


      {/* REGISTER FIELDS */}
      {!isLogin && !["users/confirm/", "users/reset/", "users/forgot/"].includes(route) && (
        <>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" 
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"/>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent"/>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent" />
        </>
      )}

      {/* CONFIRMATION CODE */}
      {route === "users/confirm/" && (
        <>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code"
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline focus:ring-blue-500 focus:border-transparent" />
        </>
      )}

      {/* BUTTONS */}
      {isLogin && (
        <button onClick={login} disabled={loading} className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Logging in..." : "Login"}
        </button>
      )}
      {!isLogin && route === "users/register/" && (
        <button onClick={createUser} disabled={loading} className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Creating account..." : "Register"}
        </button>
      )}
      {route === "users/confirm/" && (
        <button onClick={confirmUser} disabled={loading} className="w-full bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Confirming..." : "Confirm Account"}
        </button>
      )}
      </div>
    </div>
  );
};

export default Form;