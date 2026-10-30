from django.contrib.auth import get_user_model
from django.test import TestCase

from accounts.models import Skill
from companies.models import Company
from service_requests.models import ServiceRequest
from work_orders.models import WorkOrder
from knowledge_base.business_intelligence import (
    get_business_statistics,
)

User = get_user_model()


class BusinessIntelligenceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.company_a = Company.objects.create(
            name="BI Test Company A",
            phone="9200000001",
        )
        cls.company_b = Company.objects.create(
            name="BI Test Company B",
            phone="9200000002",
        )

        cls.admin = User.objects.create_user(
            username="bi_test_admin",
            password="TestPassword-BI!",
            role="ADMIN",
            company=cls.company_a,
        )

        cls.worker_a = User.objects.create_user(
            username="bi_test_worker_a",
            password="TestPassword-BI!",
            role="WORKER",
            company=cls.company_a,
            name="Worker A",
        )
        cls.worker_b = User.objects.create_user(
            username="bi_test_worker_b",
            password="TestPassword-BI!",
            role="WORKER",
            company=cls.company_a,
            name="Worker B",
        )

        cls.customer = User.objects.create_user(
            username="bi_test_customer",
            password="TestPassword-BI!",
            role="CUSTOMER",
            company=cls.company_a,
        )

        cls.request_a = ServiceRequest.objects.create(
            request_number="BI-SR-0001",
            company=cls.company_a,
            customer=cls.customer,
            title="Repair A",
            description="Test repair A",
            address="Test address A",
            status=ServiceRequest.Status.NEW,
        )
        cls.request_b = ServiceRequest.objects.create(
            request_number="BI-SR-0002",
            company=cls.company_a,
            customer=cls.customer,
            title="Repair B",
            description="Test repair B",
            address="Test address B",
            status=ServiceRequest.Status.IN_PROGRESS,
        )

        cls.work_a = WorkOrder.objects.create(
            work_order_number="BI-WO-0001",
            company=cls.company_a,
            service_request=cls.request_a,
            worker=cls.worker_a,
            status=WorkOrder.Status.ASSIGNED,
        )
        cls.work_b = WorkOrder.objects.create(
            work_order_number="BI-WO-0002",
            company=cls.company_a,
            service_request=cls.request_b,
            worker=cls.worker_a,
            status=WorkOrder.Status.COMPLETED,
        )

        # A separate company's data must never appear in Company A's BI.
        cls.customer_b = User.objects.create_user(
            username="bi_test_customer_b",
            password="TestPassword-BI!",
            role="CUSTOMER",
            company=cls.company_b,
        )
        cls.request_c = ServiceRequest.objects.create(
            request_number="BI-SR-0003",
            company=cls.company_b,
            customer=cls.customer_b,
            title="Other Company Repair",
            description="Company B repair",
            address="Other company address",
            status=ServiceRequest.Status.NEW,
        )
        cls.work_c = WorkOrder.objects.create(
            work_order_number="BI-WO-0003",
            company=cls.company_b,
            service_request=cls.request_c,
            worker=None,
            status=WorkOrder.Status.ASSIGNED,
        )

    def test_statistics_include_only_selected_company(self):
        stats = get_business_statistics(self.company_a.id)

        self.assertEqual(stats["company_id"], str(self.company_a.id))
        self.assertEqual(stats["work_orders"]["total"], 2)
        self.assertEqual(stats["service_requests"]["total"], 2)

    def test_work_order_status_counts_are_correct(self):
        stats = get_business_statistics(self.company_a.id)

        self.assertEqual(
            stats["work_orders"]["by_status"]["ASSIGNED"],
            1,
        )
        self.assertEqual(
            stats["work_orders"]["by_status"]["COMPLETED"],
            1,
        )

    def test_active_completed_and_unassigned_counts(self):
        stats = get_business_statistics(self.company_a.id)
        work_orders = stats["work_orders"]

        self.assertEqual(work_orders["active"], 1)
        self.assertEqual(work_orders["completed"], 1)
        self.assertEqual(work_orders["unassigned"], 0)

    def test_service_request_status_counts_are_correct(self):
        stats = get_business_statistics(self.company_a.id)

        self.assertEqual(
            stats["service_requests"]["by_status"]["NEW"],
            1,
        )
        self.assertEqual(
            stats["service_requests"]["by_status"]["IN_PROGRESS"],
            1,
        )

    def test_worker_workload_counts_are_correct(self):
        stats = get_business_statistics(self.company_a.id)

        workloads = {
            item["worker__username"]: item
            for item in stats["worker_workloads"]
        }

        worker_a = workloads["bi_test_worker_a"]

        self.assertEqual(worker_a["total_work_orders"], 2)
        self.assertEqual(worker_a["active_work_orders"], 1)
        self.assertEqual(worker_a["completed_work_orders"], 1)

    def test_worker_without_orders_is_not_in_workload_list(self):
        stats = get_business_statistics(self.company_a.id)

        usernames = {
            item["worker__username"]
            for item in stats["worker_workloads"]
        }

        self.assertNotIn("bi_test_worker_b", usernames)

    def test_missing_company_id_is_rejected(self):
        with self.assertRaises(ValueError):
            get_business_statistics(None)