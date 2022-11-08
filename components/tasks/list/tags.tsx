import TableCell from "@mui/material/TableCell";
import { useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import React from "react";
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { taskFieldSelector, taskSelector } from "../reducers/slice";
import { useTheme } from "@mui/material";

export interface Ioption {
    id:EntityId;
    name:string;
    color:string;
}

const 
    TagsElem = (
        {
            id,
            field,
            onDragEnter,
        }:{
            id:EntityId;
            field:EntityId;
            onDragEnter:()=>void;
        }
    ) => (
        <TableCell
            className={`${field.toString()} task-list-body-cell`}
            onDragEnter={onDragEnter} 
            // onDoubleClick={onDoubleClick}
            // onTouchStart={onTouchStart}
            data-field={field}
            data-taskid={id}
            sx={{p:0}}
        >
            <TagsInCell {...{id,field}} />
        </TableCell>
    ),
    TagsInCell = (
        {
            id,
            field,
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const ids = useAppSelector(state => taskSelector.selectById(state,id)[field] as EntityId[])

        return (
            <Grid
                sx={{
                    pl:1,
                    mx:0,
                    my:0.5,
                }}
                container
                direction='row'
            >
            {ids.map(id=>(<TagInCell key={id} {...{optionID:id,field}} />))}
            </Grid>
        )
    },
    TagInCell = (
        {
            optionID,
            field
        }:{
            optionID:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            {name,color} = useAppSelector(state => taskFieldSelector.selectById(state,field).details.options.find(opt=>opt.id===optionID) as Ioption),
            theme = useTheme()

        return (
            <Chip 
                label={name} 
                size='small' 
                sx={{
                    m:0.25,
                    backgroundColor:color,
                    '.MuiChip-label':{
                        color:theme.palette.getContrastText(color)
                    }
                }}
            />
        )
    }

export default TagsElem