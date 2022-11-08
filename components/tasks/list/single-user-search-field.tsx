import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import { useAppDispatch } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import TextField from "@mui/material/TextField";
import userDetailsApi from "@reducers/user-details/api";
import Autocomplete from "@mui/material/Autocomplete";
import { AutocompleteUserOption } from "@components/common-components";
import taskApi from "../reducers/api";

const SingleUserSearchField = (
    {
        editModeOff,
        id,
        field,
    }:{
        editModeOff:()=>void;
        id:EntityId;
        field:EntityId;
    }
) => {
    const
        dispatch = useAppDispatch(),
        [options,setOptions] = useState<string[]>([]),
        onChange = (
            e:ChangeEvent<HTMLInputElement>,
            v:string
        ) => {
            e.preventDefault()
            if (!v) return
            dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:v}))
            editModeOff()
        },
        onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
            if (v.trim()==='') {
                setOptions([])
                return
            }

            try {
                const 
                    result = await dispatch(
                        userDetailsApi.endpoints.searchUser.initiate({query:v,exclude:[]})
                    ).unwrap()

                setOptions([...result])
            } catch (error) {
                console.log(error)
            }
        },
        ref = useRef<HTMLInputElement>()

    useEffect(()=>{
        ref.current.focus()
    },[])
        
    return (
        <Autocomplete
            disablePortal
            options={options}
            forcePopupIcon={false}
            onInputChange={onInputChange}
            filterOptions={(options) => options}
            onChange={onChange}
            onBlur={editModeOff}
            renderInput={(params) => <TextField {...params} fullWidth size='small' ref={ref} sx={{minWidth:200}} />}
            isOptionEqualToValue={(opt,val)=>opt===val}
            renderOption={(prop,opt)=>{return !!opt ? <AutocompleteUserOption {...{...prop,uid:opt as string}} /> : <></>}}
        />
    )
}

export default SingleUserSearchField