'use client'

import React from 'react'
import Image from 'next/image'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import CategoriesMarquee from './CategoriesMarquee'
import Carousel, { CarouselSlide } from './Carousel'

const Hero = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

  function handleBannerClick(payload) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'banner_click', {
        banner_index: payload.index,
        banner_id: payload.id,
        ...payload.meta,
      })
    }
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'banner_click', ...payload }),
    }).catch(() => {})
  }

  return (
    <div className='mx-6'>
      <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
        <div className='relative flex-1 flex flex-col bg-gray-300 rounded-3xl xl:min-h-100 group'>
          <div className='p-5 sm:p-16'>
            <div className='inline-flex items-center gap-3 bg-gray-900 text-gray-500 pr-4 p-1 rounded-full text-xs sm:text-sm'>
              <span className='bg-gray-400 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>NEWS</span> 20% Shipping Discount on Orders Above {currency}1,000,000.00! <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
            </div>
            <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-medium bg-gradient-to-r from-slate-600 to-[#595e57] bg-clip-text text-transparent max-w-xs  sm:max-w-md'>
              Gadgets you'll love. Prices you'll trust.
            </h2>
            <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
              <p>Perfect for small and medium-sized business.</p>
              <p>Order from the comfort of your home/office anywhere nation wide.</p>
            </div>
            <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
              <p>Starts from</p>
              <p className='text-3xl'>{currency}40,000</p>
            </div>
            <button className='bg-slate-800 text-white text-sm py-2.5 px-7 sm:py-5 sm:px-12 mt-4 sm:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'>Shop Now!</button>
          </div>

          {/* keep large image on wide screens */}
          <div className='hidden sm:block sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm'>
            <Image src={assets.hero_model_img} alt='' width={420} height={420} />
          </div>
        </div>

        <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm text-slate-600'>
          <Carousel
            options={{
              breakpoints: [
                { width: 0, perView: 1 },
                { width: 640, perView: 1 },
                { width: 900, perView: 2 }, // show 2 per view >=900px
                { width: 1200, perView: 2 },
              ],
              gap: 12,
              autoplay: true,
              autoplayInterval: 4500,
              loop: true,
              showDots: true,
              showControls: true,
              onBannerClick: handleBannerClick,
            }}
          >
            <CarouselSlide id='promo-best' meta={{ type: 'best_products' }}>
              <div className='flex-1 flex items-center justify-between w-full bg-gray-200 rounded-3xl p-6 px-8 group'>
                <div>
                  <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#918e8a] bg-clip-text text-transparent max-w-40'>Best products</p>
                  <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                </div>
                <div className='w-35'>
                  <Image src={assets.hero_product_img1} alt='best product' width={120} height={120} loading='lazy' placeholder={assets.hero_product_img1Blur ? 'blur' : undefined} blurDataURL={assets.hero_product_img1Blur} />
                </div>
              </div>
            </CarouselSlide>

            <CarouselSlide id='promo-discount' meta={{ type: 'discount' }}>
              <div className='flex-1 flex items-center justify-between w-full bg-gray-400 rounded-3xl p-6 px-8 group'>
                <div>
                  <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#263240] bg-clip-text text-transparent max-w-40'>20% discounts</p>
                  <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                </div>
                <div className='w-35'>
                  <Image src={assets.hero_product_img2} alt='discount product' width={120} height={120} loading='lazy' placeholder={assets.hero_product_img2Blur ? 'blur' : undefined} blurDataURL={assets.hero_product_img2Blur} />
                </div>
              </div>
            </CarouselSlide>

            <CarouselSlide id='promo-hero-model' meta={{ type: 'hero_model' }}>
              <div className='bg-white rounded-3xl p-4 flex items-center justify-center'>
                <Image src={assets.hero_model_img} alt='model' width={240} height={240} loading='lazy' placeholder={assets.hero_model_imgBlur ? 'blur' : undefined} blurDataURL={assets.hero_model_imgBlur} />
              </div>
            </CarouselSlide>

            <CarouselSlide id='promo-special' meta={{ type: 'special', campaign: 'spring' }}>
              <div className='bg-gradient-to-r from-indigo-100 to-slate-50 rounded-3xl p-6 flex flex-col items-start'>
                <p className='text-sm text-slate-500'>Limited time</p>
                <p className='text-xl font-semibold mt-2'>Free delivery over {currency}500,000</p>
                <p className='mt-4 text-slate-600'>Shop now and save on bulk orders</p>
              </div>
            </CarouselSlide>
          </Carousel>
        </div>
      </div>

      <CategoriesMarquee />
    </div>
  )
}

export default Hero
