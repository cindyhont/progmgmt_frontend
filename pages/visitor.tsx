import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Head from 'next/head';
import { GetServerSideProps } from 'next'
import { loadMiscReduxState } from "@components/functions";
import { useAppDispatch, useAppSelector } from "@reducers";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from "@mui/material/Container";
import NonIndexPageThemeToggle from "@components/common-components/non-index-page-theme-toggle";
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { isSignedIn } from "@reducers/misc";

export const getServerSideProps: GetServerSideProps = async ({req:{cookies}}) => {
    if (cookies.hasOwnProperty('sid')){
        try {
            const 
                response = await fetch(`${process.env.NEXT_PUBLIC_SSR_API_URL}/login-prerender`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        sMethod:'body',
                        sid:cookies.sid
                    },
                }),
                json = await response.json()
            if (json.data.sidValid) return {redirect:{destination:'/',permanent:false}}
        } catch {}
    }

    return {
        props:{
            preloadedState:{
                misc:{...loadMiscReduxState(false,'')}
            }
        }
    }
}

const 
    Visitor = () => {
        const
            systemDark = useAppSelector(state => state.misc.systemDark),
            userMode = useAppSelector(state => state.misc.userMode),
            theme = useMemo(()=>createTheme(!!userMode && systemDark !== null ? {palette: {
                mode: userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode
            }} : {}),[systemDark,userMode])

        return (
            <>
            <Head>
                <title>Visitor - Project Management Tool</title>
                <meta name="description" content="Visitor - Project Management Tool"></meta>
            </Head>
            {!!userMode && systemDark !== null && <ThemeProvider theme={theme}>
                <CssBaseline />
                <Container component="main" maxWidth="xl">
                    <NonIndexPageThemeToggle />
                    <Container component="div" maxWidth="xs">
                        <Form />
                    </Container>
                </Container>
            </ThemeProvider>}
            </>
        )
    },
    Form = () => {
        const
            [disabled,setDisabled] = useState(false),
            [showPwd,setShowPwd] = useState(false),
            togglePwdVisibility = () => setShowPwd(!showPwd),
            firstNameRef = useRef<HTMLInputElement>(),
            lastNameRef = useRef<HTMLInputElement>(),
            usernameRef = useRef<HTMLInputElement>(),
            passwordRef = useRef<HTMLInputElement>(),
            [alertOpen,setAlertOpen] = useState(false),
            closeAlert = () => setAlertOpen(false),
            [alertText,setAlertText] = useState(''),
            dispatch = useAppDispatch(),
            handleError = (msg:string) => {
                setAlertText(msg)
                setAlertOpen(true)
                setDisabled(false)
                passwordRef.current.value = ''
            },
            onChange = () => setAlertOpen(false),
            handleSubmit = async(e:FormEvent) => {
                e.preventDefault()

                setDisabled(true)
                setShowPwd(false)
                
                const
                    res = await fetch('/api/create-visitor', {
                        method: 'POST',
                        body: JSON.stringify({
                            username:usernameRef.current.value.trim(),
                            password:passwordRef.current.value.trim(),
                            firstName:firstNameRef.current.value.trim(),
                            lastName:lastNameRef.current.value.trim()
                        }),
                        headers: { 'Content-Type': 'application/json' },
                        credentials:'include',
                    }),
                    ok = res.ok

                if (!ok){
                    handleError('Connection error, please try again later')
                    return
                }

                const {success,message} = await res.json() as {success:boolean;message:string;}
                if (success) dispatch(isSignedIn())
                else handleError(message)
            }
            
        return (
            <>
            <Stack
                direction='column'
                spacing={2}
                sx={{
                    height:'var(--viewport-height)',
                    justifyContent:'center'
                }}
                component='form'
                onSubmit={handleSubmit}
            >
                <TextField
                    disabled={disabled}
                    inputRef={firstNameRef}
                    required
                    fullWidth
                    label="First Name"
                    onChange={onChange}
                    inputProps={{
                        maxLength:128,
                        title:'Maximum 128 characters'
                    }}
                />
                <TextField
                    disabled={disabled}
                    inputRef={lastNameRef}
                    required
                    fullWidth
                    label="Last Name"
                    onChange={onChange}
                    inputProps={{
                        maxLength:128,
                        title:'Maximum 128 characters'
                    }}
                />
                <TextField
                    disabled={disabled}
                    inputRef={usernameRef}
                    required
                    fullWidth
                    label="Username"
                    onChange={onChange}
                    inputProps={{
                        minLength:6,
                        maxLength:128,
                        pattern:'[a-zA-Z0-9]+',
                        title:'6-128 characters with no space'
                    }}
                />
                <TextField
                    disabled={disabled}
                    inputRef={passwordRef}
                    required
                    fullWidth
                    label="Password"
                    onChange={onChange}
                    type={showPwd ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    inputProps={{
                        minLength:6,
                        maxLength:128,
                        pattern:'[a-zA-Z0-9,.?~!@#$%^&*_+=()-]+',
                        title:'6-128 characters without space'
                    }}
                    InputProps={{
                        endAdornment:(
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={togglePwdVisibility}
                                    disabled={disabled}
                                >
                                    {showPwd ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                {disabled ? <Button
                    disabled
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >Just a second ...</Button> : <Button
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >Create Visitor Account</Button>}
            </Stack>
            <Snackbar open={alertOpen} >
                <Alert 
                    severity="error" 
                    variant="filled" 
                    onClose={closeAlert}
                >{alertText}</Alert>
            </Snackbar>
            </>
        )
    }

export default Visitor