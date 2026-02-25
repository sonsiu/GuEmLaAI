import { Button, Card, CardContent, CardHeader, Chip, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import type { ITab } from '@/@core/components/custom-tabs'
import DemoForm from './Form'
import TableDemo from './Table'
import { showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from '@/services/toast.service'
import OpenDialogOnElementClick from '@/@core/components/dialogs/OpenDialogOnElementClick'
import CustomDialog from '@/@core/components/dialogs/custom-dialog'
import ConfirmDialog from '@/@core/components/dialogs/comfirm-dialog'

export const DemoTabs: ITab[] = [
  {
    label: 'Form Demo',
    content: (
      <Card>
        <CardHeader title='Form Demo' />
        <CardContent>
          <DemoForm />
        </CardContent>
      </Card>
    )
  },
  {
    label: 'Table Demo',
    content: (
      <Card>
        <CardHeader title='Table Demo' />
        <CardContent>
          <TableDemo />
        </CardContent>
      </Card>
    ),
    icon: 'tabler-lock'
  }
]

const SampleChip = () => {
  return (
    <CardContent>
      <Typography variant='title'>Sample Chips</Typography>
      <Grid container spacing={6} size={{ xs: 12 }}>
        <Grid size={{ xs: 2 }}>
          <Chip label='Tonal Default' variant='tonal' color='primary' />
        </Grid>
        <Grid size={{ xs: 2 }}>
          <Chip label='Filled Medium' variant='filled' color='primary' size='medium' />
        </Grid>
        <Grid size={{ xs: 2 }}>
          <Chip label='Outlined Medium' variant='outlined' color='primary' size='medium' />
        </Grid>
      </Grid>
    </CardContent>
  )
}

const SampleButton = () => {
  return (
    <CardContent>
      <Typography variant='title'>Sample Buton</Typography>
      <Grid size={{ xs: 12 }} container>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='tonal' color='primary'>
            Tonal
          </Button>
        </Grid>
        <Grid size={{ xs: 2 }}>
          <Button size='medium' variant='contained' color='primary'>
            Contained Size Medium
          </Button>
        </Grid>
        <Grid size={{ xs: 2 }}>
          <Button size='large' variant='outlined' color='primary'>
            Outlined Size Large
          </Button>
        </Grid>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='text' color='primary'>
            Outlined
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  )
}

const SampleTypography = () => {
  return (
    <CardContent>
      <Typography variant='title'>Sample typography</Typography> <br />
      <Typography variant='subtitle1'>Sample typography</Typography>
      <div className='flex flex-col gap-1'>
        <Typography variant='h1'>h1</Typography>
        <Typography variant='h2'>h2</Typography>
        <Typography variant='h3'>h3</Typography>
        <Typography variant='h4'>h4</Typography>
        <Typography variant='h5'>h5</Typography>
        <Typography variant='h6'>h6</Typography>
        <Typography variant='subtitle1'>subtitle1</Typography>
        <Typography variant='subtitle2'>subtitle2</Typography>
        <Typography variant='body1'>body1</Typography>
        <Typography variant='body2'>body2</Typography>
        <Typography variant='button'>button</Typography>
        <Typography variant='caption'>caption</Typography>
        <Typography variant='overline'>overline</Typography>
      </div>
    </CardContent>
  )
}

const SampleToaster = () => {
  return (
    <CardContent>
      <Grid size={{ xs: 12 }} container>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='contained' color='success' onClick={() => showSuccessToast('Success')}>
            Success
          </Button>
        </Grid>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='contained' color='error' onClick={() => showErrorToast('Error')}>
            Success
          </Button>
        </Grid>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='contained' color='success' onClick={() => showInfoToast('Info')}>
            Info
          </Button>
        </Grid>
        <Grid size={{ xs: 1 }}>
          <Button size='small' variant='contained' color='warning' onClick={() => showWarningToast('Warning')}>
            Warning
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  )
}

const DemoDialog = ({
  open,
  setOpen,
  persistent,
  contentClassName,
  contentBorder
}: {
  open: boolean
  setOpen: (open: boolean) => void
  persistent?: boolean
  contentClassName?: string
  contentBorder?: boolean
}) => {
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <CustomDialog
      persistent={persistent}
      open={open}
      setOpen={setOpen}
      contentClassName={contentClassName}
      contentBorder={contentBorder}
      content={
        <>
          <Typography>
            Bear claw pastry cotton candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon
            drops cupcake muffin brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin
            pudding caramels. Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping
            gingerbread apple pie chupa chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton
            candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin
            brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels.
            Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa
            chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton candy jelly toffee. Pudding
            chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin brownie fruitcake. Pastry pastry
            tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels. Jujubes lollipop gummies croissant
            shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa chups powder. Cake croissant halvah
            candy canes gummies. Bear claw pastry cotton candy jelly toffee. Pudding chocolate cake shortbread bonbon
            biscuit sweet. Lemon drops cupcake muffin brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate
            cake gummi bears muffin pudding caramels. Jujubes lollipop gummies croissant shortbread. Cupcake dessert
            marzipan topping gingerbread apple pie chupa chups powder. Cake croissant halvah candy canes gummies. Bear
            claw pastry cotton candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon drops
            cupcake muffin brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin
            pudding caramels. Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping
            gingerbread apple pie chupa chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton
            candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin
            brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels.
            Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa
            chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton candy jelly toffee. Pudding
            chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin brownie fruitcake. Pastry pastry
            tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels. Jujubes lollipop gummies croissant
            shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa chups powder. Cake croissant halvah
            candy canes gummies. Bear claw pastry cotton candy jelly toffee. Pudding chocolate cake shortbread bonbon
            biscuit sweet. Lemon drops cupcake muffin brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate
            cake gummi bears muffin pudding caramels. Jujubes lollipop gummies croissant shortbread. Cupcake dessert
            marzipan topping gingerbread apple pie chupa chups powder. Cake croissant halvah candy canes gummies. Bear
            claw pastry cotton candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon drops
            cupcake muffin brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin
            pudding caramels. Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping
            gingerbread apple pie chupa chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton
            candy jelly toffee. Pudding chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin
            brownie fruitcake. Pastry pastry tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels.
            Jujubes lollipop gummies croissant shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa
            chups powder. Cake croissant halvah candy canes gummies. Bear claw pastry cotton candy jelly toffee. Pudding
            chocolate cake shortbread bonbon biscuit sweet. Lemon drops cupcake muffin brownie fruitcake. Pastry pastry
            tootsie roll jujubes chocolate cake gummi bears muffin pudding caramels. Jujubes lollipop gummies croissant
            shortbread. Cupcake dessert marzipan topping gingerbread apple pie chupa chups powder. Cake croissant halvah
            candy canes gummies.
          </Typography>
        </>
      }
      header={
        <>
          <Typography variant='h4' component='span'>
            Edit User Information
          </Typography>
        </>
      }
      actions={
        <>
          <Button variant='contained' onClick={handleClose} type='submit'>
            Submit
          </Button>
          <Button variant='tonal' color='secondary' type='reset' onClick={handleClose}>
            Cancel
          </Button>
        </>
      }
      closeButton
    />
  )
}

const ConfimDialogWithActionDemo = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  return (
    <ConfirmDialog
      open={open}
      setOpen={setOpen}
      onConfirm={() => {}}
      title='Delete user?'
      description='This action cannot be undone.'
      confirmLabel='Yes, delete'
      rejectLabel='No'
    />
  )
}

