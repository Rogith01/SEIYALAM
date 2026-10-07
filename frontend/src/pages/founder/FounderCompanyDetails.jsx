
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";


function FounderCompanyDetails() {

  const navigate = useNavigate();
  const { companyId } = useParams();


  // ============================================================
  // PLATFORM SETTINGS
  // ============================================================

  const [platformName, setPlatformName] =
    useState("SEIYALAM");


  // ============================================================
  // COMPANY
  // ============================================================

  const [company, setCompany] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ============================================================
  // ADMINS
  // ============================================================

  const [admins, setAdmins] =
    useState([]);

  const [adminsLoading, setAdminsLoading] =
    useState(true);

  const [showAdminForm, setShowAdminForm] =
    useState(false);


  const [adminData, setAdminData] = useState({
    username: "",
    password: "",
    phone: "",
    employee_id: "",
  });


  const [creatingAdmin, setCreatingAdmin] =
    useState(false);

  const [adminError, setAdminError] =
    useState("");

  const [adminSuccess, setAdminSuccess] =
    useState("");


  // ============================================================
  // COMPANY STATUS
  // ============================================================

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState("");


  // ============================================================
  // DELETE ADMIN
  // ============================================================

  const [deletingAdminId, setDeletingAdminId] =
    useState(null);

  const [deleteAdminError, setDeleteAdminError] =
    useState("");


  // ============================================================
  // COMPANY EDITING
  // ============================================================

  const [editingCompany, setEditingCompany] =
    useState(false);


  const [companyData, setCompanyData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });


  const [savingCompany, setSavingCompany] =
    useState(false);

  const [companyEditError, setCompanyEditError] =
    useState("");

  const [companyEditSuccess, setCompanyEditSuccess] =
    useState("");


  // ============================================================
  // LOAD PLATFORM SETTINGS
  // ============================================================

  const loadPlatformSettings = async () => {

    try {

      const response =
        await api.get(
          "/platform/settings/"
        );

      const name =
        response.data?.platform?.name;

      if (name) {
        setPlatformName(name);
      }

    } catch (err) {

      console.error(
        "Failed to load platform settings:",
        err
      );

    }

  };


  // ============================================================
  // LOAD COMPANY
  // ============================================================

  const loadCompany = async () => {

    try {

      setLoading(true);
      setError("");


      const token =
        localStorage.getItem(
          "founder_access_token"
        );


      if (!token) {

        navigate(
          "/founder/login"
        );

        return;

      }


      const response =
        await api.get(
          "/founder/companies/list/"
        );


      const companies =
        response.data.companies || [];


      const selectedCompany =
        companies.find(
          (item) =>
            String(item.id) ===
            String(companyId)
        );


      if (!selectedCompany) {

        setError(
          "Company not found."
        );

        return;

      }


      setCompany(
        selectedCompany
      );


      setCompanyData({
        name:
          selectedCompany.name || "",

        phone:
          selectedCompany.phone || "",

        email:
          selectedCompany.email || "",

        address:
          selectedCompany.address || "",
      });


    } catch (err) {

      console.error(err);


      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {

        localStorage.removeItem(
          "founder_access_token"
        );

        localStorage.removeItem(
          "founder_refresh_token"
        );

        navigate(
          "/founder/login"
        );

        return;

      }


      setError(
        "Unable to load company details."
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // LOAD ADMINS
  // ============================================================

  const loadAdmins = async () => {

    try {

      setAdminsLoading(true);


      const token =
        localStorage.getItem(
          "founder_access_token"
        );


      if (!token) {

        navigate(
          "/founder/login"
        );

        return;

      }


      const response =
        await api.get(
          `/founder/companies/${companyId}/admins/`
        );


      setAdmins(
        response.data.admins || []
      );


    } catch (err) {

      console.error(err);


      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {

        localStorage.removeItem(
          "founder_access_token"
        );

        localStorage.removeItem(
          "founder_refresh_token"
        );

        navigate(
          "/founder/login"
        );

        return;

      }


      setAdmins([]);


    } finally {

      setAdminsLoading(false);

    }

  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadPlatformSettings();

    loadCompany();

    loadAdmins();

  }, [companyId]);


  // ============================================================
  // COMPANY EDIT HANDLERS
  // ============================================================

  const handleCompanyChange = (
    event
  ) => {

    setCompanyData({
      ...companyData,
      [event.target.name]:
        event.target.value,
    });

  };


  const openCompanyEdit = () => {

    if (!company) {
      return;
    }


    setCompanyData({
      name:
        company.name || "",

      phone:
        company.phone || "",

      email:
        company.email || "",

      address:
        company.address || "",
    });


    setCompanyEditError("");
    setCompanyEditSuccess("");
    setEditingCompany(true);

  };


  const cancelCompanyEdit = () => {

    if (company) {

      setCompanyData({
        name:
          company.name || "",

        phone:
          company.phone || "",

        email:
          company.email || "",

        address:
          company.address || "",
      });

    }


    setCompanyEditError("");
    setCompanyEditSuccess("");
    setEditingCompany(false);

  };


  const handleSaveCompany = async (
    event
  ) => {

    event.preventDefault();


    setCompanyEditError("");
    setCompanyEditSuccess("");


    if (!companyData.name.trim()) {

      setCompanyEditError(
        "Company or branch name is required."
      );

      return;

    }


    try {

      setSavingCompany(true);


      const response =
        await api.patch(
          `/founder/companies/${companyId}/`,
          {
            name:
              companyData.name.trim(),

            phone:
              companyData.phone.trim(),

            email:
              companyData.email.trim(),

            address:
              companyData.address.trim(),
          }
        );


      const updatedCompany =
        response.data.company;


      if (updatedCompany) {

        setCompany(
          updatedCompany
        );


        setCompanyData({
          name:
            updatedCompany.name || "",

          phone:
            updatedCompany.phone || "",

          email:
            updatedCompany.email || "",

          address:
            updatedCompany.address || "",
        });

      } else {

        setCompany(
          (previousCompany) => ({
            ...previousCompany,

            name:
              companyData.name.trim(),

            phone:
              companyData.phone.trim(),

            email:
              companyData.email.trim(),

            address:
              companyData.address.trim(),
          })
        );

      }


      setCompanyEditSuccess(
        response.data.message ||
          "Company details updated successfully."
      );


      setEditingCompany(false);


    } catch (err) {

      console.error(err);


      const responseData =
        err.response?.data;


      const errors =
        responseData?.errors;


      if (
        errors &&
        typeof errors === "object"
      ) {

        setCompanyEditError(
          Object.values(errors)
            .flat()
            .join(" ")
        );

      } else {

        setCompanyEditError(
          responseData?.message ||
            responseData?.detail ||
            "Unable to update company details."
        );

      }


    } finally {

      setSavingCompany(false);

    }

  };


  // ============================================================
  // ADMIN HANDLERS
  // ============================================================

  const handleAdminChange = (
    event
  ) => {

    setAdminData({
      ...adminData,
      [event.target.name]:
        event.target.value,
    });

  };


  const handleCreateAdmin = async (
    event
  ) => {

    event.preventDefault();


    setAdminError("");
    setAdminSuccess("");


    if (
      company?.status !== "ACTIVE"
    ) {

      setAdminError(
        "Admin accounts can only be created for an active company."
      );

      return;

    }


    if (!adminData.username.trim()) {

      setAdminError(
        "Admin username is required."
      );

      return;

    }


    if (!adminData.password) {

      setAdminError(
        "Admin password is required."
      );

      return;

    }


    if (
      adminData.password.length < 8
    ) {

      setAdminError(
        "Admin password must contain at least 8 characters."
      );

      return;

    }


    try {

      setCreatingAdmin(true);


      const response =
        await api.post(
          `/founder/companies/${companyId}/admin/`,
          {
            username:
              adminData.username.trim(),

            password:
              adminData.password,

            phone:
              adminData.phone.trim(),

            employee_id:
              adminData.employee_id.trim(),
          }
        );


      setAdminSuccess(
        response.data.message ||
          "Branch Admin created successfully."
      );


      setAdminData({
        username: "",
        password: "",
        phone: "",
        employee_id: "",
      });


      await loadAdmins();


      setTimeout(() => {

        setShowAdminForm(false);

        setAdminSuccess("");

      }, 1500);


    } catch (err) {

      console.error(err);


      const responseData =
        err.response?.data;


      const errors =
        responseData?.errors;


      if (
        errors &&
        typeof errors === "object"
      ) {

        setAdminError(
          Object.values(errors)
            .flat()
            .join(" ")
        );

      } else {

        setAdminError(
          responseData?.message ||
            responseData?.detail ||
            "Unable to create Branch Admin."
        );

      }


    } finally {

      setCreatingAdmin(false);

    }

  };


  // ============================================================
  // COMPANY STATUS
  // ============================================================

  const handleCompanyStatusChange = async (
    newStatus
  ) => {

    if (!company) {
      return;
    }


    let confirmationMessage = "";


    if (
      newStatus === "SUSPENDED"
    ) {

      confirmationMessage =
        "Suspend this company? Admins and Workers will not be able to log in while the company is suspended.";

    }


    if (
      newStatus === "DEACTIVATED"
    ) {

      confirmationMessage =
        "Deactivate this company? This will prevent its Admins and Workers from logging in.";

    }


    if (
      newStatus === "ACTIVE"
    ) {

      confirmationMessage =
        "Reactivate this company?";

    }


    const confirmed =
      window.confirm(
        confirmationMessage
      );


    if (!confirmed) {
      return;
    }


    try {

      setChangingStatus(true);
      setStatusError("");


      const response =
        await api.patch(
          `/founder/companies/${companyId}/status/`,
          {
            status:
              newStatus,
          }
        );


      setCompany(
        (previousCompany) => ({
          ...previousCompany,

          status:
            response.data.company?.status ||
            newStatus,
        })
      );


      if (
        newStatus !== "ACTIVE"
      ) {

        setShowAdminForm(false);

        setAdminError("");
        setAdminSuccess("");

      }


    } catch (err) {

      console.error(err);


      const responseData =
        err.response?.data;


      setStatusError(
        responseData?.message ||
          responseData?.detail ||
          "Unable to change company status."
      );


    } finally {

      setChangingStatus(false);

    }

  };


  // ============================================================
  // DELETE ADMIN
  // ============================================================

  const handleDeleteAdmin = async (
    admin
  ) => {

    const confirmed =
      window.confirm(
        `Delete Admin "${admin.username}" permanently?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingAdminId(
        admin.id
      );

      setDeleteAdminError("");


      const response =
        await api.delete(
          `/founder/admins/${admin.id}/delete/`
        );


      setAdminSuccess(
        response.data.message ||
          "Admin deleted successfully."
      );


      await loadAdmins();


    } catch (err) {

      console.error(err);


      const responseData =
        err.response?.data;


      setDeleteAdminError(
        responseData?.message ||
          responseData?.detail ||
          "Unable to delete Admin."
      );


    } finally {

      setDeletingAdminId(null);

    }

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "founder_access_token"
    );

    localStorage.removeItem(
      "founder_refresh_token"
    );

    navigate(
      "/founder/login"
    );

  };


  // ============================================================
  // ADMIN FORM
  // ============================================================

  const openAdminForm = () => {

    if (
      company?.status !== "ACTIVE"
    ) {

      setAdminError(
        "You can create a Branch Admin only when the company is active."
      );

      return;

    }


    setShowAdminForm(true);

    setAdminError("");
    setAdminSuccess("");
    setDeleteAdminError("");

  };


  const closeAdminForm = () => {

    setShowAdminForm(false);

    setAdminError("");
    setAdminSuccess("");


    setAdminData({
      username: "",
      password: "",
      phone: "",
      employee_id: "",
    });

  };


  // ============================================================
  // STATUS UI
  // ============================================================

  const getStatusClasses = () => {

    if (
      company?.status === "ACTIVE"
    ) {

      return "bg-green-50 text-green-700 border border-green-200";

    }


    if (
      company?.status === "SUSPENDED"
    ) {

      return "bg-yellow-50 text-yellow-700 border border-yellow-200";

    }


    if (
      company?.status === "DEACTIVATED"
    ) {

      return "bg-red-50 text-red-700 border border-red-200";

    }


    return "bg-slate-50 text-slate-700 border border-slate-200";

  };


  const getStatusLabel = () => {

    if (
      company?.status === "ACTIVE"
    ) {

      return "Active";

    }


    if (
      company?.status === "SUSPENDED"
    ) {

      return "Suspended";

    }


    if (
      company?.status === "DEACTIVATED"
    ) {

      return "Deactivated";

    }


    return "Unknown";

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">

        <p className="text-slate-500">
          Loading company...
        </p>

      </div>
    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (
      <div className="min-h-screen bg-slate-100">

        <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6">

          <div>

            <h1 className="text-xl font-bold">
              {platformName}
            </h1>

            <p className="text-xs text-slate-400">
              Founder Portal
            </p>

          </div>


          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600"
          >
            Logout
          </button>

        </header>


        <main className="p-6">

          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center shadow-sm">

            <p className="text-red-500 mb-5">
              {error}
            </p>


            <button
              onClick={() =>
                navigate(
                  "/founder/companies"
                )
              }
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Back to Companies
            </button>

          </div>

        </main>

      </div>
    );

  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="min-h-screen bg-slate-100">


      {/* HEADER */}

      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6">

        <div>

          <h1 className="text-xl font-bold">
            {platformName}
          </h1>

          <p className="text-xs text-slate-400">
            Founder Portal
          </p>

        </div>


        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              navigate(
                "/founder/dashboard"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Dashboard
          </button>


          <button
            onClick={() =>
              navigate(
                "/founder/companies"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Companies
          </button>


          <button
            onClick={() =>
              navigate(
                "/founder/settings"
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Settings
          </button>


          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600"
          >
            Logout
          </button>

        </div>

      </header>


      <main className="max-w-6xl mx-auto p-6">


        <button
          onClick={() =>
            navigate(
              "/founder/companies"
            )
          }
          className="mb-5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Companies
        </button>


        {/* ======================================================
            COMPANY DETAILS
        ====================================================== */}

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

          {!editingCompany ? (

            <>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                <div>

                  <div className="flex flex-wrap items-center gap-3">

                    <h2 className="text-2xl font-bold text-slate-800">
                      {company?.name}
                    </h2>


                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses()}`}
                    >
                      {getStatusLabel()}
                    </span>

                  </div>


                  <p className="mt-2 text-sm text-slate-400">
                    Company ID: #{company?.id}
                  </p>

                </div>


                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={openCompanyEdit}
                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Edit Company
                  </button>


                  {company?.status ===
                    "ACTIVE" && (
                    <>

                      <button
                        onClick={() =>
                          handleCompanyStatusChange(
                            "SUSPENDED"
                          )
                        }
                        disabled={
                          changingStatus
                        }
                        className="rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
                      >
                        {changingStatus
                          ? "Updating..."
                          : "Suspend"}
                      </button>


                      <button
                        onClick={() =>
                          handleCompanyStatusChange(
                            "DEACTIVATED"
                          )
                        }
                        disabled={
                          changingStatus
                        }
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {changingStatus
                          ? "Updating..."
                          : "Deactivate"}
                      </button>

                    </>
                  )}


                  {company?.status ===
                    "SUSPENDED" && (
                    <>

                      <button
                        onClick={() =>
                          handleCompanyStatusChange(
                            "ACTIVE"
                          )
                        }
                        disabled={
                          changingStatus
                        }
                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {changingStatus
                          ? "Updating..."
                          : "Reactivate"}
                      </button>


                      <button
                        onClick={() =>
                          handleCompanyStatusChange(
                            "DEACTIVATED"
                          )
                        }
                        disabled={
                          changingStatus
                        }
                        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {changingStatus
                          ? "Updating..."
                          : "Deactivate"}
                      </button>

                    </>
                  )}


                  {company?.status ===
                    "DEACTIVATED" && (

                    <button
                      onClick={() =>
                        handleCompanyStatusChange(
                          "ACTIVE"
                        )
                      }
                      disabled={
                        changingStatus
                      }
                      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {changingStatus
                        ? "Updating..."
                        : "Reactivate"}
                    </button>

                  )}

                </div>

              </div>


              {companyEditSuccess && (

                <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  {companyEditSuccess}
                </div>

              )}


              {statusError && (

                <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {statusError}
                </div>

              )}


              {company?.status ===
                "SUSPENDED" && (

                <div className="mt-5 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">

                  <p className="text-sm font-medium text-yellow-800">
                    This company is currently suspended.
                  </p>

                  <p className="mt-1 text-xs text-yellow-700">
                    Admin and Worker login is blocked until the company is reactivated.
                  </p>

                </div>

              )}


              {company?.status ===
                "DEACTIVATED" && (

                <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">

                  <p className="text-sm font-medium text-red-800">
                    This company is deactivated.
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    Admin and Worker login is blocked for this company.
                  </p>

                </div>

              )}


              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <div>

                  <p className="text-xs text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {company?.phone ||
                      "Not provided"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 text-sm text-slate-700 break-all">
                    {company?.email ||
                      "Not provided"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-slate-400">
                    Address
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {company?.address ||
                      "Not provided"}
                  </p>

                </div>

              </div>

            </>

          ) : (

            <form
              onSubmit={
                handleSaveCompany
              }
            >

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    Edit Company
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the company or branch information.
                  </p>

                </div>


                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses()}`}
                >
                  {getStatusLabel()}
                </span>

              </div>


              {companyEditError && (

                <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {companyEditError}
                </div>

              )}


              <div className="mt-6 grid gap-5 md:grid-cols-2">

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company / Branch Name
                  </label>


                  <input
                    type="text"
                    name="name"
                    value={
                      companyData.name
                    }
                    onChange={
                      handleCompanyChange
                    }
                    placeholder="Enter company or branch name"
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>


                  <input
                    type="tel"
                    name="phone"
                    value={
                      companyData.phone
                    }
                    onChange={
                      handleCompanyChange
                    }
                    placeholder="Enter company phone"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>


                  <input
                    type="email"
                    name="email"
                    value={
                      companyData.email
                    }
                    onChange={
                      handleCompanyChange
                    }
                    placeholder="Enter company email"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>


                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>


                  <textarea
                    name="address"
                    value={
                      companyData.address
                    }
                    onChange={
                      handleCompanyChange
                    }
                    placeholder="Enter company address"
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none resize-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>

              </div>


              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    cancelCompanyEdit
                  }
                  disabled={
                    savingCompany
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    savingCompany
                  }
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCompany
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          )}

        </div>


        {/* ======================================================
            ADMIN CREATE FORM
        ====================================================== */}

        {showAdminForm && (

          <div className="mt-6 rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

            <div className="flex items-start justify-between mb-6">

              <div>

                <h3 className="text-lg font-semibold text-slate-800">
                  Create Branch Admin
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create an Admin account for this company.
                </p>

              </div>


              <button
                onClick={
                  closeAdminForm
                }
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>

            </div>


            {adminSuccess && (

              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {adminSuccess}
              </div>

            )}


            {adminError && (

              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {adminError}
              </div>

            )}


            <form
              onSubmit={
                handleCreateAdmin
              }
              className="grid gap-5 md:grid-cols-2"
            >

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Username
                </label>


                <input
                  type="text"
                  name="username"
                  value={
                    adminData.username
                  }
                  onChange={
                    handleAdminChange
                  }
                  placeholder="Enter Admin username"
                  autoComplete="username"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>


                <input
                  type="password"
                  name="password"
                  value={
                    adminData.password
                  }
                  onChange={
                    handleAdminChange
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>


                <input
                  type="tel"
                  name="phone"
                  value={
                    adminData.phone
                  }
                  onChange={
                    handleAdminChange
                  }
                  placeholder="Enter Admin phone"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Employee ID
                </label>


                <input
                  type="text"
                  name="employee_id"
                  value={
                    adminData.employee_id
                  }
                  onChange={
                    handleAdminChange
                  }
                  placeholder="Example: ADM001"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

              </div>


              <div className="md:col-span-2 flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeAdminForm
                  }
                  className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    creatingAdmin
                  }
                  className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingAdmin
                    ? "Creating..."
                    : "Create Admin"}
                </button>

              </div>

            </form>

          </div>

        )}


        {/* ======================================================
            BRANCH ADMINISTRATORS
        ====================================================== */}

        <div className="mt-6 rounded-xl bg-white border border-slate-200 p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-lg font-semibold text-slate-800">
                Branch Administrators
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Administrators who manage this company branch.
              </p>

            </div>


            {company?.status ===
              "ACTIVE" && (

              <button
                onClick={
                  openAdminForm
                }
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + Create Branch Admin
              </button>

            )}

          </div>


          {deleteAdminError && (

            <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {deleteAdminError}
            </div>

          )}


          {adminSuccess &&
            !showAdminForm && (

            <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {adminSuccess}
            </div>

          )}


          <div className="mt-6">

            {adminsLoading ? (

              <div className="py-8 text-center">

                <p className="text-sm text-slate-500">
                  Loading administrators...
                </p>

              </div>

            ) : admins.length === 0 ? (

              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">

                <div className="text-3xl">
                  👤
                </div>


                <p className="mt-3 text-sm font-medium text-slate-700">
                  No Branch Admins
                </p>


                <p className="mt-1 text-xs text-slate-400">
                  Create the first administrator for this company.
                </p>


                {company?.status ===
                  "ACTIVE" && (

                  <button
                    onClick={
                      openAdminForm
                    }
                    className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Create Branch Admin
                  </button>

                )}

              </div>

            ) : (

              <div className="grid gap-4 md:grid-cols-2">

                {admins.map(
                  (admin) => (

                    <div
                      key={admin.id}
                      className="rounded-lg border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h4 className="text-base font-semibold text-slate-800">
                            {admin.username}
                          </h4>


                          <p className="mt-1 text-xs text-slate-400">
                            Employee ID:{" "}
                            {admin.employee_id ||
                              "Not assigned"}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            admin.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {admin.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>


                      <div className="mt-4 space-y-2">

                        <p className="text-sm text-slate-600">

                          <span className="text-slate-400">
                            Phone:
                          </span>{" "}

                          {admin.phone ||
                            "Not provided"}

                        </p>


                        <p className="text-sm text-slate-600">

                          <span className="text-slate-400">
                            Role:
                          </span>{" "}

                          {admin.role}

                        </p>

                      </div>


                      <div className="mt-5 flex justify-end">

                        <button
                          onClick={() =>
                            handleDeleteAdmin(
                              admin
                            )
                          }
                          disabled={
                            deletingAdminId ===
                            admin.id
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingAdminId ===
                          admin.id
                            ? "Deleting..."
                            : "Delete Admin"}
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </main>

    </div>

  );

}


export default FounderCompanyDetails;
