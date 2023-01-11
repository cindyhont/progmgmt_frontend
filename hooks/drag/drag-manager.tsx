import useFuncWithTimeout from "@hooks/counter/function-with-timeout"
import { EntityId } from "@reduxjs/toolkit"
import { MutableRefObject } from "react"

const useDragManager = (
    onDragStart:(_i:number)=>void,
    onDragEnter:(_j:number)=>void,
    fields:EntityId[],
    getElemID:(i:string)=>string,
    clonedElem:MutableRefObject<HTMLElement>
) => {
    const
        handleDragStart = (
            i:number,
            measurement:{
                left:number;
                top:number;
                width?:number;
                height?:number;
            },
        ) => {
            document.body.style.overscrollBehavior = 'none'
            document.body.style.userSelect = 'none'
            
            onDragStart(i)

            clonedElem.current.style.position = 'fixed'
            clonedElem.current.style.left = `${measurement.left}px`
            clonedElem.current.style.top = `${measurement.top}px`
            if ('width' in measurement) clonedElem.current.style.width = `${measurement.width}px`
            if ('height' in measurement) clonedElem.current.style.height = `${measurement.height}px`
            clonedElem.current.style.opacity = '0.7'
        },
        [execDragEnter] = useFuncWithTimeout(onDragEnter,20),
        handleDragMove = (
            x:number,
            y:number,
            tableMeasurement?:{
                top:number;
                bottom:number;
            }
        )=>{
            const len = fields.length

            for (let i=0; i<len; i++){
                const 
                    fieldID = fields[i],
                    mod = document.getElementById(getElemID(`${fieldID}`))
                if (!mod) continue
                
                if (!!tableMeasurement){
                    const 
                        {left,right} = mod.getBoundingClientRect(),
                        {top,bottom} = tableMeasurement
                    if (x>left && x<right && y>top && y<bottom){
                        execDragEnter(i)
                        break
                    }
                } else {
                    const {top,bottom,left,right} = mod.getBoundingClientRect()
                    if (x>left && x<right && y>top && y<bottom){
                        execDragEnter(i)
                        break
                    }
                }
            }
        },
        handleDragEnd = () => {
            document.body.style.overscrollBehavior = null
            document.body.style.userSelect = null
        }

    return {
        handleDragStart,
        handleDragMove,
        handleDragEnd,
    }
}

export default useDragManager