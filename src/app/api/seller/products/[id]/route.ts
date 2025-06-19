import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
});

// Updated params type for Next.js App Router
type RouteContext = {
  params: Promise<{ id: string }>;
};

// Get a specific product by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params promise
    const params = await context.params;
    const productId = parseInt(params.id);
    
    // Get the seller's shop ID
    const shop = await prisma.shop.findUnique({
      where: { sellerId: session.user.id },
      select: { id: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        shopId: shop.id, // Ensure the product belongs to the seller
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Update a product
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params promise
    const params = await context.params;
    const productId = parseInt(params.id);
    const body = await request.json();
    
    // Get the seller's shop ID
    const shop = await prisma.shop.findUnique({
      where: { sellerId: session.user.id },
      select: { id: true, stripeAccountId: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify the product belongs to the seller
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        shopId: shop.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle discount fields specifically
    if ('discountPercentage' in body || 'discountedPrice' in body || 'discountStartDate' in body || 'discountEndDate' in body) {
      // If discountPercentage is null, clear all discount fields
      if (body.discountPercentage === null) {
        body.discountedPrice = null;
        body.discountStartDate = null;
        body.discountEndDate = null;
      } 
      // If discountPercentage is set but discountedPrice is not provided, calculate it
      else if (body.discountPercentage > 0 && body.discountPercentage <= 100 && !body.discountedPrice) {
        const discountAmount = existingProduct.price.toNumber() * (body.discountPercentage / 100);
        body.discountedPrice = existingProduct.price.toNumber() - discountAmount;
      }
    }

    // Remove productId from the body if it exists
    if (body.productId) {
      delete body.productId;
    }

    // Ensure price and stock are properly converted to the right types
    const dataToUpdate = {
      ...body,
      updatedAt: new Date(),
    };
    
    // Convert price to Decimal if it exists in the body
    if (body.price !== undefined) {
      dataToUpdate.price = typeof body.price === 'string' ? 
        parseFloat(body.price) : body.price;
    }
    
    // Convert stock to Int if it exists in the body
    if (body.stock !== undefined) {
      dataToUpdate.stock = typeof body.stock === 'string' ? 
        parseInt(body.stock, 10) : body.stock;
    }
    
    // Update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
      },
      data: dataToUpdate,
    });

    // If this product has a Stripe product ID and the price was updated, update the Stripe price
    if (existingProduct.stripeProductId && body.price !== undefined && shop.stripeAccountId) {
      try {
        // Get the existing price to archive it
        const prices = await stripe.prices.list(
          { product: existingProduct.stripeProductId },
          { stripeAccount: shop.stripeAccountId }
        );

        // Create a new price
        const newPrice = await stripe.prices.create({
          product: existingProduct.stripeProductId,
          unit_amount: Math.round(parseFloat(body.price) * 100), // Convert to cents
          currency: 'myr',
          active: true,
        }, { stripeAccount: shop.stripeAccountId });

        // Update the product with the new price ID
        await prisma.product.update({
          where: { id: productId },
          data: { stripePriceId: newPrice.id }
        });

        // Archive the old price if it exists
        if (prices.data.length > 0 && existingProduct.stripePriceId) {
          await stripe.prices.update(
            existingProduct.stripePriceId,
            { active: false },
            { stripeAccount: shop.stripeAccountId }
          );
        }

        console.log(`Updated Stripe price for product ${productId}`);
      } catch (stripeError) {
        console.error('Error updating Stripe price:', stripeError);
        // Continue with the response even if Stripe update fails
      }
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'seller') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params promise
    const params = await context.params;
    const productId = parseInt(params.id);
    
    // Get the seller's shop ID
    const shop = await prisma.shop.findUnique({
      where: { sellerId: session.user.id },
      select: { id: true, stripeAccountId: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Verify the product belongs to the seller
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
        shopId: shop.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If product has a Stripe product ID, archive it in Stripe
    if (existingProduct.stripeProductId && shop.stripeAccountId) {
      try {
        await stripe.products.update(
          existingProduct.stripeProductId,
          { active: false },
          { stripeAccount: shop.stripeAccountId }
        );
        console.log(`Archived Stripe product: ${existingProduct.stripeProductId}`);
      } catch (stripeError) {
        console.error('Error archiving Stripe product:', stripeError);
        // Continue with deletion even if Stripe update fails
      }
    }

    // Delete the product
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}