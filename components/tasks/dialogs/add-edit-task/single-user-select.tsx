import React, { ChangeEvent, memo, useContext, useEffect, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete, { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { editTextFieldAction } from "./reducer";
import { ReduxState } from "@reducers";
import { useSearchUserMutation } from "@reducers/user-details/api";
import { AutocompleteUserOption } from "@components/common-components";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { useStore } from "react-redux";
import Avatar from "@mui/material/Avatar";
import { Context } from ".";
import { EntityId } from "@reduxjs/toolkit";

export interface Ioption {
    value:EntityId;
    label:string;
}

const
    SingleUserSelect = memo((
        {
            label,
            field,
            value,
            required,
        }:{
            label:string;
            field:'assignee';
            value:string;
            required:boolean;
        }
    )=>{
        const
            {addEditTaskDispatch} = useContext(Context),
            [options,setOptions] = useState<string[]>([]),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:string
            ) => {
                e.preventDefault()
                addEditTaskDispatch(editTextFieldAction({key:field,value:v || ''}))
            },
            input = useRef(''),
            [searchUser] = useSearchUserMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (input.current===v) return
                input.current = v

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
                value={value}
                onChange={onChange}
                renderInput={(params) => <SingleUserSelectInput {...{
                    params,
                    label,
                    value,
                    required
                }} />}
                filterOptions={x=>x}
                renderOption={(prop,opt)=>(!!opt ? <AutocompleteUserOption {...{...prop,uid:opt}} /> : <></>)}
            />
        )
    }),
    SingleUserSelectInput = memo((
        {
            label,
            value,
            params,
            required,
        }:{
            label:string;
            value:string;
            params: AutocompleteRenderInputParams;
            required:boolean;
        }
    ) => {
        const 
            ref = useRef<HTMLInputElement>(),
            store = useStore(),
            [avatar,setAvatar] = useState<string|null>(null)

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
                required={required}
                {...{
                    ...params,
                    inputProps:{...params.inputProps,value:undefined},
                    InputProps:{
                        ...params.InputProps,
                        startAdornment:avatar === null ? null : <Avatar src={avatar} sx={{mx:0.5,width:30,height:30}} />
                    }
                }} 
                label={label} 
            />
        )
    })

SingleUserSelect.displayName = 'SingleUserSelect'
SingleUserSelectInput.displayName = 'SingleUserSelectInput'
export default SingleUserSelect