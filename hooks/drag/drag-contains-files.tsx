import { useEffect, useState } from "react"

const useDragContainsFiles = () => {
    const 
        [dragHasFiles,setDragHasFiles] = useState(false),
        handleDragOver = (e:DragEvent) => setDragHasFiles(e.dataTransfer.types.includes('Files'))

    useEffect(()=>{
        window.addEventListener('dragover',handleDragOver,{passive:true})
        return () => window.removeEventListener('dragover',handleDragOver)
    },[])

    return dragHasFiles
}

export default useDragContainsFiles