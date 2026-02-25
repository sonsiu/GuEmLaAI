export const PATHS = {
  API: '/api/:path*',
  EXCLUDED: {
    STATIC: ['_next', 'assets', 'favicon.ico']
  }
}

export const configs = {
  api: {
    matcher: [PATHS.API]
  },

  i18n: {
    matcher: [`/((?!api|${PATHS.EXCLUDED.STATIC.join('|')}).*)`]
  }
}
