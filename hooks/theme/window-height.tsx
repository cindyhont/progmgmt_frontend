import useFuncWithTimeout from "@hooks/counter/function-with-timeout"
import { useEffect, useState } from "react"

const useWindowHeight = () => {
    const 
        [height,setHeight] = useState('100vh'),
        setNewHeight = (h:number) => setHeight(`${h}px`),
        [onResizeTimeout] = useFuncWithTimeout(setNewHeight,100),
        onResize = () => onResizeTimeout(window.innerHeight)

    useEffect(()=>{
        setNewHeight(window.innerHeight)
        window.addEventListener('resize',onResize,{passive:true})
        return () => window.removeEventListener('resize',onResize)
    },[])

    return height
}

export default useWindowHeight