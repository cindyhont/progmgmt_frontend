import { useCallback, useEffect, useRef, useState } from "react"

const useResizerDrag = () => {
    const
        [resizerDragging,setResizerDragging] = useState(false),
        dragTimer = useRef<NodeJS.Timeout>(),
        resizerDragAction = useCallback((dragging:boolean)=>{
            clearTimeout(dragTimer.current)
            if (dragging) setResizerDragging(true)
            else dragTimer.current = setTimeout(()=>setResizerDragging(false),100)
        },[])

    useEffect(()=>{
        return () => clearTimeout(dragTimer.current)
    },[])

    return {
        resizerDragging,
        resizerDragAction,
    }
}

export default useResizerDrag