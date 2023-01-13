import React, { useRef, TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent, useEffect, useContext } from 'react'
import TableCell from '@mui/material/TableCell'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box'
import { useTheme } from "@mui/material";
import { TaskDetailsSidebarDragContext } from '.';

const DragHandle = (
    {
        idx,
    }:{
        idx:number;
    }
) => {
    const
        {palette:{grey}} = useTheme(),
        dragHandle = useRef<HTMLTableCellElement>(),
        {
            dragStart,
            dragMove,
            dragEnd,
            handleMouseDown,
        } = useContext(TaskDetailsSidebarDragContext),
        onTouchStart = (e:TouchEvent) => {
            e.preventDefault()
            if (e.touches.length !== 1) return
            const f = e.touches[0]
            dragStart(f.pageX,f.pageY,idx)
        },
        onTouchMove = (e:ReactTouchEvent<HTMLTableCellElement>) => {
            const f = e.touches[0]
            dragMove(f.pageX,f.pageY)
        },
        onMouseStart = (e:ReactMouseEvent<HTMLTableCellElement>) => handleMouseDown(e.pageX,e.pageY,idx)

    useEffect(()=>{
        dragHandle.current?.addEventListener('touchstart',onTouchStart,{passive:false})
        return () => dragHandle.current?.removeEventListener('touchstart',onTouchStart)
    },[])
        
    return (
        <TableCell 
            sx={{width:0,cursor:'move'}} 
            ref={dragHandle}
            onTouchMove={onTouchMove}
            onTouchEnd={dragEnd}
            onTouchCancel={dragEnd}
            onMouseDown={onMouseStart}
        >
            <Box sx={{display:'flex',justifyContent:'center'}}>
                <DragIndicatorIcon fontSize="small" sx={{mx:1}} htmlColor={grey[500]} />
            </Box>
        </TableCell>
    )
}

export default DragHandle