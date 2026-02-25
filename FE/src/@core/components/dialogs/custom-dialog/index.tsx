import type { Breakpoint } from '@mui/material'
import { Dialog, DialogActions, DialogContent, DialogTitle, Divider } from '@mui/material'
import DialogCloseButton from '../DialogCloseButton'

interface CustomDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  content?: React.ReactNode
  contentClassName?: string
  header?: React.ReactNode
  headerClassName?: string
  actions?: React.ReactNode
  actionsClassName?: string
  closeButton?: boolean
  closeIcon?: string
  maxWidth?: Breakpoint
  scroll?: 'body' | 'paper'
  persistent?: boolean
  contentBorder?: boolean
}

const CustomDialog = ({
  open,
  setOpen,
  content,
  header,
  actions,
  closeButton,
  contentClassName,
  headerClassName,
  actionsClassName,
  closeIcon = 'tabler-x',
  maxWidth,
  persistent,
  contentBorder
}: CustomDialogProps) => {
  const handleClose = () => {
    !persistent && setOpen(false)
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={handleClose}
      scroll='paper'
      maxWidth={maxWidth}
      closeAfterTransition={false}
      disableEscapeKeyDown={persistent}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      {closeButton && (
        <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
          <i className={closeIcon} />
        </DialogCloseButton>
      )}
      {header && <DialogTitle className={`${headerClassName}`}>{header}</DialogTitle>}
      {contentBorder && <Divider />}
      {content && <DialogContent className={`${contentClassName}`}>{content}</DialogContent>}
      {contentBorder && <Divider />}
      {actions && <DialogActions className={`${actionsClassName}`}>{actions}</DialogActions>}
    </Dialog>
  )
}

export default CustomDialog
