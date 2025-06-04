'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Store, ShoppingBag, X, Calendar, Info } from 'lucide-react';
import Image from 'next/image';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]",
  button: "bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
};

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  cancellationDate?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  seller: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  items: {
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variation?: string;
    productName: string;
    productImage?: string;
    productId: number;
  }[];
}

export default function CancellationDetailsPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      
      if (!data.order) {
        throw new Error('Order not found');
      }
      
      // Check if order is actually cancelled
      if (data.order.status !== 'cancelled') {
        throw new Error('This order is not cancelled');
      }
      
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [orderId]);
  
  useEffect(() => {
    // Check if user is authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/orders');
      return;
    }
    
    if (authStatus === 'authenticated' && orderId) {
      fetchOrderDetails();
    }
  }, [authStatus, orderId, router, fetchOrderDetails]);
  
  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
        <div className="max-w-5xl mx-auto pb-20 pt-4">
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-700">Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
        <div className="max-w-5xl mx-auto pb-20 pt-4">
          <Link 
            href="/profile/purchases" 
            className={`${cartoonStyle.button} mb-6 p-2 inline-flex items-center gap-2`}
          >
            <ArrowLeft size={18} className="text-black" />
            <span className="font-bold text-black">Back to Purchases</span>
          </Link>
          
          <div className={`${cartoonStyle.card} p-8 text-center`}>
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100 border-2 border-red-300">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{error}</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find the cancellation details for this order.
            </p>
            <Link href="/profile/purchases" className={cartoonStyle.buttonPrimary + " inline-block px-6 py-3"}>
              Return to My Purchases
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
        <div className="max-w-5xl mx-auto pb-20 pt-4">
          <Link 
            href="/profile/purchases" 
            className={`${cartoonStyle.button} mb-6 p-2 inline-flex items-center gap-2`}
          >
            <ArrowLeft size={18} className="text-black" />
            <span className="font-bold text-black">Back to Purchases</span>
          </Link>
          
          <div className={`${cartoonStyle.card} p-8 text-center`}>
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100 border-2 border-red-300">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find the order you&apos;re looking for.
            </p>
            <Link href="/profile/purchases" className={cartoonStyle.buttonPrimary + " inline-block px-6 py-3"}>
              Return to My Purchases
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
      <div className="max-w-5xl mx-auto pb-20 pt-4">
        {/* Back button */}
        <Link 
          href="/profile/purchases" 
          className={`${cartoonStyle.button} mb-6 p-2 inline-flex items-center gap-2`}
        >
          <ArrowLeft size={18} className="text-black" />
          <span className="font-bold text-black">Back to Purchases</span>
        </Link>
        
        {/* Cancellation Header */}
        <div className={`${cartoonStyle.card} mb-6`}>
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold text-red-500">Cancellation Completed</h1>
            <p className="text-gray-500">Requested at: {formatDate(order.cancellationDate || order.createdAt)}</p>
          </div>
          
          {/* Shop info */}
          <div className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="bg-red-600 text-white py-1 px-2 rounded-md text-xs flex items-center">
                <Store size={14} className="mr-1" />
                <span>Mall</span>
              </div>
              <span className="font-medium">{order.seller.name}</span>
            </div>
            <Link 
              href={`/shop/${order.seller.id}`} 
              className={`${cartoonStyle.button} text-xs py-1 px-3 text-black`}
            >
              View Shop
            </Link>
          </div>
          
          {/* Products */}
          {order.items.map(item => (
            <div key={item.id} className="py-4 border-b flex">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                {item.productImage ? (
                  <Image 
                    src={item.productImage} 
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-grow">
                <div className="text-gray-800">{item.productName}</div>
                <div className="text-gray-500">
                  x{item.quantity}
                  {item.variation && <span className="ml-2 text-gray-400">({item.variation})</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-red-600 font-medium">RM{Number(item.unitPrice).toFixed(2)}</div>
              </div>
            </div>
          ))}
          
          {/* Order total */}
          <div className="py-4 flex justify-end items-center">
            <div className="text-gray-600 mr-2">Order Total:</div>
            <div className="text-red-600 text-xl font-bold">RM{Number(order.totalAmount).toFixed(2)}</div>
          </div>
        </div>
        
        {/* Cancellation Details */}
        <div className={`${cartoonStyle.card} mb-6`}>
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Cancellation Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Requested by</span>
              </div>
              <div className="font-medium">
                {order.cancelledBy === 'buyer' ? 'You (Buyer)' : 
                 order.cancelledBy === 'seller' ? 'Seller' : 
                 order.cancelledBy === 'system' ? 'System (Automatic)' : 'Unknown'}
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Cancellation Date</span>
              </div>
              <div className="font-medium">
                {formatDate(order.cancellationDate || order.createdAt)}
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Order ID</span>
              </div>
              <div className="font-medium">{order.orderNumber}</div>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Payment method</span>
              </div>
              <div className="font-medium">
                {order.paymentStatus === 'paid' ? 'Paid (Refund pending)' : 'Unpaid'}
              </div>
            </div>
            
            <div className="py-2">
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-gray-600">Reason for cancellation</span>
              </div>
              <div className="font-medium p-3 bg-gray-50 rounded-lg border text-black">
                {order.cancellationReason || 'No reason provided'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between">
          <Link
            href="/profile/purchases"
            className={`${cartoonStyle.button} px-6 py-3 text-black`}
          >
            Return to My Purchases
          </Link>
          
          <button 
            className={`${cartoonStyle.buttonPrimary} px-6 py-3`}
            onClick={() => router.push(`/product/${order.items[0]?.productId}`)}
          >
            Buy Again
          </button>
        </div>
      </div>
    </div>
  );
} 