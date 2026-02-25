'use client'

import Link from 'next/link'
import { Compare } from '@/views/try-on/components/ui/Compare'
import LanguageDropdown from '@/components/layout/shared/LanguageDropdown'
import { useTranslation } from '@/@core/hooks/useTranslation'

export default function LandingPage() {
  const { t, lang } = useTranslation()
  return (
    <div className='min-h-screen bg-background-default' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
      <main>
        <div className='relative flex flex-col min-h-[1000px] bg-background-default' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
          <div className='relative shrink-0 h-full w-full overflow-x-hidden overflow-y-auto'>
            <div className='relative flex flex-col items-center overflow-auto'>
              {/* Navbar */}
              <nav className='fixed top-0 left-0 right-0 z-50 flex items-center justify-center w-full py-4 md:z-40'>
                <div className='flex items-center justify-between w-full max-w-none px-4 py-0 bg-transparent rounded-none md:max-w-screen-lg md:px-6 md:py-3 md:backdrop-blur-[48px] md:bg-white/20 md:rounded-full'>
                  <Link aria-label='Alta Homepage' href='/' className='block'>
                    <img
                      src='/logo.png'
                      alt='Icon'
                      className='h-[28.8px] w-[136px]'
                    />
                  </Link>
                  <LanguageDropdown />
                </div>
              </nav>

              {/* Hero Section */}
              <section 
                className='relative flex flex-col items-center w-full z-10 overflow-hidden pt-8 md:pt-20'
                style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
              >
                <span className='flex flex-col items-center h-full w-full pt-8 pb-24 px-5 md:pb-0 md:px-0'>
                  <div className='flex flex-col items-center max-w-screen-lg w-full mx-auto'>
                    <h1 
                      className='text-[84px] font-bold leading-[88px] text-left w-full mb-8 md:text-[150px] md:leading-[150px] md:w-min md:mb-10 tracking-tight'
                      style={{
                        background: 'linear-gradient(to right, var(--mui-palette-primary-main), var(--mui-palette-error-main), var(--mui-palette-warning-main))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {t('landing.hero.title1')}{' '}
                      <span className='text-[84px] leading-[88px] md:text-[150px] md:leading-[150px]'>{t('landing.hero.title2')}</span>
                    </h1>
                    <p 
                      className='text-base leading-6 max-w-none text-left mb-6 md:text-xl md:leading-7 md:max-w-[675px] md:text-center md:mb-10'
                      style={{ color: 'var(--mui-palette-text-secondary)' }}
                    >
                      {t('landing.hero.subtitle')}
                    </p>
                    <span className='flex flex-col items-center justify-center gap-y-4 w-full mb-10 md:mb-16'>
                      <Link
                        href={`/${lang}/login`}
                        className='flex items-center gap-x-3 px-14 py-6 text-lg font-semibold rounded-full text-center whitespace-nowrap md:text-xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-sm'
                        style={{
                          backgroundColor: 'var(--mui-palette-primary-main)',
                          color: 'white'
                        }}
                      >
                        {t('landing.hero.signIn')}
                      </Link>
                      <Link
                        href={`/${lang}/register`}
                        className='block px-8 py-6 text-lg font-semibold rounded-full border-2 text-center md:text-xl transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-sm'
                        style={{
                          borderColor: 'var(--mui-palette-primary-main)',
                          color: 'var(--mui-palette-primary-main)',
                          backgroundColor: 'transparent'
                        }}
                      >
                        {t('landing.hero.signUp')}
                      </Link>
                    </span>
                  </div>

                  <span className='relative block max-w-screen-2xl w-full mx-auto'>
                    {/* clothes sides (desktop) */}
                    <div className='absolute hidden h-[806px] justify-between w-full z-0 p-24 left-0 top-0 md:flex'>
                      <div className='grid shrink-0 grid-flow-col grid-rows-[repeat(2,minmax(0px,1fr))] h-full justify-items-center gap-x-12 gap-y-12'>
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838579/app-assets/landing/pedxfe1ptaxlhweogkw4.webp'
                          alt='DressShirt'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838578/app-assets/landing/x2rsqssl0i3vc7k68gcd.webp'
                          alt='Skirt'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838578/app-assets/landing/yej7ry8lwelwbnwuzz7p.webp'
                          alt='Leather'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838579/app-assets/landing/scwnh4w6hmycge2v0bo6.webp'
                          alt='Top'
                          className='h-full max-w-full'
                        />
                      </div>

                      <div className='flex flex-col h-full gap-x-12 gap-y-12'>
                        {/* <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838579/app-assets/landing/pedxfe1ptaxlhweogkw4.webp'
                          alt='DressShirt'
                          className='h-3/6 max-w-full'
                        /> */}
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1692564634/app-assets/landing/Bottom6_qhnbm8.webp'
                          alt='Skirt'
                          className='h-3/6 max-w-full'
                        />
                      </div>

                      <div className='grid shrink-0 grid-flow-col grid-rows-[repeat(2,minmax(0px,1fr))] h-full justify-items-center gap-x-12 gap-y-12'>
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838578/app-assets/landing/co9uynk9v3bsrvbkytxl.webp'
                          alt='ShoesAndGlasses'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838578/app-assets/landing/kbvr4cvyihifymkgpgsc.webp'
                          alt='Blouson'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838579/app-assets/landing/k5kzx6tz7lio6u0k3oja.webp'
                          alt='Blazer'
                          className='h-full max-w-full'
                        />
                        <img
                          src='https://res.cloudinary.com/flagshipcloud/image/upload/v1730838578/app-assets/landing/jt6rdcvn3qx2mgqey4x1.webp'
                          alt='Bag'
                          className='h-full max-w-full'
                        />
                      </div>
                    </div>

                    {/* phone video */}
                    <div 
                      className='backdrop-blur-lg max-w-none w-full z-10 mx-0 p-3 rounded-[56px] md:max-w-[390px] md:mx-auto md:p-4'
                      style={{ backgroundColor: 'var(--mui-palette-primary-lighterOpacity)' }}
                    >
                      <div className='relative w-full aspect-[9/16] rounded-[42px] overflow-hidden'>
                        <Compare
                          firstImage='https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg'
                          secondImage='https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png'
                          slideMode='drag'
                          className='relative h-full w-full'
                        />
                      </div>
                    </div>
                  </span>
                </span>
              </section>

              {/* Featured Section */}
             

              {/* Talk to Alta Section */}
              <section className='w-full mt-8' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
                <section className='w-full py-4 rounded-b-[48px] md:pt-0 md:pb-24' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
                  <section className='flex flex-col max-w-screen-lg gap-y-4 w-full mx-auto'>
                    <div className='flex flex-col rounded-3xl mt-8' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                      <div className='w-auto mt-8 mx-auto md:w-[756px] md:mt-32'>
                        <p className='text-3xl font-bold leading-9 md:text-[56px] md:leading-[62.72px]' style={{ color: 'var(--mui-palette-text-primary)' }}>
                          {t('landing.talkToAI.title')}
                        </p>
                        <p className='text-3xl leading-9 md:text-[56px] md:leading-[62.72px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                          {t('landing.talkToAI.subtitle')}
                        </p>
                        <p className='text-xl leading-7 max-w-[420px] text-left mt-4 md:mt-6' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                          {t('landing.talkToAI.description')}
                        </p>
                      </div>

                      <div className='relative w-full overflow-hidden mt-4 p-4 md:mt-[54px] md:pb-10'>
                        <div className='relative list-none w-full z-[1] overflow-hidden mx-auto'>
                          <div className='relative flex h-full translate-x-[-699.977px] w-full z-[1]'>
                            <div className='relative shrink-0 h-full w-full mr-10 md:w-[45%]'>
                              <img
                                src='/landing/suggest_1.webp'
                                alt='date'
                                className='shrink-0 max-w-full w-full rounded-3xl'
                              />
                            </div>
                            <div className='relative shrink-0 h-full w-full mr-10 md:w-[45%]'>
                              <img
                                src='/landing/suggest_2.webp'
                                alt='trip'
                                className='shrink-0 max-w-full w-full rounded-3xl'
                              />
                            </div>
                            <div className='relative shrink-0 h-full w-full mr-10 md:w-[45%]'>
                              <img
                                src='/landing/suggest_3.webp'
                                alt='brunch'
                                className='shrink-0 max-w-full w-full rounded-3xl'
                              />
                            </div>
                            <div className='relative shrink-0 h-full w-full ml-0 mr-10 md:w-[45%] md:ml-10'>
                              <img
                                src='/landing/suggest_3.webp'
                                alt='work'
                                className='shrink-0 max-w-full w-full rounded-3xl'
                              />
                            </div>
                          </div>
                        </div>

                        <div 
                          className='absolute text-4xl backdrop-blur-xl leading-10 translate-x-[-50%] z-10 px-8 py-6 rounded-full left-2/4 bottom-20'
                          style={{
                            backgroundColor: 'var(--mui-palette-primary-darkOpacity)',
                            color: 'white'
                          }}
                        >
                          <div>
                            <span>{t('landing.talkToAI.outfitCaption')}</span>
                            <span className='ml-px'>|</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className='grid grid-cols-2 gap-x-4 w-full'>
                      <div className='flex flex-col bg-stone-50 w-full p-12 rounded-3xl' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                        <div className='backdrop-blur-lg bg-white/20 w-full mt-12 mb-0 md:mt-0 md:mb-12 p-3 rounded-[56px] md:p-4'>
                          <div className='relative w-full aspect-[9/16] rounded-[42px] overflow-hidden'>
                            <Compare
                              firstImage='/landing/item_0.jpg'
                              secondImage='/landing/item_1.png'
                              slideMode='drag'
                              className='relative h-full w-full'
                            />
                          </div>
                        </div>
                        <p className='text-3xl leading-9 font-semibold' style={{ color: 'var(--mui-palette-text-primary)' }}>{t('landing.wardrobe.title')}</p>
                        <p className='text-3xl leading-9' style={{ color: 'var(--mui-palette-text-secondary)' }}>{t('landing.wardrobe.subtitle')}</p>
                        <p className='text-3xl leading-9' style={{ color: 'var(--mui-palette-text-secondary)' }}>{t('landing.wardrobe.description')}</p>
                      </div>

                      <div className='flex flex-col bg-stone-50 w-full p-12 rounded-3xl' style={{ backgroundColor: 'var(--mui-palette-action-hover)' }}>
                        <div className='backdrop-blur-lg bg-white/20 w-full mt-12 mb-0 md:mt-0 md:mb-12 p-3 rounded-[56px] md:p-4'>
                          <div className='relative w-full aspect-[9/16] rounded-[42px] overflow-hidden'>
                            <Compare
                              firstImage='/landing/try_on_1.jpg'
                              secondImage='/landing/try_on_2.jpg'
                              slideMode='drag'
                              className='relative h-full w-full'
                            />
                          </div>
                        </div>
                        <p className='text-3xl leading-9 font-semibold' style={{ color: 'var(--mui-palette-text-primary)' }}>{t('landing.tryOn.title')}</p>
                        <p className='text-3xl leading-9' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                          {t('landing.tryOn.subtitle')}
                        </p>
                      </div>
                    </span>
                  </section>
                </section>
              </section>

              {/* Trending Section */}
              <section className='w-full ' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                <section className='w-full pt-12 pb-24 rounded-b-[48px] md:pt-0' style={{ backgroundColor: 'var(--mui-palette-background-paper)' }}>
                  <div className='max-w-screen-lg w-full mx-auto px-5 md:px-0'>
                    <div className='flex flex-col max-w-none w-full ml-0 md:max-w-[650px] md:ml-[10%]'>
                      <p className='text-[40px] font-bold leading-[49.6px] md:text-[56px] md:leading-[63px]' style={{ color: 'var(--mui-palette-text-primary)' }}>
                        {t('landing.trending.title')}
                      </p>
                      <p className='text-[40px] tracking-[-1px] leading-[49.6px] md:text-[56px] md:tracking-[-1.4px] md:leading-[63px]' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                        {t('landing.trending.subtitle')}
                      </p>
                    </div>
                  </div>
                </section>
              </section>

              {/* Style Goal Section */}
              <section className='w-full'>
                <div className='relative flex justify-center pt-20 pb-6 md:pt-36' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                  <div className='flex flex-col max-w-screen-lg w-full px-5 md:items-center md:px-0'>
                    <p className='text-[64px] font-bold leading-[59px] text-left w-full md:text-[88px] md:leading-[81px] md:text-center md:w-fit' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {t('landing.styleGoal.title1')}
                    </p>
                    <p className='text-[64px] leading-[59px] text-left w-full md:text-[88px] md:leading-[81px] md:text-center md:w-fit' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {t('landing.styleGoal.title2')}
                    </p>

                    <div className='flex flex-col gap-y-3 mt-12 md:items-center md:mt-20'>
                      {[
                        t('landing.styleGoal.option1'),
                        t('landing.styleGoal.option2'),
                        t('landing.styleGoal.option3'),
                        t('landing.styleGoal.option4'),
                        t('landing.styleGoal.option5')
                      ].map(text => (
                        <Link
                          key={text}
                          href={`/${lang}/login`}
                          className='block text-2xl leading-8 text-center w-fit px-10 py-6 rounded-full md:text-3xl md:leading-9 font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 active:shadow-sm'
                          style={{
                            backgroundColor: 'var(--mui-palette-primary-main)',
                            color: 'white'
                          }}
                        >
                          {text}
                        </Link>
                      ))}
                    </div>

                    <div className='z-10 mt-[120px] mx-auto md:mx-0'>
                      <img
                        src='/logo-page.png'
                        alt='Icon'
                        className='h-[69px] w-[69px]'
                      />
                    </div>

                    <div className='flex flex-col w-full z-10 mt-20 md:items-center md:flex-row-reverse md:justify-between'>
                      <span className='flex gap-x-6'>
                        <a href='' aria-label='Instagram' className='block'>
                          <img
                            src='https://c.animaapp.com/mix0f2mjLv0JBv/assets/icon-4.svg'
                            alt='Instagram'
                            className='h-[25px] w-6'
                          />
                        </a>
                        <a href='' aria-label='TikTok' className='block'>
                          <img
                            src='https://c.animaapp.com/mix0f2mjLv0JBv/assets/icon-5.svg'
                            alt='TikTok'
                            className='h-[21px] w-[18px]'
                          />
                        </a>
                      </span>

                      <span className='flex gap-x-8 mt-8 md:mt-0'>
                        <img
                          src='/logo.png'
                          alt='Logo'
                          className='h-[28.8px] w-[136px]'
                        />
                        <a href='' className='block'>
                          <span className='text-lg leading-7' style={{ color: 'var(--mui-palette-text-disabled)' }}>{t('landing.footer.privacyPolicy')}</span>
                        </a>
                        <a href='' className='block'>
                          <span className='text-lg leading-7' style={{ color: 'var(--mui-palette-text-disabled)' }}>{t('landing.footer.terms')}</span>
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
