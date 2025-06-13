'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ShoppingBag, MessageSquare, ArrowLeft, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]",
  button: "bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-green-500 text-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  tab: "px-6 py-3 font-medium",
  tabActive: "border-b-2 border-red-500 text-red-500 font-bold",
  tabInactive: "text-gray-600 hover:text-gray-900"
};

// Type definitions for order data
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

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  seller: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  items: OrderItem[];
}

// Map DB status to UI status
const mapStatusToTabStatus = (dbStatus: string, paymentStatus: string): string => {
  if (paymentStatus === 'pending') return 'TO_PAY';
  if (dbStatus === 'paid' || dbStatus === 'processing') return 'TO_SHIP';
  if (dbStatus === 'shipped') return 'TO_RECEIVE';
  if (dbStatus === 'delivered') return 'COMPLETED';
  if (dbStatus === 'cancelled') return 'CANCELLED';
  if (dbStatus === 'refunded') return 'RETURN_REFUND';
  return 'TO_PAY'; // Default
};

// Cancellation reasons
const cancellationReasons = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Changed my mind",
  "Item not needed anymore",
  "Expected delivery time is too long",
  "Incorrect shipping address",
  "Seller took too long to respond",
  "Payment issue",
  "Other"
];

export default function PurchasesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  
  // Fetch orders from database
  useEffect(() => {
    // Check if user is authenticated
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/purchases');
      return;
    }
    
    if (authStatus === 'authenticated' && session?.user?.id) {
      fetchOrders();
    }
  }, [authStatus, session, router]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    
    const uiStatus = mapStatusToTabStatus(order.status, order.paymentStatus);
    return uiStatus === activeTab;
  });
  
  // Handle "Pay Now" button click
  const handlePayNow = async (orderId: number) => {
    try {
      // Redirect to payment page or resume checkout
      router.push(`/checkout/resume/${orderId}`);
    } catch (err) {
      console.error('Error handling payment:', err);
    }
  };
  
  // Open cancellation modal
  const openCancelModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setCancelReason("");
    setOtherReason("");
    setShowCancelModal(true);
  };
  
  // Close cancellation modal
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrderId(null);
    setCancelReason("");
    setOtherReason("");
  };
  
  // Handle "Cancel Order" button click
  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    
    try {
      setCancellingOrderId(selectedOrderId);
      setCancelError(null);
      setCancelSuccess(null);
      
      // Determine final reason text
      const finalReason = cancelReason === "Other" && otherReason.trim() 
        ? otherReason.trim() 
        : cancelReason;
      
      if (!finalReason) {
        setCancelError("Please select a reason for cancellation");
        return;
      }
      
      const response = await fetch(`/api/orders/${selectedOrderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: finalReason,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }
      
      setCancelSuccess('Order cancelled successfully');
      
      // Close the modal
      closeCancelModal();
      
      // Refresh orders list after cancellation
      fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };
  
  // Check if an order can be cancelled
  const canCancel = (order: Order): boolean => {
    if (mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_PAY') {
      return true; // Can always cancel at TO_PAY stage
    } else if (mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_SHIP') {
      // For this implementation, let's assume all TO_SHIP orders can be cancelled
      // In a real scenario, you'd check if shipping hasn't started yet
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-[length:auto] bg-repeat p-6 space-y-8">
      <div className="max-w-5xl mx-auto pb-20 pt-4">
        {/* Back button */}
        <Link 
          href="/profile" 
          className={`${cartoonStyle.button} mb-6 p-2 inline-flex items-center gap-2`}
        >
          <ArrowLeft size={18} className="text-black" />
          <span className="font-bold text-black">Back to Profile</span>
        </Link>
        
        <h1 className="text-2xl font-bold mb-6 text-black">My Purchases</h1>
        
        {/* Success message */}
        {cancelSuccess && (
          <div className="bg-green-50 border-3 border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <p>{cancelSuccess}</p>
          </div>
        )}
        
        {/* Error message */}
        {cancelError && (
          <div className="bg-red-50 border-3 border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{cancelError}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b mb-6 no-scrollbar">
          {['All', 'TO_PAY', 'TO_SHIP', 'TO_RECEIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              className={`${cartoonStyle.tab} ${activeTab === tab ? cartoonStyle.tabActive : cartoonStyle.tabInactive}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'TO_PAY' ? 'To Pay' :
              tab === 'TO_SHIP' ? 'To Ship' :
              tab === 'TO_RECEIVE' ? 'To Receive' :
              tab === 'COMPLETED' ? 'Completed' :
              tab === 'CANCELLED' ? 'Cancelled' :
              tab}
            </button>
          ))}
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border-3 border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
            <button 
              onClick={fetchOrders} 
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Orders */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg overflow-hidden shadow border">
                  {/* Shop info */}
                  <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="bg-red-600 text-white py-1 px-2 rounded-md text-xs flex items-center">
                        <Store size={14} className="mr-1" />
                        <span>Mall</span>
                      </div>
                      <span className="font-medium">{order.seller.name}</span>
                      <button className="bg-red-500 text-white text-xs rounded py-1 px-2 flex items-center">
                        <MessageSquare size={12} className="mr-1" />
                        Chat
                      </button>
                      <Link 
                        href={`/shop/${order.seller.id}`} 
                        className="border border-gray-400 text-gray-600 text-xs rounded py-1 px-2 flex items-center"
                      >
                        <Store size={12} className="mr-1" />
                        View Shop
                      </Link>
                    </div>
                    <div className="text-red-500 font-bold">
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_PAY' ? 'TO PAY' :
                      mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_SHIP' ? 'TO SHIP' : 
                      mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_RECEIVE' ? 'TO RECEIVE' :
                      mapStatusToTabStatus(order.status, order.paymentStatus) === 'COMPLETED' ? 'COMPLETED' :
                      mapStatusToTabStatus(order.status, order.paymentStatus) === 'CANCELLED' ? 'CANCELLED' :
                      mapStatusToTabStatus(order.status, order.paymentStatus)}
                    </div>
                  </div>
                  
                  {/* Products */}
                  {order.items.map(item => (
                    <div key={item.id} className="p-4 border-b flex">
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
                  <div className="p-4 flex justify-end items-center">
                    <div className="text-gray-600 mr-2">Order Total:</div>
                    <div className="text-red-600 text-xl font-bold">RM{Number(order.totalAmount).toFixed(2)}</div>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <div className="text-gray-500">
                      Order #: {order.orderNumber}
                    </div>
                    <div className="flex gap-3 ml-auto">
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_PAY' && (
                        <>
                          <button 
                            onClick={() => handlePayNow(order.id)}
                            className={`${cartoonStyle.buttonPrimary} py-2 px-4`}
                          >
                            Pay Now
                          </button>
                          <button 
                            onClick={() => openCancelModal(order.id)}
                            disabled={cancellingOrderId === order.id}
                            className={`${cartoonStyle.button} py-2 px-4 text-black`}
                          >
                            {cancellingOrderId === order.id ? (
                              <span className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Cancelling...
                              </span>
                            ) : 'Cancel Order'}
                          </button>
                        </>
                      )}
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_SHIP' && (
                        <>
                          <Link 
                            href={`/profile/orders/${order.id}`}
                            className={`${cartoonStyle.buttonPrimary} py-2 px-4 inline-flex`}
                          >
                            View Details
                          </Link>
                          {canCancel(order) && (
                            <button 
                              onClick={() => openCancelModal(order.id)}
                              disabled={cancellingOrderId === order.id}
                              className={`${cartoonStyle.button} py-2 px-4 text-black`}
                            >
                              {cancellingOrderId === order.id ? (
                                <span className="flex items-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Cancelling...
                                </span>
                              ) : 'Cancel Order'}
                            </button>
                          )}
                        </>
                      )}
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'TO_RECEIVE' && (
                        <>
                          <Link 
                            href={`/profile/orders/${order.id}`}
                            className={`${cartoonStyle.buttonPrimary} py-2 px-4 inline-flex`}
                          >
                            View Details
                          </Link>
                          <button 
                            className={`${cartoonStyle.buttonSuccess} py-2 px-4 text-white`}
                            onClick={() => router.push(`/profile/orders/${order.id}`)}
                          >
                            Confirm Receipt
                          </button>
                        </>
                      )}
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'COMPLETED' && (
                        <>
                          <Link 
                            href={`/profile/orders/${order.id}`}
                            className={`${cartoonStyle.buttonPrimary} py-2 px-4 inline-flex`}
                          >
                            View Details
                          </Link>
                          <button className={`${cartoonStyle.buttonSuccess} py-2 px-4`}>
                            Buy Again
                          </button>
                        </>
                      )}
                      {mapStatusToTabStatus(order.status, order.paymentStatus) === 'CANCELLED' && (
                        <>
                          <button className={`${cartoonStyle.buttonPrimary} py-2 px-4`}>
                            Buy Again
                          </button>
                          <Link
                            href={`/profile/orders/${order.id}/cancellation`}
                            className={`${cartoonStyle.button} py-2 px-4 text-black inline-flex`}
                          >
                            View Cancellation Details
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <ShoppingBag size={64} className="mx-auto" />
                </div>
                <p className="text-gray-500">No orders found</p>
                <Link href="/main" className={`${cartoonStyle.buttonPrimary} mt-4 inline-block py-2 px-4`}>
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cartoonStyle.card} max-w-md w-full`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cancel Order</h2>
                <button 
                  onClick={closeCancelModal}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">Please select a reason for cancellation:</p>
              
              <div className="space-y-2 mb-6">
                {cancellationReasons.map((reason) => (
                  <div key={reason} className="flex items-center">
                    <input
                      type="radio"
                      id={`reason-${reason}`}
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={() => setCancelReason(reason)}
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor={`reason-${reason}`} className="text-gray-700">
                      {reason}
                    </label>
                  </div>
                ))}
                
                {/* Other reason input field */}
                {cancelReason === "Other" && (
                  <div className="mt-3 pl-6">
                    <label htmlFor="otherReason" className="text-black block mb-1">
                      Please specify:
                    </label>
                    <textarea
                      id="otherReason"
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-black"
                      rows={3}
                      placeholder="Tell us why you're cancelling..."
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={closeCancelModal}
                  className={`${cartoonStyle.button} py-2 px-4 text-black`}
                >
                  Never Mind
                </button>
                <button 
                  onClick={handleCancelOrder}
                  disabled={!cancelReason || (cancelReason === "Other" && !otherReason.trim()) || cancellingOrderId !== null}
                  className={`${cartoonStyle.buttonPrimary} py-2 px-4 ${(!cancelReason || (cancelReason === "Other" && !otherReason.trim()) || cancellingOrderId !== null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {cancellingOrderId !== null ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cancelling...
                    </span>
                  ) : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
