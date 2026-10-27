from django.db.models import Count, Q
from django.utils import timezone

from companies.models import Company
from service_requests.models import ServiceRequest
from work_orders.models import WorkOrder


def get_business_statistics(company_id):
    """
    Return live, read-only business statistics for one company.

    Authorization must be performed by the calling view.
    Never accept a company ID supplied by the AI as an authority.
    """
    if not company_id:
        raise ValueError("A valid company_id is required.")

    company = Company.objects.filter(pk=company_id).first()
    work_orders = WorkOrder.objects.filter(company_id=company_id)
    service_requests = ServiceRequest.objects.filter(
        company_id=company_id
    )

    completed_statuses = [
        WorkOrder.Status.COMPLETED,
        WorkOrder.Status.CUSTOMER_CONFIRMED,
        WorkOrder.Status.CLOSED,
    ]

    work_order_statuses = {
        str(row["status"]): row["count"]
        for row in work_orders.values("status").annotate(
            count=Count("id")
        )
    }

    request_statuses = {
        str(row["status"]): row["count"]
        for row in service_requests.values("status").annotate(
            count=Count("id")
        )
    }

    worker_workloads = list(
        work_orders.filter(worker__isnull=False)
        .values(
            "worker_id",
            "worker__name",
            "worker__username",
        )
        .annotate(
            total_work_orders=Count("id"),
            active_work_orders=Count(
                "id",
                filter=~Q(status__in=completed_statuses),
            ),
            completed_work_orders=Count(
                "id",
                filter=Q(status__in=completed_statuses),
            ),
        )
        .order_by(
            "-active_work_orders",
            "-total_work_orders",
        )[:10]
    )

    for worker in worker_workloads:
        worker["worker_id"] = str(worker["worker_id"])

    # Include readable company identity in the live context so the assistant
    # can answer company-name and company-contact questions accurately.
    company_info = None
    if company:
        company_info = {
            "id": str(company.pk),
            "name": company.name,
            "phone": getattr(company, "phone", "") or "",
            "email": getattr(company, "email", "") or "",
            "address": getattr(company, "address", "") or "",
            "status": getattr(company, "status", "") or "",
        }

    # Aggregate customer request volume for useful customer-insight questions.
    customer_request_counts = list(
        service_requests.filter(customer__isnull=False)
        .values("customer_id", "customer__name", "customer__username")
        .annotate(service_request_count=Count("id"))
        .order_by("-service_request_count", "customer__username")[:10]
    )
    for customer in customer_request_counts:
        customer["customer_id"] = str(customer["customer_id"])

    # Include a compact list of customer identities for follow-up questions.
    customer_records = list(
        service_requests.filter(customer__isnull=False)
        .values(
            "customer_id", "customer__name", "customer__username",
            "customer__email", "customer__phone",
        )
        .distinct()
        .order_by("customer__username")[:50]
    )
    for customer in customer_records:
        customer["customer_id"] = str(customer["customer_id"])

    # Only calculate overdue items when this project's model has a recognized
    # due/deadline date field. Never guess or substitute created_at.
    overdue_work_orders = {"supported": False, "count": None, "due_field": None}
    candidate_due_fields = (
        "due_date", "deadline", "expected_completion_date",
        "scheduled_end", "target_date",
    )
    model_fields = {field.name: field for field in WorkOrder._meta.get_fields()}
    due_field_name = next(
        (name for name in candidate_due_fields
         if name in model_fields and getattr(model_fields[name], "get_internal_type", lambda: "")() in ("DateField", "DateTimeField")),
        None,
    )
    if due_field_name:
        overdue_query = work_orders.filter(**{f"{due_field_name}__lt": timezone.now().date()})
        overdue_query = overdue_query.exclude(status__in=completed_statuses)
        overdue_work_orders = {
            "supported": True,
            "count": overdue_query.count(),
            "due_field": due_field_name,
        }

    # Count requests by linked customer. This is the data the chatbot needs
    # to answer customer-name and request-volume questions deterministically.
    customer_request_counts = list(
        service_requests.filter(customer__isnull=False)
        .values("customer_id", "customer__name", "customer__username")
        .annotate(service_request_count=Count("id"))
        .order_by("-service_request_count", "customer__name", "customer__username")[:100]
    )
    for customer in customer_request_counts:
        customer["customer_id"] = str(customer["customer_id"])

    # Include contact details only for customers who have requests for this
    # company; never expose unrelated customers from other companies.
    customer_records = list(
        service_requests.filter(customer__isnull=False)
        .values(
            "customer_id", "customer__name", "customer__username",
            "customer__email", "customer__phone",
        )
        .distinct()
        .order_by("customer__name", "customer__username")[:100]
    )
    for customer in customer_records:
        customer["customer_id"] = str(customer["customer_id"])

    unlinked_customer_request_count = service_requests.filter(customer__isnull=True).count()

    return {
        "company_id": str(company_id),
        "company": company_info,
        "work_orders": {
            "total": work_orders.count(),
            "by_status": work_order_statuses,
            "unassigned": work_orders.filter(
                worker__isnull=True
            ).count(),
            "active": work_orders.exclude(
                status__in=completed_statuses
            ).count(),
            "completed": work_orders.filter(
                status__in=completed_statuses
            ).count(),
        },
        "service_requests": {
            "total": service_requests.count(),
            "by_status": request_statuses,
        },
        "worker_workloads": worker_workloads,
        "customer_request_counts": customer_request_counts,
        "customers_with_requests": customer_records,
        "customers_with_requests_count": len(customer_records),
        "service_requests_without_customer": unlinked_customer_request_count,
        "overdue_work_orders": overdue_work_orders,
    }