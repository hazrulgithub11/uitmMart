'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Truck, ShoppingBag, Receipt, Star, Loader2, AlertCircle } from 'lucide-react';
import RatingModal from '@/components/RatingModal';
  import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-3 border-black rounded-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4",
  button: "bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-green-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
};

// Types for order data
interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variation?: string;
  productName: string;
  productImage?: string;
  productId: number;
}

interface ShippingAddress {
  id: number;
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Seller {
  id: number;
  name: string;
  logoUrl?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  seller: Seller;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  courierCode?: string;
  courierName?: string;
  shortLink?: string;
}

interface TrackingHistory {
  id: string;
  orderId: number;
  trackingNumber: string;
  courierCode: string;
  checkpointTime: string;
  status: string;
  details: string;
  location?: string;
  createdAt: string;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistory[]>([]);
  const [showRateProduct, setShowRateProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [ratedProducts, setRatedProducts] = useState<Set<number>>(new Set());
  const [hasRatedAnyProduct, setHasRatedAnyProduct] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;
  
  // Fetch order details from API
  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const data = await response.json();
        setOrder(data.order);
        
        // If order has tracking, fetch tracking history
        if (data.order.trackingNumber && data.order.courierCode) {
          fetchTrackingHistory(data.order.id);
        }
        
        // If order is delivered, check which products have been rated
        if (data.order.status === 'delivered') {
          fetchRatedProducts(data.order.id);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [orderId]);
  
  // Fetch which products in this order have been rated
  const fetchRatedProducts = async (orderId: number) => {
    try {
      const response = await fetch(`/api/ratings/by-order?orderId=${orderId}`);
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.ratings) {
        // Create a set of productIds that have been rated
        const ratedProductIds = new Set<number>(data.ratings.map((rating: { productId: number }) => rating.productId));
        setRatedProducts(ratedProductIds);
        setHasRatedAnyProduct(ratedProductIds.size > 0);
      }
    } catch (err) {
      console.error('Error fetching rated products:', err);
    }
  };
  
