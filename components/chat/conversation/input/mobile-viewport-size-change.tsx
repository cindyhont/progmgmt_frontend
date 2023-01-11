import { ChatPageDialogContext } from "@components/chat"
import useFuncWithTimeout from "@hooks/counter/function-with-timeout"
import { useContext, useEffect } from "react"

const useMobileViewportSizeChange = () => {
    const 
        {dialogOpen} = useContext(ChatPageDialogContext),
        scrollToTop = () => {
            if (!dialogOpen) window.scrollTo({top:0,behavior:'smooth'})
        },
        [onResize] = useFuncWithTimeout(scrollToTop,100)

    useEffect(()=>{
        if ('visualViewport' in window) window.visualViewport.addEventListener('resize',onResize,{passive:true})
        return () => {
            if ('visualViewport' in window) window.visualViewport.removeEventListener('resize',onResize)
        }
    },[])
}

export default useMobileViewportSizeChange