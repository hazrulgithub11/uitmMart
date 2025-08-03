import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import openai from '@/lib/openai';

export async function POST() {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Starting AI product analysis...');

    // Fetch all products with shop and order data
    const products = await prisma.product.findMany({
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            seller: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                createdAt: true,
                status: true,
                totalAmount: true,
                buyer: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        },
        ratings: {
          select: {
            stars: true,
            comment: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare data for AI analysis
    const analyticsData = products.map(product => {
      const totalSales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = product.orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const averageRating = product.ratings.length > 0 
        ? product.ratings.reduce((sum, rating) => sum + rating.stars, 0) / product.ratings.length 
        : 0;
      
      const recentSales = product.orderItems.filter(item => {
        const orderDate = new Date(item.order.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      }).length;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: Number(product.price),
        stock: product.stock,
        status: product.status,
        shopName: product.shop.name,
        sellerName: product.shop.seller.fullName,
        totalSales,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(1)),
        reviewCount: product.ratings.length,
        recentSales,
        createdAt: product.createdAt
      };
    });

    // Create summary statistics
    const totalProducts = products.length;
    const totalCategories = [...new Set(products.map(p => p.category))].length;
    const totalShops = [...new Set(products.map(p => p.shopId))].length;
    const categorySales = products.reduce((acc, product) => {
      const sales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      acc[product.category] = (acc[product.category] || 0) + sales;
      return acc;
    }, {} as Record<string, number>);

    const prompt = `
You are a business intelligence analyst specializing in university marketplace data. Analyze the following product and sales data from UiTM Mart to provide insights about student buying behavior and product demand.

MARKETPLACE OVERVIEW:
- Total Products: ${totalProducts}
- Total Categories: ${totalCategories}
- Total Shops: ${totalShops}
- Data Analysis Period: Last 30 days focus

PRODUCT DATA:
${JSON.stringify(analyticsData.slice(0, 50), null, 2)} // Limiting to prevent token overflow

CATEGORY SALES SUMMARY:
${JSON.stringify(categorySales, null, 2)}

ANALYSIS REQUIREMENTS:
Please provide a comprehensive analysis in the following JSON format:

{
  "executiveSummary": "3-4 sentence overview of key findings",
  "studentBuyingBehavior": {
    "topCategories": ["array of top 5 categories by demand"],
    "popularPriceRange": "RM X - RM Y",
    "seasonalTrends": "description of any patterns",
    "buyingFrequency": "insights about purchase frequency"
  },
  "productInsights": {
    "highDemandProducts": [
      {
        "name": "product name",
        "category": "category",
        "reason": "why it's popular"
      }
    ],
    "emergingCategories": ["categories with growing demand"],
    "underperformingCategories": ["categories with low demand"],
    "priceOptimizationSuggestions": "recommendations for pricing"
  },
  "vendorRecommendations": {
    "eventVendors": [
      {
        "category": "category name",
        "recommendedVendors": ["shop names"],
        "reason": "why recommended for university events"
      }
    ],
    "partnerships": [
      {
        "vendor": "shop name",
        "specialty": "what they excel at",
        "eventTypes": ["suitable event types"]
      }
    ]
  },
  "marketOpportunities": {
    "gaps": ["unmet demand areas"],
    "expansion": ["growth opportunities"],
    "innovations": ["new product suggestions"]
  },
  "actionableInsights": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ]
}

Focus on:
1. Student-specific needs and preferences
2. University event planning considerations
3. Academic calendar patterns
4. Budget-conscious purchasing behavior
5. Digital vs physical product preferences

Return only valid JSON. No markdown formatting or additional text.
`;

    try {
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "gpt-4o-mini",
        temperature: 0.3, // Slightly higher for more creative insights
        max_tokens: 2000,
      });

      const response = chatCompletion.choices[0]?.message?.content || '{}';
      
      console.log('🤖 AI Analysis Response received');
      
      // Try to parse the JSON response
      try {
        const analysisResult = JSON.parse(response);
        
        console.log('✅ AI Analysis completed successfully');
        
        return NextResponse.json({
          success: true,
          analysis: analysisResult,
          metadata: {
            totalProducts,
            totalCategories,
            totalShops,
            analysisDate: new Date().toISOString(),
            analysisId: null
          },
          message: 'Product analysis completed successfully'
        });

      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        return NextResponse.json(
          { error: 'Failed to parse AI analysis results' },
          { status: 500 }
        );
      }

    } catch (aiError) {
      console.error('❌ Error with AI analysis:', aiError);
      return NextResponse.json(
        { error: 'Failed to complete AI analysis' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 