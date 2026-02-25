import { forwardRef, type ComponentProps } from 'react'
import { Box, type BoxProps } from '@mui/material'
import Button from '@mui/material/Button'
import { endOfDay, startOfDay } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { QUICK_OPTIONS, type QuickOption } from '@/configs/datePicker.config'
import CustomTextField from '../mui/TextField'
import { DateFormat } from '@/@core/constants/global.const'
import { useTranslation } from '@/@core/hooks/useTranslation'

type Props = {
  range: [Date | null, Date | null]
  isShowQuickSelect?: boolean
  shouldCloseOnSelect?: boolean
  isClearable?: boolean
  label?: string
  onChange: (dates: [Date | null, Date | null]) => void
  customInput?: React.ReactNode
  monthsShown?: number
  placeholderText?: string
  dateFormat?: DateFormat
  showPopperArrow?: boolean
  boxProps?: BoxProps
  className?: string
  excludeDates?: Date[]
  includeDates?: Date[]
  filterDate?: (date: Date) => boolean
  showMonthDropdown?: boolean
  showYearDropdown?: boolean
  showWeekNumbers?: boolean
  useWeekdaysShort?: boolean
  locale?: string
  onFocus?: () => void
  onBlur?: () => void
  onCalendarOpen?: () => void
  onCalendarClose?: () => void
  id?: string
  name?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  inline?: boolean
  disabled?: boolean
}

interface CalendarContainerProps {
  children: React.ReactNode
  className?: string
}

const DefaultInput = forwardRef<HTMLInputElement, { value: string; label?: string }>(
  ({ value, label, ...props }, ref) => (
    <CustomTextField
      fullWidth
      label={label}
      value={value}
      inputRef={ref}
      {...props}
      sx={!label ? { mt: '20px' } : {}}
    />
  )
)

DefaultInput.displayName = 'DefaultInput'

const DateRangePicker = (props: Props) => {
  const {
    range,
    onChange,
    monthsShown = 1,
    isShowQuickSelect = true,
    label,
    customInput = <DefaultInput label={label} value={`${range[0] || ''} - ${range[1] || ''}`} />,
    dateFormat = DateFormat.YMD_HMS,
    ...rest
  } = props

  const { t } = useTranslation()

  const handleQuickSelect = (option: QuickOption) => {
    const [start, end] = option.getValue()

    onChange([start, end])
  }

  const handleChange = ([start, end]: [Date | null, Date | null]) =>
    onChange([start && startOfDay(start), end && endOfDay(end)])

  const calendarContainer = ({ children, className }: CalendarContainerProps) => (
    <div className={`${className} flex flex-col overflow-y-auto`}>
      <div className='custom-child react-datepicker flex flex-col md:flex-row'>{children}</div>
      {isShowQuickSelect && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            bgcolor: 'action.hover',
            width: {
              xs: '268px',
              sm: `${monthsShown * 290}px`
            },
            '&::-webkit-scrollbar': {
              height: 0,
              display: 'none'
            },
            '& .MuiButton-root': {
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              minWidth: 'auto',
              boxShadow: 'none',
              borderRadius: 1
            }
          }}
        >
          {QUICK_OPTIONS.map(option => (
            <Button
              key={option.label}
              size='small'
              variant='contained'
              color='primary'
              onClick={() => handleQuickSelect(option)}
            >
              {t(option.label)}
            </Button>
          ))}
        </Box>
      )}
    </div>
  )

  const newProps = {
    ...rest,
    selectsRange: true,
    selected: range[0],
    startDate: range[0],
    endDate: range[1],
    onChange: handleChange,
    calendarContainer,
    monthsShown,
    popperPlacement: 'bottom-start',
    dateFormat,
    customInput: customInput,
    highlightDates: [new Date()],
    timeZone: 'Asia/Ho_Chi_Minh'
  } as ComponentProps<typeof AppReactDatepicker>

  return <AppReactDatepicker {...newProps} />
}

export default DateRangePicker
