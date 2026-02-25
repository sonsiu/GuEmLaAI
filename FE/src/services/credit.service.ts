import { ClientApi } from './client-api.service'
import type {
  CreditBalance,
  CreditTransaction,
  UseCreditRequest,
  PaymentRequest,
  CreatePaymentResult,
  Payment
} from '@/types/credit.type'

class CreditService {
  /**
   * Get user's current credit balance
   */
  async getCreditBalance(): Promise<CreditBalance> {
    const response = await ClientApi.get<CreditBalance>('/Credit/balance')

    return response.getRaw().data
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditHistory(limit?: number): Promise<CreditTransaction[]> {
    const url = limit ? `/Credit/history?limit=${limit}` : '/Credit/history'
    const response = await ClientApi.get<CreditTransaction[]>(url)

    return response.getRaw().data
  }

  /**
   * Use credits for a service
   */
  async useCredits(request: UseCreditRequest): Promise<{ success: boolean; newBalance: number; message: string }> {
    const response = await ClientApi.post<{ success: boolean; newBalance: number; message: string }>(
      '/Credit/use',
      request
    )

    return response.getRaw().data
  }

  /**
   * Create a payment link for credit purchase
   */
  async createPaymentLink(userId: number, paymentRequest: PaymentRequest): Promise<CreatePaymentResult> {
    const response = await ClientApi.post<CreatePaymentResult>(
      `/Payment/create-embedded-payment-link?userId=${userId}`,
      paymentRequest
    )

    return response.getRaw().data
  }

  /**
   * Get payment information by order code
   */
  async getPaymentInfo(orderCode: number): Promise<Payment> {
    const response = await ClientApi.get<Payment>(`/Payment/info?orderCode=${orderCode}`)

    return response.getRaw().data
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: number, status?: string): Promise<Payment[]> {
    const url = status
      ? `/Payment/list?userId=${userId}&status=${status}`
      : `/Payment/list?userId=${userId}`

    const response = await ClientApi.get<Payment[]>(url)

    return response.getRaw().data
  }
}

export const creditService = new CreditService()

