import type { SyntheticEvent } from 'react'
import { useState } from 'react'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import { CircularProgress } from '@mui/material'
import CustomTabList from '../mui/TabList'
import useMediaQuery from '@/@menu/hooks/useMediaQuery'

export interface ITab {
  label: string
  icon?: string
  content: React.ReactNode
  disabled?: boolean
  iconPosition?: 'start' | 'end' | 'top' | 'bottom'
}

interface CustomTabsProps {
  tabs: ITab[]
  orientation?: 'vertical' | 'horizontal'
  spacing?: number
  defaultTab?: number
  onChange?: (value: number) => void
  variant?: 'scrollable' | 'standard' | 'fullWidth'
  pill?: 'true' | 'false'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  className?: string
  bodyClassName?: string
  tabListClassName?: string
  loadingTime?: number
}

const CustomTabs = ({
  tabs,
  orientation = 'horizontal',
  defaultTab = 0,
  onChange,
  variant = 'scrollable',
  pill = 'true',
  color = 'primary',
  className,
  bodyClassName,
  tabListClassName,
  loadingTime = 500
}: CustomTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const isMobile = useMediaQuery('900px')
  const [loadingTab, setLoadingTab] = useState(false)

  const handleChange = (event: SyntheticEvent, value: number) => {
    setLoadingTab(true)
    setActiveTab(value)
    onChange?.(value)
    setTimeout(() => setLoadingTab(false), loadingTime)
  }

  const styles = {
    vertical: {
      tabList: {
        minWidth: 200,
        '& .MuiTab-root': {
          justifyContent: 'flex-start',
          textAlign: 'left',
          minHeight: 48,
          py: 2,
          px: 4
        }
      }
    },
    horizontal: {
      tabList: {
        '& .MuiTab-root': {
          minHeight: 48,
          py: 2,
          px: 4,
          '&:not(:last-child)': {
            mr: 2
          }
        }
      }
    }
  }

  const currentStyles = orientation === 'vertical' ? styles.vertical.tabList : styles.horizontal.tabList

  return (
    <TabContext value={activeTab}>
      <div className={`grid grid-cols-12 gap-2 ${className}`}>
        <div
          className={`col-span-12 ${orientation === 'vertical' ? 'md:col-span-3' : 'col-span-12'} ${tabListClassName}`}
        >
          <CustomTabList
            onChange={handleChange}
            orientation={isMobile ? 'horizontal' : orientation}
            variant={variant}
            pill={pill}
            color={color}
            sx={currentStyles}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                value={index}
                label={tab.label}
                {...(tab.icon ? { icon: <i className={tab.icon} /> } : {})}
                disabled={tab.disabled}
                iconPosition={tab.iconPosition ?? 'start'}
              />
            ))}
          </CustomTabList>
        </div>
        <div className={`col-span-12 ${orientation === 'vertical' ? 'md:col-span-9' : 'col-span-12'} ${bodyClassName}`}>
          <TabPanel value={activeTab} className='p-0'>
            <Box sx={{ height: '100%' }}>
              {loadingTab ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                  <CircularProgress />
                </div>
              ) : (
                tabs[activeTab].content
              )}
            </Box>
          </TabPanel>
        </div>
      </div>
    </TabContext>
  )
}

export default CustomTabs
