import React, { memo, useEffect, useRef, useState, FormEvent } from "react";
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import DialogActions from "@mui/material/DialogActions";
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useRouter } from "next/router";
import { pushToLogin } from "@components/functions";

const PasswordDialog = memo((
    {
        open,
        onClose,
    }:{
        open:boolean;
        onClose:()=>void;
    }
)=>{
    const
        [showPwd,setShowPwd] = useState(false),
        [loading,setLoading] = useState(false),
        [showError,setShowError] = useState(false),
        [connError,setConnError] = useState(false),
        togglePwdVisibility = () => setShowPwd(!showPwd),
        submitRef = useRef<HTMLInputElement>(),
        newPasswordRef = useRef<HTMLInputElement>(),
        currentPasswordRef = useRef<HTMLInputElement>(),
        submitOnClick = () => submitRef.current.click(),
        router = useRouter(),
        onSubmit = async(e:FormEvent) => {
            e.preventDefault()
            setLoading(true)
            setConnError(false)
            setShowError(false)
            setShowPwd(false)

            const 
                payload = {
                    newPassword:newPasswordRef.current.value.trim(),
                    currentPassword:currentPasswordRef.current.value.trim()
                },
                result = await fetch('/pm-api/settings/update-password',{
                    method:'POST',
                    body: JSON.stringify(payload),
                    headers: { 
                        'Content-Type': 'application/json',
                        sMethod:'ck',
                    },
                    credentials:'include'
                }),
                status = result.status,
                ok = result.ok

            if (status===401) {
                pushToLogin(router)
                return
            }
            if (ok){
                const
                    json = await result.json()
                if (!!json?.success) onClose()
                else setShowError(true)
            } else setConnError(true)
            setLoading(false)
        }

    useEffect(()=>{
        if (open){
            setShowPwd(false)
            setConnError(false)
            setLoading(false)
            setShowError(false)
            newPasswordRef.current.value = ''
            currentPasswordRef.current.value = ''
            newPasswordRef.current.focus()
        }
    },[open])
        
    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Edit Password</DialogTitle>
            <DialogContent>
                <Stack direction='column' spacing={2} mt={1} component='form' onSubmit={onSubmit}>
                    <TextField 
                        label='New Password'
                        inputRef={newPasswordRef}
                        type={showPwd ? 'text' : 'password'}
                        required
                        fullWidth
                        inputProps={{
                            minLength:6,
                            maxLength:128
                        }}
                        InputProps={{
                            endAdornment:(
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={togglePwdVisibility}
                                        disabled={loading}
                                    >
                                        {showPwd ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        disabled={loading}
                    />
                    <TextField 
                        label='Current Password'
                        inputRef={currentPasswordRef}
                        type='password'
                        required
                        fullWidth
                        disabled={loading}
                    />
                    {showError && <Typography color='error'>Invalid input.</Typography>}
                    {connError && <Typography color='error'>Connection error. Please try again later.</Typography>}
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
PasswordDialog.displayName = 'PasswordDialog'
export default PasswordDialog