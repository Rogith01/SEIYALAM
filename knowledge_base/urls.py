from django.urls import path

from .chat_views import (
    KnowledgeChatView,
    WorkerKnowledgeChatView,
    CustomerKnowledgeChatView,
)
from .views import (
    CompanyDocumentListCreateView,
    CompanyDocumentSearchView,
    KnowledgeRetrieveView,
)

urlpatterns = [
    path(
        "documents/",
        CompanyDocumentListCreateView.as_view(),
        name="knowledge-document-list-create",
    ),
    path(
        "search/",
        CompanyDocumentSearchView.as_view(),
        name="knowledge-document-search",
    ),
    path(
        "retrieve/",
        KnowledgeRetrieveView.as_view(),
        name="knowledge-retrieve",
    ),
    path(
        "chat/",
        KnowledgeChatView.as_view(),
        name="knowledge-chat",
    ),
    path(
        "customer-chat/",
        CustomerKnowledgeChatView.as_view(),
        name="customer-knowledge-chat",
    ),
    path(
        "worker-chat/",
        WorkerKnowledgeChatView.as_view(),
        name="worker-knowledge-chat",
    ),
]