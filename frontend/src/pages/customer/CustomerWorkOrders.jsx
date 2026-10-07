import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Building2,
    MapPin,
    UserRound,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


const CustomerWorkOrders = () => {

    const { platformSettings } = useAuth();

    const platformTimezone =
        platformSettings?.platform?.timezone ||
        "Asia/Kolkata";

    const [workOrders, setWorkOrders] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");


    // =========================================================
    // FETCH WORK ORDERS
    // =========================================================

    const fetchWorkOrders = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                "/work-orders/my/"
            );

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setWorkOrders(data);

        } catch (err) {

            console.error(
                "Failed to fetch work orders:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Failed to load work orders."
            );

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // FETCH COMPANIES
    // =========================================================

    const fetchCompanies = async () => {

        try {

            const response = await api.get(
                "/customer/companies/"
            );

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setCompanies(data);

        } catch (err) {

            console.error(
                "Failed to fetch companies:",
                err
            );

        }

    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        fetchWorkOrders();
        fetchCompanies();

    }, []);


    // =========================================================
    // COMPANY NAME
    // =========================================================

    const getCompanyName = (workOrder) => {

        const serviceRequest =
            workOrder?.service_request_details;


        if (
            serviceRequest?.company_details?.name
        ) {
            return serviceRequest.company_details.name;
        }


        if (
            serviceRequest?.company &&
            typeof serviceRequest.company === "object" &&
            serviceRequest.company.name
        ) {
            return serviceRequest.company.name;
        }


        if (
            workOrder?.company &&
            typeof workOrder.company === "object" &&
            workOrder.company.name
        ) {
            return workOrder.company.name;
        }


        if (serviceRequest?.company_name) {
            return serviceRequest.company_name;
        }


        if (workOrder?.company_name) {
            return workOrder.company_name;
        }


        const companyId =
            serviceRequest?.company ||
            workOrder?.company;


        if (
            companyId &&
            typeof companyId !== "object"
        ) {

            const company =
                companies.find(
                    (item) =>
                        Number(item.id) ===
                        Number(companyId)
                );

            if (company?.name) {
                return company.name;
            }

        }


        return "Company not available";
    };


    // =========================================================
    // STATUS ICON
    // =========================================================

    const getStatusIcon = (status) => {

        const value =
            String(status || "").toUpperCase();


        if (
            value === "COMPLETED" ||
            value === "CLOSED"
        ) {
            return (
                <CheckCircle2
                    size={16}
                    className="text-emerald-500"
                />
            );
        }


        if (
            value === "CANCELLED" ||
            value === "REJECTED"
        ) {
            return (
                <XCircle
                    size={16}
                    className="text-red-500"
                />
            );
        }


        if (
            value === "IN_PROGRESS" ||
            value === "ASSIGNED"
        ) {
            return (
                <Clock
                    size={16}
                    className="text-blue-500"
                />
            );
        }


        return (
            <Clock
                size={16}
                className="text-amber-500"
            />
        );

    };


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (status) => {

        const value =
            String(status || "").toUpperCase();


        if (
            value === "COMPLETED" ||
            value === "CLOSED"
        ) {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }


        if (
            value === "CANCELLED" ||
            value === "REJECTED"
        ) {
            return "bg-red-50 text-red-700 border-red-200";
        }


        if (
            value === "IN_PROGRESS" ||
            value === "ASSIGNED"
        ) {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }


        return "bg-amber-50 text-amber-700 border-amber-200";

    };


    // =========================================================
    // WORKER NAME
    // =========================================================

    const getWorkerName = (workOrder) => {

        if (
            workOrder?.worker_details?.username
        ) {
            return workOrder.worker_details.username;
        }


        if (
            workOrder?.worker_details?.name
        ) {
            return workOrder.worker_details.name;
        }


        if (
            workOrder?.worker &&
            typeof workOrder.worker === "object"
        ) {

            return (
                workOrder.worker.username ||
                workOrder.worker.name ||
                "Worker"
            );

        }


        if (workOrder?.worker_name) {
            return workOrder.worker_name;
        }


        return "Not assigned";

    };


    // =========================================================
    // SEARCH
    // =========================================================

    const filteredWorkOrders = useMemo(() => {

        const value =
            search.trim().toLowerCase();


        if (!value) {
            return workOrders;
        }


        return workOrders.filter(
            (workOrder) => {

                const serviceRequest =
                    workOrder?.service_request_details ||
                    {};


                const companyName =
                    getCompanyName(workOrder);


                const workerName =
                    getWorkerName(workOrder);


                return (

                    String(
                        workOrder?.id || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        workOrder?.work_order_number || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        workOrder?.status || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        serviceRequest?.request_number || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        serviceRequest?.title || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        serviceRequest?.description || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(
                        serviceRequest?.address || ""
                    )
                        .toLowerCase()
                        .includes(value) ||


                    String(companyName)
                        .toLowerCase()
                        .includes(value) ||


                    String(workerName)
                        .toLowerCase()
                        .includes(value)

                );

            }
        );

    }, [
        workOrders,
        companies,
        search,
    ]);


    // =========================================================
    // DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }


        const parsedDate =
            new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: platformTimezone,
            }
        );

    };


    return (

        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
            ">

                <div>

                    <h1 className="
                        text-2xl
                        font-bold
                        text-slate-800
                    ">
                        My Work Orders
                    </h1>

                    <p className="
                        text-sm
                        text-slate-500
                        mt-1
                    ">
                        Track all your service work across companies
                    </p>

                </div>


                <button
                    type="button"
                    onClick={fetchWorkOrders}
                    disabled={loading}
                    className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        px-4
                        py-2.5
                        border
                        border-slate-200
                        bg-white
                        rounded-xl
                        text-sm
                        font-medium
                        text-slate-600
                        hover:bg-slate-50
                        disabled:opacity-50
                    "
                >

                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                SEARCH
            ================================================= */}

            <div className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                shadow-sm
                p-4
            ">

                <div className="relative">

                    <Search
                        size={18}
                        className="
                            absolute
                            left-3
                            top-1/2
                            -translate-y-1/2
                            text-slate-400
                        "
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search work orders, company, service, worker..."
                        className="
                            w-full
                            pl-10
                            pr-4
                            py-2.5
                            border
                            border-slate-200
                            rounded-xl
                            text-sm
                            text-slate-700
                            outline-none
                            focus:ring-2
                            focus:ring-slate-200
                        "
                    />

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                ">
                    {error}
                </div>

            )}


            {/* =================================================
                WORK ORDER LIST
            ================================================= */}

            {loading ? (

                <div className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-sm
                    py-16
                    flex
                    justify-center
                ">

                    <Loader2
                        size={28}
                        className="
                            animate-spin
                            text-slate-500
                        "
                    />

                </div>

            ) : filteredWorkOrders.length === 0 ? (

                <div className="
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    shadow-sm
                    py-16
                    text-center
                    px-5
                ">

                    <div className="
                        w-12
                        h-12
                        mx-auto
                        rounded-full
                        bg-slate-100
                        flex
                        items-center
                        justify-center
                    ">

                        <Clock
                            size={22}
                            className="text-slate-400"
                        />

                    </div>


                    <h3 className="
                        mt-4
                        text-sm
                        font-semibold
                        text-slate-700
                    ">
                        No work orders found
                    </h3>


                    <p className="
                        mt-1
                        text-xs
                        text-slate-500
                    ">
                        Your assigned service work orders will appear here.
                    </p>

                </div>

            ) : (

                <div className="space-y-4">

                    {filteredWorkOrders.map(
                        (workOrder) => {

                            const serviceRequest =
                                workOrder?.service_request_details ||
                                {};

                            const status =
                                String(
                                    workOrder?.status ||
                                    "PENDING"
                                ).toUpperCase();

                            const companyName =
                                getCompanyName(workOrder);

                            const workerName =
                                getWorkerName(workOrder);


                            return (

                                <div
                                    key={workOrder.id}
                                    className="
                                        bg-white
                                        border
                                        border-slate-200
                                        rounded-2xl
                                        shadow-sm
                                        p-5
                                        hover:shadow-md
                                        transition
                                    "
                                >

                                    {/* TOP */}

                                    <div className="
                                        flex
                                        flex-col
                                        sm:flex-row
                                        sm:items-start
                                        sm:justify-between
                                        gap-3
                                    ">

                                        <div>

                                            <div className="
                                                flex
                                                flex-wrap
                                                items-center
                                                gap-2
                                            ">

                                                <span className="
                                                    text-sm
                                                    font-semibold
                                                    text-slate-800
                                                ">
                                                    {workOrder.work_order_number ||
                                                        `Work Order #${workOrder.id}`}
                                                </span>


                                                {serviceRequest.request_number && (

                                                    <>

                                                        <span className="
                                                            text-xs
                                                            text-slate-400
                                                        ">
                                                            •
                                                        </span>

                                                        <span className="
                                                            text-xs
                                                            text-slate-500
                                                        ">
                                                            {serviceRequest.request_number}
                                                        </span>

                                                    </>

                                                )}

                                            </div>


                                            <h2 className="
                                                mt-2
                                                text-base
                                                font-semibold
                                                text-slate-800
                                            ">
                                                {serviceRequest.title ||
                                                    "Service Work Order"}
                                            </h2>

                                        </div>


                                        <span className={`
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            self-start
                                            px-3
                                            py-1.5
                                            rounded-full
                                            border
                                            text-xs
                                            font-medium
                                            ${getStatusClass(status)}
                                        `}>

                                            {getStatusIcon(status)}

                                            {status.replaceAll(
                                                "_",
                                                " "
                                            )}

                                        </span>

                                    </div>


                                    {/* DESCRIPTION */}

                                    {serviceRequest.description && (

                                        <p className="
                                            mt-3
                                            text-sm
                                            text-slate-500
                                            leading-6
                                        ">
                                            {serviceRequest.description}
                                        </p>

                                    )}


                                    {/* DETAILS */}

                                    <div className="
                                        mt-5
                                        grid
                                        grid-cols-1
                                        sm:grid-cols-2
                                        lg:grid-cols-4
                                        gap-4
                                    ">

                                        <div className="
                                            p-3
                                            rounded-xl
                                            bg-slate-50
                                            border
                                            border-slate-100
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-2
                                                text-xs
                                                text-slate-400
                                            ">

                                                <Building2
                                                    size={14}
                                                />

                                                Company

                                            </div>


                                            <p className="
                                                mt-1.5
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            ">
                                                {companyName}
                                            </p>

                                        </div>


                                        <div className="
                                            p-3
                                            rounded-xl
                                            bg-slate-50
                                            border
                                            border-slate-100
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-2
                                                text-xs
                                                text-slate-400
                                            ">

                                                <UserRound
                                                    size={14}
                                                />

                                                Worker

                                            </div>


                                            <p className="
                                                mt-1.5
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            ">
                                                {workerName}
                                            </p>

                                        </div>


                                        <div className="
                                            p-3
                                            rounded-xl
                                            bg-slate-50
                                            border
                                            border-slate-100
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-2
                                                text-xs
                                                text-slate-400
                                            ">

                                                <MapPin
                                                    size={14}
                                                />

                                                Address

                                            </div>


                                            <p className="
                                                mt-1.5
                                                text-sm
                                                font-medium
                                                text-slate-700
                                                truncate
                                            ">
                                                {serviceRequest.address ||
                                                    "Not provided"}
                                            </p>

                                        </div>


                                        <div className="
                                            p-3
                                            rounded-xl
                                            bg-slate-50
                                            border
                                            border-slate-100
                                        ">

                                            <div className="
                                                flex
                                                items-center
                                                gap-2
                                                text-xs
                                                text-slate-400
                                            ">

                                                <Clock
                                                    size={14}
                                                />

                                                Created

                                            </div>


                                            <p className="
                                                mt-1.5
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            ">
                                                {formatDate(
                                                    workOrder.created_at
                                                )}
                                            </p>

                                        </div>

                                    </div>


                                    {/* FOOTER */}

                                    <div className="
                                        mt-5
                                        pt-4
                                        border-t
                                        border-slate-100
                                        flex
                                        flex-col
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                        gap-3
                                    ">

                                        <p className="
                                            text-xs
                                            text-slate-400
                                        ">
                                            Service request handled through{" "}
                                            <span className="
                                                text-slate-500
                                                font-medium
                                            ">
                                                {companyName}
                                            </span>
                                        </p>


                                        <Link
                                            to={`/customer/work-orders/${workOrder.id}`}
                                            className="
                                                inline-flex
                                                items-center
                                                justify-center
                                                gap-2
                                                px-4
                                                py-2
                                                rounded-lg
                                                border
                                                border-slate-200
                                                text-xs
                                                font-medium
                                                text-slate-600
                                                hover:bg-slate-100
                                                transition
                                            "
                                        >

                                            <Eye size={15} />

                                            View Work Order

                                        </Link>

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>

            )}

        </div>

    );

};


export default CustomerWorkOrders;