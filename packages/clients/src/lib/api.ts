import { toast } from "sonner"

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    toast.error('Failed to fetch data');
    throw new Error('Failed to fetch data');
  }
  return res.json();
};

export const poster = async (url: string, data: any) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    toast.error(error.message,);
    throw new Error(error.message);
  }

  return res.json();
};