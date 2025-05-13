import useSWR from 'swr'
import { fetcher } from '@/lib/api'
import { useSocket } from '@/lib/socket-context'
import { useEffect } from 'react'
import apiClient from '../axios'

interface Alert {
  id: string
  title: string
  severity: number
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  createdAt: Date
}

export function useLiveAlerts() {
  const { data, mutate } = useSWR<Alert[]>('/api/alerts', fetcher)
  const { socket } = useSocket()

  const acknowledgeAlert = async (id: string) => {
    await apiClient.post(`/alerts/${id}/acknowledge`)
    mutate()
  }

  useEffect(() => {
    socket?.on('alert_update', mutate)
    return () => {
      socket?.off('alert_update', mutate)
    }
  }, [socket, mutate])

  return {
    alerts: data || [],
    acknowledgeAlert,
    isLoading: !data,
    error: data === undefined
  }
}