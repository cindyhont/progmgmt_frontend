// import { ChatPageDialogContext } from "@components/chat"
import useFuncWithTimeout from "@hooks/counter/function-with-timeout"
import { useEffect, useState } from "react"

const useMobileViewportSizeChange = () => {
    const 
        [focused,setFocused] = useState(false),
        // {dialogOpen} = useContext(ChatPageDialogContext),
        scrollToTop = () => {
            if (focused) {
                window.scrollTo({top:0,behavior:'smooth'})
                setFocused(false)
            }
        },
        [onResize] = useFuncWithTimeout(scrollToTop,100)

    useEffect(()=>{
        if ('visualViewport' in window) window.visualViewport.addEventListener('resize',onResize,{passive:true})
        return () => {
            if ('visualViewport' in window) window.visualViewport.removeEventListener('resize',onResize)
        }
    },[focused])

    return setFocused
}

export default useMobileViewportSizeChange