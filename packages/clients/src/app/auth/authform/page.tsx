import React from 'react';
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schemas for Login and Registration
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const RegisterSchema = z.object({
  firstName: z.string().min(2, 'Name must be at least 2 characters'),
  lastName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(2, 'Name must be at least 2 characters'),
  experience: z.string(),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
})
// .refine((data) => data.password === data.confirmPassword, {
//   message: 'Passwords do not match',
//   path: ['confirmPassword']
// });

type LoginFormInputs = z.infer<typeof LoginSchema>;
type RegisterFormInputs = z.infer<typeof RegisterSchema>;

// Custom type to handle errors for both login and register forms
type AuthFormErrors = {
  name?: { message?: string };
  email?: { message?: string };
  password?: { message?: string };
  confirmPassword?: { message?: string };
};

type AuthFormProps = {
  type: 'login' | 'register';
  onSubmit: (credentials: LoginFormInputs | RegisterFormInputs) => Promise<void>;
  isLoading?: boolean;
  children?: (params: {
    register: any;
    errors: AuthFormErrors;
    watch: any;
  }) => React.ReactNode;
};

export function AuthForm({ 
  type, 
  onSubmit, 
  isLoading = false, 
  children 
}: AuthFormProps) {
  // Select appropriate schema based on form type
  const schema = type === 'login' ? LoginSchema : RegisterSchema;

  // Configure react-hook-form with zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginFormInputs | RegisterFormInputs>({
    resolver: zodResolver(schema)
  });

  // Type-assert errors to our custom AuthFormErrors type
  const typedErrors = errors as unknown as AuthFormErrors;

  // Submit handler
  const onSubmitHandler: SubmitHandler<LoginFormInputs | RegisterFormInputs> = 
    async (data) => {
      await onSubmit(data);
    };

  return (
    <form 
      id="auth-form"
      onSubmit={handleSubmit(onSubmitHandler)} 
      className="space-y-4"
    >
      {children ? (
        children({ register, errors: typedErrors, watch })
      ) : (
        // Default form rendering if no children provided
        <div className="space-y-4">
          {type === 'register' && (
            <div>
              <label htmlFor="name" className="block mb-2">
                Full Name
              </label>
              <input
                {...register('username')}
                id="username"
                type="text"
                placeholder="Enter your full name"
                disabled={isLoading}
                className="w-full p-2 border rounded"
              />
              {typedErrors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {typedErrors.name.message}
                </p>
              )}
            </div>
          )}


          {type === 'register' && (
            <div>
              <label htmlFor="name" className="block mb-2">
                FirstName
              </label>
              <input
                {...register('firstName')}
                id="firstName"
                type="text"
                placeholder="Enter your full name"
                disabled={isLoading}
                className="w-full p-2 border rounded"
              />
              {typedErrors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {typedErrors.name.message}
                </p>
              )}
            </div>
          )}


           {type === 'register' && (
            <div>
              <label htmlFor="name" className="block mb-2">
                LastName
              </label>
              <input
                {...register('lastName')}
                id="lastName"
                type="text"
                placeholder="Enter your full name"
                disabled={isLoading}
                className="w-full p-2 border rounded"
              />
              {typedErrors?.name && (
                <p className="text-red-500 text-sm mt-1">
                  {typedErrors.name.message}
                </p>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              className="w-full p-2 border rounded"
            />
            {typedErrors.email && (
              <p className="text-red-500 text-sm mt-1">
                {typedErrors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block mb-2">
              Password
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              placeholder={
                type === 'login' 
                  ? 'Enter your password' 
                  : 'Create a strong password'
              }
              disabled={isLoading}
              className="w-full p-2 border rounded"
            />
            {typedErrors.password && (
              <p className="text-red-500 text-sm mt-1">
                {typedErrors.password.message}
              </p>
            )}
          </div>
          
          {type === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block mb-2">
                Experience
              </label>
              <input
                {...register('experience')}
                id="experience"
                type="text"
                placeholder="Confirm your password"
                disabled={isLoading}
                className="w-full p-2 border rounded"
              />
              {typedErrors?.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {typedErrors.confirmPassword.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}