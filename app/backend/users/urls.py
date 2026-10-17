from django.urls import path
from .views import CreateUserViews, ConfirmCode, EditUser, DeleteUser , ListUsers ,ForgotPasswordView,CurrentUserView,ResetPasswordView

urlpatterns = [
    path("register/", CreateUserViews.as_view(), name="create-user"),
    path("confirm/", ConfirmCode.as_view(), name="confirm-code"),
    path("edit/<uuid:pk>/", EditUser.as_view(), name="edit-user"),
    path("delete/<uuid:pk>/", DeleteUser.as_view(), name="delete-user"),
    path("list/", ListUsers.as_view(), name="List-user"),
    path("forgot/", ForgotPasswordView.as_view(), name="forgot-user"),
     path("reset/", ResetPasswordView.as_view(), name="current_user"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    

]
