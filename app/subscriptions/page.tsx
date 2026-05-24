'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Check, 
  Building2, 
  MapPin, 
  FileText, 
  Hash,
  Calendar,
  DollarSign,
  Star,
  Zap,
  Crown,
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'professional' | 'enterprise';
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxVideoAnalyses: number | null;
  current: boolean;
  icon: string;
  color: string;
  bgColor: string;
}

interface LicenseInfo {
  totalLicenses: number;
  assignedLicenses: number;
  availableLicenses: number;
  expiredLicenses: number;
  licenseTypes: {
    basic: number;
    professional: number;
    enterprise: number;
  };
}

interface BillingInfo {
  companyName: string;
  address: string;
  taxDepartment: string;
  taxId: string;
  subscriptionPlan: string;
  maxEmployees: number;
  currentEmployees: number;
  nextBillingDate: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  nextPaymentAmount: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  businessUnit?: {
    businessName: string;
    businessCode: string;
    businessCategory: string;
    region: string;
    zone: string;
    batch: string;
    branch: string;
  };
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: 'paid' | 'failed' | 'pending';
  description: string;
}

interface SubscriptionData {
  currentPlan: SubscriptionPlan;
  availablePlans: SubscriptionPlan[];
  licenseInfo: LicenseInfo;
  billingInfo: BillingInfo;
  paymentHistory: PaymentHistory[];
  additionalLicensePrice: number;
}

