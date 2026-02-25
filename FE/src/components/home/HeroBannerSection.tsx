'use client'

import React from 'react'
import { useTranslation } from '@/@core/hooks/useTranslation'
import { Compare } from '@/views/try-on/components/ui/Compare'

const HeroBannerSection: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <section className='relative overflow-hidden border-b border-primary'>

      {/* Animated background elements */}
      <div
        className='absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl'
        style={{ backgroundColor: 'var(--mui-palette-primary-lighterOpacity)' }}
      ></div>
      <div
        className='absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl'
        style={{ backgroundColor: 'var(--mui-palette-error-lighterOpacity)' }}
      ></div>

      <div className='relative w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center'>
          {/* Text Content */}
          <div className='space-y-6 sm:space-y-8'>
            <div className='space-y-2'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight'>
                <span
                  className='bg-clip-text text-transparent'
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-error-main), var(--mui-palette-warning-main))'
                  }}
                >
                  {t('home.heroBanner.aiPowered')}
                </span>
                <br />
                {t('home.heroBanner.fashionStudio')}
              </h1>
              <p className='text-lg sm:text-xl text-gray-600 dark:text-gray-400'>
                {t('home.heroBanner.subtitle')}
              </p>
            </div>

            <p className='text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg'>
              {t('home.heroBanner.description')}
            </p>
          </div>

          {/* Hero Image with Compare Component */}
          <div className='relative h-256 sm:h-256 lg:h-full min-h-80'>
            <div
              className='absolute inset-0 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden'
              style={{
                background: 
                  'linear-gradient(to bottom right, var(--mui-palette-primary-lightOpacity), var(--mui-palette-error-lightOpacity))'
              }}
            >
              <div className='absolute inset-0 flex items-center justify-center p-4'>
                <div className='w-full h-full rounded-xl overflow-hidden'>
                  <Compare
                    firstImage='/landing/item_0.jpg'
                    secondImage='/landing/item_1.png'
                    slideMode='drag'
                    className='relative h-full w-full'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroBannerSection

