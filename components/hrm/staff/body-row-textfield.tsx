import React, { memo, useEffect, useRef, useState, useMemo, useContext } from "react";
import TextField from "@mui/material/TextField";
import { useAppSelector } from "@reducers";
import { useGetHrmStaffFrontendListQuery, useUpdateHrmStaffActiveMutation } from "./reducers/api";
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Tooltip from '@mui/material/Tooltip';
import Typography from "@mui/material/Typography";
import { createFieldValueSelector, frontendStaffFilterSelector } from "./reducers/slice";
import { EditModeContext } from ".";

const 
    BodyRowTextField = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'staff_id'|'first_name'|'last_name'|'title'|'email';
        }
    )=>{
        const {editMode} = useContext(EditModeContext)
        if (editMode) return <RowTextField {...{id,field}} />
        else return <RowNoTextField {...{id,field}} />
    }),
    RowNoTextField = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'staff_id'|'first_name'|'last_name'|'title'|'email';
        }
    )=>{
        const
            frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
            filters = useAppSelector(state => frontEndSelector(state)),
            fieldValueSelector = useMemo(()=>createFieldValueSelector(id,field,''),[]),
            {value} = useGetHrmStaffFrontendListQuery(filters,{
                selectFromResult:({currentData}) => ({value:currentData ? fieldValueSelector(currentData) : ''})
            })
        return <Typography pl={1.2}>{value}</Typography>
    }),
    RowTextField = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'staff_id'|'first_name'|'last_name'|'title'|'email';
        }
    )=>{
        const
            frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
            filters = useAppSelector(state => frontEndSelector(state)),
            fieldValueSelector = useMemo(()=>createFieldValueSelector(id,field,''),[]),
            {value} = useGetHrmStaffFrontendListQuery(filters,{
                selectFromResult:({currentData}) => ({value:currentData ? fieldValueSelector(currentData) : ''})
            }),
            [errorMsg,setErrorMsg] = useState(''),
            inputRef = useRef<HTMLInputElement>(),
            timeoutRef = useRef<NodeJS.Timeout>(),
            [updateField,{isLoading}] = useUpdateHrmStaffActiveMutation(),
            update = async () => {
                if (value === inputRef.current.value) return
                const 
                    currentID = id,
                    result = await updateField({
                        id,
                        field,
                        value:inputRef.current.value,
                    }),
                    success = (result as any).data?.success

                if (currentID===id && success === false){
                    if (field==='staff_id') setErrorMsg(`ID ${inputRef.current.value} already exists`)
                    else if (field==='email') setErrorMsg(`Email address ${inputRef.current.value} already exists`)
                    else setErrorMsg('Failed to update')
                }
            },
            onChange = () => {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = setTimeout(update,2000)
            },
            onBlur = () => {
                clearTimeout(timeoutRef.current)
                update()
            }

        useEffect(()=>{
            if (!!value && value !== inputRef.current.value) inputRef.current.value = value
        },[value])
        
        return (
            <TextField 
                fullWidth 
                inputRef={inputRef}
                // inputProps={{style:{textAlign:'center'}}}
                onChange={onChange}
                onBlur={onBlur}
                InputProps={{
                    endAdornment:(
                        <InputAdornment position="end">
                            <CircularProgress 
                                size={20} 
                                sx={{
                                    visibility:isLoading ? 'visible' : 'hidden',
                                    display:errorMsg==='' ? 'inline-block' : 'none'
                                }} 
                            />
                            <Tooltip 
                                title={errorMsg} 
                                sx={{
                                    display:errorMsg==='' ? 'none' : 'block'
                                }}
                            >
                                <ErrorOutlineOutlinedIcon color='error' />
                            </Tooltip>
                        </InputAdornment>
                    )
                }}
            />
        )
    })

BodyRowTextField.displayName = 'BodyRowTextField'
RowNoTextField.displayName = 'RowNoTextField'
RowTextField.displayName = 'RowTextField'
export default BodyRowTextField