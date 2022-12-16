import React, { FormEvent, memo, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useAppDispatch, useAppSelector } from '@reducers';
import { isSignedIn } from '@reducers/misc';
import { loadMiscReduxState } from '../components/functions';
import { NonIndexPageThemeToggle } from '@components/common-components';

export const getServerSideProps: GetServerSideProps = async ({req:{cookies}}) => {
    let json = null
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
                })
            json = await response.json()

            if (json.data.sidValid) return {redirect:{destination:'/',permanent:false}}
        } catch (error) {
            
        }
    }

    return {
        props:{
            preloadedState:{
                misc:{...loadMiscReduxState(false,'')}
            },
            json
        }
    }
}

const 
    Login = () => {
        const
            systemDark = useAppSelector(state => state.misc.systemDark),
            userMode = useAppSelector(state => state.misc.userMode),
            theme = useMemo(()=>createTheme({palette: {mode: userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode}}),[systemDark,userMode])

        return (
            <>
            <Head>
                <title>Login - Project Management Tool</title>
                <meta name="description" content="Login - Project Management Tool"></meta>
            </Head>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Container component="main" maxWidth="xl">
                    <NonIndexPageThemeToggle />
                    <Container component="div" maxWidth="xs">
                        <Form />
                    </Container>
                </Container>
            </ThemeProvider>
            </>
        )
    },
    Form = memo(() => {
        const 
            dispatch = useAppDispatch(),
            [disabled,setDisabled] = useState(false),
            usernameRef = useRef<HTMLInputElement>(),
            passwordRef = useRef<HTMLInputElement>(),
            [alertOpen,setAlertOpen] = useState(false),
            onChange = () => setAlertOpen(false),
            closeAlert = () => setAlertOpen(false),
            [alertText,setAlertText] = useState(''),
            loginFailed = () => {
                setDisabled(false)
                setAlertOpen(true)
                passwordRef.current.value = ''
            },
            handleSubmit = async(e:FormEvent) => {
                e.preventDefault()
                
                setDisabled(true)

                try {
                    const 
                        username = usernameRef.current.value,
                        password = passwordRef.current.value,
                        res = await fetch('/api/login', {
                            method: 'POST',
                            body: JSON.stringify({username,password}),
                            headers: { 'Content-Type': 'application/json' },
                            credentials:'include',
                        }),
                        json = await res.json()

                    if (json.data.success) dispatch(isSignedIn())
                    else if (!json.data.local) {
                        setAlertText(`Wrong username or password. You have ${json.data.chancesLeft} chance${json.data.chancesLeft > 1 && 's'} to try again.`)
                        loginFailed()
                    }
                } catch (error) {
                    setAlertText('Connection or server error. Please try again later.')
                    loginFailed()
                }
            } 

        useEffect(()=>{
            usernameRef.current.focus()
        },[])

        return (
            <>
            <Box 
                component="form" 
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height:'100vh'
                }}
                onSubmit={handleSubmit}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            disabled={disabled}
                            inputRef={usernameRef}
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            onChange={onChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            disabled={disabled}
                            inputRef={passwordRef}
                            required
                            fullWidth
                            onChange={onChange}
                            name="password"
                            label="Password"
                            type='password'
                            id="password"
                        />
                    </Grid>
                </Grid>
                {disabled ? <Button
                    disabled
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >Signing in ...</Button> : <Button
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >Sign In</Button>}
            </Box>
            <Snackbar open={alertOpen} >
                <Alert 
                    severity="error" 
                    variant="filled" 
                    onClose={closeAlert}
                >{alertText}</Alert>
            </Snackbar>
            </>
        )
    })

Form.displayName = 'Form'
export default Login;