import { EntityId } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid'
import React, { memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddOptionTextInput from "./add-option-text-input";
import Brightness1Icon from '@mui/icons-material/Brightness1';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import { Context } from ".";
import { editDefaultValueAction, editOptionsAction } from "./reducer";
import { HexColorPicker } from "react-colorful";

const 
    getColorValue = () => Math.round(Math.random() * 255).toString(16).padStart(2,'0'),
    TagsField = (
        {
            fieldTypeID,
            options,
            defaultValue
        }:{
            fieldTypeID,
            options?:{id:EntityId;name:string;color:string;}[];
            defaultValue?:EntityId[];
        }
    ) => {
        const 
            {customFieldDispatch} = useContext(Context),
            addOption = (name:string) => {
                const opt = {id:uuidv4(),name,color:`#${getColorValue()}${getColorValue()}${getColorValue()}`}
                customFieldDispatch(editOptionsAction({
                    key:fieldTypeID,
                    value:!!options ? [...options,opt] : [opt]
                }))
            },
            toggleDefault = useCallback((v:EntityId)=>{
                if (!!defaultValue && defaultValue.includes(v)) customFieldDispatch(editDefaultValueAction({
                    key:fieldTypeID,
                    value:defaultValue.filter(e=>e!==v)
                }))
                else customFieldDispatch(editDefaultValueAction({
                    key:fieldTypeID,
                    value:!!defaultValue ? [...defaultValue,v] : [v]
                }))
            },[defaultValue]),
            deleteOption = useCallback((v:EntityId) => {
                if (!!defaultValue && defaultValue.includes(v)) toggleDefault(v)
                customFieldDispatch(editOptionsAction({
                    key:fieldTypeID,
                    value:options.filter(({id})=>id!==v)
                }))
            },[defaultValue,options]),
            updateColor = useCallback((v:EntityId,color:string)=> customFieldDispatch(editOptionsAction({
                key:fieldTypeID,
                value:options.map(e=>({...e,...(e.id===v && {color})}))
            })),[options])

        return (
            <Table stickyHeader>
                <TableHead>
                    <AddOptionTextInput {...{
                        addOption,
                        colSpan:2
                    }} />
                </TableHead>
                <TableBody>
                    {!!options && options.map(({id,name,color})=>(
                        <Option {...{
                            id,
                            name,
                            color,
                            checked:!!defaultValue && !!defaultValue.length && defaultValue.includes(id),
                            toggleDefault:()=>toggleDefault(id),
                            deleteOption,
                            updateColor
                        }} key={id} />
                    ))}
                </TableBody>
            </Table>
        )
    },
    Option = memo((
        {
            id,
            name,
            color,
            checked,
            toggleDefault,
            deleteOption,
            updateColor,
        }:{
            id:EntityId;
            name:string;
            color:string;
            checked:boolean;
            toggleDefault:()=>void;
            deleteOption:(v:EntityId)=>void;
            updateColor:(v:EntityId,color:string)=>void;
        }
    )=>{
        const 
            radioOnClick = () => toggleDefault(),
            crossOnClick = () => deleteOption(id),
            colorButtonRef = useRef<HTMLButtonElement>(),
            [colorPickerOpen,setColorPickerOpen] = useState(false),
            toggleColorPicker = () => setColorPickerOpen(prev=>!prev),
            colorOnChange = (e:string) => updateColor(id,e)

        return (
            <>
            <TableRow>
                <TableCell sx={{border:'none',p:0}}>
                    <Tooltip title='Select default tags' enterDelay={1000} enterNextDelay={1000}>
                        <FormControlLabel control={<Checkbox checked={checked} onClick={radioOnClick} />} label={name} />
                    </Tooltip>
                </TableCell>
                <TableCell 
                    sx={{
                        border:'none',
                        p:0,
                        ml:1,
                        width:0,
                    }}
                >
                    <Tooltip title='Select tag color' enterDelay={1000} enterNextDelay={1000}>
                        <IconButton ref={colorButtonRef} onClick={toggleColorPicker}>
                            <Brightness1Icon htmlColor={color} />
                        </IconButton>
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
            <Popover 
                open={colorPickerOpen} 
                onClose={toggleColorPicker} 
                anchorEl={colorButtonRef.current} 
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <HexColorPicker color={color} onChange={colorOnChange} />
            </Popover>
            </>
        )
    })
Option.displayName = 'Option'
export default TagsField