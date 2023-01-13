import useWindowEventListeners from "@hooks/event-listeners/window"
import { useState } from "react"

const useDragContainsFiles = () => {
    const 
        [dragHasFiles,setDragHasFiles] = useState(false),
        handleDragOver = (e:DragEvent) => setDragHasFiles(e.dataTransfer.types.includes('Files'))

    useWindowEventListeners([
        {evt:'dragover',func:handleDragOver},
    ])

    return dragHasFiles
}

export default useDragContainsFiles