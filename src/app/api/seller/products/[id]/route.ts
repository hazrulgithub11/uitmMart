import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Define Shop type with Stripe fields
interface ShopWithStripe {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  phoneNumber: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  sellerId: number;
  stripeAccountId?: string;
}

// Define Product type with Stripe fields
interface ProductWithStripe {
  id: number;
  name: string;
  description: string;
  price: number | string; // For Decimal type compatibility
  stock: number;
  category: string;
  status: string;
  images: string[];
  shopId: number;
  createdAt: Date;
  updatedAt: Date;
  stripeProductId?: string;
  stripePriceId?: string;
}

// Helper function to extract product ID from URL
function extractProductId(pathname: string): number | null {
  const idMatch = pathname.match(/\/seller\/products\/(\d+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }
  
  const productId = parseInt(idMatch[1]);
  return isNaN(productId) ? null : productId;
}

// Get a specific product by ID
export async function GET(req: NextRequest) {
  try {
    const productId = extractProductId(req.nextUrl.pathname);
    if (productId === null) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }
    
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    }) as unknown as ProductWithStripe;
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if the product belongs to the seller
    if (product.shopId !== user.shop.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Product does not belong to seller' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(product);
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Update a product
export async function PATCH(req: NextRequest) {
  try {
    const productId = extractProductId(req.nextUrl.pathname);
    if (productId === null) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }

    // Cast shop to ShopWithStripe
    const shop = user.shop as ShopWithStripe;
    
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    }) as unknown as ProductWithStripe;
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if the product belongs to the seller
    if (product.shopId !== shop.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Product does not belong to seller' },
        { status: 403 }
      );
    }
    
    // Get update data from request body
    const data = await req.json();
    
    // Prepare update data
    const updateData: {
      name?: string;
      description?: string;
      category?: string;
      status?: string;
      images?: string[];
      price?: number;
      stock?: number;
    } = {};
    
    // Check for field updates
    const isNameUpdated = data.name !== undefined && data.name !== product.name;
    const isDescriptionUpdated = data.description !== undefined && data.description !== product.description;
    
    if (isNameUpdated) updateData.name = data.name;
    if (isDescriptionUpdated) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.status) updateData.status = data.status;
    if (data.images) updateData.images = data.images;
    
    // Check if price is being updated
    const isPriceUpdated = data.price !== undefined;
    if (isPriceUpdated) updateData.price = parseFloat(data.price);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    
    // Update the product in the database
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    }) as unknown as ProductWithStripe;
    
    // Update Stripe if there are changes that need to be synced
    if (product.stripeProductId && shop.stripeAccountId) {
      // Sync product updates with Stripe
      if (isNameUpdated || isDescriptionUpdated) {
        try {
          console.log(`Product name or description updated, syncing with Stripe...`);
          
          // Update product details in Stripe
          await stripe.products.update(
            product.stripeProductId,
            {
              name: updatedProduct.name,
              description: updatedProduct.description,
            },
            {
              stripeAccount: shop.stripeAccountId,
            }
          );
          
          console.log(`Updated product details in Stripe for product ID ${productId}`);
        } catch (stripeError) {
          console.error('Error updating product details in Stripe:', stripeError);
          // Continue with returning the updated product even if Stripe update fails
        }
      }
      
      // If price was updated, create a new price in Stripe
      if (isPriceUpdated) {
        try {
          console.log(`Price updated for product ${productId}, syncing with Stripe...`);
          
          // Create a new price in Stripe (Stripe doesn't allow updating existing prices)
          const newStripePrice = await stripe.prices.create(
            {
              product: updatedProduct.stripeProductId,
              unit_amount: Math.round(Number(updatedProduct.price) * 100), // Convert to cents
              currency: 'myr', // Malaysian Ringgit
              metadata: {
                productId: updatedProduct.id.toString(),
              },
            },
            {
              stripeAccount: shop.stripeAccountId,
            }
          );
          
          console.log(`New Stripe price created: ${newStripePrice.id}`);
          
          // Update our database with the new price ID
          await prisma.product.update({
            where: { id: productId },
            data: { 
              stripePriceId: newStripePrice.id,
            },
          });
          
          console.log(`Updated product with new Stripe price ID: ${newStripePrice.id}`);
        } catch (stripeError) {
          console.error('Error updating price in Stripe:', stripeError);
          // Continue with returning the updated product even if Stripe update fails
        }
      }
    }
    
    return NextResponse.json(updatedProduct);
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const productId = extractProductId(req.nextUrl.pathname);
    if (productId === null) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is a seller
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });
    
    if (!user || user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a seller' },
        { status: 403 }
      );
    }
    
    if (!user.shop) {
      return NextResponse.json(
        { error: 'Seller shop not found' },
        { status: 404 }
      );
    }

    // Cast shop to ShopWithStripe
    const shop = user.shop as ShopWithStripe;
    
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    }) as unknown as ProductWithStripe;
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if the product belongs to the seller
    if (product.shopId !== shop.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Product does not belong to seller' },
        { status: 403 }
      );
    }
    
    // Check if the product has a Stripe product ID
    if (product.stripeProductId && shop.stripeAccountId) {
      try {
        console.log(`Deleting Stripe product ${product.stripeProductId}`);
        
        // Delete the product in Stripe
        await stripe.products.update(
          product.stripeProductId,
          { 
            active: false
          },
          {
            stripeAccount: shop.stripeAccountId,
          }
        );
        
        console.log(`Stripe product ${product.stripeProductId} marked as inactive`);
      } catch (stripeError) {
        console.error('Error archiving Stripe product:', stripeError);
        // Continue with deleting the product in our database even if Stripe deletion fails
      }
    }
    
    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully from database and archived in Stripe' 
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 