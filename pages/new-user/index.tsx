import React, { useMemo, useState, FormEvent } from 'react'
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
import { loadMiscReduxState } from '../../components/functions';
import { useAppSelector } from '@reducers';
import { shallowEqual } from 'react-redux';
import { NonIndexPageThemeToggle } from '@components/common-components';

export const getServerSideProps: GetServerSideProps = async ({req:{cookies},query}) => {
    if (cookies.hasOwnProperty('sid')) return {redirect:{destination:'/',permanent:false}}
    else if (query.hasOwnProperty('invite')){
        const invitationRef = query.invite
        if (typeof invitationRef === 'string'){
            try {
                const 
                    response = await fetch(`${process.env.SSR_API_URL}/new-user-prerender`,{
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            ref:invitationRef
                        },
                    }),
                    json = await response.json()
    
                if (!json.data.exists) return {redirect:{destination:'/new-user/error',permanent:false}}
            } catch (error) {
                return {redirect:{destination:'/',permanent:false}}
            }
        }
    }
    else return {redirect:{destination:'/new-user/error',permanent:false}}

    return {
        props:{
            inviteKey:query.invite,
            preloadedState:{
                misc:{...loadMiscReduxState(false,'')}
            }
        }
    }
}

const 
    NewUser = ({inviteKey}:{inviteKey:string;}) => {
        const
            systemDark = useAppSelector(state => state.misc.systemDark,shallowEqual),
            userMode = useAppSelector(state => state.misc.userMode,shallowEqual),
            theme = useMemo(()=>createTheme({palette: {mode: userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode}}),[systemDark,userMode])
        
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Container component="main" maxWidth="xl">
                    <NonIndexPageThemeToggle />
                    <Container component="div" maxWidth="xs">
                        <Form inviteKey={inviteKey} />
                    </Container>
                </Container>
            </ThemeProvider>
        )
    },
    Form = ({inviteKey}:{inviteKey:string}) => {
        const 
            [showPwd,setShowPwd] = useState(false),
            [usernameDisabled,setUsernameDisabled] = useState(false),
            [passwordDisabled,setPasswordDisabled] = useState(false),
            [buttonDisabled,setButtonDisabled] = useState(false),
            [username,setUsername] = useState(''),
            [password,setPassword] = useState(''),
            updateUsername = (e:any) => setUsername(e.target.value),
            updatePassword = (e:any) => setPassword(e.target.value),
            togglePwdVisibility = () => setShowPwd(!showPwd),
            router = useRouter(),
            handleSubmit = async(e:FormEvent) => {
                e.preventDefault()
                
                setUsernameDisabled(true)
                setPasswordDisabled(true)
                setShowPwd(false)
                setButtonDisabled(true)

                try {
                    const 
                        res = await fetch('/api/new-user', {
                            method: 'POST',
                            body: JSON.stringify({username,password}),
                            headers: { 
                                'Content-Type': 'application/json',
                                inviteKey
                            },
                            credentials:'include',
                        }),
                        json = await res.json()

                    if (json.data.success) router.push('/')
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
                            disabled={usernameDisabled}
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            onChange={updateUsername}
                            inputProps={{
                                // pattern:"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" // email regex
                                minLength:6,
                                maxLength:128
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                    <TextField
                        disabled={passwordDisabled}
                        required
                        fullWidth
                        onChange={updatePassword}
                        name="password"
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
                                        onMouseDown={togglePwdVisibility}
                                        disabled={passwordDisabled}
                                    >
                                        {showPwd ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    </Grid>
                </Grid>
                {buttonDisabled ? <Button
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
    }

export default NewUser;