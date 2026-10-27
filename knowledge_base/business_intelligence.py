from django.db.models import Count, Q

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

    return {
        "company_id": str(company_id),
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
    }