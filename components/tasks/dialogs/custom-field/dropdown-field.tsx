import React, { memo, useCallback, useContext, useRef } from "react";
import { v4 as uuidv4 } from 'uuid'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import { EntityId } from "@reduxjs/toolkit";
import { Context } from ".";
import { editDefaultValueAction, editOptionsAction } from "./reducer";
import AddOptionTextInput from "./add-option-text-input";

const 
    DropdownField = (
        {
            fieldTypeID,
            options,
            defaultValue
        }:{
            fieldTypeID:EntityId,
            options?:{id:EntityId;name:string;}[];
            defaultValue?:EntityId;
        }
    ) => {
        const
            {customFieldDispatch} = useContext(Context),
            addOption = (name:string) => {
                const opt = {id:uuidv4(),name}
                customFieldDispatch(editOptionsAction({
                    key:fieldTypeID,
                    value:!!options ? [...options,opt] : [opt]
                }))
            },
            setDefault = useCallback((v:EntityId)=>customFieldDispatch(editDefaultValueAction({
                key:fieldTypeID,
                value:v
            })),[]),
            deleteOpt = useCallback((v:EntityId)=>{
                if (defaultValue===v) customFieldDispatch(editDefaultValueAction({
                    key:fieldTypeID,
                    value:null
                }))
                customFieldDispatch(editOptionsAction({
                    key:fieldTypeID,
                    value:options.filter(({id})=>id!==v)
                }))
            },[defaultValue]),
            radioName = useRef(uuidv4()).current

        return (
            <Table stickyHeader>
                <TableHead>
                    <AddOptionTextInput {...{
                        addOption,
                        colSpan:1
                    }} />
                </TableHead>
                <TableBody>
                    {!!options && options.map(({id,name})=>(
                       <Option {...{
                            id,
                            name,
                            checked:id===defaultValue,
                            setDefault,
                            deleteOpt,
                            radioName,
                        }} key={id} 
                        />
                    ))}
                </TableBody>
            </Table>
        )
    },
    Option = memo((
        {
            id,
            name,
            checked,
            setDefault,
            deleteOpt,
            radioName,
        }:{
            id:EntityId;
            name:string;
            checked:boolean;
            setDefault:(v:EntityId)=>void;
            deleteOpt:(v:EntityId)=>void;
            radioName:string;
        }
    ) => {
        const 
            radioOnClick = () => setDefault(id),
            crossOnClick = () => deleteOpt(id)

        return (
            <TableRow>
                <TableCell sx={{border:'none',p:0}}>
                    <Tooltip title='Select default option of dropdown menu' enterDelay={1000} enterNextDelay={1000}>
                        <FormControlLabel 
                            value={id} 
                            control={<Radio required name={radioName} checked={checked} onClick={radioOnClick} />} 
                            label={name} 
                        />
                    </Tooltip>
                </TableCell>
                <TableCell 
                    sx={{
                        border:'none',
                        p:0,
                        ml:1,
                        display:'flex',
                        flexDirection:'row',
                        justifyContent:'center'
                    }}
                >
                    <IconButton onClick={crossOnClick}>
                        <CloseRoundedIcon color='error' fontSize="large" />
                    </IconButton>
                </TableCell>
            </TableRow>
        )
    })
Option.displayName = 'Option'
export default DropdownField