import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../authApi";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerValidationSchema = z.discriminatedUnion("customerType", [
  z.object({
    customerType: z.literal("PERSON"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50),
    password: z
      .string()
      .refine(
        (val) => strongPasswordRegex.test(val),
        "Password must be at least 8 characters, containing uppercase, lowercase, numbers, and a special character (@$!%*?&)",
      ),
    firstName: z.string().min(1, "First name is required").max(100),
    middleName: z.string().max(100).optional(),
    lastName: z.string().min(1, "Last name is required").max(100),
    phone: z.string().max(20).optional(),
    email: z.string().email("Invalid email address").or(z.literal("")),
    address: z.string().max(255).optional(),
  }),
  z.object({
    customerType: z.literal("ORGANIZATION"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50),
    password: z
      .string()
      .refine(
        (val) => strongPasswordRegex.test(val),
        "Password must be at least 8 characters, containing uppercase, lowercase, numbers, and a special character (@$!%*?&)",
      ),
    name: z.string().min(1, "Organization name is required").max(255),
    registrationNumber: z.string().max(100).optional(),
    taxNumber: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email("Invalid email address").or(z.literal("")),
    address: z.string().max(255).optional(),
    contactFirstName: z
      .string()
      .min(1, "Primary contact first name is required")
      .max(100),
    contactMiddleName: z.string().max(100).optional(),
    contactLastName: z
      .string()
      .min(1, "Primary contact last name is required")
      .max(100),
    contactEmail: z.string().email("Invalid contact email").or(z.literal("")),
    contactPhone: z.string().max(20).optional(),
    contactPosition: z.string().max(100).optional(),
    contactAddress: z.string().max(255).optional(),
  }),
]);

export default function Register() {
  const navigate = useNavigate();
  const [customerType, setCustomerType] = useState("PERSON");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: {
      customerType: "PERSON",
    },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    },
    onError: (err) => {
      const errMsg =
        err.message || "Registration failed. Username or email might be taken.";
      toast.error(errMsg);
    },
  });

  const handleTypeChange = (type) => {
    setCustomerType(type);
    reset({ customerType: type });
  };

  const onSubmit = (data) => {
    let payload = {};
    if (data.customerType === "PERSON") {
      payload = { ...data };
      if (!payload.email) delete payload.email;
    } else {
      payload = {
        customerType: "ORGANIZATION",
        username: data.username,
        password: data.password,
        name: data.name,
        registrationNumber: data.registrationNumber || undefined,
        taxNumber: data.taxNumber || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        contacts: [
          {
            firstName: data.contactFirstName,
            middleName: data.contactMiddleName || undefined,
            lastName: data.contactLastName,
            email: data.contactEmail || undefined,
            phone: data.contactPhone || undefined,
            position: data.contactPosition || undefined,
            address: data.contactAddress || undefined,
            isPrimary: true,
          },
        ],
      };
    }
    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden py-12 px-4">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl p-8 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-slate-450 mt-1">
            Join the Wholesale Distribution Network
          </p>
        </div>

        <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/50 mb-6">
          <button
            type="button"
            onClick={() => handleTypeChange("PERSON")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-200 ${
              customerType === "PERSON"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Individual Customer
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("ORGANIZATION")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-200 ${
              customerType === "ORGANIZATION"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Business Organization
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {customerType === "PERSON" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-violet-400">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register("firstName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    {...register("middleName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register("lastName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    {...register("phone")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  {...register("address")}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-violet-400">
                Organization Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    Organization / Company Name
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    {...register("registrationNumber")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tax Number (TIN)
                  </label>
                  <input
                    type="text"
                    {...register("taxNumber")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    {...register("phone")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Company Address
                </label>
                <input
                  type="text"
                  {...register("address")}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                />
              </div>

              <hr className="border-slate-800/40 my-3" />

              <h3 className="text-sm font-semibold text-violet-400">
                Primary Contact Person
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    {...register("contactFirstName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.contactFirstName && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.contactFirstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    {...register("contactMiddleName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    {...register("contactLastName")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.contactLastName && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.contactLastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    {...register("contactEmail")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                  {errors.contactEmail && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    {...register("contactPhone")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Position / Title
                  </label>
                  <input
                    type="text"
                    {...register("contactPosition")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Contact Address
                  </label>
                  <input
                    type="text"
                    {...register("contactAddress")}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-800/40 my-4" />
          <h3 className="text-sm font-semibold text-violet-400">
            Account Credentials
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                {...register("username")}
                placeholder="Choose username"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-sm outline-none transition"
              />
              {errors.username && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                placeholder="Choose password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-sm outline-none transition"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold text-sm transition duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-900 pt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-violet-400 hover:text-violet-300 font-semibold transition duration-150"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
