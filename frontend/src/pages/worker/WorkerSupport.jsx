import React from "react";

import {
  Mail,
  Phone,
  Globe,
  HelpCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";


const WorkerSupport = () => {

  const {
    platformSettings,
  } = useAuth();


  const platformName =
    platformSettings?.platform?.name ||
    "SEIYALAM";


  const support =
    platformSettings?.support ||
    {};


  const supportEmail =
    support.email || "";


  const supportPhone =
    support.phone || "";


  const supportWebsite =
    support.website || "";


  return (

    <div className="min-h-full bg-slate-50 p-6">

      <div className="mx-auto max-w-5xl">


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

              <HelpCircle size={24} />

            </div>


            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Help & Support
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Get help with {platformName} and the platform services.
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            PLATFORM SUPPORT
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h2 className="text-lg font-semibold text-slate-900">
              Platform Support
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contact the {platformName} support team for assistance.
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-3">


            {/* ==================================================
                EMAIL
            ================================================== */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

                <Mail size={20} />

              </div>


              <p className="text-sm font-medium text-slate-500">
                Support Email
              </p>


              {supportEmail ? (

                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-2 block break-all text-sm font-semibold text-blue-600 hover:underline"
                >
                  {supportEmail}
                </a>

              ) : (

                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Not available
                </p>

              )}

            </div>


            {/* ==================================================
                PHONE
            ================================================== */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">

                <Phone size={20} />

              </div>


              <p className="text-sm font-medium text-slate-500">
                Support Phone
              </p>


              {supportPhone ? (

                <a
                  href={`tel:${supportPhone}`}
                  className="mt-2 block text-sm font-semibold text-green-600 hover:underline"
                >
                  {supportPhone}
                </a>

              ) : (

                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Not available
                </p>

              )}

            </div>


            {/* ==================================================
                WEBSITE
            ================================================== */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">

                <Globe size={20} />

              </div>


              <p className="text-sm font-medium text-slate-500">
                Support Website
              </p>


              {supportWebsite ? (

                <a
                  href={supportWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-sm font-semibold text-purple-600 hover:underline"
                >
                  {supportWebsite}
                </a>

              ) : (

                <p className="mt-2 text-sm font-semibold text-slate-400">
                  Not available
                </p>

              )}

            </div>


          </div>

        </div>


        {/* ==================================================
            INFORMATION
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <p className="text-sm leading-6 text-blue-800">

            These support details are managed by the{" "}

            {platformName}

            {" "}platform administrator. Worker users can use these
            details to contact the official platform support team.

          </p>

        </div>


      </div>

    </div>

  );

};


export default WorkerSupport;