export default function SubscriptionsPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching subscription data...');
      
      const response = await fetch('/api/subscriptions/data');
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch subscription data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Subscription data received:', result);
      setSubscriptionData(result.data);
    } catch (err) {
      console.error('❌ Error fetching subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap = {
      shield: Shield,
      star: Star,
      crown: Crown
    };
    return iconMap[iconName as keyof typeof iconMap] || Star;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-blue-600">Loading subscription data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSubscriptionData} className="bg-blue-600 hover:bg-blue-700">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!subscriptionData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No subscription data available</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { currentPlan, availablePlans, licenseInfo, billingInfo, paymentHistory, additionalLicensePrice } = subscriptionData;
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-12">
              <div className="space-y-8">
                {/* Current Subscription Card */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{currentPlan.name} Subscription</h2>
                        <p className="text-blue-100">Renew Date: {formatDate(billingInfo.nextBillingDate)}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm">Main License</span>
                          <Badge className="bg-white/20 text-white border-white/30">
                            +{licenseInfo.assignedLicenses - 1} Additional
                          </Badge>
                        </div>
                        <div className="text-3xl font-bold">${billingInfo.nextPaymentAmount}.00 + VAT</div>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Additional License Section */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Additional License</h3>
                          <div className="text-4xl font-bold text-gray-900 mb-1">
                            ${additionalLicensePrice}<span className="text-lg text-gray-500">/mo</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Check className="w-5 h-5 text-green-500" />
                            <span className="text-sm">Unlimited accounts</span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Check className="w-5 h-5 text-green-500" />
                            <span className="text-sm">No installation fee</span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Check className="w-5 h-5 text-green-500" />
                            <span className="text-sm">No maintenance fee</span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Check className="w-5 h-5 text-green-500" />
                            <span className="text-sm">No updates fees</span>
                          </div>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg">
                          Buy additional license
                        </Button>
                      </div>

                      {/* Payment Information */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Last Payment</h4>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                Payment {billingInfo.paymentStatus === 'paid' ? 'successful' : billingInfo.paymentStatus}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm">•••• •••• •••• 0009</span>
                                <Badge className="bg-blue-600 text-white text-xs">VISA</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">+ ${billingInfo.lastPaymentAmount}.00</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6">
                          <h4 className="font-semibold text-gray-900 mb-4">Next Payment</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">{formatDate(billingInfo.nextBillingDate)}</p>
                            </div>
                            <div className="text-lg font-bold text-gray-900">${billingInfo.nextPaymentAmount}.00</div>
                          </div>
                        </div>

                        <div className="flex space-x-4">
                          <Button variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                            Change Payment Method
                          </Button>
                          <Button variant="outline" className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                            Payment History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Plans */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-bold text-gray-900">Available Plans</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Current Plan */}
                      <Card 
                        className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ring-2 ring-purple-500"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${currentPlan.bgColor} opacity-50`}></div>
                        
                        <CardContent className="relative z-10 p-8 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                            {React.createElement(getIconComponent(currentPlan.icon), { className: "w-8 h-8 text-white" })}
                          </div>
                          
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPlan.name}</h3>
                          <div className="mb-6">
                            <span className="text-4xl font-bold text-gray-900">${currentPlan.price}</span>
                            <span className="text-gray-600 ml-2">per month</span>
                          </div>
                          
                          <div className="mb-8 flex justify-center">
                            <Badge className="bg-purple-600 text-white px-4 py-1 shadow-lg text-base rounded-xl">
                              Current Plan
                            </Badge>
                          </div>
                          
                          <ul className="space-y-3 mb-8">
                            {currentPlan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start space-x-3">
                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 text-sm text-left">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <Button 
                            className="w-full py-3 rounded-xl shadow-lg transition-all duration-200 bg-gray-100 text-gray-600 cursor-not-allowed hover:bg-gray-100"
                            disabled
                          >
                            Current Plan
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Available Plans */}
                      {availablePlans.map((plan, index) => {
                        return (
                          <Card 
                            key={index} 
                            className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgColor} opacity-50`}></div>
                            
                            <CardContent className="relative z-10 p-8 text-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                                {React.createElement(getIconComponent(plan.icon), { className: "w-8 h-8 text-white" })}
                              </div>
                              
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                              <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                                <span className="text-gray-600 ml-2">per month</span>
                              </div>
                              
                              <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                  <li key={featureIndex} className="flex items-start space-x-3">
                                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 text-sm text-left">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              <Button 
                                className={`w-full py-3 rounded-xl shadow-lg transition-all duration-200 bg-gradient-to-r ${plan.color} hover:shadow-xl text-white transform hover:scale-105`}
                              >
                                Upgrade
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-gray-900">Billing</CardTitle>
                      <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        Change Billing
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600 mb-2">
                          <Building2 className="w-4 h-4" />
                          <Label className="text-sm font-medium">Corporate Name</Label>
                        </div>
                        <p className="text-gray-900 font-medium">{billingInfo.companyName}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <Label className="text-sm font-medium">Address</Label>
                        </div>
                        <p className="text-gray-900 font-medium">{billingInfo.address}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600 mb-2">
                          <FileText className="w-4 h-4" />
                          <Label className="text-sm font-medium">Tax Department</Label>
                        </div>
                        <p className="text-gray-900 font-medium">{billingInfo.taxDepartment}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-600 mb-2">
                          <Hash className="w-4 h-4" />
                          <Label className="text-sm font-medium">Tax ID</Label>
                        </div>
                        <p className="text-gray-900 font-medium">{billingInfo.taxId}</p>
                      </div>
                    </div>

                    {/* Business Unit Information */}
                    {billingInfo.businessUnit && (
                      <div className="mt-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Business Unit Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <Building2 className="w-4 h-4" />
                              <Label className="text-sm font-medium">Business Name</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.businessName}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <Hash className="w-4 h-4" />
                              <Label className="text-sm font-medium">Business Code</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.businessCode}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <FileText className="w-4 h-4" />
                              <Label className="text-sm font-medium">Category</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.businessCategory}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <Label className="text-sm font-medium">Region</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.region}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <Label className="text-sm font-medium">Zone</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.zone}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-gray-600 mb-2">
                              <Building2 className="w-4 h-4" />
                              <Label className="text-sm font-medium">Branch</Label>
                            </div>
                            <p className="text-gray-900 font-medium">{billingInfo.businessUnit.branch}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Billing History */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-bold text-gray-900">Billing History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                          </div>
                          <div>
                              <div className="font-semibold text-gray-900">{payment.plan}</div>
                            <div className="text-sm text-gray-600 flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                                <span>{formatDate(payment.date)}</span>
                              </div>
                          </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-gray-900">${payment.amount}.00</div>
                            <Badge className={`mt-1 ${getStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}