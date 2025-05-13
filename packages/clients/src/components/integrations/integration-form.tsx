'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.enum(['AWS', 'GCP', 'DNS', 'AUTH_LOG']),
  credentials: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().optional(),
    projectId: z.string().optional(),
    serverUrl: z.string().url('Must be a valid URL').optional(),
    authToken: z.string().optional(),
  }),
}).refine((data) => {
  if (data.type === 'AWS' && (!data.credentials.accessKeyId || !data.credentials.secretAccessKey)) {
    return false;
  }
  return true;
}, {
  message: 'AWS requires both access key and secret key',
  path: ['credentials.accessKeyId'],
}).refine((data) => {
  if (data.type === 'GCP' && !data.credentials.projectId) {
    return false;
  }
  return true;
}, {
  message: 'GCP requires project ID',
  path: ['credentials.projectId'],
}).refine((data) => {
  if ((data.type === 'DNS' || data.type === 'AUTH_LOG') && !data.credentials.authToken) {
    return false;
  }
  return true;
}, {
  message: 'Authentication token required',
  path: ['credentials.authToken'],
});

interface IntegrationFormProps {
  onSuccess?: (data: any) => void;
}

export function IntegrationForm({ onSuccess }: IntegrationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'AWS',
      name: '',
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
        region: '',
        projectId: '',
        serverUrl: '',
        authToken: '',
      },
    },
  });

  const selectedType = form.watch('type');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await apiClient.post('/integrations', {values});
       console.log(response , " Integration Response")
      // if (!response.ok) {
      //   const error = await response.data;
      //   throw new Error(error.message || 'Connection failed');
      // }

      const data = await response.data;
      toast.success('Integration created successfully');
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create integration');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My AWS Integration" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AWS">AWS Cloud</SelectItem>
                  <SelectItem value="GCP">Google Cloud</SelectItem>
                  <SelectItem value="DNS">DNS Logs</SelectItem>
                  <SelectItem value="AUTH_LOG">Auth Logs</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === 'AWS' && (
          <>
            <FormField
              control={form.control}
              name="credentials.accessKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Access Key ID</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="AKIA..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentials.secretAccessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Secret Access Key</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Secret key" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentials.region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Region (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="us-east-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedType === 'GCP' && (
          <FormField
            control={form.control}
            name="credentials.projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GCP Project ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="my-project-123" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === 'DNS' && (
          <>
            <FormField
              control={form.control}
              name="credentials.serverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNS Server URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://dns.example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentials.authToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Bearer token" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedType === 'AUTH_LOG' && (
          <FormField
            control={form.control}
            name="credentials.authToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Token</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="Bearer token" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          Connect Data Source
        </Button>
      </form>
    </Form>
  );
}