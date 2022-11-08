import React, { ChangeEvent, useContext, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField';
import { EntityId } from '@reduxjs/toolkit';
import { editDefaultValueAction } from './reducer';
import { Context } from '.';

const LinkField = (
    {
        fieldTypeID,
        value,
    }:{
        fieldTypeID:EntityId;
        value?:{
            text?:string;
            url?:string;
        }
    }
) => {
    const 
        {customFieldDispatch} = useContext(Context),
        textOnChange = (e:ChangeEvent<HTMLInputElement>)=> {
            customFieldDispatch(editDefaultValueAction({
                key:fieldTypeID,
                value:{
                    text:e.target.value,
                    url:value?.url || ''
                }
            }))
        },
        urlOnChange = (e:ChangeEvent<HTMLInputElement>)=> {
            customFieldDispatch(editDefaultValueAction({
                key:fieldTypeID,
                value:{
                    url:e.target.value,
                    text:value?.text || ''
                }
            }))
        },
        textRef = useRef<HTMLInputElement>()

    useEffect(()=>{
        textRef.current.focus()
    },[])

    return (
        <>
        <TextField 
            inputRef={textRef}
            fullWidth
            label='Default Text'
            value={value?.text || ''}
            onChange={textOnChange}
        />
        <TextField 
            fullWidth
            label='Default URL'
            value={value?.url || ''}
            onChange={urlOnChange}
        />
        </>
    )
}

export default LinkField