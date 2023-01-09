import { useEffect, useState } from "react"

const useWindowHeight = () => {
    const 
        [height,setHeight] = useState('100vh'),
        onResize = () => setHeight(`${window.visualViewport.height}px`)

    useEffect(()=>{
        onResize()
        window.visualViewport.addEventListener('resize',onResize,{passive:true})
        return () => window.visualViewport.removeEventListener('resize',onResize)
    },[])

    return height
}

export default useWindowHeight