const SampleDialog = () => {
  return (
    <CardContent>
      <div className='flex gap-2'>
        <OpenDialogOnElementClick
          element={Button}
          elementProps={{
            variant: 'contained',
            children: 'Normal Dialog'
          }}
          dialog={DemoDialog}
        />
        <OpenDialogOnElementClick
          element={Button}
          elementProps={{
            variant: 'contained',
            children: 'Persistent Dialog',
            color: 'error'
          }}
          dialog={DemoDialog}
          dialogProps={{
            persistent: true,
            contentBorder: true,
            contentClassName: 'max-h-[500px]'
          }}
        />

        <OpenDialogOnElementClick
          element={Button}
          elementProps={{
            variant: 'contained',
            children: 'Confirm Dialog',
            color: 'warning'
          }}
          dialog={ConfimDialogWithActionDemo}
        />

        <OpenDialogOnElementClick
          element={Button}
          elementProps={{
            variant: 'contained',
            children: 'Confirm Dialog with Require',
            color: 'info'
          }}
          dialog={ConfirmDialog}
          dialogProps={{
            onConfirm: () => {},
            confirmationText: 'DELETE',
            title: 'Danger Zone',
            description: 'Please type "DELETE" to proceed.'
          }}
        />
      </div>
    </CardContent>
  )
}

export const DemoTabs2: ITab[] = [
  {
    label: 'Typography',
    content: <SampleTypography />
  },
  {
    label: 'Button',
    content: <SampleButton />
  },
  {
    label: 'Chip',
    content: <SampleChip />
  },
  {
    label: 'Toaster',
    content: <SampleToaster />
  },
  {
    label: 'Dialog',
    content: <SampleDialog />
  }
]
