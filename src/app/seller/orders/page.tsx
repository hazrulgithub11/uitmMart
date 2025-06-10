'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Loader2,
  AlertCircle,
  Truck,
  X,
  PackageOpen,
  Clock,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { couriers } from '@/data/couriers';

// Define types for the order
interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number | string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  courier?: string;
  courierCode?: string;
  courierName?: string;
  shortLink?: string;
  shippedAt?: string;
  deliveredAt?: string;
  buyer: {
    id: number;
    fullName: string;
    email: string;
  };
  items: {
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variation?: string;
    productName: string;
    productImage: string;
    productId: number;
  }[];
  shippingAddress: {
    id: number;
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };
}

// Define types for tracking data
interface TrackingCheckpoint {
  id?: number | string;
  checkpointTime?: string;
  time?: string;
  checkpoint_time?: string;
  created_at?: string;
  status?: string;
  details?: string;
  location?: string;
  message?: string;
  content?: string;
  description?: string;
}

interface TrackingDetails {
  success?: boolean;
  checkpoints?: TrackingCheckpoint[];
  originalData?: {
    data?: {
      checkpoints?: TrackingCheckpoint[];
    };
  };
  mainStatus?: string;
  detailedStatus?: string;
  message?: string;
  courierName?: string;
  shortLink?: string;
  error?: string;
}

// Shipping Details Modal Component props type
interface ShippingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateOrder: (orderId: number, data: Record<string, unknown>) => Promise<void>;
}

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

