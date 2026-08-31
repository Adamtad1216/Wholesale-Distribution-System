import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../authApi';
import { loginSuccess } from '../authSlice';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      if (response && response.data) {
        dispatch(loginSuccess(response.data));
        toast.success('Successfully logged in!', { duration: 6000 });
        navigate('/dashboard');
      } else {
        toast.error('Login failed: Invalid server response', { duration: 6000 });
      }
    },
    onError: (err) => {
      // Error is displayed inline in the form, no toast needed.
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-4 text-white text-2xl font-bold">
            W
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Wholesale Distribution System
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {mutation.isError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-center text-xs font-semibold text-rose-500 leading-relaxed shadow-sm">
              {mutation.error?.message || 'Invalid username or password'}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Username
            </label>
            <input
              type="text"
              {...register('username')}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-855 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-sm outline-none transition duration-200"
            />
            {errors.username && (
              <p className="text-xs text-rose-500 mt-1.5">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-900/60 border border-slate-855 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-sm outline-none transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-200 transition focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold text-sm transition duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-900 pt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition duration-150">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
