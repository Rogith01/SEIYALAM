import { useEffect, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Building2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const CustomerServiceRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getArray = (value) => {
    if (Array.isArray(value)) return value;

    if (Array.isArray(value?.results)) {
      return value.results;
    }

    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [requestResponse, workOrdersResponse] =
        await Promise.all([
          api.get(`/service-requests/${id}/`),
          api.get("/work-orders/my/"),
        ]);

      setRequest(requestResponse.data);

      const allOrders = getArray(workOrdersResponse.data);

      const relatedOrders = allOrders.filter(
        (order) =>
          String(
            order.service_request_details?.id ||
              order.service_request?.id ||
              order.service_request ||
              ""
          ) === String(id)
      );

      setWorkOrders(relatedOrders);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load service request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw
          className="animate-spin text-blue-600"
          size={30}
        />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/customer/service-requests")}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Requests
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Service request not found."}
        </div>
      </div>
    );
  }

  const status = request.status || "PENDING";

  const assignedWorker =
    workOrders.length > 0
      ? workOrders[0].worker_details
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/customer/service-requests")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Requests
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {request.title ||
                request.subject ||
                `Service Request #${request.id}`}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Request ID: #{request.id}
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700">
            {status}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Request Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ClipboardList size={20} />
              </div>

              <h2 className="font-semibold text-slate-900">
                Request Details
              </h2>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {request.description || "No description provided."}
            </p>
          </div>

          {/* Work Orders */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">
                Work Orders
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Progress associated with this request.
              </p>
            </div>

            {workOrders.length === 0 ? (
              <div className="p-8 text-center">
                <Clock
                  className="mx-auto mb-3 text-slate-300"
                  size={35}
                />

                <p className="text-sm text-slate-500">
                  No work order has been assigned yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workOrders.map((order) => {
                  const worker = order.worker_details;

                  return (
                    <div key={order.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div>
                          <p className="font-medium text-slate-900">
                            {order.work_order_number ||
                              `Work Order #${order.id}`}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {order.service_request_details
                              ?.description ||
                              "Work order created for this request."}
                          </p>

                          {worker && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                              <User size={15} />

                              <span>
                                Worker:{" "}
                                <span className="font-medium text-slate-800">
                                  {worker.name ||
                                    worker.username}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="h-fit w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                            {order.status || "ASSIGNED"}
                          </span>

                          <button
                            onClick={() =>
                              navigate(
                                `/customer/work-orders/${order.id}`
                              )
                            }
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <ExternalLink size={14} />
                            View Work Order
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Request Information */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Request Information
            </h2>

            <div className="space-y-4">
              {/* Company / Branch */}
              <div className="flex gap-3">
                <Building2
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Company / Branch
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {request.company?.name ||
                      request.company_name ||
                      "Not available"}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="flex gap-3">
                <Clock
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Created
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {request.created_at
                      ? new Date(
                          request.created_at
                        ).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Address
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {request.address || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Assigned Worker */}
              <div className="flex gap-3">
                <User
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-xs text-slate-500">
                    Assigned Worker
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {assignedWorker?.name ||
                      assignedWorker?.username ||
                      "Not assigned yet"}
                  </p>

                  {assignedWorker?.employee_id && (
                    <p className="mt-1 text-xs text-slate-500">
                      Employee ID:{" "}
                      {assignedWorker.employee_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Completed */}
          {[
            "COMPLETED",
            "CUSTOMER_CONFIRMED",
            "CLOSED",
          ].includes(status) && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="text-green-600"
                  size={22}
                />

                <div>
                  <h3 className="font-semibold text-green-800">
                    Service Completed
                  </h3>

                  <p className="mt-1 text-sm text-green-700">
                    This service request has been completed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceRequestDetails;