import { useState } from "react";
import Form from "../components/Forms";
import { Link } from "react-router-dom";

const SignupPage = () => {
  const [mode, setMode] = useState("login");
  
  

  const getFormProps = () => {
    switch (mode) {
      case "register":
        return { route: "users/register/", isLogin: false };
      case "reset":
        return { route: "users/reset/", isLogin: false };
      case "forgot":
        return { route: "users/forgot/", isLogin: false };
      default:
        return { route: "token/", isLogin: true };
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center   bg-blue-50">
    <div className="text-center mb-8 mt-4" >
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        {mode === "login"
          ? "Welcome Back"
          : mode === "register"
          ? "Create Account"
          : mode === "forgot"
          ? "Forgot Password"
          : "Reset Password"}
      </h1>
       <p className="text-gray-600">
            {mode === "login"
              ? "Sign in to your account"
              : mode === "register"
              ? "Join us today"
              : "We'll help you get back in"}
          </p>

      <Form {...getFormProps()} />

      <div >
        {mode === "login" && (
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button onClick={() => setMode("register")}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Sign up
              </button>
            </p>
            <p>
              <Link to="#" onClick={() => setMode("forgot")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                Forgot Password?
              </Link>
            </p>
          </div>
        )}

        {mode !== "login" && (
           <div className="mt-6 text-center space-y-3">
          
          <p>
            <button onClick={() => setMode("login")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline ">
              Back to Login
            </button>
          </p>
           </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default SignupPage;
