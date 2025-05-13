'use client';

import { useEffect, useState } from 'react';
import { useRouter , redirect } from 'next/navigation';
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

// Validation schema for registration
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string()
    .min(4, 'Username must be at least 4 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  experience: z.enum(['Basic', 'Intermediate', 'Advanced'], {
    errorMap: () => ({ message: 'Please select an experience level' })
  })
});

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {hasCookie} = useCookiesNext();
  // const { setCookie, hasCookie, deleteCookie, getCookies, getCookie } = useCookiesNext();   
  useEffect(()=>{
    if (hasCookie("user-auth")) {
        redirect("/");
      }
    console.log(hasCookie("user-auth"))
  },[]) 

  const handleSubmit = async (credentials: 
    | { email: string; password: string; }
    | { 
        email: string; 
        password: string; 
        firstName: string; 
        lastName: string; 
        username: string; 
        experience: string; 
      }
  ) => {
    // Determine if it's a registration object
    console.log(credentials , "credentials")
    const isRegistration = 'firstName' in credentials;

    // Validate input
    try {
      if (isRegistration) {
        RegisterSchema.parse(credentials);
        console.log(credentials , " from credentials")

      }
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
      const endpoint = isRegistration ? '/auth/register' : '/auth/login';
      const res = await apiClient.post(endpoint,{
          ...credentials,
        });

      // if (!!res.data) {
      //   // Log attempt
      //   await (isRegistration 
      //     ? logRegistrationAttempt(credentials.email, true)
      //     : logLoginAttempt(credentials.email, true)
      //   );
        
        // Redirect 
        router.push('/auth/login');
        toast.success(isRegistration ? 'Registration successful' : 'Login successful');
      // } else {
        // Log failed attempt
      //   await (isRegistration 
      //     ? logRegistrationAttempt(credentials.email, false)
      //     : logLoginAttempt(credentials.email, false)
      //   );

      //   const errorData = await res.json().catch(() => ({}));
      //   const errorMessage = errorData.message || (isRegistration ? 'Registration failed' : 'Login failed');
      //   toast.error(errorMessage);
      // }
    } catch (error) {
      console.error(isRegistration ? 'Registration error:' : 'Login error:', error);
      toast.error('Failed to connect to server. Either user already exist or server is down.  Please try again.');
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
    try {
      await fetch('/api/auth/log-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          success,
          timestamp: new Date().toISOString(),
          ...getDeviceInfo()
        }),
      });
    } catch (error) {
      console.error('Failed to log login attempt');
    }
  };

  // Log registration attempts for security monitoring
  const logRegistrationAttempt = async (email: string, success: boolean) => {
    try {
      await fetch('/api/auth/log-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          success,
          timestamp: new Date().toISOString(),
          ...getDeviceInfo()
        }),
      });
    } catch (error) {
      console.error('Failed to log registration attempt');
    }
  };

  return (
    <div className="container relative min-h-screen py-10 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">
            Create SOAR Platform Account
          </CardTitle>
          <p className="text-muted-foreground">
            Join our enterprise dashboard platform
          </p>
        </CardHeader>
        <CardContent>
          <AuthForm
            type="register"
            onSubmit={handleSubmit}
            isLoading={isLoading}
          >
            {({ register, errors }:{register:any;errors:any}) => (
              <>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        {...register('firstName')}
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        disabled={isLoading}
                        className={errors.firstName ? 'border-destructive' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-destructive text-sm">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        {...register('lastName')}
                        id="lastName"
                        type="text"
                        placeholder="Enter last name"
                        disabled={isLoading}
                        className={errors.lastName ? 'border-destructive' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-destructive text-sm">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      {...register('username')}
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      disabled={isLoading}
                      className={errors.username ? 'border-destructive' : ''}
                    />
                    {errors.username && (
                      <p className="text-destructive text-sm">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

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

                  <div className="grid gap-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <select
                      {...register('experience')}
                      id="experience"
                      disabled={isLoading}
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
                        errors.experience ? 'border-destructive' : 'border-input'
                      }`}
                    >
                      <option value="">Select Experience Level</option>
                      <option value="Basic">Basic</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    {errors.experience && (
                      <p className="text-destructive text-sm">
                        {errors.experience.message}
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
                        placeholder="Create a strong password"
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <div className="text-center text-sm mt-4">
            Already have an account? {' '}
            <a 
              href="/auth/login" 
              className="text-primary hover:underline"
            >
              Log in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}