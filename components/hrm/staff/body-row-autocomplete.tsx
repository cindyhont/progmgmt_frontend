import React, { ChangeEvent, memo, SyntheticEvent, useEffect, useState, useMemo, useContext } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import { useAppSelector } from "@reducers";
import { useGetHrmStaffFrontendListQuery, useGetSupervisorOrDepartmentQuery, useUpdateHrmStaffActiveMutation } from "./reducers/api";
import { createFieldValueSelector, frontendStaffFilterSelector } from "./reducers/slice";
import { EditModeContext } from ".";

const 
    BodyRowAutocomplete = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'department_id'|'supervisor_id';
        }        
    )=>{
        const {editMode} = useContext(EditModeContext)
        if (editMode) return <RowAutocomplete {...{id,field}} />
        else return <RowNoAutocomplete {...{id,field}} />
    }),
    RowNoAutocomplete = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'department_id'|'supervisor_id';
        } 
    )=>{
        const 
            frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
            filters = useAppSelector(state => frontEndSelector(state)),
            
            {itemID} = useGetHrmStaffFrontendListQuery(filters,{
                selectFromResult:({currentData}) => {
                    if (!currentData) return {itemID:''}
                    const item = currentData.find(d=>d.id===id)
                    if (!item) return {itemID:''}
                    return {itemID:item[field]}
                }
            }),
            {value} = useGetSupervisorOrDepartmentQuery({id:itemID,item:field.replace('_id','') as "supervisor" | "department"},{
                selectFromResult:({currentData}) => {
                    if (!currentData) return {value:''}
                    return {value:currentData.name==='' ? `(No ${field.replace('_id','').replace(field[0],field[0].toUpperCase())})` : currentData.name}
                }
            })

        return <Typography pl={1.2}>{value}</Typography>
    }),
    RowAutocomplete = memo((
        {
            id,
            field,
        }:{
            id:string;
            field:'department_id'|'supervisor_id';
        }
    )=>{
        const 
            frontEndSelector = useMemo(()=>frontendStaffFilterSelector(),[]),
            filters = useAppSelector(state => frontEndSelector(state)),
            fieldValueSelector = useMemo(()=> createFieldValueSelector(id,field,''),[]),
            {itemID} = useGetHrmStaffFrontendListQuery(filters,{
                selectFromResult:({currentData}) => ({itemID:currentData ? fieldValueSelector(currentData) : ''})
            }),
            {value} = useGetSupervisorOrDepartmentQuery({id:itemID,item:field.replace('_id','') as "supervisor" | "department"},{
                selectFromResult:({currentData}) => {
                    if (!currentData) return {value:{label:'',id:itemID}}
                    return {value:{label:currentData.name==='' ? `(No ${field.replace('_id','').replace(field[0],field[0].toUpperCase())})` : currentData.name,id:itemID}}
                }
            }),
            [options,setOptions] = useState<{label:string;id:string}[]>([]),
            [inputValue,setInputValue] = useState(''),
            onInputChange = async(_:SyntheticEvent,v:string) => {
                if (v===value.label) return
                setInputValue(v)
                if (v==='' && value.label!=='') {
                    setOptions([value])
                    return
                }

                try {
                    const 
                        response = await fetch(`/pm-api/hrm/staff/search-${field.replace('_id','')}/${encodeURIComponent(v)}`),
                        json = await response.json()
                    // console.log(json)
                    setOptions([...json,value])
                } catch {}
            },
            onBlur = () => {
                setInputValue(value.label)
                if (value.label!=='') setOptions([value])
            },
            [updateField] = useUpdateHrmStaffActiveMutation(),
            onChange = async(_:ChangeEvent<HTMLInputElement>,v:{label:string;id:string;}) => {
                if (!v) return
                try {
                    await updateField({
                        id,
                        field,
                        value:v.id,
                    })
                } catch (error) {
                    console.log(error)
                }
            },
            onFocus = () => setInputValue('')

        useEffect(()=>{
            if (value.label !== '') setInputValue(value.label)
        },[value.label,value.id])

        return (
            <Autocomplete 
                onInputChange={onInputChange}
                onFocus={onFocus}
                value={value}
                inputValue={inputValue}
                options={options.length ? options : [value]}
                onChange={onChange}
                disableClearable
                noOptionsText='Type and search...'
                getOptionLabel={(opt:{label:string;id:string;})=>opt.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                includeInputInList
                filterSelectedOptions
                filterOptions={(x) => x}
                onBlur={onBlur}
                renderInput={(params) => (<TextField {...params} />)}
                forcePopupIcon={false}
            />
        )
    })

BodyRowAutocomplete.displayName = 'BodyRowAutocomplete'
RowNoAutocomplete.displayName = 'RowNoAutocomplete'
RowAutocomplete.displayName = 'RowAutocomplete'
export default BodyRowAutocomplete