import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { Product } from '@prisma/client';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Platform fee percentage (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

// Max length for image URLs to prevent Stripe URL length errors
const MAX_IMAGE_URL_LENGTH = 500;

// Define extended product type to include discount fields
type ExtendedProduct = Product & {
  discountPercentage?: number | null;
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
  discountedPrice?: number | null;
};

// Check if a discount is currently active
const isDiscountActive = (product: ExtendedProduct) => {
  if (!product.discountPercentage) return false;
  
  const now = new Date();
  const startDate = product.discountStartDate ? new Date(product.discountStartDate) : null;
  const endDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
  
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  
  return true;
};

// Type definitions
interface ShopItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
    discountedPrice?: number | null;
    discountPercentage?: number | null;
    stock: number;
    images: string[];
    shopId: number;
    shop: {
      id: number;
      stripeAccountId?: string;
    };
  };
  variation?: string;
}

interface ShopItemWithProduct extends ShopItem {
  product: ShopItem['product'];
}

interface ShopData {
  shop: {
    id: number;
    stripeAccountId?: string | null;
    [key: string]: unknown;
  };
  items: ShopItemWithProduct[];
}

export async function POST(req: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { items, addressId } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!addressId) {
      return NextResponse.json(
        { error: 'No delivery address provided' },
        { status: 400 }
      );
    }

    // Verify the address belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Invalid delivery address' },
        { status: 400 }
      );
    }

    // Fetch product details and validate stock
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        shop: true
      }
    });

    // Group items by seller/shop
    const itemsByShop: Record<string, ShopData> = {};
    let totalAmount = 0;

    // Validate items and calculate totals
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        );
      }

      // Check if discount is active before using discounted price
      const extendedProduct = product as unknown as ExtendedProduct;
      const hasActiveDiscount = extendedProduct.discountPercentage && isDiscountActive(extendedProduct);
      const unitPrice = hasActiveDiscount && extendedProduct.discountedPrice
        ? parseFloat(extendedProduct.discountedPrice.toString())
        : parseFloat(product.price.toString());
        
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      // Group by shop
      const shopId = product.shopId.toString(); // Convert to string for object key
      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = {
          shop: product.shop,
          items: []
        };
      }

      itemsByShop[shopId].items.push({
        ...item,
        product,
        unitPrice,
        totalPrice: itemTotal
      });
    }

    // Create line items for Stripe
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      // Check if discount is active before using discounted price
      const extendedProduct = product as unknown as ExtendedProduct;
      const hasActiveDiscount = extendedProduct.discountPercentage && isDiscountActive(extendedProduct);
      const unitPrice = hasActiveDiscount && extendedProduct.discountedPrice
        ? parseFloat(extendedProduct.discountedPrice.toString())
        : parseFloat(product.price.toString());
      
      // Get product image and ensure it's not too long
      let productImages: string[] = [];
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        
        // Only include the image if it's not too long
        // Skip data URLs or very long paths
        if (firstImage && !firstImage.startsWith('data:') && firstImage.length <= MAX_IMAGE_URL_LENGTH) {
          productImages = [firstImage];
        }
      }
      
      // Add discount information to product name if applicable
      let productName = product.name;
      if (hasActiveDiscount && extendedProduct.discountPercentage) {
        productName = `${product.name} (${extendedProduct.discountPercentage}% OFF)`;
      }
      
      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: productName,
            images: productImages,
            metadata: {
              productId: product.id.toString(),
              shopId: product.shopId.toString()
            }
          },
          unit_amount: Math.round(unitPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Generate a unique order number
    const orderNumber = `UITM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create orders in the database (one per shop/seller)
    const orders = [];
    
    for (const shopId in itemsByShop) {
      const shopItems = itemsByShop[shopId].items as ShopItemWithProduct[];
      
      // Calculate shop totals
      const shopTotal = shopItems.reduce((sum: number, item: { totalPrice: number }) => sum + item.totalPrice, 0);
      const shopPlatformFee = shopTotal * PLATFORM_FEE_PERCENTAGE;
      const shopSellerPayout = shopTotal - shopPlatformFee;
      
      // Process product images for OrderItem to ensure they're not too long
      const orderItemsWithSafeImages = shopItems.map((item: { 
        product: { name: string; images?: string[] }; 
        productId: number; 
        quantity: number; 
        unitPrice: number; 
        totalPrice: number; 
        variation?: string 
      }) => {
        let productImage = null;
        if (item.product.images && item.product.images.length > 0) {
          const image = item.product.images[0];
          // Only use the image if it's not a data URL and not too long
          if (image && !image.startsWith('data:') && image.length <= MAX_IMAGE_URL_LENGTH) {
            productImage = image;
          }
        }
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          variation: item.variation || null,
          productName: item.product.name,
          productImage: productImage
        };
      });
      
      // Create order in database
      const order = await prisma.order.create({
        data: {
          orderNumber: `${orderNumber}-${shopId}`,
          totalAmount: shopTotal,
          platformFee: shopPlatformFee,
          sellerPayout: shopSellerPayout,
          buyerId: session.user.id,
          sellerId: parseInt(shopId),
          addressId: addressId,
          items: {
            create: orderItemsWithSafeImages
          }
        },
        include: {
          items: true
        }
      });
      
      orders.push(order);
    }

    // Get the shop information to see if we need to use a connected account
    const shopId = Object.keys(itemsByShop)[0]; // Get the first shop ID (we're assuming single-shop checkout)
    const shopData = itemsByShop[shopId].shop;
    const useConnectedAccount = shopData && shopData.stripeAccountId;
    
    // Create proper URLs for success and cancel pages
    // Use either NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL, whichever is available
    const baseUrl = new URL(
      process.env.NEXT_PUBLIC_APP_URL || 
      process.env.NEXT_PUBLIC_BASE_URL || 
      'http://localhost:3000'
    );
    
    // Create a valid success URL with proper URL encoding
    const successUrl = new URL('/checkout/success', baseUrl);
    successUrl.searchParams.append('session_id', '{CHECKOUT_SESSION_ID}');
    
    // Create a valid cancel URL with proper URL encoding
    const cancelUrl = new URL('/checkout/cancel', baseUrl);

    // Create Stripe checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customer_email: session.user.email || undefined,
      metadata: {
        orderIds: orders.map(order => order.id.toString()).join(','),
        userId: session.user.id.toString()
      },
      payment_intent_data: {
        metadata: {
          orderIds: orders.map(order => order.id.toString()).join(','),
          userId: session.user.id.toString()
        }
      }
    };
    
    // Create the session with the appropriate options
    let stripeSession;
    if (useConnectedAccount) {
      // Approach 1: Create session on connected account
      // When creating on connected account, add application fee but don't include transfer_data
      const connectedAccountOptions = {
        ...sessionOptions,
        payment_intent_data: {
          ...sessionOptions.payment_intent_data,
          application_fee_amount: Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE * 100) // Fee in cents
        }
      };
      
      stripeSession = await stripe.checkout.sessions.create(
        connectedAccountOptions, 
        { stripeAccount: shopData.stripeAccountId || undefined }
      );
      console.log(`Created checkout session on connected account: ${shopData.stripeAccountId}`);
    } else {
      // Approach 2: Create on platform account (no connected account available)
      stripeSession = await stripe.checkout.sessions.create(sessionOptions);
      console.log('Created checkout session on platform account');
    }

    // Update orders with Stripe session ID
    await Promise.all(orders.map(order => 
      prisma.order.update({
        where: { id: order.id },
        data: { 
          stripeSessionId: stripeSession.id,
          stripeAccountId: useConnectedAccount ? shopData.stripeAccountId || undefined : undefined
        }
      })
    ));

    // Return the checkout session URL
    return NextResponse.json({ 
      url: stripeSession.url,
      sessionId: stripeSession.id,
      onConnectedAccount: !!useConnectedAccount
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}