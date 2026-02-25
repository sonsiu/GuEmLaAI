import type { ContentListUnion, ContentUnion } from '@google/genai'
import { GoogleGenAI } from '@google/genai'
import type { IProfile } from '../types/auth.type'
import type { Ingredient } from '@/types/meal.type'
import type { ISleep, ISleepAnalytic } from '@/types/sleep.type'

export class GeminiService {
  private ai: GoogleGenAI
  private systemInstruction: ContentUnion | undefined

  constructor(profile?: IProfile) {
    this.ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })

    if (profile) {
      this.systemInstruction = this.createMealPlanInstruction(profile)
    }
  }

  createMealPlanInstruction(profile: IProfile): ContentUnion {
    return {
      role: 'model',
      parts: [
        {
          text: `[THÔNG TIN NGƯỜI DÙNG]
- Mã người dùng: ${profile.userId || 'Chưa có'}
- Cân nặng: ${profile.weight || 'Chưa có'}kg
- Chiều cao: ${profile.height || 'Chưa có'}cm
- Vòng eo: ${profile.waist || 'Chưa có'}cm
- BMI: ${profile.bmi || 'Chưa có'}
- Mục tiêu sức khỏe: ${profile.healthGoal || 'Chưa có'}
- Cân nặng mục tiêu: ${profile.targetWeight || 'Chưa có'}kg
- Tỉ lệ mỡ cơ thể: ${profile.bodyFatPercentage || 'Chưa có'}%
- Khối lượng cơ: ${profile.muscleMass || 'Chưa có'}kg
- Lượng nước uống/ngày: ${profile.dailyWaterIntake || 'Chưa có'} ml
- Số bước chân mục tiêu/ngày: ${profile.dailySteps || 'Chưa có'} bước
- Dị ứng: ${profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'Chưa có'}
- Hạn chế ăn uống: ${profile.foodRestrictions && profile.foodRestrictions.length > 0 ? profile.foodRestrictions.join(', ') : 'Chưa có'}
- Chế độ ăn: ${profile.dietaryPreference || 'Chưa có'}
- Bữa ăn ưa thích: ${profile.mealPreference || 'Chưa có'}
- Lượng calo mục tiêu/ngày: ${profile.dailyCalorieGoal || 'Chưa có'} cal
- Lượng calo tiêu thu trung bình/ngày: ${profile.dailyCalorieBurn || 'Chưa có'} cal
- Tình trạng sức khỏe: ${profile.medicalConditions || 'Chưa có'}
- Thực phẩm bổ sung: ${profile.supplements || 'Chưa có'}
- Mức độ vận động: ${profile.workoutSchedule || 'Chưa có'}
- Tuổi: ${profile.age || 'Chưa có'}
- Giới tính: ${profile.gender || 'Chưa có'}
- Ngày xóa tài khoản: ${profile.deletedAt || 'Chưa có'}

**Lưu ý: Thông tin nào ghi là 'Chưa có' thì có thể bỏ qua khi xây dựng thực đơn để tránh loãng thông tin.**`
        },
        {
          text: `[RULES FOR MEAL SUGGESTION]
1. Always return an array of objects, each object is a meal plan for one day.
2. If the user asks for 1 day, return an array with 1 object. If the user asks for a week, return an array with 7 objects.
3. Each object must have the following structure:
{
  "day": 1,
  "overview": "Short summary about the meal plan and health goal",
  "additionalAdvice": "Additional advice for the day",
  "breakfast": [ { ... } ],
  "lunch": [ { ... } ],
  "dinner": [ { ... } ],
  "snack": [ { ... } ],
  "totalCalories": "",
  "totalProtein": "",
  "totalCarb": "",
  "totalFat": ""
}
4. Each meal (breakfast, lunch, dinner, snack) is an array of dishes. Each dish has:
- "dish_name": string
- "ingredients": array of objects, each with:
    - "name": string
    - "quantity": string (must include unit 'g', e.g., "100g")
- "calories": string (number or range, no unit)
- "protein": string (number or range, no unit)
- "carb": string (number or range, no unit)
- "fat": string (number or range, no unit)
5. Do not include any text or explanation outside the JSON array.
6. Example format:
[
  {
    "day": 1,
    "overview": "Summary...",
    "additionalAdvice": "Advice...",
    "breakfast": [
      {
        "dish_name": "Pho bo",
        "ingredients": [
          { "name": "Pho", "quantity": "100g" },
          { "name": "Bo", "quantity": "100g" }
        ],
        "calories": "350",
        "protein": "20",
        "carb": "50",
        "fat": "8"
      }
    ],
    "lunch": [ ... ],
    "dinner": [ ... ],
    "snack": [ ... ],
    "totalCalories": "1500",
    "totalProtein": "100",
    "totalCarb": "500",
    "totalFat": "50"
  }
]
7. If a value is a range, use the format "min-max" (e.g., "calories": "300-400"). If it is a single value, use the number only (e.g., "calories": "100"). Do not include units or text like 'kcal', 'g', etc. in these fields.
8. Do not return any text outside the JSON array.
9. **Only return up to day 7 (do not return any day > 7).**
10. **Bắt buộc phải xây dựng thực đơn dựa trên đầy đủ thông tin người dùng cung cấp ở phần [THÔNG TIN NGƯỜI DÙNG] phía trên. Không được bỏ qua bất kỳ thông tin nào.**
11. **Tổng lượng calo mỗi ngày trong thực đơn phải tiệm cận hoặc xấp xỉ với lượng calo mục tiêu/ngày của người dùng (nếu có), hoặc lượng calo tiêu thụ trung bình/ngày nếu không có mục tiêu. Ví dụ: ${profile.dailyCalorieGoal || profile.dailyCalorieBurn || 'Chưa có'} kcal/ngày. Không được thấp hơn 90% hoặc cao hơn 110% so với con số này.**`
        },
        {
          text: `[CÁCH TRẢ LỜI]
1. Trả lời theo cấu trúc:
   - Tổng quan về thực đơn
   - Chi tiết từng bữa ăn (tên món, lượng calo, thành phần dinh dưỡng)
   - Lời khuyên bổ sung
2. Sử dụng ngôn ngữ dễ hiểu, không quá chuyên môn
3. Đưa ra các lựa chọn thay thế nếu có
4. Nhắc nhở về việc uống nước và vận động
5. Khuyến khích tham khảo ý kiến chuyên gia dinh dưỡng nếu cần`
        }
      ]
    }
  }

  async getResponse(
    prompt: string,
    history: any[] = [],
    instruction: ContentUnion | undefined = this.systemInstruction
  ): Promise<string> {
    try {
      const contents: ContentListUnion = [
        ...history,
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: instruction,
          temperature: 0.8,
          topP: 0.95
        }
      })

      return response.text || 'Không nhận được phản hồi từ AI'
    } catch (error) {
      //console.error('Lỗi khi gọi Gemini API:', error)
      return 'Xin lỗi, tôi không thể xử lý yêu cầu này lúc này.'
    }
  }

  async getCookingSteps(dishName: string, ingredients: Ingredient[]): Promise<string> {
    const ingredientsList = ingredients.map(ing => `${ing.name} (${ing.quantity})`).join('\n- ')

    const prompt = `Hãy hướng dẫn cách nấu món ${dishName} theo từng bước cụ thể. 

Nguyên liệu cần chuẩn bị:
- ${ingredientsList}

Trả lời theo định dạng:
Bước 1: [Mô tả bước 1]
Bước 2: [Mô tả bước 2]
...
Lưu ý: Có thể trả lời vài lời khuyên về cách nấu món.`

    const response = await this.getResponse(prompt, [], ``)

    return response
  }

  formatHourVi(date: Date) {
    const h = date.getHours()

    if (h === 0) return '12 giờ sáng'
    if (h < 12) return `${h} giờ sáng`
    if (h === 12) return '12 giờ trưa'
    if (h < 18) return `${h} giờ chiều`
    if (h < 24) return `${h - 12} giờ tối`
    return `${h} giờ`
  }

  async getSleepInsight(sleeps: ISleep[], analytic: ISleepAnalytic | null): Promise<string> {
    if (!analytic) return 'Không có dữ liệu giấc ngủ'

    const prompt = `
Bạn là chuyên gia về sức khỏe giấc ngủ. Dưới đây là dữ liệu giấc ngủ của người dùng trong thời gian gần đây:

- Tổng số đêm ghi nhận: ${analytic.totalNight}
- Thời gian ngủ trung bình: ${analytic.averageSleepTime.toFixed(2)} giờ
- Chất lượng giấc ngủ trung bình: ${analytic.averageSleepQuality.toFixed(2)} (thang điểm 10)
- Số đêm chất lượng kém: ${analytic.badQuality}
- Số đêm chất lượng trung bình: ${analytic.averageQuality}
- Số đêm chất lượng tốt: ${analytic.goodQuality}
- Số đêm chất lượng xuất sắc: ${analytic.excellentQuality}

Chi tiết từng đêm gần nhất:
${sleeps
  .map(
    (s, i) =>
      `Đêm ${i + 1}: Ngủ từ ${this.formatHourVi(new Date(s.bedtime))} đến ${this.formatHourVi(new Date(s.wakeupTime))}, chất lượng: ${s.sleepQuality}/10, ghi chú: ${s.note || 'Không có'}`
  )
  .join('\n')}

Dựa trên các dữ liệu trên, hãy phân tích và đưa ra lời khuyên cụ thể, ngắn gọn (3-5 câu) để người dùng cải thiện chất lượng giấc ngủ. Trả lời bằng tiếng Việt, xưng "bạn".
  `.trim()

    const response = await this.getResponse(prompt, [], ``)

    return response
  }

  async getSpiritAdvice(userPrompt: string, history: ContentListUnion = []): Promise<string> {
    const systemPrompt = `
Bạn là chuyên gia tâm lý, có nhiệm vụ lắng nghe, động viên và tư vấn tinh thần cho người dùng. Hãy trả lời thật đồng cảm, tích cực, ngắn gọn (2-5 câu), xưng "bạn". Nếu người dùng chia sẻ cảm xúc tiêu cực, hãy động viên và đưa ra lời khuyên nhẹ nhàng, thực tế. Nếu người dùng cần động lực, hãy khích lệ và gợi ý các cách cải thiện tâm trạng. Không dùng ngôn ngữ quá chuyên môn, hãy gần gũi như một người bạn tốt bụng.

Dưới đây là chia sẻ của người dùng:
"${userPrompt}"

Hãy trả lời bằng tiếng Việt.
    `.trim()

    return this.getResponse(systemPrompt, history as any[], undefined)
  }
}
