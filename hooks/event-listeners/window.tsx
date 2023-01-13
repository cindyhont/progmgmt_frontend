import { useEffect } from "react";

const useWindowEventListeners = (
    listeners:{evt:string;func:(e:Event | MouseEvent | TouchEvent)=>void}[],
    deps?:any[]
) => {
    useEffect(()=>{
        listeners.forEach(({evt,func})=>{
            window.addEventListener(evt,func,{passive:true})
        })
        return () => {
            listeners.forEach(({evt,func})=>{
                window.removeEventListener(evt,func)
            })
        }
    },deps || [])
}

export default useWindowEventListeners