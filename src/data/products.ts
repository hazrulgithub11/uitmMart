export interface Product {
  id: number;
  title: string;
  price: number;
  discount: number | null;
  image: string;
  cod: boolean;
}

export const products: Product[] = [
  {
    id: 1,
    title: 'Satisfyingfaction Hoodie Zipper',
    price: 123.75,
    discount: 10,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 2,
    title: 'HITAM Bintang Slip On Loafers Shoes',
    price: 29.15,
    discount: 54,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 3,
    title: 'Hades Rebel Sweater Knit - Genuine',
    price: 208.42,
    discount: null,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 4,
    title: 'Jacket Mmxiv JACKET HIGH CLUB Bordeaux Red',
    price: 121.99,
    discount: 9,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 5,
    title: 'Nerveatte Polizei - Baggy Sweatpants 330GSM',
    price: 116.05,
    discount: null,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 6,
    title: 'POCO X7 Pro 6000mAh battery+90W',
    price: 1299.00,
    discount: 13,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 7,
    title: 'GRAFEN Root Booster Shampoo',
    price: 92.82,
    discount: 61,
    image: '/images/placeholder.svg',
    cod: true
  },
  {
    id: 8,
    title: 'Voyagstuffofficial - Star Sora V1 Men\'s Black',
    price: 86.89,
    discount: 36,
    image: '/images/placeholder.svg',
    cod: true
  }
]; 