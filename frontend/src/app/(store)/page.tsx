import { Metadata } from 'next';
import { HeroSlider } from '@/components/home/HeroSlider';
import { FeaturedCategories } from '@/components/home/FeaturedCategories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { BestSellers } from '@/components/home/BestSellers';
import { NewArrivals } from '@/components/home/NewArrivals';
import { FlashSale } from '@/components/home/FlashSale';
import { Testimonials } from '@/components/home/Testimonials';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { InstagramSection } from '@/components/home/InstagramSection';

export const metadata: Metadata = {
  title: 'Beauty Center — Luxury Beauty Store',
  description: 'Discover premium skincare, makeup, fragrance, and beauty products.',
};

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <FeaturedCategories />
      <FeaturedProducts />
      <BestSellers />
      <NewArrivals />
      <FlashSale />
      <Testimonials />
      <NewsletterSection />
      <InstagramSection />
    </>
  );
}