// Shipping Details Modal Component
const ShippingDetailsModal: React.FC<ShippingDetailsModalProps> = ({ isOpen, onClose, order, onUpdateOrder }) => {
  // Initialize with empty values to avoid undefined state
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierCode, setCourierCode] = useState('');
  const [courierName, setCourierName] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetails | null>(null);
  const [isLoadingTrackingDetails, setIsLoadingTrackingDetails] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [orderTrackingHistory, setOrderTrackingHistory] = useState<TrackingCheckpoint[]>([]); // State for historical checkpoints
  const [courierSearch, setCourierSearch] = useState(''); // For courier search functionality
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false); // State for webhook simulation

  // Initialize state values from order when modal opens
  useEffect(() => {
    if (order && isOpen) {
      console.log('Modal opened with order:', order.id);
      console.log('Setting initial values:', {
        trackingNumber: order.trackingNumber || '',
        courierCode: order.courierCode || '',
        courierName: order.courierName || '',
        status: order.status || ''
      });
      
      // Set form values from order
      setTrackingNumber(order.trackingNumber || '');
      setCourierCode(order.courierCode || '');
      setCourierName(order.courierName || '');
      setOrderStatus(order.status || '');
      setCancelReason('');
      
      // Fetch tracking history if there's a tracking number
      if (order.trackingNumber && order.id) {
        fetchOrderTrackingHistory(order.id);
      }
    }
  }, [order, isOpen]);

  // Fetch historical tracking data from our database
  const fetchOrderTrackingHistory = async (orderId: number | undefined) => {
    if (!orderId) return;
    
    console.log('Fetching tracking history for order:', orderId);
    try {
      const response = await fetch(`/api/tracking/history?orderId=${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Failed to fetch order tracking history:', errorData.error || errorData.message || 'Unknown error');
        return;
      }
      
      const data = await response.json();
      console.log('Tracking history API response:', data);
      
      // Handle error responses
      if (!data.success) {
        console.warn('Tracking history API returned unsuccessful response:', data.error || data.message || 'Unknown error');
        return;
      }
      
      const historyData = data.trackingHistory || [];
      
      if (Array.isArray(historyData) && historyData.length > 0) {
        // Sort history by checkpointTime descending (most recent first)
        const sortedHistory = historyData.sort((a: TrackingCheckpoint, b: TrackingCheckpoint) => {
          // Handle both string and Date objects
          const timeA = a.checkpointTime ? new Date(a.checkpointTime).getTime() : 0;
          const timeB = b.checkpointTime ? new Date(b.checkpointTime).getTime() : 0;
          return timeB - timeA;
        });
        
        setOrderTrackingHistory(sortedHistory);
        console.log('Fetched order tracking history:', sortedHistory);
      } else {
        console.log('No tracking history data found in response');
        setOrderTrackingHistory([]);
      }
    } catch (error) {
      console.error('Error fetching order tracking history:', error);
    }
  };

  // Register tracking number with tracking.my API
  const registerTrackingNumber = async (trackingNum: string, courierCd: string) => {
    if (!trackingNum || !courierCd) {
      console.error('Tracking number and courier code are required to register tracking');
      return false;
    }
    
    try {
      console.log(`Registering tracking number: ${trackingNum} with courier: ${courierCd}`);
      
      // Call our backend API that will handle the communication with tracking.my
      const response = await fetch('/api/tracking/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracking_number: trackingNum,
          courier: courierCd.toLowerCase(),
          orderId: order?.id // Pass the orderId to update the order with the shortLink
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to register tracking number:', errorData);
        return false;
      }
      
      const data = await response.json();
      console.log('Tracking registration response:', data);
      
      // If we got a shortLink, save it
      if (data.shortLink) {
        console.log('Received short link:', data.shortLink);
      }
      
      // Return true if registration was successful
      return data.success === true;
    } catch (error) {
      console.error('Error registering tracking number:', error);
      return false;
    }
  };

  // Fetch tracking details function
  const fetchTrackingDetails = useCallback(async (trackingNum = trackingNumber, courierCd = courierCode) => {
    if (!trackingNum) {
      setTrackingError('Tracking number is required');
      return;
    }
    
    if (!courierCd) {
      setTrackingError('Courier service is required');
      return;
    }
    
    setIsLoadingTrackingDetails(true);
    setTrackingError('');
    
    setOrderTrackingHistory([]); // Clear previous history before fetching live details
    
    // Try to register the tracking number first (in case it's not registered yet)
    // This is safe to call even if already registered - the API will handle duplicates
    try {
      await registerTrackingNumber(trackingNum, courierCd);
    } catch (error) {
      console.warn('Failed to register tracking number, but will try to fetch anyway:', error);
      // Continue anyway, as the tracking might already be registered
    }
    
    // Fetch live tracking from tracking.my API
    try {
      // Add query parameter to force immediate API call to tracking.my
      const apiUrl = `/api/tracking/shipment-status?trackingNumber=${encodeURIComponent(trackingNum)}&courierCode=${encodeURIComponent(courierCd || '')}&forceFetch=true`;
      console.log(`Fetching tracking details from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Tracking API error status: ${response.status}`);
        console.error(`Raw error response: ${errorText}`);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('Parsed error response:', errorData);
        } catch (e) {
          console.error('Failed to parse error response as JSON:', e);
          errorData = { error: errorText || 'Unknown error' };
        }
        
        setIsLoadingTrackingDetails(false);
        throw new Error(errorData.error || errorData.message || 'Failed to fetch tracking details');
      }
      
      const responseText = await response.text();
      console.log(`Tracking API raw response (first 100 chars): ${responseText.substring(0, 100)}...`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Unexpected response format: Invalid JSON');
      }
      
      console.log('Tracking API response (parsed):', data);
      
      // Ensure we have the required data structure
      if (!data) {
        console.error('Tracking API returned empty data');
        throw new Error('Unexpected response format: Empty data');
      }
      
      if (!data.success) {
        console.warn('Tracking API returned unsuccessful response:', data);
        setTrackingError(data.error || data.message || 'Could not fetch tracking details. API returned unsuccessful response.');
        return;
      }
      
      // Check for empty or missing checkpoints
      if (!data.checkpoints || !Array.isArray(data.checkpoints) || data.checkpoints.length === 0) {
        console.warn('No checkpoints found in tracking data:', data);
        
        // If the data is nested in an originalData property, extract it
        if (data.originalData && data.originalData.data && data.originalData.data.checkpoints) {
          data.checkpoints = data.originalData.data.checkpoints;
          console.log('Using checkpoints from originalData:', data.checkpoints);
        } else if (data.message && data.message.includes('not found') && order?.id) {
          // If this is a "not found" response but we created an initial tracking record,
          // fetch the tracking history to display that instead
          console.log('No live tracking data available, fetching history records instead');
          fetchOrderTrackingHistory(order.id);
        }
      }
      
      setTrackingDetails(data);
      // Also fetch/refresh historical data from our DB when live details are fetched
      if (order?.id) {
        fetchOrderTrackingHistory(order.id);
      }
      
      // Auto-update order status based on tracking status if it's more advanced
      const statusPriority: Record<string, number> = {
        'pending': 1,
        'processing': 2,
        'shipped': 3,
        'delivered': 4,
        'cancelled': 5
      };
      
      if (data.mainStatus && typeof data.mainStatus === 'string' && statusPriority[data.mainStatus] && statusPriority[orderStatus]) {
        if (statusPriority[data.mainStatus] > statusPriority[orderStatus]) {
          setOrderStatus(data.mainStatus);
          
          // If status changed significantly, log it (we removed auto-refresh notifications)
          if (data.mainStatus !== orderStatus) {
            console.log(`Tracking status updated from ${orderStatus} to ${data.mainStatus}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching tracking details:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error fetching tracking details. Please try again.';
      
      setTrackingError(errorMessage);
      
      // Try to fetch tracking history anyway if we have an order ID
      if (order?.id) {
        console.log('Fetching tracking history despite live tracking error');
        fetchOrderTrackingHistory(order.id);
      }
    } finally {
      setIsLoadingTrackingDetails(false);
    }
  }, [trackingNumber, courierCode, order, orderStatus]);

  // Fetch initial tracking data when modal is opened with existing tracking information
  useEffect(() => {
    if (!isOpen || !trackingNumber || !courierCode) return;
    
    // Only fetch if tracking info is already saved in the database
    if (order?.trackingNumber && order?.courierCode) {
      fetchTrackingDetails(trackingNumber, courierCode);
      fetchOrderTrackingHistory(order?.id);
    }
  }, [isOpen, trackingNumber, courierCode, order?.id, order?.trackingNumber, order?.courierCode, fetchTrackingDetails]);

  // Simulate webhook for tracking updates
  const simulateWebhook = async () => {
    if (!order?.id || !trackingNumber || !courierCode) {
      console.error('Cannot simulate webhook: Missing order ID, tracking number, or courier code');
      return;
    }
    
    setIsSimulatingWebhook(true);
    
    try {
      console.log(`Simulating webhook for order ${order.id}, tracking ${trackingNumber}`);
      
      // Call our webhook simulation endpoint
      const response = await fetch('/api/tracking/webhook-simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber,
          courierCode,
          orderId: order.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to simulate webhook:', errorData);
        throw new Error(errorData.error || 'Failed to simulate webhook');
      }
      
      const data = await response.json();
      console.log('Webhook simulation response:', data);
      
      // Refresh tracking data
      fetchTrackingDetails();
      
      // Also refresh tracking history
      if (order.id) {
        fetchOrderTrackingHistory(order.id);
      }
    } catch (error) {
      console.error('Error simulating webhook:', error);
      setTrackingError(error instanceof Error ? error.message : 'Failed to refresh tracking data');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!order) return;
    
    setIsSubmitting(true);
    
    try {
      const updateData: Record<string, unknown> = {
        status: orderStatus,
      };
      
      // Always include tracking information if provided, regardless of status
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
      
      if (courierCode) {
        updateData.courierCode = courierCode;
      }
      
      if (courierName) {
        updateData.courierName = courierName;
      }
      
      if (orderStatus === 'cancelled') {
        updateData.cancellationReason = cancelReason;
      }
      
      // If this is a new tracking number or courier changed, register with tracking.my API
      if (trackingNumber && courierCode && 
          (trackingNumber !== order.trackingNumber || courierCode !== order.courierCode)) {
        // Register the tracking number before updating the order
        const registrationSuccess = await registerTrackingNumber(trackingNumber, courierCode);
        
        if (!registrationSuccess) {
          console.warn('Tracking number registration failed, but will continue with order update');
          // We continue with the order update even if registration fails
          // The tracking data can be registered later when fetching
        } else {
          console.log('Successfully registered tracking number with tracking.my API');
          
          // Fetch the tracking details to get the latest short_link
          await fetchTrackingDetails(trackingNumber, courierCode);
        }
      }
      
      await onUpdateOrder(order.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tracking number change with debounce
  const handleTrackingNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value;
      console.log('Setting tracking number to:', value);
      
      // Force the update with setTimeout to ensure React processes it
      setTimeout(() => {
        setTrackingNumber(value);
      }, 0);
      
      // Clear courier selection when tracking number is cleared
      if (!value || value.trim() === '') {
        setCourierCode('');
        setCourierName('');
      }
      console.log('Updated tracking number:', value);
    } catch (error) {
      console.error('Error updating tracking number:', error);
    }
  };

  // Courier options for manual selection
  const courierOptions = couriers.sort((a, b) => a.name.localeCompare(b.name));

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    if (status.toLowerCase().includes('delivered') || status.toLowerCase().includes('completed')) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (status.toLowerCase().includes('transit') || status.toLowerCase().includes('out for delivery')) {
      return <Truck className="h-5 w-5 text-amber-500" />;
    } else if (status.toLowerCase().includes('received') || status.toLowerCase().includes('pickup')) {
      return <PackageOpen className="h-5 w-5 text-blue-500" />;
    } else if (status.toLowerCase().includes('cancelled') || status.toLowerCase().includes('returned') || status.toLowerCase().includes('failed')) {
      return <X className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${cartoonStyle.card} max-w-lg bg-yellow-50 max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
        <DialogTitle className={`${cartoonStyle.heading} text-black`}>Order Shipping Details</DialogTitle>
          <DialogDescription className="text-gray-700 font-medium mt-2">
            Order ID: {order?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">Customer Information</h3>
            <div className="bg-white p-4 rounded-xl border-2 border-black space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <span className="text-gray-700 font-bold text-black">Delivery Address:</span>
                <p className="mt-1 text-black">
                  {order?.shippingAddress ? 
                    `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}` :
                    'No address information available'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-700 font-bold text-black">Phone Number:</span>
                <p className="mt-1 text-black">{order?.shippingAddress?.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-700 font-bold text-black">Customer Name:</span>
                <p className="mt-1 text-black">{order?.buyer?.fullName || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Status Update */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">Update Shipping Status</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking" className="font-bold text-black">Tracking Number</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="tracking" 
                      placeholder="Enter tracking number"
                      className={`${cartoonStyle.input} text-black flex-1`}
                      value={trackingNumber || ''}
                      onChange={handleTrackingNumberChange}
                      key={`tracking-input-${isOpen}-${order?.id}`}
                    />
                  </div>
                  {/* Debug display to verify state - you can remove this after testing */}
                  <div className="text-xs text-gray-500">State value: {trackingNumber}</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courier" className="font-bold text-black">Courier Service</Label>
                  <Select 
                    value={courierCode || ''} 
                    onValueChange={(value) => {
                      try {
                        console.log('Selected courier code:', value);
                        
                        // Force the update with setTimeout
                        setTimeout(() => {
                          setCourierCode(value);
                          const selected = courierOptions.find(c => c.code === value);
                          if (selected) {
                            setCourierName(selected.name);
                            console.log('Selected courier name:', selected.name);
                          }
                        }, 0);
                        
                        // Clear the search after selection
                        setCourierSearch('');
                      } catch (error) {
                        console.error('Error selecting courier:', error);
                      }
                    }}
                    onOpenChange={(open) => {
                      // Clear search when dropdown is closed
                      if (!open) {
                        setCourierSearch('');
                      }
                    }}
                    key={`courier-select-${isOpen}-${order?.id}`}
                  >
                    <SelectTrigger className={`${cartoonStyle.input} bg-white !text-black`}>
                      <SelectValue placeholder="Select courier">
                        {courierName ? courierName : 'Select courier'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b border-gray-200">
                        <Input 
                          placeholder="Search courier..." 
                          className={`${cartoonStyle.input} text-black text-sm`}
                          value={courierSearch}
                          onChange={(e) => setCourierSearch(e.target.value)}
                        />
                      </div>
                      <SelectGroup className="max-h-[220px] overflow-y-auto">
                        <SelectLabel className="font-bold text-black">Courier Services</SelectLabel>
                        {courierOptions
                          .filter(courier => 
                            courier.name.toLowerCase().includes(courierSearch.toLowerCase())
                          )
                          .map((courier) => (
                            <SelectItem 
                              key={courier.code} 
                              value={courier.code} 
                              className="text-black"
                            >
                              {courier.name}
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                </div>

              {/* Tracking Status Button - Only show for orders with tracking info already saved in the database */}
              {order?.trackingNumber && order?.courierCode && trackingNumber && courierCode && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <Button
                      type="button"
                      onClick={() => fetchTrackingDetails()}
                      disabled={isLoadingTrackingDetails || !trackingNumber}
                      className={`${cartoonStyle.buttonPrimary} flex-1`}
                      variant="outline"
                    >
                      {isLoadingTrackingDetails ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading tracking details...
                        </>
                      ) : (
                        <>
                          <Info className="mr-2 h-4 w-4" />
                          Check Shipment Status
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => simulateWebhook()}
                      disabled={isSimulatingWebhook || isLoadingTrackingDetails || !trackingNumber}
                      className={`${cartoonStyle.button} text-black flex-1`}
                      variant="outline"
                    >
                      {isSimulatingWebhook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Refresh Tracking
                        </>
                      )}
                    </Button>
                </div>
                  
                  {trackingError && (
                    <div className="mt-2 bg-red-50 p-2 rounded-md border border-red-200 text-red-600 text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{trackingError}</span>
              </div>
                  )}
                  
                  <div className="mt-4 bg-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-black">Shipment Progress</h4>
                    </div>
                    
                    {!order?.trackingNumber || !order?.courierCode ? (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">Save tracking information first to enable tracking features.</p>
                        <p className="text-xs text-gray-500 mt-2">Tracking details will be available after you save the order with tracking number and courier.</p>
                      </div>
                    ) : isLoadingTrackingDetails && !trackingDetails && orderTrackingHistory.length === 0 ? (
                      <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                        <p className="text-gray-600">Fetching tracking information...</p>
                      </div>
                    ) : (
                      <>
                        {/* Display Historical Checkpoints first */}
                        {orderTrackingHistory && orderTrackingHistory.length > 0 ? (
                          <div className="space-y-4 mt-2 max-h-80 overflow-y-auto pr-2 mb-4 border-b-2 border-gray-300 pb-4">
                            <h5 className="font-semibold text-sm text-gray-600">Tracking History:</h5>
                            {orderTrackingHistory.map((checkpoint: TrackingCheckpoint, index: number) => {
                              const date = new Date(checkpoint.checkpointTime || new Date());
                              const formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'short' });
                              const formattedTime = date.toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }).toLowerCase();
                              
                              return (
                                <div key={`hist-${checkpoint.id || index}`} className="flex">
                                  <div className="w-24 pr-3 text-right">
                                    <div className="font-medium text-black text-sm">{formattedDate}</div>
                                    <div className="text-xs text-gray-500">{formattedTime}</div>
                                  </div>
                                  <div className="flex flex-col items-center mx-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                      {getStatusIcon(checkpoint.status || checkpoint.details || '')}
                                    </div>
                                    {index < orderTrackingHistory.length - 1 && (
                                      <div className="w-0.5 bg-gray-300 h-10 flex-grow"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 pb-3">
                                    <div className={`${index === 0 ? 'font-semibold' : 'font-medium'} text-black text-sm`}>
                                      {checkpoint.details || checkpoint.status || 'Status update'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {checkpoint.location || ''}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-3 text-center border-b-2 border-gray-300 mb-3">
                            <p className="text-gray-500 text-sm">No stored tracking history available.</p>
                          </div>
                        )}

                        {/* Display Live Checkpoints from API if available */}
                        {trackingDetails && trackingDetails.checkpoints && Array.isArray(trackingDetails.checkpoints) && trackingDetails.checkpoints.length > 0 ? (
                          <div className="space-y-4 mt-2 max-h-80 overflow-y-auto pr-2">
                             <h5 className="font-semibold text-sm text-gray-600">Live Tracking Details:</h5>
                            {trackingDetails.checkpoints.map((checkpoint: TrackingCheckpoint, index: number) => {
                              // Format the date for display
                              const date = new Date(checkpoint.checkpoint_time || checkpoint.created_at || checkpoint.time || new Date());
                              const formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'short' });
                              const formattedTime = date.toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }).toLowerCase();
                              
                              // Get the message or status text with any reference IDs preserved
                              const statusText = checkpoint.message || checkpoint.content || checkpoint.description || checkpoint.status || 'Status update';
                              
                              // Get the location with fallback
                              const locationText = checkpoint.location || '';
                              
                              // Need safe access to checkpoints.length
                              const checkpointsLength = trackingDetails.checkpoints?.length || 0;
                              
                              return (
                                <div key={`live-${checkpoint.id || index}`} className="flex">
                                  <div className="w-24 pr-3 text-right">
                                    <div className="font-medium text-black text-sm">{formattedDate}</div>
                                    <div className="text-xs text-gray-500">{formattedTime}</div>
                                  </div>
                                  <div className="flex flex-col items-center mx-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                                      {getStatusIcon(statusText)}
                                    </div>
                                    
                                    {/* Connecting line (except for last item) */}
                                    {index < checkpointsLength - 1 && (
                                      <div className="w-0.5 bg-gray-300 h-10 flex-grow"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 pb-3">
                                    <div className={`${index === 0 ? 'font-semibold' : 'font-medium'} text-black text-sm`}>
                                      {statusText}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {locationText}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          !isLoadingTrackingDetails && (orderTrackingHistory.length === 0) && (
                            <div className="py-4 text-center">
                              <p className="text-gray-500 mb-1">No live tracking details available from courier API.</p>
                              <p className="text-sm text-gray-400">
                                This may happen if the package was just registered with the courier. 
                                Try again later or contact the courier service directly.
                              </p>
                            </div>
                          )
                        )}
                        
                        {trackingDetails && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-black">
                              Current Status: <span className="font-bold">{trackingDetails.detailedStatus || 'Processing'}</span>
                            </p>
                            {trackingDetails.mainStatus && (
                              <p className="text-xs text-gray-600 mt-1">
                                System Status: {trackingDetails.mainStatus.charAt(0).toUpperCase() + trackingDetails.mainStatus.slice(1)}
                              </p>
                            )}
                            {trackingDetails.courierName && (
                              <p className="text-xs text-gray-600 mt-1">
                                Courier: {trackingDetails.courierName}
                              </p>
                            )}
                            {trackingDetails.message && (
                              <p className="text-xs text-gray-600 mt-1">
                                {trackingDetails.message}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status" className="font-bold text-black">Order Status</Label>
                <Select 
                  value={orderStatus || ''} 
                  onValueChange={(value) => {
                    try {
                      console.log('Selected order status:', value);
                      
                      // Force the update with setTimeout
                      setTimeout(() => {
                        setOrderStatus(value);
                      }, 0);
                    } catch (error) {
                      console.error('Error setting order status:', error);
                    }
                  }}
                  key={`status-select-${isOpen}-${order?.id}-${orderStatus}`}
                >
                  <SelectTrigger className={`${cartoonStyle.input} bg-white !text-black`}>
                    <SelectValue placeholder="Update status">
                      {orderStatus ? orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1) : 'Update status'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !text-black">
                    <SelectGroup>
                      <SelectLabel className="font-bold text-black">Status Options</SelectLabel>
                      <SelectItem value="processing" className="text-black">Processing</SelectItem>
                      <SelectItem value="shipped" className="text-black">Shipped</SelectItem>
                      <SelectItem value="delivered" className="text-black">Delivered</SelectItem>
                      <SelectItem value="cancelled" className="text-black">Cancelled</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Display tracking short link if available */}
              {(order?.shortLink || trackingDetails?.shortLink) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="font-bold text-black">Tracking Link:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`${cartoonStyle.button} text-xs py-0 h-7 text-black`}
                      onClick={() => {
                        const link = trackingDetails?.shortLink || order?.shortLink;
                        if (link) {
                          navigator.clipboard.writeText(link);
                          alert('Tracking link copied to clipboard!');
                        }
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                  <p className="text-sm text-blue-800 break-all">
                    {trackingDetails?.shortLink || order?.shortLink}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Share this link with the customer to let them track their package.
                  </p>
                </div>
              )}

              {orderStatus === 'cancelled' && (
                <div className="space-y-2">
                  <Label htmlFor="cancelReason" className="font-bold text-black">Cancellation Reason</Label>
                  <Textarea 
                    id="cancelReason" 
                    placeholder="Please provide a reason for cancellation"
                    className={`${cartoonStyle.input} text-black`}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-3 mt-4">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              className={`${cartoonStyle.button} text-black`}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleUpdateShipping} 
            disabled={
              (orderStatus === 'shipped' && (!trackingNumber || !courierCode)) || 
              (orderStatus === 'cancelled' && !cancelReason) ||
              isSubmitting
            }
            className={cartoonStyle.buttonSuccess}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Updating...
              </>
            ) : (
              'Update Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (statusFilter !== 'All') {
        queryParams.append('status', statusFilter.toLowerCase());
      }
      
      if (paymentFilter !== 'All') {
        queryParams.append('paymentStatus', paymentFilter.toLowerCase());
      }
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // Fetch orders from API
      const response = await fetch(`/api/seller/orders${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter, searchQuery]);

  // Update order status
  const updateOrder = async (orderId: number, data: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      // Refresh orders after update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  // Load orders on initial render and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply search filter
  const handleApplyFilters = () => {
    fetchOrders();
  };

  // Toggle sort direction
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Sort orders
  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortBy) {
      case 'id':
        return sortDirection === 'asc' 
          ? a.id - b.id 
          : b.id - a.id;
      case 'totalAmount':
        const amountA = typeof a.totalAmount === 'string' ? parseFloat(a.totalAmount) : a.totalAmount;
        const amountB = typeof b.totalAmount === 'string' ? parseFloat(b.totalAmount) : b.totalAmount;
        return sortDirection === 'asc' 
          ? amountA - amountB 
          : amountB - amountA;
      case 'createdAt':
        return sortDirection === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  // Function to get status badge color
  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return <Badge className="bg-blue-500 text-white border-2 border-black font-bold">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-amber-500 text-white border-2 border-black font-bold">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500 text-white border-2 border-black font-bold">Delivered</Badge>;
      case 'pending':
        return <Badge className="bg-purple-500 text-white border-2 border-black font-bold">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white border-2 border-black font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-2 border-black font-bold">{status}</Badge>;
    }
  };

  // Function to get payment status badge color
  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-2 border-black font-bold">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white border-2 border-black font-bold">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white border-2 border-black font-bold">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-amber-500 text-white border-2 border-black font-bold">Refunded</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white border-2 border-black font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-2 border-black font-bold">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle opening shipping modal
  const handleOpenShippingModal = (order: Order) => {
    setSelectedOrder(order);
    setIsShippingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/seller')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge className="bg-blue-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Orders</Badge>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>Order Management</h1>
            <p className="text-gray-700 mt-1 font-medium">View and manage customer orders</p>
          </div>
        </div>
      </div>

      {/* Filters and search section */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className={`${cartoonStyle.card} bg-yellow-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-black">Filters & Search</CardTitle>
            <CardDescription className="text-gray-700 font-medium">
              Find orders by ID, customer email, or status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 text-black" />
                  <Input
                    placeholder="Search orders..."
                    className={`${cartoonStyle.input} pl-8 text-black`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 text-black" />
                  <select
                    className={`${cartoonStyle.input} w-full pl-8 py-2 appearance-none text-black`}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Order Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 text-black" />
                  <select
                    className={`${cartoonStyle.input} w-full pl-8 py-2 appearance-none text-black`}
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="All">All Payment Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="flex space-x-2 text-black">
                <Button 
                  variant="outline" 
                  className={cartoonStyle.button}
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setPaymentFilter('All');
                  }}
                >
                  Reset
                </Button>
                <Button 
                  className={cartoonStyle.buttonPrimary}
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <div className="max-w-7xl mx-auto">
        <Card className={`${cartoonStyle.card} bg-white`}>
          <CardHeader className="pb-3 border-b-2 border-black">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-black">Orders List</CardTitle>
              <div className="text-sm font-bold">
                {sortedOrders.length} orders
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="font-bold">Loading orders...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 border-2 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p className="mb-6 font-medium">{error}</p>
                <Button 
                  className={cartoonStyle.buttonPrimary}
                  onClick={fetchOrders}
                >
                  Try Again
                </Button>
              </div>
            ) : sortedOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('id')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Order ID</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('createdAt')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Date/Time</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center">
                          <span className="font-extrabold text-black">Buyer&apos;s Email</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left" onClick={() => toggleSort('totalAmount')}>
                        <div className="flex items-center cursor-pointer hover:text-blue-600">
                          <span className="font-extrabold text-black">Total Amount</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-black" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center">
                          <span className="font-extrabold text-black">Order Status</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center">
                          <span className="font-extrabold text-black">Payment Status</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">
                        <span className="font-extrabold text-black">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr key={order.id} className="border-b-2 border-gray-300 hover:bg-yellow-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-black">{order.orderNumber}</td>
                        <td className="py-4 px-4 font-medium text-black">{formatDate(order.createdAt)}</td>
                        <td className="py-4 px-4 text-black">{order.buyer.email}</td>
                        <td className="py-4 px-4 font-bold text-black">RM {Number(order.totalAmount).toFixed(2)}</td>
                        <td className="py-4 px-4 text-black">
                          {getOrderStatusBadge(order.status)}
                        </td>
                        <td className="py-4 px-4">
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 border-2 border-black rounded-md bg-blue-100 hover:bg-blue-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              onClick={() => router.push(`/seller/orders/${order.id}`)}
                              title="View Order Details"
                            >
                              <span className="sr-only">View Details</span>
                              <Eye className="h-4 w-4 text-black" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 border-2 border-black rounded-md bg-green-100 hover:bg-green-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                              onClick={() => handleOpenShippingModal(order)}
                              title="Shipping Details"
                            >
                              <span className="sr-only">Shipping Details</span>
                              <Truck className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 border-2 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">No orders found</h3>
                <p className="mb-6 font-medium">There are no orders matching your criteria</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t-2 border-black pt-4">
            <div className="text-sm font-bold">
              Showing {sortedOrders.length} orders
            </div>
            {/* Pagination would go here for a real app */}
          </CardFooter>
        </Card>
      </div>

      {/* Shipping Details Modal */}
      {selectedOrder && (
        <ShippingDetailsModal 
          isOpen={isShippingModalOpen} 
          onClose={() => setIsShippingModalOpen(false)} 
          order={selectedOrder} 
          onUpdateOrder={updateOrder}
        />
      )}
    </div>
  );
}
