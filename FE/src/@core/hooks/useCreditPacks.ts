import { useState, useEffect } from 'react'
import { useAuth } from '@/@core/contexts/AuthContext'
import { creditService } from '@/services/credit.service'
import type { CreditPack, CreditTransaction, PaymentRequest, CreatePaymentResult } from '@/types/credit.type'

export function useCreditPacks() {
  const { user, isAuthenticated } = useAuth()

  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentResult, setPaymentResult] = useState<CreatePaymentResult | null>(null)
  const [currentOrderCode, setCurrentOrderCode] = useState<number | null>(null)

  const fetchCreditBalance = async () => {
    setRefreshing(true)

    try {
      const data = await creditService.getCreditBalance()

      setBalance(data.balance)
    } catch (err) {
      //console.error('Failed to fetch credit balance:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      const transactions = await creditService.getCreditHistory(5)

      setRecentTransactions(transactions)
    } catch (err) {
      //console.error('Failed to fetch transactions:', err)
    }
  }

  // Fetch credit balance on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditBalance()
      fetchRecentTransactions()
    }
  }, [isAuthenticated])

  // Light polling: Check payment status while modal is open
  useEffect(() => {
    if (!isPaymentOpen || !currentOrderCode) return

    const pollInterval = setInterval(async () => {
      try {
        const paymentInfo = await creditService.getPaymentInfo(currentOrderCode)

        if (paymentInfo && typeof paymentInfo === 'object' && 'status' in paymentInfo) {
          const status = (paymentInfo as { status: string }).status

          if (status === 'PAID') {
            clearInterval(pollInterval)
            setIsPaymentOpen(false)
            setSuccessMessage('✅ Payment successful! Credits have been added.')
            fetchCreditBalance()
            fetchRecentTransactions()
          } else if (status === 'CANCELLED' || status === 'EXPIRED') {
            clearInterval(pollInterval)
            setIsPaymentOpen(false)
          }
        }
      } catch (err) {
        //console.error('Error checking payment status:', err)
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(pollInterval)
  }, [isPaymentOpen, currentOrderCode])

  const handlePurchase = async (pack: CreditPack) => {
    // if (!user?.id) {
    //   setError('Please log in to purchase credits')
    //   return
    // }

    // setPurchasingPackId(pack.id)
    // setLoading(true)
    // setError(null)

    // try {
    //   // Create payment request
    //   const paymentRequest: PaymentRequest = {
    //     amount: pack.price,
    //     description: `${pack.credits} credits`,
    //     items: [
    //       {
    //         name: pack.name,
    //         quantity: 1,
    //         price: pack.price
    //       }
    //     ]
    //   }

    //   const result = await creditService.createPaymentLink(user., paymentRequest)

    //   setPaymentResult(result)
    //   setCurrentOrderCode(result.orderCode)
    //   setIsPaymentOpen(true)
    //   setLoading(false)
    //   setPurchasingPackId(null)
    // } catch (err) {
    //   const errorMessage = err instanceof Error ? err.message : 'Failed to create payment'

    //   setError(errorMessage)
    //   console.error('Purchase error:', err)
    //   setLoading(false)
    //   setPurchasingPackId(null)
    // }
  }

  const handleClosePayment = async () => {
    // setIsPaymentOpen(false)
    // setPurchasingPackId(null)
    // setPaymentResult(null)
    // setCurrentOrderCode(null)
  }

  return {
    balance,
    loading,
    refreshing,
    purchasingPackId,
    recentTransactions,
    error,
    successMessage,
    isPaymentOpen,
    paymentResult,
    fetchCreditBalance,
    handlePurchase,
    handleClosePayment
  }
}

