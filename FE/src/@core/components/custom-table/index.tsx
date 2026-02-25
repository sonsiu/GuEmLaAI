import { useCallback, useEffect, useMemo, useState } from 'react'
import { TablePagination, Checkbox, Skeleton, Typography, Card, Chip, Divider } from '@mui/material'
import type { ITableConfig, ITableItem, TableSearchOptions } from '@/types/table.type'
import { useTranslation } from '@/@core/hooks/useTranslation'
import tableStyles from '@core/styles/table.module.css'
import TableSearchBar from './table-search-bar'
import SelectActionDropdown from './select-action-dropdown'

interface TableProps {
  tableConfig: ITableConfig[]
  data: ITableItem[]
  showCheckbox?: boolean
  pageSize?: number
  totalItem?: number
  isLoading?: boolean
  tableHeight?: number | string
  onSearch?: (params: any) => void
  onCheckedChange?: (checked: any) => void
  onRowClick?: (row: any) => void
  searchOptions?: TableSearchOptions
  customRow?: Record<string, (row: ITableItem) => JSX.Element>
  customCell?: Record<string, JSX.Element>
}

export const CustomTable = ({
  tableConfig,
  data,
  showCheckbox = false,
  pageSize = 10,
  totalItem = 0,
  isLoading = false,
  tableHeight = 500,
  onSearch,
  onCheckedChange,
  onRowClick,
  searchOptions,
  customRow,
  customCell
}: TableProps) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const [selectedPages, setSelectedPages] = useState<Map<number, string[]>>(new Map())
  const { t } = useTranslation()
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})
  const [checkAll, setCheckAll] = useState(false)

  useEffect(() => {
    onCheckedChange?.({ checkAll: checkAll, checkedList: Array.from(selectedPages.values()).flat() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPages])

  const triggerSearch = useCallback(
    ({
      pageIndex = page + 1,
      pageSize: customPageSize,
      searchParams: overrideParams,
      sortOverride
    }: {
      pageIndex?: number
      pageSize?: number
      searchParams?: Record<string, string>
      sortOverride?: { key: string; direction: 'asc' | 'desc' }
    }) => {
      const finalPageSize = customPageSize ?? rowsPerPage
      const sort = sortOverride ?? sortConfig
      const finalSearchParams = overrideParams ?? searchParams

      onSearch?.({
        page: pageIndex,
        size: finalPageSize,
        ...finalSearchParams,
        ...(sort && {
          sortBy: sort.key,
          sortType: sort.direction
        })
      })

      setPage(pageIndex - 1)
    },
    [onSearch, page, rowsPerPage, searchParams, sortConfig]
  )

  const handleSortClick = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc'

    if (sortConfig && sortConfig.key === columnKey) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }

    setSortConfig({ key: columnKey, direction })
    triggerSearch({ pageIndex: 1, pageSize: rowsPerPage, sortOverride: { key: columnKey, direction } })
  }

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      handleSelectAll(false)

      return
    }

    setSelectedPages(prev => {
      const newMap = new Map(prev)

      newMap.set(page, [])

      return newMap
    })

    setCheckAll(false)
  }

  const handleSelectAll = (isAll: boolean = false) => {
    setSelectedPages(prev => {
      const newMap = new Map(prev)

      isAll
        ? newMap.clear()
        : newMap.set(
            page,
            data.map(n => n.id)
          )
      return newMap
    })

    setCheckAll(isAll)
  }

  const handleClickCheckbox = useCallback(
    (event: React.MouseEvent<unknown>, id: string) => {
      let selectedList = selectedPages.get(page) || []

      if (checkAll) {
        selectedList = data.map(n => n.id)
        setCheckAll(false)
      }

      const alreadySelected = selectedList.includes(id)

      const newSelected = alreadySelected ? selectedList.filter(selectedId => selectedId !== id) : [...selectedList, id]

      setSelectedPages(prev => {
        const newMap = new Map(prev)

        newMap.set(page, newSelected)

        return newMap
      })
    },
    [selectedPages, page, checkAll, data]
  )

  const handleSearch = useCallback(
    (params: Record<string, string>) => {
      setSearchParams(params)
      triggerSearch({
        pageIndex: 1,
        searchParams: params
      })
    },
    [triggerSearch]
  )

  const isSelected = useCallback(
    (id: string) => {
      if (checkAll) return true

      return selectedPages.get(page)?.includes(id) || false
    },
    [checkAll, selectedPages, page]
  )

  const renderTableBody = useCallback(() => {
    if (isLoading) {
      return Array(rowsPerPage)
        .fill(null)
        .map((_, index) => (
          <tr key={`skeleton-${index}`} className={tableStyles.tr}>
            {showCheckbox && (
              <td className={`${tableStyles.td} ${tableStyles.checkbox}`}>
                <Skeleton variant='rectangular' width={24} height={24} />
              </td>
            )}
            {tableConfig.map((column, colIndex) => (
              <td
                key={`skeleton-${index}-${colIndex}`}
                className={tableStyles.td}
                style={{ maxWidth: column.width, minWidth: column.width }}
              >
                <Skeleton variant='text' width='100%' />
              </td>
            ))}
          </tr>
        ))
    }

    if (!data.length) {
      return (
        <tr>
          <td
            colSpan={showCheckbox ? tableConfig.length + 1 : tableConfig.length}
            className={`${tableStyles.td} text-center`}
          >
            <div
              className='flex flex-col items-center justify-center'
              style={{
                minHeight: typeof tableHeight === 'number' ? tableHeight - 100 : 400
              }}
            >
              <i className='tabler-database-off text-6xl text-textSecondary mb-4' />
              <Typography variant='h6' className='mb-2'>
                Không có dữ liệu
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Không có dữ liệu hoặc truy cập lỗi, vui lòng thử lại sau
              </Typography>
            </div>
          </td>
        </tr>
      )
    }

    return data.map((row, rIndex) => {
      const isItemSelected = isSelected(row.id)

      return (
        <tr
          className={`${isItemSelected ? tableStyles.selected : ''} ${!!onRowClick ? tableStyles.onHover : ''}`}
          onClick={() => {
            onRowClick?.(row)
          }}
          role='row'
          key={`${row.id}--${rIndex}`}
        >
          {showCheckbox && (
            <td className={`${tableStyles.checkbox}`} onClick={e => e.stopPropagation()}>
              <Checkbox checked={isItemSelected} onClick={event => handleClickCheckbox(event, row.id)} />
            </td>
          )}
          {tableConfig.map(column => (
            <td
              key={`${row.id}-${column.key}`}
              className={`${column.align ? `text-${column.align}` : 'text-left'}`}
              style={{
                maxWidth: column.width,
                minWidth: column.width,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {customRow?.[column.key] ? (
                customRow[column.key](row)
              ) : (
                <>
                  {column.prefix}
                  {row[column.key]}
                  {column.suffix}
                </>
              )}
            </td>
          ))}
        </tr>
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    data,
    rowsPerPage,
    showCheckbox,
    tableConfig,
    tableHeight,
    t,
    isSelected,
    onRowClick,
    handleClickCheckbox,
    customRow
  ])

  const memoizedTableBody = useMemo(() => renderTableBody(), [renderTableBody])

  const totalSelected = useMemo(() => {
    return Array.from(selectedPages.values()).flat().length
  }, [selectedPages])

  return (
    <>
      {(showCheckbox || searchOptions?.showSearch) && (
        <div className='flex justify-between items-center mb-2 flex-wrap gap-2'>
          {checkAll ? (
            <Chip label={`${totalItem} ${t('table.itemsSelected')}`} color='primary' variant='filled' />
          ) : totalSelected > 0 ? (
            <Chip label={`${totalSelected} ${t('table.itemsSelected')}`} color='primary' variant='filled' />
          ) : (
            <span className='invisible'>Placeholder</span>
          )}
          {searchOptions?.showSearch && <TableSearchBar searchOptions={searchOptions} onSearch={handleSearch} />}
        </div>
      )}
      <Card className='mt-0'>
        <div
          className={isLoading ? 'overflow-hidden' : 'overflow-x-auto'}
          style={{ maxHeight: tableHeight, minHeight: tableHeight }}
        >
          <table className={tableStyles.table}>
            <thead className={`sticky top-0 z-10`}>
              <tr>
                {showCheckbox && (
                  <th className={`${tableStyles.checkbox}`}>
                    <Checkbox
                      indeterminate={
                        (selectedPages.get(page)?.length || 0) > 0 &&
                        (selectedPages.get(page)?.length || 0) < data.length
                      }
                      checked={checkAll || (data.length > 0 && (selectedPages.get(page)?.length || 0) === data.length)}
                      onChange={handleSelectAllClick}
                    />
                    <SelectActionDropdown
                      onSelectPage={() => handleSelectAll()}
                      onSelectAll={() => handleSelectAll(true)}
                    />
                  </th>
                )}
                {tableConfig.map(column => (
                  <th
                    key={column.key}
                    className={`${column.align ? `text-${column.align}` : 'text-left'}`}
                    style={{ maxWidth: column.width, minWidth: column.width }}
                    onClick={() => handleSortClick(column.key)}
                  >
                    {customCell?.[column.key] ? (
                      customCell[column.key]
                    ) : (
                      <div className={`${column.sort ? 'flex items-center gap-1 cursor-pointer select-none' : ''}`}>
                        <span>{t(column.title)}</span>
                        {column.sort && (
                          <span className='ml-2 flex items-center'>
                            {sortConfig && sortConfig.key === column.key ? (
                              sortConfig.direction === 'asc' ? (
                                <i className='tabler-arrow-narrow-up text-base' />
                              ) : (
                                <i className='tabler-arrow-narrow-down text-base' />
                              )
                            ) : (
                              <i className='tabler-arrows-sort text-base text-textSecondary' />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{memoizedTableBody}</tbody>
          </table>
        </div>
        <Divider />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component='div'
          count={totalItem}
          rowsPerPage={rowsPerPage}
          page={page}
          labelRowsPerPage={'Số dòng trên trang'}
          onPageChange={(event, newPage) => {
            triggerSearch({ pageIndex: newPage + 1 })
            const tableContainer = document.querySelector(`.${tableStyles.table}`)?.closest('.overflow-x-auto')

            if (tableContainer) {
              tableContainer.scrollTop = 0
            }
          }}
          onRowsPerPageChange={event => {
            const newSize = parseInt(event.target.value, 10)

            setRowsPerPage(newSize)
            setPage(0)
            triggerSearch({ pageIndex: 1, pageSize: newSize })
          }}
          showFirstButton={true}
          showLastButton={true}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${'trong'} ${count}`}
        />
      </Card>
    </>
  )
}
