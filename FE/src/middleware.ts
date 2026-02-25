import { chain } from './middlewares/chain.middleware'
import { i18nMiddleware } from './middlewares/i18n.middleware'
import { roleMiddleware } from './middlewares/role.middleware'

export default chain(i18nMiddleware, roleMiddleware)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)']
}
