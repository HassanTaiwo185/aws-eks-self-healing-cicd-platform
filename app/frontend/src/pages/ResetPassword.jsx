import Form from "../components/Forms";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-blue-50 px-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md bg-white text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Reset Password</h1>
        <p className="text-gray-600 mb-6">Enter 6 digits reset code and your new password  below.</p>
        <Form route="users/reset/" isLogin={false} />
      </div>
    </div>
  );
};

export default ResetPasswordPage;