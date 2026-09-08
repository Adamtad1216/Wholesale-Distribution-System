import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  Briefcase,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../../authApi';
import { logout } from '../../authSlice';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import ThemeToggle from '../../../../components/layout/header/ThemeToggle';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token');
  const token = rawToken ? rawToken.trim() : '';

  const handleGoToLogin = () => {
    try {
      dispatch(logout());
    } catch (_) {}
    window.location.href = '/login';
  };

  // Verification state: 'VERIFYING' | 'VALID' | 'INVALID' | 'SUCCESS'
  const [status, setStatus] = useState('VERIFYING');
  const [invitationData, setInvitationData] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Verify invitation token on mount
  useEffect(() => {
    if (!token) {
      setStatus('INVALID');
      setVerifyError('No invitation token was provided. Please check the link in your email.');
      return;
    }

    let isMounted = true;

    async function checkToken() {
      try {
        setStatus('VERIFYING');
        const res = await authApi.verifyInvitation(token);
        const data = res?.data?.data || res?.data || res;

        if (isMounted) {
          setInvitationData(data);
          if (data.suggestedUsername) {
            setUsername(data.suggestedUsername);
          }
          setStatus('VALID');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to verify invitation token:', err);
          const msg =
            err?.message ||
            err?.response?.data?.message ||
            'This invitation link is invalid, expired, or has already been used.';
          setVerifyError(msg);
          setStatus('INVALID');
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password rules validation
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    {
      label: 'At least one special character (!@#$%^&*...)',
      met: /[@$!%*?&#]/.test(password),
    },
  ];

  const allRulesMet = rules.every((r) => r.met);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!username.trim() || username.trim().length < 3) {
      setSubmitError('Username must be at least 3 characters long.');
      return;
    }

    if (username.length > 50) {
      setSubmitError('Username cannot exceed 50 characters.');
      return;
    }

    if (!allRulesMet) {
      setSubmitError('Please ensure your password meets all the security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        token,
        username: username.trim(),
        password,
      };

      await authApi.acceptInvitation(payload);
      setStatus('SUCCESS');
      toast.success('Account successfully activated!');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      const msg =
        err?.response?.data?.message ||
        'Failed to set up your account. Please check your credentials or try again.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Toggle Button */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient background glow accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* ── STATE 1: VERIFYING TOKEN ──────────────────────────────── */}
      {status === 'VERIFYING' && (
        <Card className="w-full max-w-md p-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-500 animate-pulse mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Validating Invitation</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your invitation link...
          </p>
          <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse w-2/3 mx-auto rounded-full" />
          </div>
        </Card>
      )}

      {/* ── STATE 2: INVALID OR EXPIRED TOKEN ─────────────────────── */}
      {status === 'INVALID' && (
        <Card className="w-full max-w-md p-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-1">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">Invalid or Expired Link</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {verifyError}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-left text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground mb-1">Need help?</div>
            <p>• Invitation links are valid for a limited time and can only be used once.</p>
            <p>• If you already created your account, try signing in directly.</p>
            <p>• Otherwise, ask your administrator to send a new invitation link.</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              fullWidth
              onClick={handleGoToLogin}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Go to Sign In
            </Button>
          </div>
        </Card>
      )}

      {/* ── STATE 3: INVITATION ACCEPTED SUCCESSFULLY ──────────────── */}
      {status === 'SUCCESS' && (
        <Card className="w-full max-w-md p-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 mb-1 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Account Activated!
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Your username and password have been saved. You can now access the Wholesale Distribution System.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Your Registered Username
            </span>
            <div className="text-base font-mono font-bold text-violet-400 mt-1">
              {username}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleGoToLogin}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Sign In Now
          </Button>
        </Card>
      )}

      {/* ── STATE 4: VALID TOKEN - ENTER USERNAME & PASSWORD ──────── */}
      {status === 'VALID' && (
        <Card className="w-full max-w-lg p-8 relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Complete Your Account Setup
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your username and password to activate your account
            </p>
          </div>

          {/* Employee Information Card */}
          {invitationData && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Invited Member
                </span>
                {((invitationData.assignedRoles && invitationData.assignedRoles.length > 0) ||
                  (invitationData.roles && invitationData.roles.length > 0)) && (
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(invitationData.assignedRoles || invitationData.roles).map((role, idx) => {
                      const roleName = typeof role === 'string' ? role : role.name;
                      return (
                        <span
                          key={role.id || roleName || idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        >
                          {roleName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-sm font-bold text-foreground">
                {invitationData.employee?.name ||
                  [invitationData.firstName, invitationData.lastName].filter(Boolean).join(' ') ||
                  'Team Member'}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{invitationData.employee?.email || invitationData.email}</span>
                {invitationData.employee?.department && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" />
                    {invitationData.employee.department}
                  </span>
                )}
                {invitationData.employee?.jobTitle && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {invitationData.employee.jobTitle}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-500 leading-relaxed">
                {submitError}
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.doe"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                This will be your unique login name (3-50 characters).
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Password Requirements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                    {rule.met ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                    )}
                    <span className={rule.met ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {passwordsMatch ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={submitting}
              disabled={submitting || !allRulesMet || !passwordsMatch || username.trim().length < 3}
              className="mt-2"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {submitting ? 'Activating Account...' : 'Activate Account'}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
            Already activated your account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
              Sign In
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
