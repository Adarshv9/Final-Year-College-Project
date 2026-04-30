// Page component for the OTPVerify authentication flow.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import BrandLogo from '../../shared/ui/BrandLogo';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// Render the OTP verify page.
export default function OTPVerifyPage() {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';


  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);


  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Handle change.
  const handleChange = (val, idx) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    if (char && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
    if (next.every((c) => c) && next.join('').length === OTP_LENGTH) {
      submitOTP(next.join(''));
    }
  };

  // Handle key down.
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  // Handle paste.
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length) {
      const next = pasted.split('').concat(Array(OTP_LENGTH).fill('')).slice(0, OTP_LENGTH);
      setOtp(next);
      inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      if (pasted.length === OTP_LENGTH) submitOTP(pasted);
    }
  };

  // Handle OTP.
  const submitOTP = async (code) => {
    setLoading(true);
    try {
      await authApi.verifyOTP({ email, otp: code });
      toast.success('Email verified! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Handle resend.
  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendOTP({ email });
      toast.success('New OTP sent to your email!');
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // Handle manual submit.
  const handleManualSubmit = () => {
    const code = otp.join('');
    if (code.length === OTP_LENGTH) submitOTP(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl animate-fade-in">
        
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" aria-label="Go to home" className="inline-flex items-center gap-2.5">
            <BrandLogo imageClassName="h-10 w-auto" />
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h1>
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-900">{email}</span>
          </p>
        </div>

        
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((val, idx) =>
          <input
            key={idx}
            ref={(el) => inputsRef.current[idx] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={[
            'w-12 h-14 text-center text-xl font-bold bg-white border rounded-xl',
            'text-slate-900 outline-none transition-all duration-150',
            val ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200',
            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'].
            join(' ')} />

          )}
        </div>

        <Button
          full
          size="lg"
          onClick={handleManualSubmit}
          loading={loading}
          disabled={otp.join('').length !== OTP_LENGTH}>
          
          Verify Email
        </Button>

        
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-sm text-slate-500">Didn&apos;t receive it?</span>
          {countdown > 0 ?
          <span className="text-sm text-slate-600">Resend in {countdown}s</span> :

          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors">
            
              <RefreshCcw size={13} className={resending ? 'animate-spin' : ''} />
              Resend OTP
            </button>
          }
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-indigo-600 hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>);

}