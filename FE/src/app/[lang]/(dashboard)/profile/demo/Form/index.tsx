import { TextField, Button, FormControlLabel, Switch, Checkbox, RadioGroup, Radio, MenuItem } from '@mui/material'
import moment from 'moment'
import { Form, useAppForm } from '@/@core/components/custom-form'
import { FormControl } from '@/@core/components/custom-form/form-control'
import { FormError } from '@/@core/components/custom-form/form-error'
import { FormItem } from '@/@core/components/custom-form/form-item'
import { FormLabel } from '@/@core/components/custom-form/form-label'
import { useTranslation } from '@/@core/hooks/useTranslation'

const DemoForm = () => {
  const { t } = useTranslation()

  const form = useAppForm(
    {
      name: [
        'John Doe',
        {
          required: 'Name is required heheheh',
          min: 5,
          pattern: /^[A-Za-z\s]+$/
        }
      ],
      age: [25, { required: true, minNumber: [18, 'Khong du tuoi'] }],
      email: ['test@example.com', {}],
      country: ['US', {}],
      subscribe: [true, {}],
      gender: ['male'],
      birthDate: [moment()],
      notifications: [true],
      description: ['']
    },
    t
  )

  const onSubmit = (data: any) => {
  //  console.log('Form data:', data)
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormItem>
        <FormLabel required>Name</FormLabel>
        <FormError
          name='name'
          render={error => (
            <FormControl name='name' error={error} helperText={error?.message}>
              <TextField fullWidth placeholder='Enter your name' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel required>Age</FormLabel>
        <FormError
          name='age'
          render={error => (
            <FormControl name='age' error={error} helperText={error?.message}>
              <TextField fullWidth placeholder='Enter your age' type='number' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel required>Email</FormLabel>
        <FormError
          name='email'
          render={error => (
            <FormControl name='email' error={error} helperText={error?.message}>
              <TextField fullWidth placeholder='Enter your email' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel required>Country</FormLabel>
        <FormError
          name='country'
          render={error => (
            <FormControl name='country' error={error} helperText={error?.message}>
              <TextField select fullWidth defaultValue='US'>
                <MenuItem value='US'>United States</MenuItem>
                <MenuItem value='UK'>United Kingdom</MenuItem>
                <MenuItem value='VN'>Vietnam</MenuItem>
              </TextField>
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel required>Gender</FormLabel>
        <FormError
          name='gender'
          render={error => (
            <FormControl name='gender' error={error} helperText={error?.message}>
              <RadioGroup row>
                <FormControlLabel value='male' control={<Radio />} label='Male' />
                <FormControlLabel value='female' control={<Radio />} label='Female' />
                <FormControlLabel value='other' control={<Radio />} label='Other' />
              </RadioGroup>
            </FormControl>
          )}
        />
      </FormItem>

      {/* <FormItem>
        <FormLabel required>Birth Date</FormLabel>
        <FormError
          name='birthDate'
          render={error => (
            <FormControl name='birthDate' error={error} helperText={error?.message}>
              <DatePicker format='YYYY-MM-DD HH:mm:ss' label='Controlled picker' />
            </FormControl>
          )}
        />
      </FormItem> */}

      <FormItem>
        <FormError
          name='subscribe'
          render={error => (
            <FormControl name='subscribe' error={error} helperText={error?.message}>
              <FormControlLabel control={<Checkbox />} label='Subscribe to newsletter' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormError
          name='notifications'
          render={error => (
            <FormControl name='notifications' error={error} helperText={error?.message}>
              <FormControlLabel control={<Switch />} label='Enable notifications' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormError
          name='description'
          render={error => (
            <FormControl name='description' error={error} helperText={error?.message}>
              <TextField fullWidth multiline rows={1} placeholder='Enter description' />
            </FormControl>
          )}
        />
      </FormItem>

      <Button type='submit' variant='contained' color='primary' className='mt-4'>
        Submit
      </Button>
    </Form>
  )
}

export default DemoForm
