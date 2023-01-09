import { useEffect, useState } from "react"

const useWindowHeight = () => {
    const 
        [height,setHeight] = useState('100vh'),
        onResize = () => setHeight(`${window.innerHeight}px`)

    useEffect(()=>{
        onResize()
        window.addEventListener('resize',onResize,{passive:true})
        return () => window.removeEventListener('resize',onResize)
    },[])

    return height
}

export default useWindowHeight