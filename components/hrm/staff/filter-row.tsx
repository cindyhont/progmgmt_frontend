import React, { ChangeEvent, memo, useContext, useEffect, useState } from "react";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { IstaffFilterItem, updateField, updateOperator, deleteFilterAction, updateValue, updateUserRights, updateDepartments, updateSupervisors } from "./reducers/filter";
import Autocomplete from '@mui/material/Autocomplete';
import constants from "@components/constants";
import { FilterContext } from "./filter-modal";
import { ThrmStaffColumns, ThrmStaffFilterOperators } from "../interfaces";

const 
    userRightOptions = constants.userRights.map((label,i)=>({label,value:i})),
    FilterModalRow = memo((
        {
            id,
            field,
            operator,
            value,
            department_ids,
            supervisor_ids,
            user_rights,
        }:IstaffFilterItem
    )=>(
        <Grid
            container
            direction='row'
            mt={2}
            columnSpacing={1}
        >
            <Field {...{id,field}} />
            <Operator {...{id,field,operator}} />
            <StringInput {...{id,field,value}} />
            <UserRightAutocomplete {...{id,field,user_rights}} />
            <Department {...{id,field,department_ids}} />
            <Supervisors {...{id,field,supervisor_ids}} />
            <DeleteBtn id={id} />
        </Grid>
    )),
    Field = memo((
        {
            id,
            field,
        }:{
            id:string,
            field:ThrmStaffColumns,
        }
    )=>{
        const 
            {filterDispatch} = useContext(FilterContext),
            onChange = (e:ChangeEvent<HTMLInputElement>) => filterDispatch(updateField({id,field:e.target.value as ThrmStaffColumns}))

        return (
            <Grid item sm={3} xs={12}>
                <FormControl fullWidth>
                    <InputLabel>Field</InputLabel>
                    <Select
                        id="staff-filter-field"
                        value={field}
                        name='staff-filter-field'
                        label="Field"
                        onChange={onChange}
                    >
                        <MenuItem value='staff_id'>ID</MenuItem>
                        <MenuItem value='first_name'>First Name</MenuItem>
                        <MenuItem value='last_name'>Last Name</MenuItem>
                        <MenuItem value='title'>Title</MenuItem>
                        <MenuItem value='department_id'>Department</MenuItem>
                        <MenuItem value='supervisor_id'>Supervisor</MenuItem>
                        <MenuItem value='user_right'>User Rights</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        )
    }),
    Operator = memo((
        {
            id,
            field,
            operator
        }:{
            id:string;
            field:ThrmStaffColumns;
            operator:ThrmStaffFilterOperators;
        }
    )=>{
        const
            theme = useTheme(),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            [operatorGroup,setOperatorGroup] = useState(0),
            {filterDispatch} = useContext(FilterContext),
            fieldOnChange = () => {
                if (["staff_id","first_name","last_name","title"].includes(field)) {
                    setOperatorGroup(0)
                    if (!['',"equals","contains","start_with","end_with"].includes(operator)) filterDispatch(updateOperator({id,operator:'contains'}))
                } else if (['department_id','supervisor_id','user_right'].includes(field)) {
                    setOperatorGroup(1)
                    if (!['',"includes","excludes"].includes(operator)) filterDispatch(updateOperator({id,operator:'includes'}))
                }
            },
            operatorOnChange = (e:ChangeEvent<HTMLInputElement>) => filterDispatch(updateOperator({id,operator:e.target.value as ThrmStaffFilterOperators}))

        useEffect(()=>{
            fieldOnChange()
        },[field])
            
        return (
            <Grid item sm={3} xs={12} mt={matchesSM ? 0 : 1}>
                <FormControl fullWidth>
                    <InputLabel>Operator</InputLabel>
                    <Select
                        id="staff-filter-operator"
                        value={operator}
                        name='staff-filter-operator'
                        label="Operator"
                        onChange={operatorOnChange}
                    >
                        <MenuItem value='contains' sx={{display:operatorGroup===0 ? 'flex' : 'none'}}>contains</MenuItem>
                        <MenuItem value='equals' sx={{display:operatorGroup===0 ? 'flex' : 'none'}}>equals</MenuItem>
                        <MenuItem value='start_with' sx={{display:operatorGroup===0 ? 'flex' : 'none'}}>starts with</MenuItem>
                        <MenuItem value='end_with' sx={{display:operatorGroup===0 ? 'flex' : 'none'}}>ends with</MenuItem>
                        <MenuItem value='includes' sx={{display:operatorGroup===1 ? 'flex' : 'none'}}>includes</MenuItem>
                        <MenuItem value='excludes' sx={{display:operatorGroup===1 ? 'flex' : 'none'}}>excludes</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        )
    }),
    StringInput = memo((
        {
            id,
            field,
            value
        }:{
            id:string,
            field:ThrmStaffColumns,
            value:string;
        }
    ) => {
        const 
            theme = useTheme(),
            {filterDispatch} = useContext(FilterContext),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            onChange = (e:ChangeEvent<HTMLInputElement>) => filterDispatch(updateValue({id,value:e.target.value}))

        return (
            <Grid 
                item sm={5} 
                xs={12} 
                mt={matchesSM ? 0 : 1}
                sx={{
                    display:["","staff_id","first_name","last_name","title"].includes(field) ? 'block' : 'none'
                }}
            >
                <TextField 
                    fullWidth 
                    name='staff-filter-value'
                    label='Value'
                    value={value}
                    onChange={onChange}
                />
            </Grid>
        )
    }),
    UserRightAutocomplete = memo((
        {
            id,
            field,
            user_rights
        }:{
            id:string,
            field:ThrmStaffColumns,
            user_rights:{label:string;value:number}[];
        }
    )=>{
        const 
            theme = useTheme(),
            {filterDispatch} = useContext(FilterContext),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            getOptionLabel = (opt:{label:string;value:number}) => opt.label,
            onChange = (
                _:ChangeEvent<HTMLInputElement>,
                v:{label:string;value:number}[]
            ) => filterDispatch(updateUserRights({id,user_rights:v}))

        return (
            <Grid 
                item sm={5} 
                xs={12} 
                mt={matchesSM ? 0 : 1}
                sx={{display:field==='user_right' ? 'block' : 'none'}}
            >
                <Autocomplete 
                    onChange={onChange}
                    value={user_rights}
                    multiple
                    filterSelectedOptions
                    getOptionLabel={getOptionLabel}
                    options={userRightOptions}
                    forcePopupIcon={false}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="User Rights"
                        />
                    )}
                />
            </Grid>
        )
    }),
    Department = memo((
        {
            id,
            field,
            department_ids
        }:{
            id:string,
            field:ThrmStaffColumns,
            department_ids:{label:string;id:string;}[];
        }
    )=>{
        const 
            theme = useTheme(),
            {filterDispatch} = useContext(FilterContext),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            getOptionLabel = (opt:{label:string;id:string}) => opt.label,
            [options,setOptions] = useState<{label:string;id:string}[]>([]),
            onChange = (
                _:ChangeEvent<HTMLInputElement>,
                v:{label:string;id:string}[]
            ) => filterDispatch(updateDepartments({id,departments:v})),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (v==='') {
                    setOptions([])
                    return
                }
                try {
                    const 
                        response = await fetch(`/pm-api/hrm/staff/search-department/${encodeURIComponent(v)}`),
                        json = await response.json()
                    setOptions([...json,...department_ids])
                } catch {
                    setOptions([])
                }
            },
            isOptionEqualToValue = (a:{label:string;id:string;},b:{label:string;id:string;}) => a.id === b.id,
            filterOptions = (opt:{label:string;id:string;}[],_:any) => opt

        return (
            <Grid 
                item sm={5} 
                xs={12} 
                mt={matchesSM ? 0 : 1}
                sx={{display:field==='department_id' ? 'block' : 'none'}}
            >
                <Autocomplete 
                    onChange={onChange}
                    onInputChange={onInputChange}
                    value={department_ids}
                    multiple
                    filterSelectedOptions
                    isOptionEqualToValue={isOptionEqualToValue}
                    filterOptions={filterOptions}
                    getOptionLabel={getOptionLabel}
                    options={options}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Departments"
                        />
                    )}
                />
            </Grid>
        )
    }),
    Supervisors = memo((
        {
            id,
            field,
            supervisor_ids
        }:{
            id:string,
            field:ThrmStaffColumns,
            supervisor_ids:{label:string;id:string;}[];
        }
    )=>{
        const 
            theme = useTheme(),
            {filterDispatch} = useContext(FilterContext),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            getOptionLabel = (opt:{label:string;id:string}) => opt.label,
            [options,setOptions] = useState<{label:string;id:string}[]>([]),
            onChange = (
                _:ChangeEvent<HTMLInputElement>,
                v:{label:string;id:string}[]
            ) => filterDispatch(updateSupervisors({id,supervisors:v})),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (v==='') {
                    setOptions([])
                    return
                }
                try {
                    const 
                        response = await fetch(`/pm-api/hrm/staff/search-supervisor/${encodeURIComponent(v)}`),
                        json = await response.json()
                    console.log(json)
                    setOptions([...json,...supervisor_ids])
                } catch {}
            },
            isOptionEqualToValue = (a:{label:string;id:string;},b:{label:string;id:string;}) => a.id === b.id,
            filterOptions = (opt:{label:string;id:string;}[],_any) => opt

        return (
            <Grid 
                item sm={5} 
                xs={12} 
                mt={matchesSM ? 0 : 1}
                sx={{display:field==='supervisor_id' ? 'block' : 'none'}}
            >
                <Autocomplete 
                    onChange={onChange}
                    onInputChange={onInputChange}
                    value={supervisor_ids}
                    multiple
                    filterSelectedOptions
                    getOptionLabel={getOptionLabel}
                    isOptionEqualToValue={isOptionEqualToValue}
                    filterOptions={filterOptions}
                    options={options}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Supervisors"
                        />
                    )}
                />
            </Grid>
        )
    }),
    DeleteBtn = memo(({id}:{id:string})=>{
        const 
            theme = useTheme(),
            {filterDispatch} = useContext(FilterContext),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            onDelete = () => filterDispatch(deleteFilterAction(id))

        return (
            <Grid item sm={1} xs={12} sx={{height:56,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <IconButton 
                    sx={matchesSM ? {
                        border:`1px solid ${theme.palette.primary.main}`
                    }:{
                        borderRadius:1,
                        border:`1px solid ${theme.palette.primary.main}`
                    }} 
                    color='primary'
                    onClick={onDelete}
                >
                    <DeleteIcon />
                </IconButton>
            </Grid>
        )
    })

FilterModalRow.displayName = 'FilterModalRow'
Field.displayName = 'Field'
Operator.displayName = 'Operator'
StringInput.displayName = 'StringInput'
UserRightAutocomplete.displayName = 'UserRightAutocomplete'
DeleteBtn.displayName = 'DeleteBtn'
Department.displayName = 'Department'
Supervisors.displayName = 'Supervisors'
export default FilterModalRow