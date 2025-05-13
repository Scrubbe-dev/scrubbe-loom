// components/integration-form.tsx
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
import apiClient from '@/lib/axios';

const integrationSchema = z.object({
  type: z.enum(['AWS', 'GCP', 'DNS', 'AUTH_LOG']),
  credentials: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().optional(),
    projectId: z.string().optional(),
    serverUrl: z.string().optional(),
    authToken: z.string().optional(),
  }).partial().refine(data => {

    // if (data. === 'AWS') {
    //   return !!data.accessKeyId && !!data.secretAccessKey;
    // }
    // if (data.type === 'GCP') {
    //   return !!data.projectId;
    // }
    // return true;
  })
});

export function IntegrationForm() {
  const form = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      type: 'AWS',
      credentials: {},
    },
  });

  const selectedType = form.watch('type');

  async function onSubmit(values: z.infer<typeof integrationSchema>) {
    try {
      const response = await apiClient.post('/integrations', {values});
      
      if (!response.data) throw new Error('Connection failed');
      // Handle successful connection
    } catch (error) {
      console.error('Integration error:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              name="credentials.accessKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Access Key ID</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="credentials.secretAccessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AWS Secret Access Key</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {selectedType === 'GCP' && (
          <FormField
            name="credentials.projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GCP Project ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedType === 'DNS' && (
          <>
            <FormField
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
              name="credentials.authToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" className="w-full">
          Connect Data Source
        </Button>
      </form>
    </Form>
  );
}