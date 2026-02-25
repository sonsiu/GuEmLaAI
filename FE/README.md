# Hướng Dẫn Sử Dụng Base Dự Án

Tài liệu này mô tả cách sử dụng các component base, cách gọi API, form, table và các utilities trong dự án.

## Mục Lục

1. [Gọi API](#gọi-api)
2. [Form Component](#form-component)
3. [Table Component](#table-component)
4. [Dialog Component](#dialog-component)
5. [Toast Notification](#toast-notification)
6. [Các Component Khác](#các-component-khác)
7. [Hooks & Utilities](#hooks--utilities)

---

## Gọi API

### Client-Side API (ClientApi)

Sử dụng `ClientApi` từ `@/services/client-api.service` để gọi API ở client-side.

#### Các phương thức:

- `get<T>(url, options?, isShowErrorToast?)` - GET request
- `post<T>(url, body?, options?, isShowErrorToast?)` - POST request
- `put<T>(url, body?, options?)` - PUT request
- `patch<T>(url, body?, options?)` - PATCH request
- `delete<T>(url, options?)` - DELETE request
- `upload<T>(url, body?, options?)` - Upload file (FormData)

#### Cách sử dụng:

```typescript
import { ClientApi } from '@/services/client-api.service'

// GET request
const response = await ClientApi.get<User[]>('/users/get-all')
response
  .onSuccess(data => {
    //console.log('Success:', data)
  })
  .onError(error => {
    //console.error('Error:', error.message)
  })

// POST request
const createResponse = await ClientApi.post<User>('/users/create', {
  name: 'John Doe',
  email: 'john@example.com'
})

// Upload file
const formData = new FormData()
formData.append('file', file)
const uploadResponse = await ClientApi.upload<UploadResult>('/upload', formData)

// Lấy raw response
const rawResponse = response.getRaw()
```

#### Lưu ý về URL:

**⚠️ QUAN TRỌNG:** Khi gọi API, chỉ cần sử dụng đường dẫn tương đối không có prefix `/api`:

- ✅ **Đúng:** `/Admin/users`, `/users/get-all`, `/auth/Login`
- ❌ **Sai:** `/api/Admin/users`, `/api/users/get-all`, `/api/auth/Login`

`ClientApi` sẽ tự động thêm base URL và prefix `/api` nếu cần. Chỉ cần truyền đường dẫn endpoint tương đối.

**AccessToken tự động:** `ClientApi` sẽ tự động lấy `accessToken` từ `localStorage` và thêm vào header `Authorization: Bearer <token>` cho các request không phải public route.

### Server-Side API (fetch.server)

Sử dụng các hàm từ `@/@core/base/fetch/fetch.server` để gọi API ở server-side (Server Components, API Routes).

#### Các hàm có sẵn:

- `Get<T>(endpoint, options?)` - GET request
- `GetAll<T>(endpoint, params, options?)` - GET với query params (pagination)
- `Post<T>(endpoint, body, options?)` - POST request
- `Put<T>(endpoint, body, options?)` - PUT request
- `Patch<T>(endpoint, body, options?)` - PATCH request
- `Delete<T>(endpoint, options?)` - DELETE request
- `Upload<T>(endpoint, body, options?)` - Upload file

#### Cách sử dụng:

```typescript
import { Get, GetAll, Post, Put, Delete } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

// GET single item
const result = await Get<User>('/users/get-one/123')
if (result.success) {
  //console.log('User:', result.data)
}

// GET với pagination
const params: BaseQueryRequest = {
  page: 1,
  size: 10,
  sortBy: 'createdAt',
  sortType: 'desc'
}
const listResult = await GetAll<User[]>('/users/get-all', params)

// POST request
const createResult = await Post<User>('/users/create', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT request
const updateResult = await Put<User>('/users/update/123', {
  name: 'Jane Doe'
})

// DELETE request
const deleteResult = await Delete('/users/delete/123')
```

### Tạo Service

Tạo service trong thư mục `src/services/` để tổ chức các API calls:

```typescript
import { Get, GetAll, Post, Put, Delete } from '@/@core/base/fetch/fetch.server'
import type { BaseQueryRequest } from '@/types'

const USER_ENDPOINTS = {
  GET_ALL: '/users/get-all',
  GET_ONE: '/users/get-one',
  CREATE: '/users/create',
  UPDATE: '/users/update',
  DELETE: '/users/delete'
} as const

export const userService = {
  getAll: (params: BaseQueryRequest) => GetAll<User[]>(USER_ENDPOINTS.GET_ALL, params),
  getOne: (id: string) => Get<User>(`${USER_ENDPOINTS.GET_ONE}/${id}`),
  create: (data: CreateUserRequest) => Post<User>(USER_ENDPOINTS.CREATE, data),
  update: (id: string, data: UpdateUserRequest) => Put<User>(`${USER_ENDPOINTS.UPDATE}/${id}`, data),
  delete: (id: string) => Delete(`${USER_ENDPOINTS.DELETE}/${id}`)
}
```

---

## Form Component

Sử dụng `useAppForm` và các component form từ `@/@core/components/custom-form` để tạo form với validation.

### Cấu trúc Form

```typescript
import { Form, useAppForm } from '@/@core/components/custom-form'
import { FormControl } from '@/@core/components/custom-form/form-control'
import { FormError } from '@/@core/components/custom-form/form-error'
import { FormItem } from '@/@core/components/custom-form/form-item'
import { FormLabel } from '@/@core/components/custom-form/form-label'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { TextField, Button } from '@mui/material'

const MyForm = () => {
  const { t } = useTranslation()

  // Định nghĩa form với default values và validation rules
  const form = useAppForm(
    {
      // [fieldName]: [defaultValue, validationRules?]
      name: [
        '', // default value
        {
          required: true, // hoặc 'Custom error message'
          min: 5,
          max: 50
        }
      ],
      email: [
        '',
        {
          required: 'Email là bắt buộc',
          email: true
        }
      ],
      age: [
        0,
        {
          required: true,
          minNumber: [18, 'Tuổi phải từ 18 trở lên'],
          maxNumber: [100, 'Tuổi không được vượt quá 100']
        }
      ],
      password: [
        '',
        {
          required: true,
          min: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
          pattern: [/^[A-Za-z0-9]+$/, 'Mật khẩu chỉ được chứa chữ và số']
        }
      ]
    },
    t // translation function
  )

  const onSubmit = async (data: any) => {
    //console.log('Form data:', data)
    // Gọi API hoặc xử lý dữ liệu
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormItem>
        <FormLabel required>Tên</FormLabel>
        <FormError
          name='name'
          render={error => (
            <FormControl name='name' error={error} helperText={error?.message}>
              <TextField fullWidth placeholder='Nhập tên của bạn' />
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
              <TextField fullWidth type='email' placeholder='Nhập email' />
            </FormControl>
          )}
        />
      </FormItem>

      <FormItem>
        <FormLabel required>Tuổi</FormLabel>
        <FormError
          name='age'
          render={error => (
            <FormControl name='age' error={error} helperText={error?.message}>
              <TextField fullWidth type='number' placeholder='Nhập tuổi' />
            </FormControl>
          )}
        />
      </FormItem>

      <Button type='submit' variant='contained' color='primary'>
        Gửi
      </Button>
    </Form>
  )
}
```

### Validation Rules

Các validation rules hỗ trợ:

- `required: boolean | string` - Bắt buộc nhập
- `min: number | [number, string]` - Độ dài tối thiểu (string)
- `max: number | [number, string]` - Độ dài tối đa (string)
- `minNumber: number | [number, string]` - Giá trị số tối thiểu
- `maxNumber: number | [number, string]` - Giá trị số tối đa
- `email: boolean | string` - Kiểm tra định dạng email
- `pattern: RegExp | [RegExp, string]` - Regex pattern
- `date: boolean | string` - Kiểm tra định dạng ngày
- `custom: [(value: any) => boolean, string]` - Validation tùy chỉnh

### Các loại Input

#### TextField

```typescript
<FormControl name='name' error={error} helperText={error?.message}>
  <TextField fullWidth placeholder='Nhập tên' />
</FormControl>
```

#### Select/Dropdown

```typescript
<FormControl name='country' error={error} helperText={error?.message}>
  <TextField select fullWidth>
    <MenuItem value='VN'>Việt Nam</MenuItem>
    <MenuItem value='US'>United States</MenuItem>
  </TextField>
</FormControl>
```

#### Checkbox

```typescript
<FormControl name='subscribe' error={error} helperText={error?.message}>
  <FormControlLabel control={<Checkbox />} label='Đăng ký nhận tin' />
</FormControl>
```

#### Switch

```typescript
<FormControl name='notifications' error={error} helperText={error?.message}>
  <FormControlLabel control={<Switch />} label='Bật thông báo' />
</FormControl>
```

#### DatePicker (với moment)

```typescript
import { DatePicker } from '@mui/x-date-pickers'
import moment from 'moment'

<FormControl name='birthDate' error={error} helperText={error?.message}>
  <DatePicker format='YYYY-MM-DD' label='Chọn ngày sinh' />
</FormControl>
```

---

## Table Component

Sử dụng `CustomTable` từ `@/@core/components/custom-table` để hiển thị dữ liệu dạng bảng với pagination, sorting, search.

### Cấu trúc Table

```typescript
import { CustomTable } from '@/@core/components/custom-table'
import type { ITableConfig, ITableItem, ITableData } from '@/types/table.type'
import { useState, useEffect } from 'react'

const MyTable = () => {
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<ITableData>({
    data: [],
    totalItem: 0,
    pageIndex: 1,
    pageSize: 10
  })

  // Định nghĩa cấu hình cột
  const tableConfig: ITableConfig[] = [
    {
      title: 'Tên người dùng',
      key: 'username',
      width: '150px',
      sort: true, // Cho phép sort
      align: 'left'
    },
    {
      title: 'Email',
      key: 'email',
      width: '200px',
      sort: true
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: '100px',
      sort: false
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '150px',
      sort: false
    }
  ]

  // Hàm fetch dữ liệu
  const fetchData = async (params: any = {}) => {
    setLoading(true)
    try {
      const { page = 1, size = 10, sortBy, sortType, ...searchParams } = params

      const result = await userService.getAll({
        page,
        size,
        sortBy,
        sortType,
        ...searchParams
      })

      if (result.success) {
        setTableData({
          data: result.data || [],
          totalItem: result.totalItem || 0,
          pageIndex: page,
          pageSize: size
        })
      }
    } catch (error) {
    //  console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi chọn checkbox
  const handleCheckedChange = (checked: any) => {
    //console.log('Checked items:', checked.checkedList)
    //console.log('Check all:', checked.checkAll)
  }

  // Xử lý khi click vào row
  const handleRowClick = (row: ITableItem) => {
    //console.log('Row clicked:', row)
  }

  // Custom render cho một cột cụ thể
  const customRow = {
    status: (row: ITableItem) => {
      return row.status === 'active' ? (
        <Chip label='Hoạt động' color='success' />
      ) : (
        <Chip label='Không hoạt động' color='error' />
      )
    },
    action: (row: ITableItem) => {
      return (
        <Button onClick={() => handleEdit(row)}>Sửa</Button>
      )
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <CustomTable
      tableConfig={tableConfig}
      data={tableData.data}
      totalItem={tableData.totalItem}
      pageSize={tableData.pageSize}
      isLoading={loading}
      showCheckbox={true} // Hiển thị checkbox
      tableHeight={600} // Chiều cao bảng
      onSearch={fetchData} // Callback khi search/pagination/sort
      onCheckedChange={handleCheckedChange} // Callback khi chọn checkbox
      onRowClick={handleRowClick} // Callback khi click row
      searchOptions={{
        showSearch: true,
        placeholder: 'Tìm kiếm...',
        debounceTime: 500,
        searchField: 'email', // Field để search
        searchWithButton: {
          searchButtonText: 'Tìm kiếm',
          variant: 'contained',
          color: 'primary'
        }
      }}
      customRow={customRow} // Custom render cho các cột
    />
  )
}
```

### Table Config Properties

- `title: string` - Tiêu đề cột (có thể dùng translation key)
- `key: string` - Key của field trong data
- `width?: string` - Độ rộng cột (ví dụ: '150px')
- `align?: 'left' | 'center' | 'right'` - Căn lề
- `sort?: boolean` - Cho phép sort
- `prefix?: string` - Text hiển thị trước giá trị
- `suffix?: string` - Text hiển thị sau giá trị
- `hidden?: boolean` - Ẩn cột

### Table Props

- `tableConfig: ITableConfig[]` - Cấu hình các cột (bắt buộc)
- `data: ITableItem[]` - Dữ liệu hiển thị (bắt buộc)
- `totalItem?: number` - Tổng số item (cho pagination)
- `pageSize?: number` - Số item mỗi trang (mặc định: 10)
- `isLoading?: boolean` - Trạng thái loading
- `showCheckbox?: boolean` - Hiển thị checkbox
- `tableHeight?: number | string` - Chiều cao bảng
- `onSearch?: (params: any) => void` - Callback khi search/pagination/sort
- `onCheckedChange?: (checked: any) => void` - Callback khi chọn checkbox
- `onRowClick?: (row: ITableItem) => void` - Callback khi click row
- `searchOptions?: TableSearchOptions` - Cấu hình search bar
- `customRow?: Record<string, (row: ITableItem) => JSX.Element>` - Custom render cho các cột
- `customCell?: Record<string, JSX.Element>` - Custom render cho header cell

---

## Dialog Component

Sử dụng `CustomDialog` từ `@/@core/components/dialogs/custom-dialog` để tạo dialog/modal.

### Cách sử dụng:

```typescript
import CustomDialog from '@/@core/components/dialogs/custom-dialog'
import { Button } from '@mui/material'
import { useState } from 'react'

const MyComponent = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Mở Dialog</Button>

      <CustomDialog
        open={open}
        setOpen={setOpen}
        header={<h2>Tiêu đề Dialog</h2>}
        content={
          <div>
            <p>Nội dung dialog ở đây</p>
          </div>
        }
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant='contained' onClick={() => setOpen(false)}>
              Xác nhận
            </Button>
          </>
        }
        closeButton={true} // Hiển thị nút đóng
        maxWidth='sm' // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
        persistent={false} // Không cho đóng khi click outside
        contentBorder={true} // Hiển thị border giữa header/content/actions
      />
    </>
  )
}
```

### Dialog Props

- `open: boolean` - Trạng thái mở/đóng
- `setOpen: (open: boolean) => void` - Hàm set state
- `header?: React.ReactNode` - Header của dialog
- `content?: React.ReactNode` - Nội dung chính
- `actions?: React.ReactNode` - Footer actions
- `closeButton?: boolean` - Hiển thị nút đóng
- `closeIcon?: string` - Icon class cho nút đóng (mặc định: 'tabler-x')
- `maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - Độ rộng tối đa
- `persistent?: boolean` - Không cho đóng khi click outside hoặc ESC
- `contentBorder?: boolean` - Hiển thị border
- `contentClassName?: string` - Custom class cho content
- `headerClassName?: string` - Custom class cho header
- `actionsClassName?: string` - Custom class cho actions

---

## Toast Notification

Sử dụng các hàm từ `@/services/toast.service` để hiển thị thông báo.

### Cách sử dụng:

```typescript
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '@/services/toast.service'

// Success toast
showSuccessToast('Thao tác thành công!')

// Error toast
showErrorToast('Đã xảy ra lỗi!')

// Warning toast
showWarningToast('Cảnh báo!')

// Info toast
showInfoToast('Thông tin')

// Với custom options
showSuccessToast('Thành công!', {
  autoClose: 5000,
  position: 'top-center'
})
```

### Toast Options

- `position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'`
- `autoClose?: number` - Thời gian tự đóng (ms)
- `hideProgressBar?: boolean`
- `closeOnClick?: boolean`
- `pauseOnHover?: boolean`
- `draggable?: boolean`

---

## Các Component Khác

### Loading Component

```typescript
import { Loading } from '@/@core/components/loading'

<Loading />
```

### Skeleton Component

```typescript
import { Skeleton } from '@/@core/components/skeleton'

<Skeleton variant='rectangular' width={200} height={100} />
```

### DateRangePicker

```typescript
import { DateRangePicker } from '@/@core/components/date-range-picker'

<DateRangePicker
  onChange={(startDate, endDate) => {
    // console.log('Start:', startDate, 'End:', endDate)
  }}
/>
```

### Option Menu

```typescript
import { OptionMenu } from '@/@core/components/option-menu'

<OptionMenu
  options={[
    { text: 'Sửa', icon: 'tabler-edit', onClick: () => {} },
    { text: 'Xóa', icon: 'tabler-trash', onClick: () => {} }
  ]}
/>
```

---

## Hooks & Utilities

### useTranslation

Hook để sử dụng translation/i18n:

```typescript
import { useTranslation } from '@/@core/hooks/useTranslation'

const MyComponent = () => {
  const { t } = useTranslation()

  return <div>{t('common.hello')}</div>
}
```

### useSettings

Hook để truy cập theme settings:

```typescript
import { useSettings } from '@/@core/hooks/useSettings'

const MyComponent = () => {
  const { settings, saveSettings } = useSettings()

  return (
    <div>
      <p>Theme: {settings.mode}</p>
      <button onClick={() => saveSettings({ mode: 'dark' })}>
        Đổi theme
      </button>
    </div>
  )
}
```

### useDebouncedCallback

Hook để debounce callback:

```typescript
import { useDebouncedCallback } from '@/@core/hooks/useDebouncedCallBack'

const MyComponent = () => {
  const debouncedSearch = useDebouncedCallback((value: string) => {
    // console.log('Search:', value)
  }, 500)

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder='Tìm kiếm...'
    />
  )
}
```

---

## Best Practices

1. **API Calls**: Luôn sử dụng service layer để tổ chức API calls
2. **Form Validation**: Sử dụng `useAppForm` với validation rules rõ ràng
3. **Table**: Định nghĩa `tableConfig` trong file config riêng để dễ quản lý
4. **Error Handling**: Luôn xử lý error và hiển thị toast thông báo
5. **Loading States**: Luôn hiển thị loading state khi fetch data
6. **Type Safety**: Sử dụng TypeScript types cho tất cả data structures
7. **Internationalization (i18n)**: ⚠️ **QUAN TRỌNG** - Luôn tích hợp i18n cho tất cả text cứng trong màn hình mới:
   - Sử dụng `useTranslation` hook từ `@/@core/hooks/useTranslation`
   - Thay thế tất cả text cứng bằng `t('key.path')`
   - Thêm translation keys vào cả `vi.json` và `en.json`
   - Không được để text cứng trong component (trừ các giá trị động như số, ngày tháng)

---

## Ví Dụ Hoàn Chỉnh

### Component với Form và API Call

```typescript
'use client'

import { useState } from 'react'
import { Form, useAppForm } from '@/@core/components/custom-form'
import { FormControl } from '@/@core/components/custom-form/form-control'
import { FormError } from '@/@core/components/custom-form/form-error'
import { FormItem } from '@/@core/components/custom-form/form-item'
import { FormLabel } from '@/@core/components/custom-form/form-label'
import { TextField, Button } from '@mui/material'
import { ClientApi } from '@/services/client-api.service'
import { showSuccessToast, showErrorToast } from '@/services/toast.service'
import { useTranslation } from '@/@core/hooks/useTranslation'

const CreateUserForm = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const form = useAppForm(
    {
      name: ['', { required: 'Tên là bắt buộc', min: 3 }],
      email: ['', { required: true, email: true }],
      age: [0, { required: true, minNumber: [18, 'Tuổi phải từ 18'] }]
    },
    t
  )

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await ClientApi.post('/users/create', data)
      response
        .onSuccess(() => {
          showSuccessToast('Tạo người dùng thành công!')
          form.reset()
        })
        .onError((error) => {
          showErrorToast(error.message)
        })
    } catch (error) {
      showErrorToast('Đã xảy ra lỗi!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormItem>
        <FormLabel required>Tên</FormLabel>
        <FormError
          name='name'
          render={error => (
            <FormControl name='name' error={error} helperText={error?.message}>
              <TextField fullWidth placeholder='Nhập tên' />
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
              <TextField fullWidth type='email' placeholder='Nhập email' />
            </FormControl>
          )}
        />
      </FormItem>

      <Button type='submit' variant='contained' disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Tạo người dùng'}
      </Button>
    </Form>
  )
}
```

---

Chúc bạn code vui vẻ! 🚀
