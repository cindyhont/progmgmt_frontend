import React, { memo, useEffect, useRef, useState, useMemo, useContext } from "react";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Checkbox from '@mui/material/Checkbox';
import { useGetHrmDeptBackendIDsQuery, useGetHrmDeptFrontendListQuery, useUpdateHrmDeptActiveMutation, useUpdateHrmDeptRowCheckboxMutation } from "./reducers/api";
import { useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Tooltip from '@mui/material/Tooltip';
import { backendDeptFilterSelector, frontendDeptFilterSelector } from "./reducers/slice";
import { createSelector } from "@reduxjs/toolkit";
import { IhrmDeptFrontendItem } from "../interfaces";
import { EditModeContext } from ".";
import useFuncWithTimeout from "hooks/counter/function-with-timeout";

const 
    Row = memo(({id}:{id:string})=>{
        const
            filterSelector = useMemo(()=>backendDeptFilterSelector(),[]),
            filters = useAppSelector(state => filterSelector(state)),
            {selected} = useGetHrmDeptBackendIDsQuery(filters,{
                selectFromResult:({currentData}) => ({
                    selected:currentData ? currentData.find(d=>d.id===id)?.selected === true : false
                })
            })
            
        return (
            <TableRow selected={selected}>
                <RowCheckbox id={id} selected={selected} />
                <TableCell sx={{py:1,height:72}}>
                    <RowField id={id} field='internal_id' />
                </TableCell>
                <TableCell sx={{py:1,height:72}}>
                    <RowField id={id} field='name' />
                </TableCell>
            </TableRow>
        )
    }),
    RowCheckbox = memo(({id,selected}:{id:string;selected:boolean;})=>{
        const 
            {editMode} = useContext(EditModeContext),
            [updateCheckbox] = useUpdateHrmDeptRowCheckboxMutation(),
            onChange = () => updateCheckbox(id)
            
        return (
            <TableCell padding="checkbox" sx={{display:editMode ? 'table-cell' : 'none'}}>
                <Checkbox
                    color="primary"
                    checked={selected}
                    onChange={onChange}
                />
            </TableCell>
        )
    }),
    RowField = memo(({field,id}:{field:'internal_id'|'name';id:string})=>{
        const {editMode} = useContext(EditModeContext)
        if (editMode) return <RowInput id={id} field={field} />
        else return <RowCell id={id} field={field} />
    }),
    createFieldValueSelector = (id:string,field:'internal_id'|'name') => createSelector(
        (res:IhrmDeptFrontendItem[]) => res.find(d=>d.id===id),
        (item:IhrmDeptFrontendItem) => !!item ? item[field] : '',
    ),
    RowCell = memo(({field,id}:{field:'internal_id'|'name';id:string})=>{
        const 
            filterSelector = useMemo(()=>frontendDeptFilterSelector(),[]),
            filters = useAppSelector(state=>filterSelector(state)),
            fieldValueSelector = useMemo(()=> createFieldValueSelector(id,field),[]),
            {value} = useGetHrmDeptFrontendListQuery(filters,{
                selectFromResult:({currentData}) => ({value:currentData ? fieldValueSelector(currentData) : ''})
            })
        return (
            <Typography fontSize='1rem' align={field==='internal_id'?'center':'inherit'}>{value}</Typography>
        )
    }),
    RowInput = memo(({field,id}:{field:'internal_id'|'name';id:string})=>{
        const 
            filterSelector = useMemo(()=>frontendDeptFilterSelector(),[]),
            filters = useAppSelector(state=>filterSelector(state)),
            [errorMsg,setErrorMsg] = useState(''),
            fieldValueSelector = useMemo(()=> createFieldValueSelector(id,field),[]),
            {value} = useGetHrmDeptFrontendListQuery(filters,{
                selectFromResult:({currentData}) => ({value:currentData ? fieldValueSelector(currentData) : ''})
            }),
            inputRef = useRef<HTMLInputElement>(),
            [updateField,{isLoading}] = useUpdateHrmDeptActiveMutation(),
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
                    if (field==='internal_id') setErrorMsg(`ID ${inputRef.current.value} already exists`)
                    else setErrorMsg('Failed to update')
                }
            },
            [onChange,onBlur] = useFuncWithTimeout(update,2000)

        useEffect(()=>{
            if (!!value && value !== inputRef.current.value) inputRef.current.value = value
        },[value])

        return (
            <TextField 
                fullWidth
                inputRef={inputRef}
                inputProps={field==='internal_id' ? {style: {textAlign: 'center'},maxLength:30} : {maxLength:200}}
                name={field}
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
        );
    })

Row.displayName = 'Row'
RowCheckbox.displayName = 'RowCheckbox'
RowInput.displayName = 'RowInput'
RowField.displayName = 'RowField'
RowCell.displayName = 'RowCell'
export default Row