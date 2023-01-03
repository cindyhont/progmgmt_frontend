import { taskTimeRecordsSelector } from "@components/tasks/reducers/slice"
import { useAppSelector } from "@reducers"
import { EntityId } from "@reduxjs/toolkit"
import { useEffect, useRef, useState } from "react"

const useTaskStopwatch = (timerOn:boolean,timerID:EntityId) => {
    const 
        timeoutRef = useRef<NodeJS.Timeout>(),
        [increment,setIncrement] = useState<number>(null),
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        startTime = useAppSelector(state => taskTimeRecordsSelector.selectById(state,timerID)?.start || 0),
        updateTime = () => {
            const diff = Date.now() - startTime
            setIncrement(diff)
            timeoutRef.current = setTimeout(updateTime,1000 - (diff % 1000))
        },
        cancelTimeout = () => {
            setIncrement(null)
            clearTimeout(timeoutRef.current)
        }

    useEffect(()=>{
        if (timerOn && pageVisibility) updateTime()
        else cancelTimeout()
        return () => cancelTimeout()
    },[timerOn,timerID,pageVisibility])

    return increment
}

export default useTaskStopwatch