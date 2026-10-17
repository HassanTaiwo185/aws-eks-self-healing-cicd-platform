import Form from "../components/Forms";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-blue-50 px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md bg-white text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Forgot Password</h1>
        <p className="text-gray-600 mb-6">We'll help you get back in</p>
        <Form route="users/forgot/" isLogin={false} />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
