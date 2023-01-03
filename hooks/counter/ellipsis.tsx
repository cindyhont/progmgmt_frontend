import { useAppSelector } from "@reducers"
import { useEffect, useRef, useState } from "react"

const useEllipsis = () => {
    const 
        [str,setStr] = useState(''),
        timeout = useRef<NodeJS.Timeout>(),
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        animate = () => {
            const newStr = Array.from(Array((str.length + 1) % 4),() => '.').join('')
            setStr(newStr)
            timeout.current = setTimeout(animate,800)
        }

    useEffect(()=>{
        if (pageVisibility) timeout.current = setTimeout(animate,800)
        return () => clearTimeout(timeout.current)
    },[pageVisibility])

    return str
}

export default useEllipsis