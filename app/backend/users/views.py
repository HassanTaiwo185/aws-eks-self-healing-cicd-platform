from django.shortcuts import render
from rest_framework import generics, status
from .serializers import CreateUser, UpdateUserSerializer, ForgotPasswordSerializer, UserSerializer, ResetPasswordSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .models import User, ConfirmationCode
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
import random
import requests
import os
from rest_framework.parsers import MultiPartParser, FormParser


# Generating 6 digits confirmation code
def generate_confirmation_code():
    return ''.join(str(random.randint(0, 9)) for _ in range(6))


# Send email via Brevo HTTP API (works on all platforms, no SMTP needed)
def send_brevo_email(to_email, subject, message):
    api_key = os.getenv('BREVO_API_KEY')
    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "sender": {"email": "ayindehassan776@gmail.com", "name": "CollabsUp"},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": message
        }
    )
    return response


# Create your views here.
class CreateUserViews(generics.CreateAPIView):
    serializer_class = CreateUser
    queryset = User.objects.all()
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
        code = generate_confirmation_code()
        ConfirmationCode.objects.create(user=user, code=code)

        # Send confirmation email via Brevo API
        send_brevo_email(
            to_email=user.email,
            subject="Email Confirmation",
            message=f"Your email confirmation code is {code}"
        )


# Confirming user email and activating user account
class ConfirmCode(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        code = request.data.get('code')

        # Get user
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get confirmation code
        try:
            confirmation_code = ConfirmationCode.objects.get(user=user)
        except ConfirmationCode.DoesNotExist:
            return Response({"error": "No confirmation code found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if already active
        if user.is_active:
            return Response({"error": "User is already active."}, status=status.HTTP_400_BAD_REQUEST)

        # Check code match
        if confirmation_code.code != code:
            return Response({"error": "Invalid confirmation code."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if expired
        if confirmation_code.is_expired():
            confirmation_code.delete()
            return Response({"error": "Confirmation code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Activate user
        user.is_active = True
        user.save()
        confirmation_code.delete()

        return Response({"message": "Account activated successfully"}, status=status.HTTP_200_OK)


# Edit user profile
class EditUser(generics.UpdateAPIView):
    serializer_class = UpdateUserSerializer
    permission_classes = [IsAdminUser, IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(team=user.team)


# Delete User profile
class DeleteUser(generics.DestroyAPIView):
    serializer_class = CreateUser
    permission_classes = [IsAdminUser, IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(team=user.team)


# List all users
class ListUsers(generics.ListAPIView):
    serializer_class = CreateUser
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(team=user.team)


# Forgot password VIEWS
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].strip().lower()
            username = serializer.validated_data['username']

            user = User.objects.filter(username=username, email__iexact=email).first()
            if not user:
                return Response({"non_field_errors": ["User with this username and email does not exist."]}, status=400)

            code = generate_confirmation_code()
            ConfirmationCode.objects.create(user=user, code=code)

            # Send reset email via Brevo API
            send_brevo_email(
                to_email=email,
                subject="Reset Your Password",
                message=f"Your password reset code is: {code}"
            )

            return Response({"message": "Password reset code sent.", "username": user.username, "email": user.email}, status=200)

        return Response(serializer.errors, status=400)


# Reset user password view
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['password']

            # Check if new password matches old password
            if user.check_password(new_password):
                return Response(
                    {"error": "You cannot reuse your previous password."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(new_password)
            user.save()

            # Delete used confirmation code(s)
            ConfirmationCode.objects.filter(user=user, code=serializer.validated_data['code']).delete()

            return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)

        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Get current user
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)