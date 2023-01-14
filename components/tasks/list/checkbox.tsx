import { useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import React from "react";
import { taskSelector } from "../reducers/slice";
import TableCell from '@mui/material/TableCell';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import { useTaskUpdateOneFieldMutation } from "../reducers/api";
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckBoxRoundedIcon from '@mui/icons-material/CheckBoxRounded';
import { useTheme } from "@mui/material";

const CheckboxElem = (
    {
        id,
        field,
        hasEditRight,
    }:{
        id:EntityId;
        field:EntityId;
        hasEditRight:boolean;
    }
) => {
    const 
        value = useAppSelector(state => taskSelector.selectById(state,id)[field]),
        [taskUpdateOneField] = useTaskUpdateOneFieldMutation(),
        onClick = () => taskUpdateOneField({id,field,value:!value}),
        {palette:{primary}} = useTheme()

    return (
        <TableCell 
            className={`${field.toString()} task-list-body-cell`}
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
                sx={{'.MuiSvgIcon-root':{fill:primary.main}}}
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