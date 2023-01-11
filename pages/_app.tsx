import type { AppProps } from 'next/app'
import '../styles.css'
import { useEffect, useMemo, useRef } from 'react';
import { Provider, shallowEqual } from "react-redux";
import configureAppStore, { IpreloadedState, useAppDispatch, useAppSelector } from '@reducers'
import { systemIsDark, updateUserMode, updateTouchScreen, updatePageVisibility } from '@reducers/misc'
import { useRouter } from 'next/router';
import { pushToLogin } from '@components/functions';
import Head from 'next/head'
import useFuncWithTimeout from '@hooks/counter/function-with-timeout';

const 
    MyApp = ({ Component, pageProps }: AppProps) => {
        const 
            router = useRouter(),
            store = useMemo(()=>configureAppStore(pageProps?.preloadedState as IpreloadedState),[router.pathname])

        return (
            <Provider store={store}>
                <Wrapper>
                    <>
                    <Head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    </Head>
                    <Component {...pageProps} />
                    </>
                </Wrapper>
            </Provider>
        )
    },
    Wrapper = ({children}:{children:JSX.Element}) => {
        const
            dispatch = useAppDispatch(),
            router = useRouter(),

            systemDark = useAppSelector(state => state.misc.systemDark),
            userMode = useAppSelector(state => state.misc.userMode),

            authRequired = useAppSelector(state => state.misc.authRequired,shallowEqual),
            signedIn = useAppSelector(state => state.misc.signedIn,shallowEqual),
            systemThemeOnChange = (e:MediaQueryListEvent) => {
                sessionStorage.setItem('systemDark',e.matches.toString())
                dispatch(systemIsDark(e.matches))
            },
            onVisibilityChange = () => dispatch(updatePageVisibility(document.visibilityState==='visible')),

            loginMsg = 'login',
            logoutMsg = 'logout',
            broadcastChannel = useRef<BroadcastChannel>(),
            login = () => router.push(router.query.redirect as string ?? '/'),
            logout = () => pushToLogin(router),
            bcReceiveMessage = (e:MessageEvent) => {
                if (e.data===logoutMsg) logout()
                else if (e.data===loginMsg) login()
            },
            setNewSize = () => {
                const htmlTag = document.getElementsByTagName('html')[0]
                htmlTag.style.setProperty('--viewport-height',`${window.visualViewport.height}px`)
                // setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),10)
            },
            [onResize] = useFuncWithTimeout(setNewSize,100)


        useEffect(()=>{
            if (!!userMode && systemDark !== null){
                const mode:'light'|'dark' = userMode === 'system' ? (systemDark ? 'dark' : 'light') : userMode
                document.getElementsByTagName('html')[0].style.backgroundColor = mode === 'light' ? 'white' : 'black'
            }
        },[userMode,systemDark])

        useEffect(()=>{
            onVisibilityChange()
            if ('visualViewport' in window) setNewSize()
            
            const isTouchScreen = window.matchMedia("(pointer: coarse)").matches
            dispatch(updateTouchScreen(isTouchScreen))

            const userMode = sessionStorage.getItem('userMode')
            if (!!userMode && ['light','dark','system'].includes(userMode)) dispatch(updateUserMode(userMode as "light" | "dark" | "system"))
            else {
                sessionStorage.setItem('userMode','system')
                dispatch(updateUserMode('system'))
            }

            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            dispatch(systemIsDark(isDark))
            sessionStorage.setItem('systemDark',isDark.toString())

            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', systemThemeOnChange,{passive:true});
            document.addEventListener('visibilitychange',onVisibilityChange,{passive:true})
            if ('visualViewport' in window) window.visualViewport.addEventListener('resize',onResize,{passive:true})
            return () => {
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', systemThemeOnChange);
                document.removeEventListener('visibilitychange',onVisibilityChange)
            }
        },[router.pathname])

        useEffect(()=>{
            if (authRequired && !signedIn) {
                broadcastChannel.current.postMessage(logoutMsg)
                logout()
            } else if (!authRequired && signedIn) {
                broadcastChannel.current.postMessage(loginMsg)
                login()
            }
        },[signedIn])
            
        useEffect(()=>{
            broadcastChannel.current = new BroadcastChannel('auth')
            broadcastChannel.current.addEventListener('message',bcReceiveMessage,{passive:true})
            
            return () => {
                broadcastChannel.current.removeEventListener('message',bcReceiveMessage)
                broadcastChannel.current.close();
            }
        },[])

        return children
    }

export default MyApp;