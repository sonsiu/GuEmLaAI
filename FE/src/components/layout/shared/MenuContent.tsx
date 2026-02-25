import { useCallback, useMemo } from 'react'
import { MenuItem as VerticalMenuItem, MenuSection, SubMenu as VerticalSubMenu } from '@menu/vertical-menu'
import { MenuItem as HorizontalMenuItem, SubMenu as HorizontalSubMenu } from '@menu/horizontal-menu'
import { useTranslation } from '@/@core/hooks/useTranslation'
import type { IMenu } from '@/configs/sidebar.config'
import CustomChip from '@/@core/components/mui/Chip'

interface MenuContentProps {
  items: IMenu[]
  layout?: 'vertical' | 'horizontal'
}

const MenuContent = ({ items, layout = 'vertical' }: MenuContentProps) => {
  const { lang, t } = useTranslation()

  const MenuComponents = useMemo(
    () => ({
      MenuItem: layout === 'vertical' ? VerticalMenuItem : HorizontalMenuItem,
      SubMenu: layout === 'vertical' ? VerticalSubMenu : HorizontalSubMenu
    }),
    [layout]
  )

  const createIcon = useCallback((iconClass?: string) => {
    if (!iconClass) return undefined
    return <i className={iconClass} />
  }, [])

  const getFullPath = useCallback((itemPath?: string, parentPath: string = '') => {
    return parentPath ? `${parentPath}/${itemPath || ''}` : itemPath || ''
  }, [])

  const renderMenuItem = useCallback(
    (item: IMenu, parentPath: string = '', key: string) => {
      const { MenuItem, SubMenu } = MenuComponents
      const fullPath = getFullPath(item.routerLink, parentPath)
      const icon = createIcon(item.icon)

      if (item.children?.length)
        return (
          <SubMenu
            key={key}
            label={t(item.label)}
            icon={icon}
            suffix={<CustomChip label={item.children.length} size='small' color='error' round='true' />}
          >
            {item.children.map((child, index) => renderMenuItem(child, fullPath, `${key}-${index}`))}
          </SubMenu>
        )

      return (
        <MenuItem key={key} href={`/${lang}/${fullPath}`} icon={icon}>
          {t(item.label)}
        </MenuItem>
      )
    },
    [MenuComponents, lang, createIcon, getFullPath, t]
  )

  return (
    <>
      {items?.map((item, index) => {
        if (item.section && layout === 'vertical') {
          return (
            <MenuSection key={item.section + index} label={item.section}>
              {renderMenuItem(item, '', `${item.routerLink}-${index}`)}
            </MenuSection>
          )
        }

        return renderMenuItem(item, '', `${item.routerLink}-${index}`)
      })}
    </>
  )
}

export default MenuContent
