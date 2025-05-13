'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function AuthForm({ type, onSubmit }: {
  type: 'login' | 'register';
  onSubmit: (data: z.infer<typeof authSchema>) => void;
}) {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(authSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label>Email</label>
        <input {...register('email')} type="email" required />
      </div>
      
      <div>
        <label>Password</label>
        <input {...register('password')} type="password" required />
      </div>

      <Button type="submit" className="w-full">
        {type === 'login' ? 'Sign In' : 'Create Account'}
      </Button>
    </form>
  );
}