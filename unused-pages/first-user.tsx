import React, { FormEvent, memo, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { loadMiscReduxState } from '../components/functions';
import { useAppSelector } from '@reducers';
import { shallowEqual } from 'react-redux';
import { NonIndexPageThemeToggle } from '@components/common-components';

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        props:{
            preloadedState:{
                misc:{...loadMiscReduxState(false,'')}
            }
        }
    }
}

const 
    FirstUser = () => {
        const
            systemDark = useAppSelector(state => state.misc.systemDark,shallowEqual),
            userMode = useAppSelector(state => state.misc.userMode,shallowEqual),
            theme = useMemo(()=>createTheme({palette: {mode: userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode}}),[systemDark,userMode])

        return (
            <>
            <Head>
                <title>First User - Project Management Tool</title>
                <meta name="description" content="First User - Project Management Tool"></meta>
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
            [showPwd,setShowPwd] = useState(false),
            [disabled,setDisabled] = useState(false),
            togglePwdVisibility = () => setShowPwd(!showPwd),
            usernameRef = useRef<HTMLInputElement>(),
            passwordRef = useRef<HTMLInputElement>(),
            router = useRouter(),
            handleSubmit = async(e:FormEvent) => {
                e.preventDefault()
                setDisabled(true)
                setShowPwd(false)
                
                const 
                    username = usernameRef.current.value,
                    password = passwordRef.current.value;

                try {
                    const 
                        res = await fetch('/api/first-user', {
                            method: 'POST',
                            body: JSON.stringify({username,password}),
                            headers: { 'Content-Type': 'application/json' },
                            credentials:'include',
                        }),
                        json = await res.json()

                    if (json.data.success) router.push('/start')
                    else console.log(json)
                } catch (error) {
                    console.log(error)
                }
            } 

        return (
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
                            inputProps={{
                                minLength:6,
                                maxLength:128
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        disabled={disabled}
                        inputRef={passwordRef}
                        required
                        fullWidth
                        label="Password"
                        type={showPwd ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        inputProps={{
                            minLength:6,
                            maxLength:128
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
                    </Grid>
                </Grid>
                {disabled ? <Button
                    disabled
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >Submitting ...</Button> : <Button
                    id="form-submit"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    >Sign Up</Button>}
            </Box>
        )
    })
Form.displayName = 'Form'
export default FirstUser;