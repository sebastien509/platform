export const durations={instant:.08,fast:.15,base:.22,slow:.32,slower:.48} as const;
export const easings={standard:[.2,0,0,1],decelerate:[0,0,.2,1],accelerate:[.4,0,1,1],emphasized:[.2,0,0,1]} as const;
export const transitions={fast:{duration:durations.fast,ease:easings.standard},base:{duration:durations.base,ease:easings.standard},slow:{duration:durations.slow,ease:easings.standard},decelerate:{duration:durations.base,ease:easings.decelerate},accelerate:{duration:durations.fast,ease:easings.accelerate},emphasized:{duration:durations.slow,ease:easings.emphasized}} as const;
export type MotionDuration=keyof typeof durations;export type MotionEasing=keyof typeof easings;export type MotionTransition=keyof typeof transitions;
