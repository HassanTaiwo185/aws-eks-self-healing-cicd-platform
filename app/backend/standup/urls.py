from django.urls import path
from .views import CreateStandUp, EditStandUp,DeleteStandUp,ListStandUp, StandUpDetail


urlpatterns = [
    path("create/", CreateStandUp.as_view(), name="create-standup"),
    path("edit/<uuid:pk>/", EditStandUp.as_view(), name="edit-standup"),
    path("delete/<uuid:pk>/", DeleteStandUp.as_view(), name="delete-standup"),
    path("list/", ListStandUp.as_view(), name="list-standup"),
    path("detail/<uuid:pk>/", StandUpDetail.as_view(), name="standup-detail"),
]
