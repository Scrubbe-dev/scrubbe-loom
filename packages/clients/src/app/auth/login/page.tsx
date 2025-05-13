'use client';

import { useEffect, useState } from 'react';
import { useRouter , redirect} from 'next/navigation';
import { z } from 'zod';
import { AuthForm } from '../authform/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import apiClient from '@/lib/axios';
import { useCookiesNext } from 'cookies-next';


const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setCookie , hasCookie , getCookie} = useCookiesNext();
  const auth = getCookie("user-auth")
    // const { setCookie, hasCookie, deleteCookie, getCookies, getCookie } = useCookiesNext();   
      if (hasCookie("user-auth")) {
          redirect("/");
        }

  const handleSubmit = async (credentials: {
    email: string;
    password: string;
  }) => {
    // Validate input
    try {
      LoginSchema.parse(credentials);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        validationError.errors.forEach(err => 
          toast.error(err.message)
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      console.log(credentials , " from credentials")
      const res = await apiClient.post('/auth/login', {
          ...credentials});
        // Multi-factor authentication check
        const responseData = await res.data;
        // if (responseData.requiresMFA) {
        //   router.push('/mfa-verification');
        //   return;
        // }

        // Log login attempt
        // await logLoginAttempt(credentials.email, true);
      
       setCookie("user-auth",{refreshToken:responseData.refreshToken,token:responseData.token,user:responseData.user})
        router.push('/');
        toast.success('Login successful');
        // Log failed login attempt
        // await logLoginAttempt(credentials.email, false);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to connect to server. Maybe Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch CSRF token from server
  const fetchCSRFToken = async () => {
    try {
      const res = await fetch('/api/auth/csrf-token');
      const data = await res.json();
      return data.csrfToken;
    } catch {
      console.error('Failed to fetch CSRF token');
      return '';
    }
  };

  // Collect device information for security
  const getDeviceInfo = () => {
    if (typeof window !== 'undefined') {
      return {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    return {};
  };

  // Log login attempts for security monitoring
  const logLoginAttempt = async (email: string, success: boolean) => {
    console.log(email , success)
    try {
      await apiClient.post('/auth/login', {
          email,
          success,
          timestamp: new Date().toISOString(),
          ...getDeviceInfo()
        })
      
    } catch (error) {
      console.error('Failed to log login attempt');
    }
  };

  return (
    <div className="container relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">
            SOAR Platform Login
          </CardTitle>
          <p className="text-muted-foreground">
            Secure access to your enterprise dashboard
          </p>
        </CardHeader>
        <CardContent>
          <AuthForm
            type="login"
            onSubmit={handleSubmit}
            isLoading={isLoading}
          >
            {({ register, errors }:{register:any;errors:any}) => (
              <>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      {...register('email')}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2 relative">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        {...register('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className={errors.password ? 'border-destructive' : ''}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-sm">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <a 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            )}
          </AuthForm>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button 
            type="submit" 
            form="auth-form" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
          <div className="text-center text-sm mt-4">
            Don't have an account? {' '}
            <a 
              href="/auth/register" 
              className="text-primary hover:underline"
            >
              Sign up
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}