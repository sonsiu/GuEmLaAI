import { useEffect, useState } from 'react'
import { Chip } from '@mui/material/'
import { CustomTable } from '@/@core/components/custom-table'
import { TABLE_DEMO_CONFIG } from '@/configs/table.config'
import type { ICheckedList, ITableData, ITableItem } from '@/types/table.type'
import { ClientApi } from '@/services/client-api.service'

const TableDemo = () => {
  const [loading, setLoading] = useState(false)

  const [tableData, setTableData] = useState<ITableData>({
    data: [],
    totalItem: 0,
    pageIndex: 1,
    pageSize: 10
  })

  const fetchUsers = async (params: any = {}) => {
    const { pageIndex = 1, pageSize = 10, sortBy, sortType } = params

    setLoading(true)

    let queryParams = `?limit=${pageSize}&skip=${(pageIndex - 1) * pageSize}`

    if (params.email) {
      queryParams += `&email=${params.email}`
    }

    if (sortBy && sortType) {
      queryParams += `&sortBy=${sortBy}&sortOrder=${sortType}`
    }

    const res = await ClientApi.get<ITableItem>(`https://dummyjson.com/users${queryParams}`)

    setTableData({
      data: (res.getRaw() as any).users || [],
      totalItem: (res.getRaw() as any).total,
      pageIndex: pageIndex,
      pageSize: pageSize
    })

    setLoading(false)
  }

  const handleCheckedChange = (checked: ICheckedList) => {
    //console.log('🚀 ~ handleCheckedChange ~ checked:', checked)
  }

  const handleRowClick = (row: ITableItem) => {
    //console.log('🚀 ~ handleRowClick ~ row:', row)
  }

  const status = (row: ITableItem) => {
    return row.status === 'active' ? <Chip label='Active' color='success' /> : <Chip label='Inactive' color='error' />
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <>
      <CustomTable
        tableConfig={TABLE_DEMO_CONFIG}
        {...tableData}
        showCheckbox={true}
        isLoading={loading}
        onSearch={fetchUsers}
        onCheckedChange={handleCheckedChange}
        searchOptions={{
          showSearch: true,
          placeholder: 'Search users',
          debounceTime: 500,
          searchField: 'email',
          searchWithButton: {
            searchButtonText: 'Search',
            variant: 'contained',
            color: 'primary'
          }
        }}
        onRowClick={handleRowClick}
        customRow={{
          status: (row: ITableItem) => status(row),
          email: (row: ITableItem) => <span className='text-warning'>{row.email}</span>
        }}
        customCell={{
          email: <span className='text-warning'>King</span>
        }}
      />
    </>
  )
}

export default TableDemo
