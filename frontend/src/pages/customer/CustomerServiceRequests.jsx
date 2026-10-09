import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Plus,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    MapPin,
    Building2,
    X,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


const CustomerServiceRequests = () => {

    const { platformSettings } = useAuth();

    const platformTimezone =
        platformSettings?.platform?.timezone ||
        "Asia/Kolkata";

    const [requests, setRequests] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [companiesLoading, setCompaniesLoading] = useState(true);

    const [error, setError] = useState("");
    const [companiesError, setCompaniesError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        company_id: "",
        title: "",
        description: "",
        phone: "",
        address: "",
        location_latitude: "",
        location_longitude: "",
    });


    // =========================================================
    // FETCH REQUESTS
    // =========================================================

    const fetchRequests = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                "/service-requests/my/"
            );

            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.results || [];

            setRequests(data);

        } catch (err) {

            console.error(
                "Failed to fetch service requests:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Failed to load service requests."
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

            setCompaniesLoading(true);
            setCompaniesError("");

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

            setCompaniesError(
                err?.response?.data?.detail ||
                "Failed to load available companies."
            );

        } finally {

            setCompaniesLoading(false);

        }
    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        fetchRequests();
        fetchCompanies();

    }, []);


    // =========================================================
    // COMPANY NAME
    // =========================================================

    const getCompanyName = (request) => {

        if (request?.company_details?.name) {
            return request.company_details.name;
        }

        if (
            request?.company &&
            typeof request.company === "object" &&
            request.company.name
        ) {
            return request.company.name;
        }

        if (request?.company_name) {
            return request.company_name;
        }

        const companyId =
            request?.company_id ||
            (
                request?.company &&
                typeof request.company !== "object"
                    ? request.company
                    : null
            );

        if (companyId) {

            const company = companies.find(
                (item) =>
                    Number(item.id) === Number(companyId)
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
    // STATUS STYLE
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
    // FILTER
    // =========================================================

    const filteredRequests = useMemo(() => {

        const searchValue =
            search.trim().toLowerCase();

        return requests.filter((request) => {

            const companyName =
                getCompanyName(request);

            const matchesSearch =
                !searchValue ||
                String(
                    request?.request_number || ""
                )
                    .toLowerCase()
                    .includes(searchValue) ||
                String(
                    request?.title || ""
                )
                    .toLowerCase()
                    .includes(searchValue) ||
                String(
                    request?.description || ""
                )
                    .toLowerCase()
                    .includes(searchValue) ||
                String(companyName)
                    .toLowerCase()
                    .includes(searchValue) ||
                String(
                    request?.address || ""
                )
                    .toLowerCase()
                    .includes(searchValue);

            const requestStatus =
                String(
                    request?.status || ""
                ).toUpperCase();

            const matchesStatus =
                statusFilter === "ALL" ||
                requestStatus === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );

        });

    }, [
        requests,
        companies,
        search,
        statusFilter,
    ]);


    // =========================================================
    // FORM CHANGE
    // =========================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =========================================================
    // GET LOCATION
    // =========================================================

    const handleGetLocation = () => {

        if (!navigator.geolocation) {

            alert(
                "Geolocation is not supported by this browser."
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {

                setFormData((previous) => ({
                    ...previous,
                    location_latitude:
                        position.coords.latitude,
                    location_longitude:
                        position.coords.longitude,
                }));

            },
            (error) => {

                console.error(
                    "Location error:",
                    error
                );

                alert(
                    "Unable to get your current location."
                );

            }
        );

    };


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (!formData.company_id) {

            alert(
                "Please select a service company."
            );

            return;
        }

        if (!formData.title.trim()) {

            alert(
                "Please enter service title."
            );

            return;
        }

        if (!formData.description.trim()) {

            alert(
                "Please enter service description."
            );

            return;
        }

        try {

            setSubmitting(true);

            await api.post(
                "/service-requests/",
                {
                    company_id:
                        Number(formData.company_id),

                    title:
                        formData.title.trim(),

                    description:
                        formData.description.trim(),

                    phone:
                        formData.phone.trim(),

                    address:
                        formData.address.trim(),


location_latitude:
    formData.location_latitude !== ""
        && formData.location_latitude !== null
        ? Number(Number(formData.location_latitude).toFixed(6))
        : null,

location_longitude:
    formData.location_longitude !== ""
        && formData.location_longitude !== null
        ? Number(Number(formData.location_longitude).toFixed(6))
        : null,
                }
            );

            setFormData({
                company_id: "",
                title: "",
                description: "",
                phone: "",
                address: "",
                location_latitude: "",
                location_longitude: "",
            });

            setShowModal(false);

            await fetchRequests();
        } catch (err) {
            console.error(
                "Failed to create service request:",
                err?.response?.status,
                err?.response?.data || err
            );

            const data = err?.response?.data;

            const message = data
                ? typeof data === "string"
                    ? data
                    : data.error ||
                    data.detail ||
                    data.company_id ||
                    data.title ||
                    data.description ||
                    JSON.stringify(data)
                : err?.message || "Network error. Please try again.";

            alert(`Failed to create request: ${message}`);
        } finally {
            setSubmitting(false);
        }
    };


    // =========================================================
    // DATE
    // =========================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate =
            new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                    <h1 className="text-2xl font-bold text-slate-800">
                        My Service Requests
                    </h1>

                    <p className="text-sm text-slate-500 mt-1">
                        Track and manage all your service requests
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        px-4
                        py-2.5
                        bg-slate-800
                        hover:bg-slate-900
                        text-white
                        text-sm
                        font-medium
                        rounded-xl
                        transition
                    "
                >

                    <Plus size={17} />

                    New Service

                </button>

            </div>


            {/* =================================================
                FILTER CARD
            ================================================= */}

            <div className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                shadow-sm
                p-4
            ">

                <div className="
                    flex
                    flex-col
                    lg:flex-row
                    gap-3
                ">

                    <div className="relative flex-1">

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
                            placeholder="Search requests, company, service..."
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


                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        className="
                            px-4
                            py-2.5
                            border
                            border-slate-200
                            rounded-xl
                            text-sm
                            text-slate-700
                            bg-white
                            outline-none
                        "
                    >

                        <option value="ALL">
                            All Status
                        </option>

                        <option value="PENDING">
                            Pending
                        </option>

                        <option value="ASSIGNED">
                            Assigned
                        </option>

                        <option value="IN_PROGRESS">
                            In Progress
                        </option>

                        <option value="COMPLETED">
                            Completed
                        </option>

                        <option value="CLOSED">
                            Closed
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>

                    </select>


                    <button
                        type="button"
                        onClick={fetchRequests}
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
                REQUEST LIST
            ================================================= */}

            <div className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                shadow-sm
                overflow-hidden
            ">

                <div className="
                    px-5
                    py-4
                    border-b
                    border-slate-200
                    flex
                    items-center
                    justify-between
                ">

                    <div>

                        <h2 className="
                            text-base
                            font-semibold
                            text-slate-800
                        ">
                            Service Requests
                        </h2>

                        <p className="
                            text-xs
                            text-slate-500
                            mt-1
                        ">
                            {filteredRequests.length} request
                            {filteredRequests.length !== 1
                                ? "s"
                                : ""}
                        </p>

                    </div>

                </div>


                {loading ? (

                    <div className="
                        py-16
                        flex
                        items-center
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

                ) : filteredRequests.length === 0 ? (

                    <div className="
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
                            No service requests found
                        </h3>

                        <p className="
                            mt-1
                            text-xs
                            text-slate-500
                        ">
                            Create a new service request to get started.
                        </p>

                    </div>

                ) : (

                    <div className="divide-y divide-slate-100">

                        {filteredRequests.map(
                            (request) => {

                                const status =
                                    String(
                                        request?.status ||
                                        "PENDING"
                                    ).toUpperCase();

                                const companyName =
                                    getCompanyName(request);

                                return (

                                    <div
                                        key={request.id}
                                        className="
                                            p-5
                                            hover:bg-slate-50
                                            transition
                                        "
                                    >

                                        <div className="
                                            flex
                                            flex-col
                                            lg:flex-row
                                            lg:items-center
                                            lg:justify-between
                                            gap-4
                                        ">

                                            <div className="
                                                flex-1
                                                min-w-0
                                            ">

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
                                                        {request.request_number ||
                                                            `Request #${request.id}`}
                                                    </span>

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
                                                        {formatDate(
                                                            request.created_at
                                                        )}
                                                    </span>

                                                </div>


                                                <h3 className="
                                                    mt-2
                                                    text-sm
                                                    font-semibold
                                                    text-slate-700
                                                ">
                                                    {request.title ||
                                                        "Service Request"}
                                                </h3>


                                                <p className="
                                                    mt-1
                                                    text-sm
                                                    text-slate-500
                                                    line-clamp-2
                                                ">
                                                    {request.description ||
                                                        "No description provided."}
                                                </p>


                                                <div className="
                                                    mt-3
                                                    flex
                                                    flex-wrap
                                                    gap-4
                                                    text-xs
                                                    text-slate-500
                                                ">

                                                    <span className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                    ">

                                                        <Building2
                                                            size={14}
                                                        />

                                                        {companyName}

                                                    </span>


                                                    {request.address && (

                                                        <span className="
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                        ">

                                                            <MapPin
                                                                size={14}
                                                            />

                                                            <span className="max-w-xs truncate">
                                                                {request.address}
                                                            </span>

                                                        </span>

                                                    )}

                                                </div>

                                            </div>


                                            <div className="
                                                flex
                                                items-center
                                                gap-3
                                                shrink-0
                                            ">

                                                <span className={`
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    px-3
                                                    py-1.5
                                                    rounded-full
                                                    border
                                                    text-xs
                                                    font-medium
                                                    ${getStatusClass(
                                                        status
                                                    )}
                                                `}>

                                                    {getStatusIcon(status)}

                                                    {status
                                                        .replaceAll(
                                                            "_",
                                                            " "
                                                        )}

                                                </span>


                                                <Link
                                                    to={`/customer/service-requests/${request.id}`}
                                                    className="
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        px-3
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

                                                    View

                                                </Link>

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* =================================================
                NEW SERVICE MODAL
            ================================================= */}

            {showModal && (

                <div className="
                    fixed
                    inset-0
                    z-50
                    bg-black/40
                    flex
                    items-center
                    justify-center
                    p-4
                ">

                    <div className="
                        w-full
                        max-w-2xl
                        max-h-[90vh]
                        overflow-y-auto
                        bg-white
                        rounded-2xl
                        shadow-2xl
                    ">

                        <div className="
                            px-5
                            py-4
                            border-b
                            border-slate-200
                            flex
                            items-center
                            justify-between
                        ">

                            <div>

                                <h2 className="
                                    text-lg
                                    font-semibold
                                    text-slate-800
                                ">
                                    New Service Request
                                </h2>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Select a company and submit your service details
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    flex
                                    items-center
                                    justify-center
                                    text-slate-400
                                    hover:bg-slate-100
                                    hover:text-slate-600
                                "
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="p-5 space-y-5"
                        >

                            {/* COMPANY */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Service Company
                                </label>

                                <select
                                    name="company_id"
                                    value={formData.company_id}
                                    onChange={handleChange}
                                    disabled={companiesLoading}
                                    className="
                                        w-full
                                        px-3
                                        py-2.5
                                        border
                                        border-slate-200
                                        rounded-xl
                                        text-sm
                                        text-slate-700
                                        bg-white
                                        outline-none
                                        focus:ring-2
                                        focus:ring-slate-200
                                    "
                                >

                                    <option value="">
                                        {companiesLoading
                                            ? "Loading companies..."
                                            : "Select a company"}
                                    </option>

                                    {companies.map(
                                        (company) => (

                                            <option
                                                key={company.id}
                                                value={company.id}
                                            >
                                                {company.name}
                                            </option>

                                        )
                                    )}

                                </select>

                                {companiesError && (

                                    <p className="
                                        mt-2
                                        text-xs
                                        text-red-600
                                    ">
                                        {companiesError}
                                    </p>

                                )}

                            </div>


                            {/* TITLE */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Service Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Example: AC Repair"
                                    className="
                                        w-full
                                        px-3
                                        py-2.5
                                        border
                                        border-slate-200
                                        rounded-xl
                                        text-sm
                                        outline-none
                                        focus:ring-2
                                        focus:ring-slate-200
                                    "
                                />

                            </div>


                            {/* DESCRIPTION */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe the service you need..."
                                    className="
                                        w-full
                                        px-3
                                        py-2.5
                                        border
                                        border-slate-200
                                        rounded-xl
                                        text-sm
                                        outline-none
                                        resize-none
                                        focus:ring-2
                                        focus:ring-slate-200
                                    "
                                />

                            </div>


                            {/* PHONE */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Your contact number"
                                    className="
                                        w-full
                                        px-3
                                        py-2.5
                                        border
                                        border-slate-200
                                        rounded-xl
                                        text-sm
                                        outline-none
                                        focus:ring-2
                                        focus:ring-slate-200
                                    "
                                />

                            </div>


                            {/* ADDRESS */}

                            <div>

                                <label className="
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    mb-2
                                ">
                                    Service Address
                                </label>

                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Enter service address"
                                    className="
                                        w-full
                                        px-3
                                        py-2.5
                                        border
                                        border-slate-200
                                        rounded-xl
                                        text-sm
                                        outline-none
                                        resize-none
                                        focus:ring-2
                                        focus:ring-slate-200
                                    "
                                />

                            </div>


                            {/* LOCATION */}

                            <div className="
                                p-4
                                bg-slate-50
                                border
                                border-slate-200
                                rounded-xl
                            ">

                                <div className="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    gap-3
                                ">

                                    <div>

                                        <p className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        ">
                                            Current Location
                                        </p>

                                        <p className="
                                            text-xs
                                            text-slate-500
                                            mt-1
                                        ">
                                            Add GPS coordinates for the service
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            handleGetLocation
                                        }
                                        className="
                                            inline-flex
                                            items-center
                                            justify-center
                                            gap-2
                                            px-3
                                            py-2
                                            rounded-lg
                                            bg-white
                                            border
                                            border-slate-200
                                            text-xs
                                            font-medium
                                            text-slate-600
                                            hover:bg-slate-100
                                        "
                                    >

                                        <MapPin size={15} />

                                        Get Location

                                    </button>

                                </div>


                                {formData.location_latitude &&
                                    formData.location_longitude && (

                                        <p className="
                                            mt-3
                                            text-xs
                                            text-emerald-600
                                        ">
                                            Location captured successfully.
                                        </p>

                                    )}

                            </div>


                            {/* BUTTONS */}

                            <div className="
                                flex
                                justify-end
                                gap-3
                                pt-2
                            ">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                    className="
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        text-sm
                                        font-medium
                                        text-slate-600
                                        hover:bg-slate-50
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-5
                                        py-2.5
                                        rounded-xl
                                        bg-slate-800
                                        hover:bg-slate-900
                                        text-white
                                        text-sm
                                        font-medium
                                        disabled:opacity-50
                                    "
                                >

                                    {submitting && (

                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />

                                    )}

                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Request"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

};


export default CustomerServiceRequests;