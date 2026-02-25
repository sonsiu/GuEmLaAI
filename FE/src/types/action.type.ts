export type TAction = {
  _id: string
  title: string
  videoUrl: string
  tags: ActionTag[]
  createdAt: string
  updatedAt: string
}

export enum ActionTag {
  YOGA = 'YOGA',
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO'
}

export const ActionLabel: Record<ActionTag, string> = {
  [ActionTag.YOGA]: 'Yoga',
  [ActionTag.STRENGTH]: 'Thiền',
  [ActionTag.CARDIO]: 'Thể dục'
}

export const ActionTagFake: Record<string, ActionTag> = {
  yoga: ActionTag.YOGA,
  meditation: ActionTag.STRENGTH,
  exercise: ActionTag.CARDIO
}
