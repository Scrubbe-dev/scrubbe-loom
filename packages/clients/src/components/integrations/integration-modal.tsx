'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IntegrationForm } from './integration-form'

export function IntegrationModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (integration: any) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Connect New Data Source</DialogTitle>
        </DialogHeader>
        <IntegrationForm 
          onSuccess={(integration: any) => {
            onSuccess(integration)
            onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}