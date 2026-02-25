import { useState } from 'react'
import { Button, Typography, TextField } from '@mui/material'
import CustomDialog from '../custom-dialog'

interface ConfirmDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
  onReject?: () => void
  title?: string
  description?: string
  confirmLabel?: string
  rejectLabel?: string
  confirmationText?: string
  persistent?: boolean
}

const ConfirmDialog = ({
  open,
  setOpen,
  onConfirm,
  onReject,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  rejectLabel = 'Cancel',
  confirmationText,
  persistent = false
}: ConfirmDialogProps) => {
  const [inputValue, setInputValue] = useState('')

  const handleClose = () => {
    setOpen(false)
    setInputValue('')
  }

  const handleConfirm = () => {
    onConfirm()
    handleClose()
  }

  const handleReject = () => {
    onReject?.()
    handleClose()
  }

  const isConfirmDisabled = confirmationText ? inputValue !== confirmationText : false

  return (
    <CustomDialog
      open={open}
      setOpen={setOpen}
      persistent={persistent}
      header={
        <Typography variant='h5' component='span'>
          {title}
        </Typography>
      }
      content={
        <>
          {description && <Typography className='mb-4'>{description}</Typography>}
          {confirmationText && (
            <TextField
              fullWidth
              label={`Type "${confirmationText}" to confirm`}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
          )}
        </>
      }
      actions={
        <>
          <Button variant='contained' onClick={handleConfirm} disabled={isConfirmDisabled}>
            {confirmLabel}
          </Button>
          <Button variant='tonal' color='secondary' onClick={handleReject}>
            {rejectLabel}
          </Button>
        </>
      }
      closeButton={true}
    />
  )
}

export default ConfirmDialog
