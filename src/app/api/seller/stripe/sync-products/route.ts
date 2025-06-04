import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export async function POST() {
  try {
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
    
    if (!user.shop.stripeAccountId) {
      return NextResponse.json(
        { error: 'Please connect your Stripe account first' },
        { status: 400 }
      );
    }
    
    const stripeAccountId = user.shop.stripeAccountId;
    
    // Get all products for this seller
    const products = await prisma.product.findMany({
      where: {
        shopId: user.shop.id,
      },
    });
    
    console.log(`Found ${products.length} products for shop ID ${user.shop.id}`);
    
    // Separate products into those that need creation and those that need price updates
    const productsToCreate = [];
    const productsToUpdatePrice = [];
    
    for (const product of products) {
      const hasNoProductId = !product.stripeProductId || product.stripeProductId === '';
      const hasNoPriceId = !product.stripePriceId || product.stripePriceId === '';
      
      if (hasNoProductId || hasNoPriceId) {
        // Product needs initial Stripe creation
        productsToCreate.push(product);
        console.log(`Product ${product.id} needs initial Stripe creation`);
      } else {
        // Product exists in Stripe, check if we need to update price
        productsToUpdatePrice.push(product);
        console.log(`Product ${product.id} already exists in Stripe, will check if price needs update`);
      }
    }
    
    console.log(`${productsToCreate.length} products need to be created in Stripe`);
    console.log(`${productsToUpdatePrice.length} products need price check/update in Stripe`);
    
    // Create products and prices in Stripe for new products
    const creationResults = await Promise.all(
      productsToCreate.map(async (product) => {
        try {
          console.log(`Starting sync for product ${product.id} (${product.name})`);
          
          // Safely access shop ID
          const shopId = user.shop?.id.toString() || '';
          
          // 1. Create product in Stripe
          console.log(`Creating Stripe product for product ID ${product.id}`);
          const stripeProduct = await stripe.products.create(
            {
              name: product.name,
              description: product.description,
              metadata: {
                productId: product.id.toString(),
                shopId: shopId,
              },
            },
            {
              stripeAccount: stripeAccountId,
            }
          );
          
          console.log(`Stripe product created: ${stripeProduct.id}`);
          
          // 2. Create price for this product
          console.log(`Creating Stripe price for product ID ${product.id}`);
          const stripePrice = await stripe.prices.create(
            {
              product: stripeProduct.id,
              unit_amount: Math.round(Number(product.price) * 100), // Convert to cents
              currency: 'myr', // Malaysian Ringgit
              metadata: {
                productId: product.id.toString(),
              },
            },
            {
              stripeAccount: stripeAccountId,
            }
          );
          
          console.log(`Stripe price created: ${stripePrice.id}`);
          
          // 3. Update our database with the Stripe IDs
          console.log(`Updating database with Stripe IDs for product ${product.id}`);
          try {
            await prisma.product.update({
              where: { id: product.id },
              data: { 
                stripeProductId: stripeProduct.id,
                stripePriceId: stripePrice.id,
              },
            });
            console.log(`Database updated successfully for product ${product.id}`);
          } catch (dbError) {
            console.error(`Database update failed for product ${product.id}:`, dbError);
            
            // Try using raw SQL as fallback
            try {
              console.log(`Attempting raw SQL update for product ${product.id}`);
              await prisma.$executeRaw`
                UPDATE "Product" 
                SET "stripeProductId" = ${stripeProduct.id}, 
                    "stripePriceId" = ${stripePrice.id}
                WHERE id = ${product.id}
              `;
              console.log(`Raw SQL update successful for product ${product.id}`);
            } catch (sqlError) {
              console.error(`Raw SQL update failed for product ${product.id}:`, sqlError);
              throw sqlError;
            }
          }
          
          return {
            success: true,
            productId: product.id,
            type: 'create',
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
          };
        } catch (error) {
          console.error(`Error creating Stripe product ${product.id}:`, error);
          return {
            success: false,
            productId: product.id,
            type: 'create',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );
    
    // Update prices for existing products in Stripe
    const updateResults = await Promise.all(
      productsToUpdatePrice.map(async (product) => {
        try {
          console.log(`Checking product ${product.id} (${product.name}) for updates in Stripe`);
          
          const stripeProductId = product.stripeProductId;
          const stripePriceId = product.stripePriceId;
          
          let needsProductUpdate = false;
          
          // First, check if the product details need updating
          try {
            const stripeProduct = await stripe.products.retrieve(
              stripeProductId!,
              { stripeAccount: stripeAccountId }
            );
            
            // Check if product name or description needs updating
            if (stripeProduct.name !== product.name || stripeProduct.description !== product.description) {
              console.log(`Product details mismatch for product ${product.id}:`);
              if (stripeProduct.name !== product.name) {
                console.log(`- Name: Stripe="${stripeProduct.name}", DB="${product.name}"`);
              }
              if (stripeProduct.description !== product.description) {
                console.log(`- Description: Stripe="${stripeProduct.description}", DB="${product.description}"`);
              }
              
              needsProductUpdate = true;
              
              // Update product details in Stripe
              await stripe.products.update(
                stripeProductId!,
                {
                  name: product.name,
                  description: product.description,
                },
                {
                  stripeAccount: stripeAccountId,
                }
              );
              
              console.log(`Updated product details in Stripe for product ${product.id}`);
            }
          } catch (productError) {
            console.error(`Error retrieving or updating Stripe product ${product.id}:`, productError);
            // Continue with price check even if product update fails
          }
          
          // Next, check if the price needs updating
          try {
            const stripePrice = await stripe.prices.retrieve(
              stripePriceId!,
              { stripeAccount: stripeAccountId }
            );
            
            // Check if price needs update
            const currentPriceInCents = Math.round(Number(product.price) * 100);
            
            if (stripePrice.unit_amount !== currentPriceInCents) {
              console.log(`Price mismatch for product ${product.id}: DB=${currentPriceInCents}, Stripe=${stripePrice.unit_amount}`);
              
              // Create a new price (Stripe doesn't allow updating existing prices)
              console.log(`Creating new Stripe price for product ID ${product.id}`);
              const newStripePrice = await stripe.prices.create(
                {
                  product: stripeProductId!,
                  unit_amount: currentPriceInCents,
                  currency: 'myr',
                  metadata: {
                    productId: product.id.toString(),
                  },
                },
                {
                  stripeAccount: stripeAccountId,
                }
              );
              
              console.log(`New Stripe price created: ${newStripePrice.id}`);
              
              // Update product with new price ID
              await prisma.product.update({
                where: { id: product.id },
                data: { 
                  stripePriceId: newStripePrice.id,
                },
              });
              
              return {
                success: true,
                productId: product.id,
                type: needsProductUpdate ? 'product-and-price-update' : 'price-update',
                oldPriceId: stripePriceId!,
                newPriceId: newStripePrice.id,
                oldPrice: stripePrice.unit_amount,
                newPrice: currentPriceInCents,
              };
            } 
            // If only product details were updated but not price
            else if (needsProductUpdate) {
              return {
                success: true,
                productId: product.id,
                type: 'product-update-only',
              };
            }
            // Nothing needed to be updated
            else {
              console.log(`No updates needed for product ${product.id}`);
              return {
                success: true,
                productId: product.id,
                type: 'no-update-needed',
              };
            }
          } catch (priceError) {
            console.error(`Error retrieving Stripe price for product ${product.id}:`, priceError);
            
            // If the price ID is invalid, create a new one
            console.log(`Creating new Stripe price for product ID ${product.id} due to error`);
            const newStripePrice = await stripe.prices.create(
              {
                product: stripeProductId!,
                unit_amount: Math.round(Number(product.price) * 100),
                currency: 'myr',
                metadata: {
                  productId: product.id.toString(),
                },
              },
              {
                stripeAccount: stripeAccountId,
              }
            );
            
            console.log(`New Stripe price created: ${newStripePrice.id}`);
            
            // Update product with new price ID
            await prisma.product.update({
              where: { id: product.id },
              data: { 
                stripePriceId: newStripePrice.id,
              },
            });
            
            return {
              success: true,
              productId: product.id,
              type: needsProductUpdate ? 'product-update-with-price-recreated' : 'price-recreated',
              newPriceId: newStripePrice.id,
            };
          }
        } catch (error) {
          console.error(`Error updating Stripe product ${product.id}:`, error);
          return {
            success: false,
            productId: product.id,
            type: 'update',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );
    
    // Combine all results
    const allResults = [...creationResults, ...updateResults];
    const allSuccessful = allResults.every(result => result.success);
    const createdCount = creationResults.filter(result => result.success).length;
    const updatedPriceCount = updateResults.filter(result => result.success && (result.type === 'price-update' || result.type === 'product-and-price-update' || result.type === 'price-recreated' || result.type === 'product-update-with-price-recreated')).length;
    const updatedProductDetailsCount = updateResults.filter(result => result.success && (result.type === 'product-update-only' || result.type === 'product-and-price-update' || result.type === 'product-update-with-price-recreated')).length;
    
    return NextResponse.json({
      success: allSuccessful,
      message: `Synced ${createdCount} new products, updated prices for ${updatedPriceCount} products, and updated details for ${updatedProductDetailsCount} products with Stripe`,
      results: allResults,
      totalProductsFound: products.length,
      productsCreated: createdCount,
      productsWithPriceUpdates: updatedPriceCount,
      productsWithDetailsUpdates: updatedProductDetailsCount,
      // Include error details for debugging
      errors: allResults
        .filter(result => !result.success)
        .map(result => ({
          productId: result.productId,
          type: result.type,
          error: result.error
        }))
    });
    
  } catch (error) {
    console.error('Error syncing products with Stripe:', error);
    return NextResponse.json(
      { error: 'Failed to sync products with Stripe', details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 