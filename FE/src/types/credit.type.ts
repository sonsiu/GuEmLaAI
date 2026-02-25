export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number // in VND
  priceUSD?: number
  popular?: boolean
  features: string[]
  badge?: string
}

export interface CreditBalance {
  balance: number
  userId: number
}

export interface CreditTransaction {
  id: number
  userId: number
  amount: number
  type: 'PURCHASE' | 'USAGE' | 'REFUND' | 'BONUS'
  description: string
  createdAt: string
  paymentId?: number
  referenceId?: string
}

export interface UseCreditRequest {
  amount: number
  description: string
  referenceId?: string
}

export interface Payment {
  id: number
  orderCode: number
  amount: number
  description: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
  paymentUrl?: string
  checkoutUrl?: string
  createdAt: string
  paidAt?: string
  transactionId?: string
  userId?: number
}

export interface PaymentRequest {
  amount: number
  description: string
  items: PaymentItem[]
  returnUrl?: string
  cancelUrl?: string
}

export interface PaymentItem {
  name: string
  quantity: number
  price: number
}

export interface CreatePaymentResult {
  bin: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
  orderCode: number
  currency: string
  paymentLinkId: string
  status: string
  checkoutUrl: string
  qrCode: string
}

