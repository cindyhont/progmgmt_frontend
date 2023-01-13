import React, { ChangeEvent, FormEvent, ForwardedRef, forwardRef, memo, useCallback, useRef, useState, useMemo, useContext } from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { backendStaffFilterSelector } from './reducers/slice';
import { shallowEqual } from 'react-redux'
import { useAppSelector } from "@reducers";
import Autocomplete from '@mui/material/Autocomplete';
import { v4 as uuidv4 } from 'uuid'
import constants from "@components/constants";
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { useAddHrmStaffActiveMutation } from "./reducers/api";
import { DialogEditContext } from ".";

const 
    userRightArr = constants.userRights,
    TextInput = memo(forwardRef((
        {
            label,
            disabled,
            onFocus,
            minLength,
            maxLength,
            pattern,
        }:{
            label:string;
            disabled:boolean;
            onFocus:()=>void;
            minLength:number;
            maxLength:number;
            pattern?:string;
        },
        ref:ForwardedRef<HTMLInputElement>
    )=>{
        return (
            <Grid item sm={6} xs={12}>
                <TextField
                    fullWidth
                    required
                    inputRef={ref}
                    label={label}
                    variant="outlined"
                    disabled={disabled}
                    inputProps={{
                        minLength,
                        maxLength,
                        ...(!!pattern && {pattern})
                    }}
                    onFocus={onFocus}
                />
            </Grid>
        )
    })),
    AsyncAutocomplete = memo(forwardRef((
        {
            label,
        }:{
            label:string;
        },
        ref:ForwardedRef<HTMLInputElement>
    )=>{
        const
            [options,setOptions] = useState<{label:string;id:string}[]>([]),
            [value,setValue] = useState<{label:string;id:string}>({label:'',id:''}),
            id = uuidv4(),
            onChange = (_:ChangeEvent<HTMLInputElement>,v:{label:string;id:string}) => {
                if (!v) return
                (document.getElementById(id) as HTMLInputElement).value = v.id
                setValue(prev => ({...prev,...v}))
            },
            isOptionEqualToValue = (a:{label:string;id:string;},b:{label:string;id:string;}) => a.id === b.id,
            getOptionLabel = (opt:{label:string;id:string}) => opt.label,
            filterOptions = (opt:{label:string;id:string;}[],_:any) => opt,
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (v==='') {
                    setOptions([])
                    return
                }
                try {
                    const 
                        response = await fetch(`/pm-api/hrm/staff/search-${label.toLowerCase()}/${encodeURIComponent(v)}`),
                        json = await response.json()
                    setOptions([...json,value])
                } catch {
                    setOptions([])
                }
            }

        return (
            <Grid item sm={6} xs={12}>
                <Autocomplete 
                    onChange={onChange}
                    onInputChange={onInputChange}
                    value={value}
                    filterSelectedOptions
                    isOptionEqualToValue={isOptionEqualToValue}
                    filterOptions={filterOptions}
                    getOptionLabel={getOptionLabel}
                    options={options}
                    disableClearable
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            required
                        />
                    )}
                />
                <input type='hidden' ref={ref} id={id} />
            </Grid>
        )
    })),
    UserRightRow = memo(({id,i}:{id:string;i:number})=>(
        <TableRow>
            <TableCell sx={{fontSize:'1rem',border:'none'}}>
                {userRightArr[i]}
            </TableCell>
            <TableCell padding='checkbox' sx={{border:'none'}}>
                <Checkbox id={`${id}-${i}`} />
            </TableCell>
        </TableRow>
    )),
    AddStaffDialog = memo(({addDialogOn}:{addDialogOn:boolean}) => {
        const 
            staffIdRef = useRef<HTMLInputElement>(),
            emailRef = useRef<HTMLInputElement>(),
            firstNameRef = useRef<HTMLInputElement>(),
            lastNameRef = useRef<HTMLInputElement>(),
            titleRef = useRef<HTMLInputElement>(),
            departmentRef = useRef<HTMLInputElement>(),
            supervisorRef = useRef<HTMLInputElement>(),
            [errorMsg,setErrorMsg] = useState<string[]>([]),
            {dialogEditDispatch} = useContext(DialogEditContext),
            closeDialog = () => {
                dialogEditDispatch({type:'addDialog',payload:false})
                setErrorMsg([])
            },
            onFocus = useCallback(()=>setErrorMsg([]),[]),
            [disabled,setDisabled] = useState(false),
            submitBtn = useRef<HTMLInputElement>(),
            clickSubmit = () => submitBtn.current.click(),
            backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
            filters = useAppSelector(state => backEndSelector(state),shallowEqual),
            userRightID = uuidv4(),
            [addStaff] = useAddHrmStaffActiveMutation(),
            submit = async(e:FormEvent) => {
                e.preventDefault()
                setDisabled(true)
                
                let userRight = 0
                const userRightLen = userRightArr.length
                for (let i=0; i<userRightLen; i++){
                    if ((document.getElementById(`${userRightID}-${i}`) as HTMLInputElement).checked){
                        userRight += Math.pow(2,i)
                    }
                }

                const 
                    staffID = staffIdRef.current.value.trim(),
                    email = emailRef.current.value.trim()
                
                try {
                    const {id} = await addStaff({
                        staffID,
                        firstName:firstNameRef.current.value.trim(),
                        lastName:lastNameRef.current.value.trim(),
                        title:titleRef.current.value.trim(),
                        departmentID:departmentRef.current.value.trim(),
                        supervisorID:supervisorRef.current.value.trim(),
                        userRight,
                        email,
                        filters,
                    }).unwrap()
                    setDisabled(false)
                    if (id!=='') closeDialog()
                    else setErrorMsg([`ID ${staffID} or email address ${email} already exists. Please double check.`])
                } catch {}
            }

        return (
            <Dialog open={addDialogOn} onClose={closeDialog}>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogContent>
                    <Grid 
                        component='form' 
                        container 
                        direction='row' 
                        spacing={2} 
                        my={1}
                        onSubmit={submit}
                    >
                        <TextInput 
                            {...{
                                label:'First Name',
                                disabled,
                                onFocus,
                                minLength:1,
                                maxLength:128
                            }} 
                            ref={firstNameRef}
                        />
                        <TextInput 
                            {...{
                                label:'Last Name',
                                disabled,
                                onFocus,
                                minLength:1,
                                maxLength:128
                            }} 
                            ref={lastNameRef}
                        />
                        <TextInput 
                            {...{
                                label:'ID',
                                disabled,
                                onFocus,
                                minLength:1,
                                maxLength:30
                            }} 
                            ref={staffIdRef}
                        />
                        <TextInput 
                            {...{
                                label:'Email Address',
                                disabled,
                                onFocus,
                                minLength:1,
                                maxLength:128,
                                pattern:"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                            }} 
                            ref={emailRef}
                        />
                        <TextInput 
                            {...{
                                label:'Title',
                                disabled,
                                onFocus,
                                minLength:1,
                                maxLength:200
                            }} 
                            ref={titleRef}
                        />
                        <AsyncAutocomplete label='Department' ref={departmentRef} />
                        <AsyncAutocomplete label='Supervisor' ref={supervisorRef} />
                        <TableContainer sx={{mt:2,ml:0}}>
                            <Table>
                                <TableBody>
                                {userRightArr.map((_,i)=>(
                                    <UserRightRow key={i} id={userRightID} i={i} />
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <input type='submit' style={{display:'none'}} ref={submitBtn} />
                    </Grid>
                </DialogContent>
                {errorMsg.length!==0 && <ul style={{color:'red'}}>
                    {errorMsg.map((e,i)=>(<li key={i}>{e}</li>))}    
                </ul>}
                <DialogActions>
                    <Button onClick={closeDialog} variant="outlined">Cancel</Button>
                    <Button onClick={clickSubmit} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>
        )
    })

TextInput.displayName = 'TextInput'
AsyncAutocomplete.displayName = 'AsyncAutocomplete'
UserRightRow.displayName = 'UserRightRow'
AddStaffDialog.displayName = 'AddStaffDialog'
export default AddStaffDialog