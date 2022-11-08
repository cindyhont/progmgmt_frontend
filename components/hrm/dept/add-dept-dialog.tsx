import React, { FormEvent, memo, useContext, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@reducers";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { backendDeptFilterSelector } from './reducers/slice';
import { useAddHrmDeptActiveMutation } from "./reducers/api";
import { DialogEditContext } from ".";

const AddDeptDialog = memo(({addDialogOn}:{addDialogOn:boolean})=>{
    const 
        [addDept] = useAddHrmDeptActiveMutation(),
        filterSelector = useMemo(()=>backendDeptFilterSelector(),[]),
        filters = useAppSelector(state => filterSelector(state)),
        idRef = useRef<HTMLInputElement>(),
        nameRef = useRef<HTMLInputElement>(),
        [disabled,setDisabled] = useState(false),
        [errorMsg,setErrorMsg] = useState<string[]>([]),
        clearErrorMsg = () => setErrorMsg([]),
        {dialogEditDispatch} = useContext(DialogEditContext),
        closeDialog = () => {
            dialogEditDispatch({type:'addDialog',payload:false})
            clearErrorMsg()
        },
        submit = async (e:FormEvent) => {
            e.preventDefault()
            setDisabled(true)

            const
                internal_id = idRef.current.value.trim(),
                name = nameRef.current.value.trim()

            try {
                const {id} = await addDept({internal_id,name,filters}).unwrap()
                setDisabled(false)
                if (id!=='') closeDialog()
                else setErrorMsg([`ID ${internal_id} already exists. Please assign another ID.`])
            } catch {}

            setDisabled(false)
        },
        submitBtn = useRef<HTMLInputElement>(),
        clickSubmit = () => submitBtn.current.click()

    return (
        <Dialog open={addDialogOn} onClose={closeDialog}>
            <DialogTitle>Add Department</DialogTitle>
            <DialogContent>
                <Grid 
                    component='form' 
                    container 
                    direction='row' 
                    spacing={2} 
                    my={1}
                    onSubmit={submit}
                >
                    <Grid item sm={3} xs={12}>
                        <TextField
                            fullWidth
                            required
                            inputRef={idRef}
                            label="ID"
                            variant="outlined"
                            disabled={disabled}
                            inputProps={{
                                minLength:1,
                                maxLength:30,
                            }}
                            onFocus={clearErrorMsg}
                        />
                    </Grid>
                    <Grid item sm={9} xs={12}>
                        <TextField
                            fullWidth
                            required
                            inputRef={nameRef}
                            label="Name"
                            variant="outlined"
                            disabled={disabled}
                            inputProps={{
                                minLength:1,
                                maxLength:200,
                            }}
                            onFocus={clearErrorMsg}
                        />
                    </Grid>
                    <input type="submit" ref={submitBtn} style={{display:'none'}} />
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

AddDeptDialog.displayName = 'AddDeptDialog'
export default AddDeptDialog