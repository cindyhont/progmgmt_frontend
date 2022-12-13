import React, { memo } from "react";
import TableCell from '@mui/material/TableCell';
import { useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import Resizer from "./resizer";
import { taskFieldSelector } from "../reducers/slice";

const HeaderCell = memo((
    {
        field,
        onDragEnter,
        onDragStart
    }:{
        field:EntityId;
        onDragEnter:()=>void;
        onDragStart:()=>void;
    }
)=>{
    const 
        fieldName = useAppSelector(state=>taskFieldSelector.selectById(state,field)?.fieldName || ''),
        indexeddbOK = useAppSelector(state => state.misc.indexeddbOK),
        isTouchScreen = useAppSelector(state => state.misc.isTouchScreen)

    return (
        <>
        <TableCell 
            className={field.toString()}
            draggable={indexeddbOK}
            onDragEnter={onDragEnter}
            onDragStart={onDragStart}
            sx={{cursor:'move'}}
            data-field={field}
        >{fieldName}</TableCell>
        {!isTouchScreen && <Resizer field={field} />}
        </>
    )
})
HeaderCell.displayName = 'HeaderCell'
export default HeaderCell