  // Fetch tracking history
  const fetchTrackingHistory = async (orderId: number) => {
    try {
      const response = await fetch(`/api/tracking/history?orderId=${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking history');
      }
      
      const data = await response.json();
      if (data.success && data.trackingHistory) {
        setTrackingHistory(data.trackingHistory);
      }
    } catch (err) {
      console.error('Error fetching tracking history:', err);
    }
  };
  
  // Format the address from address components
  const formatAddress = (address: ShippingAddress): string => {
    const addressParts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return addressParts.join(', ');
  };
  
  // Generate order timeline based on status
  const generateTimeline = (order: Order) => {
    const timeline = [
      { 
        status: 'Order Placed', 
        date: new Date(order.createdAt).toLocaleDateString(),
        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        completed: true 
      },
      { 
        status: `Order Paid (RM${Number(order.totalAmount).toFixed(2)})`, 
        date: order.paymentStatus === 'paid' ? new Date(order.updatedAt).toLocaleDateString() : '',
        time: order.paymentStatus === 'paid' ? new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', 
        completed: order.paymentStatus === 'paid'
      },
      { 
        status: 'Order Shipped Out', 
        date: order.status === 'shipped' ? 
              trackingHistory.length > 0 ? new Date(trackingHistory[trackingHistory.length-1].checkpointTime).toLocaleDateString() : '' : '',
        time: order.status === 'shipped' ? 
              trackingHistory.length > 0 ? new Date(trackingHistory[trackingHistory.length-1].checkpointTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' : '',
        completed: order.status === 'shipped' || order.status === 'delivered'
      },
      { 
        status: 'Order Received', 
        date: order.status === 'delivered' ? 
              trackingHistory.length > 0 ? new Date(trackingHistory[0].checkpointTime).toLocaleDateString() : '' : '',
        time: order.status === 'delivered' ? 
              trackingHistory.length > 0 ? new Date(trackingHistory[0].checkpointTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' : '',
        completed: order.status === 'delivered'
      },
      { 
        status: 'To Rate', 
        date: '', 
        time: '',
        completed: hasRatedAnyProduct // Mark as completed if any product has been rated
      },
    ];
    
    return timeline;
  };
  
  // Handle "Confirm Received" button click
  const handleConfirmReceived = async () => {
    // Open confirmation dialog instead of immediately confirming
    setConfirmDialogOpen(true);
  };
  
  // Handle actual confirmation after dialog confirmation
  const handleConfirmReceivedConfirmed = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}/received`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm order as received');
      }
      
      // Refresh order data
      const updatedOrderResponse = await fetch(`/api/orders/${orderId}`);
      const updatedOrderData = await updatedOrderResponse.json();
      setOrder(updatedOrderData.order);
      
      // Close the dialog
      setConfirmDialogOpen(false);
      
    } catch (err) {
      console.error('Error confirming order received:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm order as received');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the rating modal for a specific product
  const handleOpenRatingModal = (product: OrderItem) => {
    // Don't allow rating if the product has already been rated
    if (ratedProducts.has(product.productId)) {
      return;
    }
    
    setSelectedProduct(product);
    setShowRateProduct(true);
  };
  
  // Handle closing the rating modal
  const handleCloseRatingModal = () => {
    setShowRateProduct(false);
    setSelectedProduct(null);
  };
  
  // Handle submitting a rating
  const handleSubmitRating = async (stars: number, comment: string) => {
    if (!selectedProduct || !order) return;
    
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          orderId: order.id,
          stars,
          comment
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      
      // Add this product to the rated products set
      setRatedProducts(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedProduct.productId);
        return newSet;
      });
      
      // Set that at least one product has been rated
      setHasRatedAnyProduct(true);
      
      // Show success message
      setRatingSuccess(true);
      
      // Close the modal
      setShowRateProduct(false);
      setSelectedProduct(null);
      
      // Don't automatically hide the success message after rating all products
      const allProductsRated = order.items.every(item => 
        ratedProducts.has(item.productId) || item.productId === selectedProduct.productId
      );
      
      if (!allProductsRated) {
        // Only hide the success message temporarily if there are still unrated products
        setTimeout(() => {
          setRatingSuccess(false);
        }, 3000);
      }
      
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-repeat bg-auto p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 text-black">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-repeat bg-auto p-4">
        <div className="max-w-3xl mx-auto pt-4 pb-20">
          <Link
            href="/profile/purchases"
            className={`${cartoonStyle.button} p-2 inline-flex items-center gap-2`}
          >
            <ArrowLeft size={18} className="text-black" />
            <span className="font-bold text-black">Back</span>
          </Link>
          
          <div className={`${cartoonStyle.card} mt-6 text-center py-8`}>
            <p className="text-red-500 mb-4">
              {error || "Order not found"}
            </p>
            <Link href="/profile/purchases" className={`${cartoonStyle.buttonPrimary} py-2 px-6 inline-block`}>
              Return to My Purchases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Map order status to UI status
  const getStatusLabel = (order: Order): string => {
    if (order.paymentStatus === 'pending') return 'WAITING FOR PAYMENT';
    if (order.status === 'paid' || order.status === 'processing') return 'ORDER PROCESSING';
    if (order.status === 'shipped') return 'ORDER SHIPPED';
    if (order.status === 'delivered') return 'ORDER COMPLETED';
    if (order.status === 'cancelled') return 'ORDER CANCELLED';
    return 'ORDER PLACED';
  };
  
  // Generate the timeline data
  const timelineData = generateTimeline(order);

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-repeat bg-auto p-4">
      <div className="max-w-3xl mx-auto pt-4 pb-20">
        {/* Back button and Order ID */}
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/profile/purchases"
            className={`${cartoonStyle.button} p-2 inline-flex items-center gap-2`}
          >
            <ArrowLeft size={18} className="text-black" />
            <span className="font-bold text-black">Back</span>
          </Link>
          <div className="text-right">
            <div className="text-sm text-gray-600">ORDER ID: {order.orderNumber}</div>
            <div className="font-bold text-red-500">{getStatusLabel(order)}</div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className={`${cartoonStyle.card} bg-white mb-6`}>
          <div className="flex justify-between mb-8 relative">
            {timelineData.map((step, index) => {
              const Icon = index === 0 ? Receipt : 
                           index === 1 ? ShoppingBag : 
                           index === 2 ? Truck : 
                           index === 3 ? CheckCircle : Star;
              
              // Only draw the line if it's not the last item
              const showLine = index < timelineData.length - 1;
              
              return (
                <div key={index} className="flex flex-col items-center relative z-10 w-1/5">
                  {/* Connect with a line if completed */}
                  {showLine && (
                    <div className={`absolute top-4 left-1/2 h-0.5 w-full ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} style={{ transform: 'translateX(50%)' }}></div>
                  )}
                  
                  {/* Circle with icon */}
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center border-2 ${step.completed ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>
                    <Icon size={16} />
                  </div>
                  
                  {/* Label */}
                  <div className="text-xs text-center mt-2 font-medium text-black">
                    {step.status}
                  </div>
                  
                  {/* Date and time */}
                  {step.date && (
                    <div className="text-xs text-gray-500 text-center mt-1 text-black">
                      {step.date} {step.time}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show "Confirm Received" button if order is shipped */}
          {order.status === 'shipped' && (
            <div className="text-center">
              <button 
                onClick={handleConfirmReceived}
                className={`${cartoonStyle.buttonSuccess} px-6 py-2 inline-flex items-center gap-2`}
              >
                <CheckCircle size={16} /> 
                Confirm Order Received
              </button>
              <div className="text-xs text-gray-500 mt-2 text-black">
                Please confirm once you have received your order
              </div>
            </div>
          )}

          {/* Rate product button - only show for completed orders with unrated products */}
          {order.status === 'delivered' && (
            <div className="text-center">
              {ratingSuccess || order.items.every(item => ratedProducts.has(item.productId)) ? (
                <div className="text-green-600 font-medium text-black">
                  Thank you for your feedback!
                </div>
              ) : (
                <button 
                  onClick={() => {
                    // Find first unrated product to rate
                    const unratedProduct = order.items.find(item => !ratedProducts.has(item.productId));
                    
                    // If all products rated, use the first product
                    const productToRate = unratedProduct || order.items[0];
                    
                    if (productToRate) {
                      setSelectedProduct(productToRate);
                      setShowRateProduct(true);
                    }
                  }}
                  className={`${cartoonStyle.buttonSuccess} px-6 py-2 inline-flex items-center gap-2`}
                >
                  <Star size={16} /> 
                  Rate Products
                </button>
              )}
              <div className="text-xs text-gray-500 mt-2 text-black">
                Rate your products to help others make better purchasing decisions
              </div>
            </div>
          )}
        </div>

        {/* Delivery Tracking - Only show if order has tracking info */}
        {order.trackingNumber && (
          <div className={`${cartoonStyle.card} bg-white mb-6`}>
            <h2 className="text-lg font-bold border-b-2 border-gray-200 pb-3 mb-4 text-black">Delivery Tracking</h2>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1 text-black">Tracking Number:</div>
                {order.shortLink ? (
                  <a 
                    href={order.shortLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {order.trackingNumber}
                  </a>
                ) : (
                  <div className="font-bold text-black">{order.trackingNumber}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1 text-black">Courier:</div>
                <div className="font-bold text-black">{order.courierName || order.courierCode}</div>
              </div>
            </div>
            
            <h2 className="text-lg font-bold border-b-2 border-gray-200 pb-3 mb-4 text-black">Delivery Address</h2>
            
            <div className="font-bold mb-4">{order.shippingAddress.recipient}</div>
            <div className="text-gray-600 mb-4">{order.shippingAddress.phone}</div>
            <div className="text-gray-700">{formatAddress(order.shippingAddress)}</div>
            
            {trackingHistory.length > 0 && (
              <div className="border-t-2 border-gray-200 mt-6 pt-4">
                <div className="mb-4">
                  <h3 className="font-bold mb-2">{trackingHistory[0].status}</h3>
                  <div className={`${order.status === 'delivered' ? 'text-green-600' : 'text-blue-600'} mb-1 text-black`}>
                    {trackingHistory[0].details}
                  </div>
                  {order.status === 'delivered' && (
                    <div className="text-sm text-gray-600 text-black">Recipient: {order.shippingAddress.recipient}</div>
                  )}
                  <div className="text-sm text-gray-600 text-black">
                    {new Date(trackingHistory[0].checkpointTime).toLocaleString()}
                  </div>
                </div>
                
                {/* Tracking Timeline */}
                <div className="relative pl-6 pt-4 border-t border-dashed border-gray-200">
                  {trackingHistory.slice(1).map((history, index) => (
                    <div key={index} className="relative mb-6">
                      {/* Timeline dot and line */}
                      <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-gray-400"></div>
                      <div className="absolute -left-2 top-3 bottom-0 w-0.5 bg-gray-300" 
                           style={{ display: index < trackingHistory.length - 2 ? 'block' : 'none' }}></div>
                      
                      {/* Content */}
                      <div className="text-gray-800 mb-1 text-black">{history.status}</div>
                      <div className="text-sm text-gray-600 text-black">{history.details}</div>
                      {history.location && <div className="text-sm text-gray-600 text-black">{history.location}</div>}
                      <div className="text-sm text-gray-500 text-black">
                        {new Date(history.checkpointTime).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Details */}
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-500 text-white px-2 py-1 text-xs rounded mr-2">Official</div>
              <div className="font-bold text-black">{order.seller.name}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/chat?shop=${order.seller.id}`} className="text-gray-600 text-sm underline">Chat</Link>
              <Link href={`/shop/${order.seller.id}`} className="text-gray-600 text-sm underline">View Shop</Link>
            </div>
          </div>
          
          {/* Product List */}
          {order.items.map((item, index) => (
            <div key={index} className="flex border-t border-gray-200 py-4 text-black">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded overflow-hidden mr-4 ">
                <Image
                  src={item.productImage || '/images/placeholder.svg'}
                  alt={item.productName}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="flex-grow">
                <div className="text-sm mb-1 text-black">{item.productName}</div>
                {item.variation && (
                  <div className="text-xs text-gray-500 mb-2 text-black">Variation: {item.variation}</div>
                )}
                <div className="text-xs text-gray-500 text-black">x{item.quantity}</div>
                
                {/* Add individual product rating button for completed orders */}
                {order.status === 'delivered' && (
                  ratedProducts.has(item.productId) ? (
                    <div className="mt-2 text-xs text-green-600 inline-flex items-center gap-1">
                      <Star size={12} fill="#10B981" color="#10B981" />
                      Product rated
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenRatingModal(item)}
                      className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Star size={12} />
                      Rate this product
                    </button>
                  )
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-gray-700 text-black">RM{Number(item.unitPrice).toFixed(2)}</div>
              </div>
            </div>
          ))}
          
          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="flex justify-between text-sm mb-2 text-black">
              <div className="text-gray-600 text-black">Merchandise Subtotal:</div>
              <div className="text-black">RM{order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0).toFixed(2)}</div>
            </div>
            <div className="flex justify-between text-sm mb-2 text-black">
              <div className="text-gray-600 text-black">Shipping Fee:</div>
              <div className="text-black">RM{(Number(order.totalAmount) - order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)).toFixed(2)}</div>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 pt-4 text-black">
              <div>Order Total:</div>
              <div className="text-red-500">RM{Number(order.totalAmount).toFixed(2)}</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between text-sm text-black">
              <div className="text-gray-600 text-black">Payment Method:</div>
              <div className="text-black">Online Banking</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 text-black">
          <Link href="/profile/purchases" className={`${cartoonStyle.button} flex-1 py-3 text-center`}>
            View My Purchases
          </Link>
          <Link href="/main" className={`${cartoonStyle.buttonPrimary} flex-1 py-3 text-center`}>
            Continue Shopping
          </Link>
        </div>

        {/* Rating Modal */}
        {showRateProduct && selectedProduct && (
          <RatingModal
            isOpen={showRateProduct}
            onClose={handleCloseRatingModal}
            onSubmit={handleSubmitRating}
            productName={selectedProduct.productName}
            productImage={selectedProduct.productImage || '/images/placeholder.svg'}
          />
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className={`${cartoonStyle.card} max-w-md bg-yellow-50`}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-black">Confirm Order Receipt</DialogTitle>
              <DialogDescription className="text-gray-700">
                Have you actually received the physical package? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      Only confirm if you have physically received the package. 
                      Confirming will mark the order as delivered and release payment to the seller.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setConfirmDialogOpen(false)}
                className={`${cartoonStyle.button} text-black flex-1`}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmReceivedConfirmed}
                className={`${cartoonStyle.buttonSuccess} flex-1`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processing...
                  </>
                ) : (
                  <>Yes, I Received It</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 