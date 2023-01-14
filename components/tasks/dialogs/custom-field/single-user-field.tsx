import React, { ChangeEvent, memo, useContext, useEffect, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { ReduxState, useAppDispatch } from "@reducers";
import { useSearchUserMutation } from "@reducers/user-details/api";
import { AutocompleteUserOption } from "@components/common-components";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { useStore } from "react-redux";
import Avatar from "@mui/material/Avatar";
import { Context } from ".";
import { editDefaultValueAction } from "./reducer";
import { EntityId } from "@reduxjs/toolkit";

const 
    SingleUserField = (
        {
            fieldTypeID,
            value,
        }:{
            fieldTypeID:EntityId;
            value:string;
        }
    ) => {
        const
            {customFieldDispatch} = useContext(Context),
            [options,setOptions] = useState<string[]>([]),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:string
            ) => {
                e.preventDefault()
                customFieldDispatch(editDefaultValueAction({key:fieldTypeID,value:v}))
            },
            [searchUser] = useSearchUserMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (v.trim()==='') {
                    setOptions([])
                    return
                }

                try {
                    const result = await searchUser({query:v,exclude:[]}).unwrap()

                    setOptions([...result])
                } catch (error) {
                    console.log(error)
                }
            }
            
        return (
            <Autocomplete
                disablePortal
                fullWidth
                options={options}
                forcePopupIcon={false}
                onInputChange={onInputChange}
                filterOptions={(options) => options}
                value={value}
                onChange={onChange}
                renderInput={(params) => <SingleUserSelectInput {...{
                    params,
                    value,
                }} />}
                isOptionEqualToValue={(opt,val)=>opt===val}
                renderOption={(prop,opt)=>{return !!opt ? <AutocompleteUserOption {...{...prop,uid:opt}} /> : <></>}}
            />
        )
    },
    SingleUserSelectInput = memo((
        {
            value,
            params,
        }:{
            value:string;
            params: AutocompleteRenderInputParams;
        }
    ) => {
        const 
            ref = useRef<HTMLInputElement>(),
            store = useStore(),
            [avatar,setAvatar] = useState<string|null>(null)

        useEffect(()=>{
            ref.current.focus()
        },[])

        useEffect(()=>{
            const user = userDetailsSelector.selectById(store.getState() as ReduxState,value)
            if (!user) {
                ref.current.value = ''
                setAvatar(null)
            } else {
                ref.current.value = `${user.firstName} ${user.lastName}`.trim()
                setAvatar(user.avatar)
            }
        },[value])

        return (
            <TextField 
                inputRef={ref} 
                {...{
                    ...params,
                    inputProps:{...params.inputProps,value:undefined},
                    InputProps:{
                        ...params.InputProps,
                        startAdornment:avatar === null ? null : <Avatar src={avatar} sx={{mx:0.5,width:30,height:30}} />
                    }
                }} 
                label='Default person'
            />
        )
    })
SingleUserSelectInput.displayName = 'SingleUserSelectInput'
export default SingleUserField