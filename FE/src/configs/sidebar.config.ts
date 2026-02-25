import { USER_ROLE } from '@/@core/constants/global.const'

interface IBaseMenu {
  routerLink?: string
  label: string
  icon?: string
  role?: string
  className?: string
  value?: string
  isActive?: boolean
}

export interface IChildMenu extends IBaseMenu { }

export interface IMenu extends IBaseMenu {
  children?: IChildMenu[]
  section?: string
}

const Admin: IMenu[] = [
  {
    label: 'sidebar.dashboard',
    icon: 'tabler-layout-dashboard',
    routerLink: 'admin'
  },
  {
    label: 'sidebar.userManagement',
    icon: 'tabler-users',
    routerLink: 'admin/user-management'
  },
  {
    label: 'sidebar.publicCollection',
    icon: 'tabler-sparkles',
    routerLink: 'admin/public-collection'
  },
  {
    label: 'sidebar.httpLogging',
    icon: 'tabler-chart-line',
    routerLink: 'admin/http-logging'
  },
  {
    label: 'sidebar.globalNotifications',
    icon: 'tabler-bell',
    routerLink: 'admin/global-notifications'
  }
]

const User: IMenu[] = [
  {
    label: 'sidebar.home',
    icon: 'tabler-play',
    routerLink: 'home'
  },
  {
    label: 'sidebar.tryOn',
    icon: 'tabler-hanger',
    routerLink: 'try-on'
  },
  {
    label: 'sidebar.outfitSuggest',
    icon: 'tabler-sparkles',
    routerLink: 'outfit-suggest'
  },
  {
    label: 'sidebar.wardrobe',
    icon: 'tabler-shirt',
    routerLink: 'wardrobe'
  },
  {
    label: 'sidebar.calendar',
    icon: 'tabler-calendar',
    routerLink: 'calendar'
  },
  {
    label: 'sidebar.referral',
    icon: 'tabler-gift',
    routerLink: 'referral'
  }

]

export const MappingMenuByRoles = {
  [USER_ROLE.ADMIN]: Admin,
  [USER_ROLE.USER]: User
}
