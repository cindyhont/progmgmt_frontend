import React, { memo, useContext, useEffect, useRef } from "react";
import TableCell from '@mui/material/TableCell';
import { EntityId } from "@reduxjs/toolkit";
import { ResizerDragContent } from ".";
import { grey } from '@mui/material/colors';

const Resizer = memo((
    {
        field,
        id,
    }:{
        field:EntityId;
        id?:EntityId;
    }
) => {
    const 
        intialWidth = useRef(0),
        cursorX = useRef(0),
        resizerOn = useRef(false),
        dragging = useRef(false),
        {resizerDragAction} = useContext(ResizerDragContent),
        borderThicken = () => {
            const 
                cells = document.getElementsByClassName(field.toString()) as HTMLCollectionOf<HTMLElement>,
                len = cells.length

            for (let i=0; i<len; i++){
                cells[i].classList.add('hover')
            }
        },
        borderShrink = () => {
            const 
                cells = document.getElementsByClassName(field.toString()) as HTMLCollectionOf<HTMLElement>,
                len = cells.length

            for (let i=0; i<len; i++){
                cells[i].classList.remove('hover')
            }
        },
        onMouseDown = (e:React.MouseEvent) => {
            if (e.button!==0) return
            resizerDragAction(true)
            
            const 
                cells = document.getElementsByClassName(field.toString()) as HTMLCollectionOf<HTMLElement>,
                headerCell = cells[0]

            if (!!headerCell.style.width) intialWidth.current = +headerCell.style.width.replace('px','')
            else intialWidth.current = headerCell.offsetWidth

            cursorX.current = e.pageX
            resizerOn.current = true
        },
        onMouseMove = (e:MouseEvent) => {
            if (!resizerOn.current) return
            resizerDragAction(true)
            dragging.current = true
            const 
                cells = document.getElementsByClassName(field.toString()) as HTMLCollectionOf<HTMLElement>,
                len = cells.length,
                newWidth = Math.max(intialWidth.current + e.pageX - cursorX.current,10)

            for (let i=0; i<len; i++){
                cells[i].style.width = `${newWidth}px`
            }
        },
        onMouseUp = () => {
            if (dragging.current) borderShrink()
            resizerDragAction(false)
            resizerOn.current = false
            dragging.current = false
        },
        onMouseEnter = () => {
            if (!resizerOn.current) borderThicken()
        },
        onMouseLeave = () => {
            if (!resizerOn.current) borderShrink()
        }

    useEffect(()=>{
        document.addEventListener('mousemove',onMouseMove)
        document.addEventListener('mouseup',onMouseUp)
        return () => {
            document.removeEventListener('mousemove',onMouseMove)
            document.removeEventListener('mouseup',onMouseUp)
        }
    },[])

    return (
        <TableCell 
            sx={{
                width:5,
                p:0,
                userSelect:'none',
                cursor:'col-resize',
                borderRight:`1px dotted ${grey[500]}`,
            }}
            className='resizer'
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data-field={field}
            {...{...(!!id && {'data-taskid':id})}}
        />
    )
})
Resizer.displayName = 'Resizer'
export default Resizer