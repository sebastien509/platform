import type { Variants } from 'framer-motion';
export const typeformEnter:Variants={initial:{opacity:0,y:24},animate:{opacity:1,y:0,transition:{duration:.32,ease:[.16,1,.3,1]}}};
export const typeformExit:Variants={initial:{opacity:1,y:0,filter:'blur(0px)'},exit:{opacity:.15,y:-24,filter:'blur(1px)',transition:{duration:.26,ease:[.4,0,.2,1]}}};
export const traceState:Variants={initial:{opacity:0,y:-8,scale:.98},animate:{opacity:.15,y:0,scale:.98,transition:{duration:.4,ease:[.16,1,.3,1]}},exit:{opacity:0,y:-12,scale:.96,transition:{duration:.2}}};
