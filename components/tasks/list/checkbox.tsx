import { useAppDispatch, useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import React from "react";
import { taskSelector } from "../reducers/slice";
import TableCell from '@mui/material/TableCell';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import taskApi from "../reducers/api";
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckBoxRoundedIcon from '@mui/icons-material/CheckBoxRounded';
import { useTheme } from "@mui/material";

const CheckboxElem = (
    {
        id,
        field,
        onDragEnter,
        hasEditRight,
    }:{
        id:EntityId;
        field:EntityId;
        onDragEnter:()=>void;
        hasEditRight:boolean;
    }
) => {
    const 
        value = useAppSelector(state => taskSelector.selectById(state,id)[field]),
        dispatch = useAppDispatch(),
        onClick = () => dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:!value})),
        theme = useTheme()

    return (
        <TableCell 
            className={`${field.toString()} task-list-body-cell`}
            onDragEnter={onDragEnter}
            data-field={field}
            data-taskid={id}
            sx={{
                p:0,
                textAlign:'center',
            }}
        >
            {hasEditRight && <Checkbox  
                checked={value}
                onClick={onClick}
                sx={{'.MuiSvgIcon-root':{fill:theme.palette.primary.main}}}
                data-nottotask='true'
            />}
            {!hasEditRight && <Grid
                container
                direction='row'
                sx={{
                    justifyContent:'center'
                }}
            >
                {!!value ? <CheckBoxRoundedIcon color='primary' /> : <CheckBoxOutlineBlankRoundedIcon color='primary' />}
            </Grid>}
        </TableCell>
    )
}

export default CheckboxElem