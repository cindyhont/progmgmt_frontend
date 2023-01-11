import React, { memo, MouseEvent, TouchEvent as ReactTouchEvent, useEffect, useRef } from "react";
import TableCell from '@mui/material/TableCell';
import { useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import Resizer from "./resizer";
import { taskFieldSelector } from "../reducers/slice";

const HeaderCell = memo((
    {
        field,
        dragStart,
        dragMove,
        dragEnd,
        handleMouseDown,
    }:{
        field:EntityId;
        dragStart:(x:number,y:number)=>void;
        dragMove:(x:number,y:number)=>void;
        dragEnd:()=>void;
        handleMouseDown:(x:number,y:number)=>void;
    }
)=>{
    const 
        fieldName = useAppSelector(state=>taskFieldSelector.selectById(state,field)?.fieldName || ''),
        indexeddbOK = useAppSelector(state => state.misc.indexeddbOK),
        isTouchScreen = useAppSelector(state => state.misc.isTouchScreen),
        ref = useRef<HTMLTableCellElement>(),
        onTouchStart = (e:TouchEvent) => {
            e.preventDefault()
            if (e.touches.length !== 1) return
            const f = e.touches[0]
            dragStart(f.pageX,f.pageY)
        },
        onMouseDown = (e:MouseEvent<HTMLTableCellElement>) => { 
            if (indexeddbOK) handleMouseDown(e.pageX,e.pageY)
        },
        onTouchMove = (e:ReactTouchEvent<HTMLTableCellElement>) => {
            const f = e.touches[0]
            dragMove(f.pageX,f.pageY)
        }

    useEffect(()=>{
        ref.current?.addEventListener('touchstart',onTouchStart,{passive:false})
        return () => ref.current?.removeEventListener('touchstart',onTouchStart)
    },[])

    return (
        <>
        <TableCell 
            ref={ref}
            className={`${field}`}
            id={`task-list-table-${field}`}
            sx={{cursor:'move'}}
            data-field={field}
            onTouchMove={onTouchMove}
            onTouchEnd={dragEnd}
            onMouseDown={onMouseDown}
        >{fieldName}</TableCell>
        {!isTouchScreen && <Resizer field={field} />}
        </>
    )
})
HeaderCell.displayName = 'HeaderCell'
export default HeaderCell