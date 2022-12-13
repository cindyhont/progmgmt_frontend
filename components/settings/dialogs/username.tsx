import React, { memo, useEffect, useRef, useState, FormEvent } from "react";
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import DialogActions from "@mui/material/DialogActions";
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useAppSelector } from "@reducers";
import Stack from '@mui/material/Stack'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useUpdateUsernameMutation } from "../reducers/api";

const UsernameDialog = memo((
    {
        open,
        onClose,
    }:{
        open:boolean;
        onClose:()=>void;
    }
)=>{
    const
        username = useAppSelector(state => state.misc.username),
        usernameRef = useRef<HTMLInputElement>(),
        passwordRef = useRef<HTMLInputElement>(),
        submitRef = useRef<HTMLInputElement>(),
        [loading,setLoading] = useState(false),
        submitOnClick = () => submitRef.current.click(),
        [updateUsername] = useUpdateUsernameMutation(),
        [showError,setShowError] = useState(false),
        onSubmit = async (e:FormEvent) => {
            e.preventDefault()
            setShowError(false)
            setLoading(true)
            const 
                payload = {
                    username:usernameRef.current.value.trim(),
                    password:passwordRef.current.value.trim()
                },
                success = await updateUsername(payload).unwrap()
            if (success) onClose()
            else setShowError(true)
            setLoading(false)
        }

    useEffect(()=>{
        if (open){
            setLoading(false)
            setShowError(false)
            usernameRef.current.value = ''
            passwordRef.current.value = ''
            usernameRef.current.focus()
        }
    },[open])

    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Edit Username</DialogTitle>
            <DialogContent>
                <Stack direction='column' spacing={2} mt={1} component='form' onSubmit={onSubmit}>
                    <TextField 
                        label='New Username'
                        placeholder={username}
                        inputRef={usernameRef}
                        required
                        fullWidth
                        inputProps={{
                            minLength:6,
                            maxLength:128
                        }}
                        disabled={loading}
                    />
                    <TextField 
                        label='Password'
                        inputRef={passwordRef}
                        type='password'
                        required
                        fullWidth
                        disabled={loading}
                    />
                    {showError && <Typography color='error'>Wrong password.</Typography>}
                    <input hidden type='submit' ref={submitRef} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button {...{
                    variant:'contained',
                    ...(loading && {endIcon:<RefreshRoundedIcon className="infinite-rotate" />}),
                    onClick:submitOnClick
                }}>Submit</Button>
            </DialogActions>
        </Dialog>
    )
})
UsernameDialog.displayName = 'UsernameDialog'
export default UsernameDialog