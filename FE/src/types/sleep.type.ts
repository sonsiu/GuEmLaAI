export interface ISleep {
  _id: string
  sleepQuality: number
  bedtime: Date
  wakeupTime: Date
  note: string
  createdDate: Date
}

export interface ISleepAnalytic {
  totalNight: number
  averageSleepTime: number
  averageSleepQuality: number
  badQuality: number
  averageQuality: number
  goodQuality: number
  excellentQuality: number
}

export enum EMOTION {
  HAPPY = 'HAPPY',
  NORMAL = 'NORMAL',
  SAD = 'SAD'
}

export interface ISpiritDate {
  emotion: EMOTION
  description: string
}

export interface ISpirit {
  _id: string
  createdDate: Date
  morning?: ISpiritDate
  afternoon?: ISpiritDate
  evening?: ISpiritDate
}
